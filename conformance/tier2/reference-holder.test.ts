import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import { eudiBin, eudiVersion, presentWithEudi, receiveWithEudi, type EudiOutcome } from "../lib/holder/eudi-dev";
import { mintsEnabled } from "../lib/mints";
import type { Network } from "../lib/network";
import { issuanceState, mintIssuance, mintPresentation, presentationState } from "../lib/playground-client";
import { check, type Verdict } from "../lib/report";
import { listScenarios, serviceFor, type Scenario } from "../lib/scenarios";
import { describeNetworks } from "../lib/suite";

const RAIL = "openid4vc-sdjwt";
const DEMO_PARAMS = "signer=x5c";
const SCENARIO_IDS = ["issue-accredited", "issue-unaccredited", "present-accredited", "present-unaccredited"];
const FLOW_TIMEOUT_MS = 240_000;

type Target = { scenario: Scenario; service: CastService };
type Holder = { root: string; version: string | null; wallets: Map<string, string> };

function targets(services: CastService[]): Target[] {
  const scenarios = listScenarios();
  return SCENARIO_IDS.flatMap((id) => {
    const scenario = scenarios.find((s) => s.id === id);
    if (!scenario) throw new Error(`scenarios.yaml has no ${id}`);
    const service = services.find((s) => s.id === serviceFor(scenario, RAIL));
    return service && inScope(service) ? [{ scenario, service }] : [];
  });
}

async function pollState<T extends { done: boolean }>(read: () => Promise<T>, tries = 30, delayMs = 2000): Promise<T> {
  let state = await read();
  for (let i = 1; i < tries && !state.done; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    state = await read();
  }
  return state;
}

function notCompleted<T>(outcome: Exclude<EudiOutcome<T>, { status: "completed" }>, evidence: Record<string, unknown>): Verdict {
  if (outcome.status === "unknown") return { outcome: "unknown", cause: outcome.cause, evidence };
  return { outcome: "broken", cause: `eudi-dev: ${outcome.cause}`, evidence };
}

const verdictOf = (problems: string[], evidence: Record<string, unknown>): Verdict => ({
  outcome: problems.length === 0 ? "works" : "broken",
  cause: problems.join(" | ") || undefined,
  evidence,
});

async function runIssue(network: Network, t: Target, holder: Holder): Promise<Verdict> {
  const mint = await mintIssuance(network, t.service, { format: RAIL, demoParams: DEMO_PARAMS, credential: t.scenario.credential, params: t.scenario.params });
  const walletDir = path.join(holder.root, t.scenario.id);
  const run = await receiveWithEudi(mint.url, { walletDir });
  const evidence = { holder: holder.version, args: run.args };
  if (run.status !== "completed") return notCompleted(run, evidence);

  const state = await pollState(() => issuanceState(network, t.service, mint));
  const problems: string[] = [];
  const received = run.result;
  if (received.deferred) problems.push("issuer deferred the credential");
  if (received.signature !== "pass") problems.push(`issuer signature ${received.signature ?? "not checked"}${received.signatureDetail ? `: ${received.signatureDetail}` : ""}`);
  if (!state.done) problems.push(`issuance did not complete: state ${state.state ?? "unknown"}`);
  if (state.declined) problems.push("issuer declined the credential request");
  if (problems.length === 0) holder.wallets.set(t.scenario.id, walletDir);
  return verdictOf(problems, { ...evidence, received, state });
}

async function runPresent(network: Network, t: Target, holder: Holder): Promise<Verdict> {
  if (!t.scenario.needs) throw new Error(`${t.scenario.id}: present scenario has no needs`);
  const walletDir = holder.wallets.get(t.scenario.needs);
  if (!walletDir) return { outcome: "unknown", cause: `no eudi-dev credential from ${t.scenario.needs}` };

  const mint = await mintPresentation(network, t.service, { format: RAIL, demoParams: DEMO_PARAMS, credential: t.scenario.credential, login: t.scenario.login });
  const run = await presentWithEudi(mint.url, { walletDir });
  const evidence = { holder: holder.version, args: run.args };
  if (run.status !== "completed") return notCompleted(run, evidence);

  const submitted = run.result;
  if (!submitted.accepted) return verdictOf([`verifier answered HTTP ${submitted.httpStatus}: ${submitted.body}`], { ...evidence, submitted });
  const state = await pollState(() => presentationState(network, t.service, mint, t.scenario.login));
  const problems: string[] = [];
  if (!state.done) problems.push(`presentation did not complete: state ${state.state ?? "unknown"}`);
  if (!state.verified) problems.push("service reports verified: false");
  return verdictOf(problems, { ...evidence, submitted, state });
}

describe("tier 2 reference holder [CONF-T2-1]", () => {
  describeNetworks("tier 2 reference holder", (network) => {
    const holder: Holder = { root: "", version: null, wallets: new Map() };

    beforeAll(async () => {
      if (!mintsEnabled()) return;
      holder.root = fs.mkdtempSync(path.join(os.tmpdir(), "eudi-dev-"));
      holder.version = await eudiVersion();
    });

    afterAll(() => {
      if (holder.root) fs.rmSync(holder.root, { recursive: true, force: true });
    });

    for (const t of targets(listCastServices(network))) {
      const base = {
        tier: "t2" as const,
        check: "reference-holder",
        clause: "CONF-T2-1",
        network: network.id,
        cast: t.service.cast,
        service: t.service.id,
        scenario: t.scenario.id,
      };
      it(
        `eudi-dev ${t.scenario.id} on ${t.service.id}`,
        (ctx) => {
          if (!mintsEnabled()) return ctx.skip("CONFORMANCE_MINTS is not 1");
          return check(base, async (): Promise<Verdict> => {
            if (!holder.version) return { outcome: "unknown", cause: `eudi-dev binary ${eudiBin()} did not answer 'version'` };
            return t.scenario.kind === "issue" ? runIssue(network, t, holder) : runPresent(network, t, holder);
          });
        },
        FLOW_TIMEOUT_MS,
      );
    }
  });
});
