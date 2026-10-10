import { describe, it } from "vitest";
import { effectiveDemoParams, listWalletProfiles, targetsNetwork, type WalletBuild, type WalletProfile } from "../../app/lib/wallet-profiles";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import { createHolderKey, type HolderKey } from "../lib/holder/keys";
import { receiveCredential } from "../lib/holder/oid4vci";
import { presentCredential } from "../lib/holder/oid4vp";
import { incompatibilityFor } from "../lib/incompatibility";
import { mintsEnabled } from "../lib/mints";
import type { Network } from "../lib/network";
import { issuanceState, mintIssuance, mintPresentation, presentationState, type Mint } from "../lib/playground-client";
import { check, type Verdict } from "../lib/report";
import { profilesDir } from "../lib/profiles-dir";
import { listScenarios, serviceFor, type Scenario } from "../lib/scenarios";
import { serviceDid } from "../lib/service-did";
import { describeNetworks } from "../lib/suite";
import { trustClientFor, type TrustClient } from "../lib/trust-client";
import { assertTrust, expectedTrust, resolveFreshCached } from "../lib/trust-expectation";

const RAIL = "openid4vc-sdjwt";
const FLOW_TIMEOUT_MS = 120_000;

const profiles = listWalletProfiles(profilesDir());
const orderedScenarios = [...listScenarios()].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "issue" ? -1 : 1));

type Target = { profile: WalletProfile; build: WalletBuild; scenario: Scenario; service: CastService };
type StoredCredential = { credential: string; vct: string | null; key: HolderKey };

function targets(network: Network, services: CastService[]): Target[] {
  const out: Target[] = [];
  for (const profile of profiles.filter((p) => p.rails.includes(RAIL)))
    for (const build of profile.builds.filter((b) => targetsNetwork(b, network.id)))
      for (const scenario of orderedScenarios) {
        const service = services.find((s) => s.id === serviceFor(scenario, RAIL));
        if (!service || !inScope(service)) continue;
        out.push({ profile, build, scenario, service });
      }
  return out;
}

const credentialKey = (t: Pick<Target, "profile" | "build">, scenarioId: string): string => `${t.profile.id}|${t.build.kind}|${scenarioId}`;

async function pollUntilDone<T extends { done: boolean }>(pollFn: () => Promise<T>, tries = 30, delayMs = 2000): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const state = await pollFn();
    if (state.done) return state;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("flow did not complete in time");
}

const EVENTOS_DECISIONS: Record<string, string> = {
  "entrada-costa-rica": "acceso",
  "entrada-otro-evento": "otro-evento",
};

async function runIssue(network: Network, trust: TrustClient, t: Target, credentials: Map<string, StoredCredential | null>): Promise<Verdict> {
  const expectation = expectedTrust(t.scenario, t.service);
  const demoParams = effectiveDemoParams(t.profile, t.build, RAIL);
  const mint: Mint = await mintIssuance(network, t.service, { format: RAIL, demoParams, credential: t.scenario.credential, params: t.scenario.params });
  const key = await createHolderKey();
  const received = await receiveCredential(mint.url, key);
  const state = await pollUntilDone(() => issuanceState(network, t.service, mint));
  credentials.set(credentialKey(t, t.scenario.id), state.done ? { credential: received.credential, vct: received.vct, key } : null);

  const { did } = await serviceDid(t.service);
  const assertion = await assertTrust(trust, did, expectation, network);
  const problems = [...assertion.problems];
  if (!state.done) problems.push(`issuance did not complete: state ${state.state ?? "unknown"}`);
  if (state.declined) problems.push("issuer declined the credential request");

  const authorization = received.vct ? await trust.issuerAuthorization(did, received.vct) : null;
  if (!authorization) {
    if (expectation.q2 !== null) problems.push("received credential carries no vct");
  } else if (authorization.authorized === null) {
    if (expectation.q2 !== null) problems.push(authorization.cause);
  } else if (expectation.q2 !== null && authorization.authorized !== expectation.q2) problems.push(`issuer-authorization ${authorization.authorized} is not ${expectation.q2}`);

  return {
    outcome: problems.length === 0 ? "works" : "broken",
    cause: problems.join(" | ") || undefined,
    evidence: { ...assertion.evidence, authorized: authorization?.authorized, vtjscId: authorization?.vtjscId ?? null, authorization: authorization?.evidence, state },
  };
}

async function runPresent(network: Network, trust: TrustClient, t: Target, credentials: Map<string, StoredCredential | null>): Promise<Verdict> {
  if (!t.scenario.needs) throw new Error(`${t.scenario.id}: present scenario has no needs`);
  const stored = credentials.get(credentialKey(t, t.scenario.needs));
  if (!stored) return { outcome: "unknown", cause: `no credential from ${t.scenario.needs}` };

  const expectation = expectedTrust(t.scenario, t.service);
  const demoParams = effectiveDemoParams(t.profile, t.build, RAIL);
  const mint: Mint = await mintPresentation(network, t.service, { format: RAIL, demoParams, credential: t.scenario.credential, login: t.scenario.login });
  const presented = await presentCredential(mint.url, stored.credential, stored.key);
  const state = await pollUntilDone(() => presentationState(network, t.service, mint, t.scenario.login));

  const { did } = await serviceDid(t.service);
  const assertion = await assertTrust(trust, did, expectation, network);
  const problems = [...assertion.problems];
  if (!state.done) problems.push(`presentation did not complete: state ${state.state ?? "unknown"}`);
  if (!state.verified) problems.push("service reports verified: false");
  const wantedDecision = EVENTOS_DECISIONS[t.scenario.id];
  if (wantedDecision && state.decision !== wantedDecision) problems.push(`decision ${state.decision ?? "none"} is not ${wantedDecision}`);

  const vct = presented.vctValues[0] ?? stored.vct;
  const authorization = vct ? await trust.verifierAuthorization(did, vct) : null;
  if (!authorization) {
    if (expectation.q3 !== null) problems.push("no vct available for the presented credential");
  } else if (authorization.authorized === null) {
    if (expectation.q3 !== null) problems.push(authorization.cause);
  } else if (expectation.q3 !== null && authorization.authorized !== expectation.q3) problems.push(`verifier-authorization ${authorization.authorized} is not ${expectation.q3}`);

  return {
    outcome: problems.length === 0 ? "works" : "broken",
    cause: problems.join(" | ") || undefined,
    evidence: { ...assertion.evidence, authorized: authorization?.authorized, vtjscId: authorization?.vtjscId ?? null, authorization: authorization?.evidence, state },
  };
}

describe.skipIf(!mintsEnabled())("tier 2 headless openid4vc flows [CONF-T2-1]", () => {
  describeNetworks("tier 2 headless openid4vc flows", (network) => {
    const trust = trustClientFor(network);
    const services = listCastServices(network);
    const credentials = new Map<string, StoredCredential | null>();

    for (const t of targets(network, services)) {
      const base = {
        tier: "t2" as const,
        check: "flow",
        clause: "CONF-T2-1",
        network: network.id,
        cast: t.service.cast,
        service: t.service.id,
        wallet: t.profile.id,
        build: t.build.kind,
        scenario: t.scenario.id,
      };
      it(
        `${t.profile.id}/${t.build.kind} ${t.scenario.id} on ${t.service.id}`,
        () =>
          check(base, async (): Promise<Verdict> => {
            const incompatible = incompatibilityFor(t.build, t.scenario.id, t.service.id);
            if (incompatible) return { outcome: "incompatible-by-design", cause: incompatible.cause, reference: incompatible.reference };
            return t.scenario.kind === "issue" ? runIssue(network, trust, t, credentials) : runPresent(network, trust, t, credentials);
          }),
        FLOW_TIMEOUT_MS,
      );
    }

    it("resolver production flag matches networks.yaml", () =>
      check({ tier: "t2", check: "resolver-production-flag", clause: "PW-CFG-2", network: network.id }, async (): Promise<Verdict> => {
        const service = services.find((s) => inScope(s));
        if (!service) return { outcome: "unknown", cause: "no in-scope service to resolve" };
        const { did } = await serviceDid(service);
        const resolution = await resolveFreshCached(trust, did);
        if (!resolution) return { outcome: "unknown", cause: "resolver has no verdict after refresh" };
        if (resolution.production === null)
          return { outcome: "not-testable", cause: `the ${trust.protocol} trust backend at ${trust.endpoint} reports no production flag`, evidence: { did, networkProduction: network.production } };
        const matches = resolution.production === network.production;
        return {
          outcome: matches ? "works" : "broken",
          cause: matches ? undefined : `resolver production=${resolution.production}, networks.yaml says ${network.production}`,
          evidence: { did, production: resolution.production, networkProduction: network.production },
        };
      }),
    );
  });
});
