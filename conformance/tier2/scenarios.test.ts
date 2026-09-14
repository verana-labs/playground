import { describe, it } from "vitest";
import { z } from "zod";
import { effectiveDemoParams, listWalletProfiles, type WalletBuild, type WalletProfile } from "../../app/lib/wallet-profiles";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import { fetchJson } from "../lib/http";
import { createHolderKey, type HolderKey } from "../lib/holder/keys";
import { receiveCredential } from "../lib/holder/oid4vci";
import { presentCredential } from "../lib/holder/oid4vp";
import { incompatibilityFor } from "../lib/incompatibility";
import { mintsEnabled } from "../lib/mints";
import type { Network } from "../lib/network";
import { issuanceState, mintIssuance, mintPresentation, presentationState, type Mint } from "../lib/playground-client";
import { check, type Verdict } from "../lib/report";
import { profilesDir } from "../lib/profiles-dir";
import { ResolverClient } from "../lib/resolver-client";
import { listScenarios, serviceFor, type Scenario } from "../lib/scenarios";
import { serviceDid } from "../lib/service-did";
import { describeNetworks } from "../lib/suite";
import { assertTrust, expectedTrust, resolveFreshCached } from "../lib/trust-expectation";

const RAIL = "openid4vc-sdjwt";
const FLOW_TIMEOUT_MS = 120_000;

const profiles = listWalletProfiles(profilesDir());
const orderedScenarios = [...listScenarios()].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "issue" ? -1 : 1));

type Target = { profile: WalletProfile; build: WalletBuild; scenario: Scenario; service: CastService };
type StoredCredential = { credential: string; vct: string | null; key: HolderKey };

function targets(services: CastService[]): Target[] {
  const out: Target[] = [];
  for (const profile of profiles.filter((p) => p.rails.includes(RAIL)))
    for (const build of profile.builds)
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

const VctDocumentSchema = z.looseObject({ relatedJsonSchemaCredentialId: z.string().min(1) });

async function vtjscIdFor(vctUrl: string): Promise<string | null> {
  const parsed = VctDocumentSchema.safeParse(await fetchJson(vctUrl));
  return parsed.success ? parsed.data.relatedJsonSchemaCredentialId : null;
}

const EVENTOS_DECISIONS: Record<string, string> = {
  "entrada-costa-rica": "acceso",
  "entrada-otro-evento": "otro-evento",
};

async function runIssue(network: Network, resolver: ResolverClient, t: Target, credentials: Map<string, StoredCredential | null>): Promise<Verdict> {
  const expectation = expectedTrust(t.scenario, t.service);
  const demoParams = effectiveDemoParams(t.profile, t.build, RAIL);
  const mint: Mint = await mintIssuance(network, t.service, { format: RAIL, demoParams, credential: t.scenario.credential, params: t.scenario.params });
  const key = await createHolderKey();
  const received = await receiveCredential(mint.url, key);
  const state = await pollUntilDone(() => issuanceState(network, t.service, mint));
  credentials.set(credentialKey(t, t.scenario.id), state.done ? { credential: received.credential, vct: received.vct, key } : null);

  const { did } = await serviceDid(t.service);
  const trust = await assertTrust(resolver, did, expectation, network);
  const problems = [...trust.problems];
  if (!state.done) problems.push(`issuance did not complete: state ${state.state ?? "unknown"}`);
  if (state.declined) problems.push("issuer declined the credential request");

  let vtjscId: string | null = null;
  let authorized: boolean | undefined;
  if (received.vct) {
    vtjscId = await vtjscIdFor(received.vct);
    if (vtjscId) {
      authorized = (await resolver.issuerAuthorization(did, vtjscId)).authorized;
      if (expectation.q2 !== null && authorized !== expectation.q2) problems.push(`issuer-authorization ${authorized} is not ${expectation.q2}`);
    } else if (expectation.q2 !== null) problems.push(`vct document at ${received.vct} has no relatedJsonSchemaCredentialId`);
  } else if (expectation.q2 !== null) problems.push("received credential carries no vct");

  return { outcome: problems.length === 0 ? "works" : "broken", cause: problems.join(" | ") || undefined, evidence: { ...trust.evidence, authorized, vtjscId, state } };
}

async function runPresent(network: Network, resolver: ResolverClient, t: Target, credentials: Map<string, StoredCredential | null>): Promise<Verdict> {
  if (!t.scenario.needs) throw new Error(`${t.scenario.id}: present scenario has no needs`);
  const stored = credentials.get(credentialKey(t, t.scenario.needs));
  if (!stored) return { outcome: "unknown", cause: `no credential from ${t.scenario.needs}` };

  const expectation = expectedTrust(t.scenario, t.service);
  const demoParams = effectiveDemoParams(t.profile, t.build, RAIL);
  const mint: Mint = await mintPresentation(network, t.service, { format: RAIL, demoParams, login: t.scenario.login });
  const presented = await presentCredential(mint.url, stored.credential, stored.key);
  const state = await pollUntilDone(() => presentationState(network, t.service, mint, t.scenario.login));

  const { did } = await serviceDid(t.service);
  const trust = await assertTrust(resolver, did, expectation, network);
  const problems = [...trust.problems];
  if (!state.done) problems.push(`presentation did not complete: state ${state.state ?? "unknown"}`);
  if (!state.verified) problems.push("service reports verified: false");
  const wantedDecision = EVENTOS_DECISIONS[t.scenario.id];
  if (wantedDecision && state.decision !== wantedDecision) problems.push(`decision ${state.decision ?? "none"} is not ${wantedDecision}`);

  let vtjscId: string | null = null;
  let authorized: boolean | undefined;
  const vct = presented.vctValues[0] ?? stored.vct;
  if (vct) {
    vtjscId = await vtjscIdFor(vct);
    if (vtjscId) {
      authorized = (await resolver.verifierAuthorization(did, vtjscId)).authorized;
      if (expectation.q3 !== null && authorized !== expectation.q3) problems.push(`verifier-authorization ${authorized} is not ${expectation.q3}`);
    } else if (expectation.q3 !== null) problems.push(`vct document at ${vct} has no relatedJsonSchemaCredentialId`);
  } else if (expectation.q3 !== null) problems.push("no vct available for the presented credential");

  return { outcome: problems.length === 0 ? "works" : "broken", cause: problems.join(" | ") || undefined, evidence: { ...trust.evidence, authorized, vtjscId, state } };
}

describe.skipIf(!mintsEnabled())("tier 2 headless openid4vc flows [CONF-T2-1]", () => {
  describeNetworks("tier 2 headless openid4vc flows", (network) => {
    const resolver = new ResolverClient(network.resolver as string);
    const services = listCastServices(network);
    const credentials = new Map<string, StoredCredential | null>();

    for (const t of targets(services)) {
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
            return t.scenario.kind === "issue" ? runIssue(network, resolver, t, credentials) : runPresent(network, resolver, t, credentials);
          }),
        FLOW_TIMEOUT_MS,
      );
    }

    it("resolver production flag matches networks.yaml", () =>
      check({ tier: "t2", check: "resolver-production-flag", clause: "PW-CFG-2", network: network.id }, async (): Promise<Verdict> => {
        const service = services.find((s) => inScope(s));
        if (!service) return { outcome: "unknown", cause: "no in-scope service to resolve" };
        const { did } = await serviceDid(service);
        const resolution = await resolveFreshCached(resolver, did);
        if (!resolution) return { outcome: "unknown", cause: "resolver has no verdict after refresh" };
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
