import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, it } from "vitest";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import { routeCredentials } from "../lib/demo-route";
import {
  callHarness,
  exchanges,
  imported,
  issuerAnchor,
  presentationProblems,
  protocolsoupBin,
  protocolsoupRef,
  requestProblems,
  startHarness,
  verifierAnchor,
  type Anchors,
  type Harness,
  type HarnessReply,
} from "../lib/holder/protocolsoup";
import { planCredentials, probeFailure, type CredentialPlan, type Prober } from "../lib/mint-plan";
import { mintsEnabled } from "../lib/mints";
import { testableNetworks, type Network } from "../lib/network";
import { issuanceState, mintIssuance, mintPresentation, presentationState, type Mint } from "../lib/playground-client";
import { check, type Verdict } from "../lib/report";

const RAIL = "openid4vc-sdjwt";
const REQUEST_PARAMS = "signer=x5c";
const REQUEST_VARIANT = "dcql+x5c";
const FLOW_TIMEOUT_MS = 240_000;
const MINT_SPACING_MS = 1_000;
const PROBE_SPACING_MS = 400;

type Held = { session: string; credentialId: string };
type Holder = { harness: Harness | null; startFailure: string | null; anchorFailures: Map<string, string>; held: Map<string, Held> };
type Runner = (network: Network, service: CastService, plan: CredentialPlan, holder: Holder) => Promise<Verdict>;

let lastMint = 0;

async function pace(spacingMs = MINT_SPACING_MS): Promise<void> {
  const wait = lastMint + spacingMs - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastMint = Date.now();
}

const prober =
  (network: Network): Prober =>
  async (service, role, credential, params) => {
    await pace(PROBE_SPACING_MS);
    try {
      const mint =
        role === "issuer"
          ? await mintIssuance(network, service, { format: RAIL, demoParams: "", credential, params })
          : await mintPresentation(network, service, { format: RAIL, demoParams: REQUEST_PARAMS, credential });
      return { outcome: "mints", detail: mint.kind };
    } catch (e) {
      return probeFailure(e);
    }
  };

const NETWORKS = mintsEnabled() && protocolsoupBin() ? testableNetworks().filter((n) => n.protocol === "v4") : [];
const PLANS = new Map<string, CredentialPlan[]>();
for (const network of NETWORKS) {
  const services = listCastServices(network).filter(inScope);
  PLANS.set(network.id, await planCredentials(routeCredentials(), services, prober(network)));
}

async function mintOffer(network: Network, service: CastService, plan: CredentialPlan): Promise<Mint> {
  await pace();
  return mintIssuance(network, service, { format: RAIL, demoParams: "", credential: plan.credential, params: plan.params });
}

async function mintRequest(network: Network, service: CastService, plan: CredentialPlan): Promise<Mint> {
  await pace();
  return mintPresentation(network, service, { format: RAIL, demoParams: REQUEST_PARAMS, credential: plan.credential });
}

async function pollState<T extends { done: boolean }>(read: () => Promise<T>, tries = 30, delayMs = 2000): Promise<T> {
  let state = await read();
  for (let i = 1; i < tries && !state.done; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    state = await read();
  }
  return state;
}

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

async function harvestAnchors(network: Network, plans: CredentialPlan[], holder: Holder): Promise<Anchors> {
  const anchors: Anchors = { verifiers: [], issuers: [] };
  const firstPlan = (service: CastService, role: "issuers" | "verifiers"): CredentialPlan | undefined => plans.find((p) => p[role].some((s) => s.id === service.id));
  const unique = (role: "issuers" | "verifiers"): CastService[] => [...new Map(plans.flatMap((p) => p[role]).map((s) => [s.id, s])).values()];
  for (const service of unique("issuers")) {
    const plan = firstPlan(service, "issuers");
    if (!plan) continue;
    try {
      anchors.issuers.push(await issuerAnchor((await mintOffer(network, service, plan)).url));
    } catch (e) {
      holder.anchorFailures.set(service.id, `could not read the x5c root of ${service.id}'s signed metadata: ${message(e)}`);
    }
  }
  for (const service of unique("verifiers")) {
    const plan = firstPlan(service, "verifiers");
    if (!plan) continue;
    try {
      anchors.verifiers.push(await verifierAnchor((await mintRequest(network, service, plan)).url));
    } catch (e) {
      holder.anchorFailures.set(service.id, `could not read the x5c root of ${service.id}'s request object: ${message(e)}`);
    }
  }
  return anchors;
}

const evidenceOf = (reply: HarnessReply, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  holder: protocolsoupRef(),
  httpStatus: reply.status,
  exchanges: exchanges(reply),
  ...extra,
});

const verdictOf = (problems: string[], evidence: Record<string, unknown>): Verdict => ({
  outcome: problems.length === 0 ? "works" : "broken",
  cause: problems.join(" | ") || undefined,
  evidence,
});

const runIssue: Runner = async (network, service, plan, holder) => {
  const mint = await mintOffer(network, service, plan);
  const session = `conformance-${randomUUID()}`;
  const reply = await callHarness(holder.harness as Harness, "/api/import", session, { offer: mint.url });
  const result = imported(reply);
  const evidence = evidenceOf(reply, { offer: mint.url });
  if ("problem" in result) return { outcome: "broken", cause: `ProtocolSoup refused the credential: ${result.problem}`, evidence };
  const state = await pollState(() => issuanceState(network, service, mint));
  const problems: string[] = [];
  if (!state.done) problems.push(`issuance did not complete: state ${state.state ?? "unknown"}`);
  if (state.declined) problems.push("issuer declined the credential request");
  if (problems.length === 0 && !holder.held.has(plan.credential)) holder.held.set(plan.credential, { session, credentialId: result.credentialId });
  return verdictOf(problems, { ...evidence, state });
};

const runRequest: Runner = async (network, service, plan, holder) => {
  const mint = await mintRequest(network, service, plan);
  const reply = await callHarness(holder.harness as Harness, "/api/resolve", `conformance-${randomUUID()}`, { openid4vp_uri: mint.url });
  return verdictOf(requestProblems(reply), evidenceOf(reply, { request: mint.url, trust: reply.body.trust ?? null }));
};

const runPresent: Runner = async (network, service, plan, holder) => {
  const held = holder.held.get(plan.credential);
  if (!held) return { outcome: "not-testable", cause: `ProtocolSoup holds no ${plan.credential}: no issuer's offer imported (see protocolsoup-issue)` };
  const mint = await mintRequest(network, service, plan);
  const reply = await callHarness(holder.harness as Harness, "/api/present", held.session, {
    openid4vp_uri: mint.url,
    credential_id: held.credentialId,
    approve_external_trust: true,
  });
  const evidence = evidenceOf(reply, { request: mint.url });
  const problems = presentationProblems(reply);
  if (problems.length > 0) return verdictOf(problems, evidence);
  const state = await pollState(() => presentationState(network, service, mint));
  if (!state.done) problems.push(`presentation did not complete: state ${state.state ?? "unknown"}`);
  if (!state.verified) problems.push("service reports verified: false");
  return verdictOf(problems, { ...evidence, state });
};

describe("tier 2 protocolsoup holder [CONF-T2-1]", () => {
  for (const network of NETWORKS) {
    describe(`${network.id} protocolsoup`, () => {
      const plans = PLANS.get(network.id) ?? [];
      const holder: Holder = { harness: null, startFailure: null, anchorFailures: new Map(), held: new Map() };

      beforeAll(async () => {
        try {
          holder.harness = await startHarness(protocolsoupBin() as string, await harvestAnchors(network, plans, holder));
        } catch (e) {
          holder.startFailure = message(e);
        }
      }, FLOW_TIMEOUT_MS);

      afterAll(async () => {
        await holder.harness?.stop();
      });

      const cell = (checkId: string, service: CastService, scenario: string, runner: Runner, plan: CredentialPlan): void => {
        const base = { tier: "t2" as const, check: checkId, clause: "CONF-T2-1", network: network.id, cast: service.cast, service: service.id, scenario };
        it(
          `protocolsoup ${checkId} ${scenario} on ${service.id}`,
          () =>
            check(base, async (): Promise<Verdict> => {
              if (!holder.harness) return { outcome: "unknown", cause: holder.startFailure ?? "the ProtocolSoup wallet harness did not start" };
              const anchorFailure = holder.anchorFailures.get(service.id);
              if (anchorFailure) return { outcome: "unknown", cause: anchorFailure };
              return runner(network, service, plan, holder);
            }),
          FLOW_TIMEOUT_MS,
        );
      };

      for (const plan of plans) for (const service of plan.issuers) cell("protocolsoup-issue", service, plan.credential, runIssue, plan);
      for (const plan of plans) {
        for (const service of plan.verifiers) {
          cell("protocolsoup-request", service, `${plan.credential}@${REQUEST_VARIANT}`, runRequest, plan);
          cell("protocolsoup-present", service, `${plan.credential}@${REQUEST_VARIANT}`, runPresent, plan);
        }
      }
    });
  }

  if (NETWORKS.length === 0) it.skip("needs PROTOCOLSOUP_BIN, CONFORMANCE_MINTS=1 and a v4 network", () => {});
});
