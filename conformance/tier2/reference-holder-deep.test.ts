import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { z } from "zod";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import {
  agentRefusal,
  credentialFindings,
  decodeWithEudi,
  eudiBin,
  eudiVersion,
  freePortPair,
  inlineOffer,
  inlineRequest,
  presentViaServer,
  presentWithEudi,
  receiveViaServer,
  receiveWithEudi,
  requestUriOf,
  serverLog,
  signedMetadataFindings,
  storedCredential,
  validateWithEudi,
  verifierAnswers,
  withEudiServer,
  withRequestId,
  type EudiOutcome,
  type Refusal,
  type VerifierAnswer,
} from "../lib/holder/eudi-dev";
import { fetchWithTimeout } from "../lib/http";
import { fetchIssuerMetadata } from "../lib/issuer-metadata";
import { mintsEnabled } from "../lib/mints";
import type { Network } from "../lib/network";
import { issuanceState, mintIssuance, mintPresentation, presentationState, type Mint } from "../lib/playground-client";
import { check, type Verdict } from "../lib/report";
import { listScenarios, serviceFor, type Scenario } from "../lib/scenarios";
import { integrityMatches } from "../lib/sri";
import { describeNetworks } from "../lib/suite";

const RAIL = "openid4vc-sdjwt";
const DEMO_PARAMS = "signer=x5c";
const SCENARIO_IDS = ["issue-accredited", "issue-unaccredited", "present-accredited", "present-unaccredited"];
const FLOW_TIMEOUT_MS = 300_000;
const EUDI_METADATA_ACCEPT = "application/json, application/jwt";

type Target = { scenario: Scenario; service: CastService };
type Issued = { walletDir: string; offerUrl: string; decodedOffer: unknown; haipFindings: string[] | null };
type ErrorResponse = { mint: Mint; answers: VerifierAnswer[] };
type Holder = { root: string; version: string | null; issued: Map<string, Issued>; errorResponses: Map<string, ErrorResponse> };
type Runner = (network: Network, t: Target, holder: Holder) => Promise<Verdict>;

const DecodedRequestSchema = z.looseObject({
  client_id: z.string().optional(),
  response_mode: z.string().optional(),
  request_object: z.looseObject({ header: z.record(z.string(), z.unknown()), payload: z.record(z.string(), z.unknown()) }).optional(),
});

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

function verdictOf(problems: string[], evidence: Record<string, unknown>, unknowns: string[] = []): Verdict {
  if (problems.length > 0) return { outcome: "broken", cause: problems.join(" | "), evidence };
  if (unknowns.length > 0) return { outcome: "unknown", cause: unknowns.join(" | "), evidence };
  return { outcome: "works", evidence };
}

function refusalVerdict(replays: [string, Refusal][], evidence: Record<string, unknown>): Verdict {
  const problems: string[] = [];
  const unknowns: string[] = [];
  for (const [label, r] of replays) {
    if (r.kind === "accepted") problems.push(`${label}: the agent accepted it (${r.detail})`);
    if (r.kind === "errored") problems.push(`${label}: the agent errored instead of refusing (${r.detail})`);
    if (r.kind === "unknown") unknowns.push(`${label}: ${r.cause}`);
  }
  return verdictOf(problems, { ...evidence, attempts: Object.fromEntries(replays) }, unknowns);
}

const freshDir = (holder: Holder, name: string): string => fs.mkdtempSync(path.join(holder.root, `${name}-`));

function wellKnownMetadataUrl(issuer: string): string {
  const url = new URL(issuer);
  return `${url.origin}/.well-known/openid-credential-issuer${url.pathname.replace(/\/$/, "")}`;
}

const mintOffer = (network: Network, t: Target): Promise<Mint> =>
  mintIssuance(network, t.service, { format: RAIL, demoParams: DEMO_PARAMS, credential: t.scenario.credential, params: t.scenario.params });

const mintRequest = (network: Network, t: Target): Promise<Mint> =>
  mintPresentation(network, t.service, { format: RAIL, demoParams: DEMO_PARAMS, credential: t.scenario.credential, login: t.scenario.login });

async function vctIntegrity(payload: Record<string, unknown>): Promise<{ problem?: string; unknown?: string; evidence: Record<string, unknown> }> {
  const vct = payload.vct;
  const integrity = payload["vct#integrity"];
  if (typeof vct !== "string") return { problem: "the credential carries no vct", evidence: {} };
  if (integrity === undefined) return { evidence: { vct, integrity: "absent" } };
  if (typeof integrity !== "string") return { problem: "vct#integrity is not a string", evidence: { vct, integrity } };
  const res = await fetchWithTimeout(vct, { headers: { accept: "application/json" } });
  if (!res.ok) return { unknown: `Type Metadata ${vct} answered HTTP ${res.status}`, evidence: { vct, integrity } };
  const matches = integrityMatches(integrity, new Uint8Array(await res.arrayBuffer()));
  const evidence = { vct, integrity, matches };
  if (matches === null) return { unknown: `vct#integrity ${integrity} names no sha256, sha384 or sha512 digest`, evidence };
  return matches ? { evidence } : { problem: `vct#integrity ${integrity} does not match the Type Metadata served at ${vct}`, evidence };
}

const decodeIssuer: Runner = async (_network, t, holder) => {
  const { raw } = await fetchIssuerMetadata(t.service);
  const issuer = z.looseObject({ credential_issuer: z.url() }).parse(raw).credential_issuer;
  const url = wellKnownMetadataUrl(issuer);
  const signed = await fetchWithTimeout(url, { headers: { accept: "application/jwt" } });
  const contentType = signed.headers.get("content-type") ?? "";
  const jwt = (await signed.text()).trim();
  const servedToEudi = (await fetchWithTimeout(url, { headers: { accept: EUDI_METADATA_ACCEPT } })).headers.get("content-type");
  const evidence: Record<string, unknown> = { holder: holder.version, url, contentType, servedToEudiAccept: servedToEudi };
  if (!signed.ok || !contentType.startsWith("application/jwt"))
    return { outcome: "unknown", cause: `${url} served no signed metadata to Accept: application/jwt (HTTP ${signed.status}, ${contentType || "no content type"})`, evidence };

  const file = path.join(holder.root, `${t.service.id}-issuer-metadata.jwt`);
  fs.writeFileSync(file, jwt);
  const decoded = await decodeWithEudi(file, { format: "jwt" });
  evidence.args = decoded.args;
  if (decoded.status !== "completed") return notCompleted(decoded, evidence);
  evidence.validation = decoded.result.validation;
  const result = signedMetadataFindings(decoded.result, issuer);
  if ("unknown" in result) return { outcome: "unknown", cause: result.unknown, evidence };
  return verdictOf(result.findings.map((f) => `signed issuer metadata: ${f}`), evidence);
};

const issueAndValidate: Runner = async (network, t, holder) => {
  const mint = await mintOffer(network, t);
  const walletDir = freshDir(holder, t.scenario.id);
  const decodedOffer = await decodeWithEudi(mint.url);
  const run = await receiveWithEudi(mint.url, { walletDir });
  const evidence: Record<string, unknown> = { holder: holder.version, args: run.args };
  if (run.status !== "completed") return notCompleted(run, evidence);
  const received = run.result;
  evidence.received = received;
  if (received.deferred || !received.credentialId) return { outcome: "broken", cause: "the issuer deferred the credential, so there is nothing to validate", evidence };
  const issued: Issued = { walletDir, offerUrl: mint.url, decodedOffer: decodedOffer.status === "completed" ? decodedOffer.result : null, haipFindings: null };
  holder.issued.set(t.scenario.id, issued);

  const state = await pollState(() => issuanceState(network, t.service, mint));
  evidence.state = state;
  const raw = await storedCredential(received.credentialId, walletDir);
  if (raw.status !== "completed") return notCompleted(raw, evidence);
  const file = path.join(walletDir, `${received.credentialId}.sd-jwt`);
  fs.writeFileSync(file, raw.result);

  const decoded = await decodeWithEudi(file);
  if (decoded.status !== "completed") return notCompleted(decoded, evidence);
  const checks = credentialFindings(decoded.result);
  if ("unknown" in checks) return { outcome: "unknown", cause: checks.unknown, evidence };
  evidence.checks = checks.checks;

  const validation = await validateWithEudi(file);
  if (validation.status !== "completed") return notCompleted(validation, evidence);
  issued.haipFindings = validation.result.haipFindings;
  evidence.validate = validation.result;

  const integrity = await vctIntegrity(checks.payload);
  evidence.vctIntegrity = integrity.evidence;
  const problems = [...checks.findings];
  if (!validation.result.valid) problems.push(`eudi validate: ${validation.result.failure ?? "failed"}`);
  if (integrity.problem) problems.push(integrity.problem);
  if (!state.done) problems.push(`issuance did not complete: state ${state.state ?? "unknown"}`);
  return verdictOf(problems, evidence, integrity.unknown ? [integrity.unknown] : []);
};

const replayOffer: Runner = async (_network, t, holder) => {
  const issued = holder.issued.get(t.scenario.id);
  if (!issued) return { outcome: "unknown", cause: `no eudi-dev credential from ${t.scenario.id} to replay` };
  const inline = inlineOffer(issued.decodedOffer);
  if (!inline) return { outcome: "unknown", cause: "eudi-dev could not decode the redeemed offer, so its pre-authorized code is unknown" };
  const byUri = await receiveWithEudi(issued.offerUrl, { walletDir: freshDir(holder, `${t.scenario.id}-replay-uri`) });
  const byCode = await receiveWithEudi(inline, { walletDir: freshDir(holder, `${t.scenario.id}-replay-code`) });
  return refusalVerdict(
    [
      ["redeemed credential_offer_uri", agentRefusal(byUri)],
      ["redeemed pre-authorized code", agentRefusal(byCode)],
    ],
    { holder: holder.version, args: [byUri.args, byCode.args] },
  );
};

const haipIssue: Runner = async (network, t, holder) => {
  const mint = await mintOffer(network, t);
  const served = await withEudiServer({ walletDir: freshDir(holder, `${t.scenario.id}-haip`), haip: true }, (server) => receiveViaServer(mint.url, server));
  if (served.status === "unknown") return { outcome: "unknown", cause: served.cause, evidence: { holder: holder.version } };
  const run = served.result;
  const credentialHaip = holder.issued.get(t.scenario.id)?.haipFindings ?? null;
  const evidence: Record<string, unknown> = { holder: holder.version, args: run.args, credentialHaipFindings: credentialHaip };
  if (run.status === "unknown") return notCompleted(run, evidence);

  const problems: string[] = [];
  if (run.status === "failed") problems.push(`eudi-dev (HAIP 1.0, strict) refused the issuance: ${run.cause}`);
  else if (run.result.deferred) problems.push("the issuer deferred the credential");
  else {
    const state = await pollState(() => issuanceState(network, t.service, mint));
    evidence.state = state;
    if (!state.done) problems.push(`issuance did not complete: state ${state.state ?? "unknown"}`);
  }
  for (const finding of credentialHaip ?? []) problems.push(`credential issued without HAIP: ${finding}`);
  return verdictOf(problems, evidence);
};

const decodeVerifier: Runner = async (network, t, holder) => {
  const mint = await mintRequest(network, t);
  const decoded = await decodeWithEudi(mint.url);
  const served = await withEudiServer({ walletDir: freshDir(holder, `${t.scenario.id}-decode`), haip: false }, async (server) => {
    const run = await presentViaServer(mint.url, server);
    return { run, answers: verifierAnswers(await serverLog(server)) };
  });
  const request = decoded.status === "completed" ? DecodedRequestSchema.safeParse(decoded.result).data : undefined;
  const evidence: Record<string, unknown> = {
    holder: holder.version,
    decodeArgs: decoded.args,
    clientId: request?.client_id,
    responseMode: request?.response_mode,
    requestHeader: request?.request_object ? { ...request.request_object.header, x5c: undefined } : undefined,
    requestPayload: request?.request_object?.payload,
  };
  if (served.status === "unknown") return { outcome: "unknown", cause: served.cause, evidence };
  const { run, answers } = served.result;
  evidence.args = run.args;
  if (run.status === "completed" && run.result.status === "no_match") holder.errorResponses.set(t.scenario.id, { mint, answers });

  const problems: string[] = [];
  if (decoded.status === "failed") problems.push(`eudi decode: ${decoded.cause}`);
  if (decoded.status === "completed" && !request?.request_object) problems.push("eudi decode found no signed request object behind request_uri");
  if (run.status === "unknown") return { outcome: "unknown", cause: run.cause, evidence };
  if (run.status === "failed") problems.push(`strict eudi-dev refused the request: ${run.cause}`);
  else if (run.result.status === "submitted") return { outcome: "unknown", cause: "an empty eudi-dev wallet submitted a presentation", evidence };
  return verdictOf(problems, evidence, decoded.status === "unknown" ? [decoded.cause] : []);
};

const errorResponse: Runner = async (network, t, holder) => {
  const observed = holder.errorResponses.get(t.scenario.id);
  if (!observed) return { outcome: "unknown", cause: "the strict decode run sent no access_denied error response to this verifier" };
  const answer = observed.answers.at(-1);
  if (!answer) return { outcome: "unknown", cause: "eudi-dev logged no verifier answer to its access_denied error response" };
  const state = await presentationState(network, t.service, observed.mint, t.scenario.login);
  const evidence = { holder: holder.version, answer, state };
  if (answer.statusCode === 200) return { outcome: "works", evidence };
  return {
    outcome: "broken",
    cause: `the verifier answered HTTP ${answer.statusCode} ${answer.body.replace(/\s+/g, " ")} to an access_denied Authorization Error Response (session state ${state.state ?? "unknown"}); OID4VP 1.0 §8.2 requires HTTP 200 once it is processed`,
    evidence,
  };
};

const replayPresentation: Runner = async (network, t, holder) => {
  if (!t.scenario.needs) throw new Error(`${t.scenario.id}: present scenario has no needs`);
  const walletDir = holder.issued.get(t.scenario.needs)?.walletDir;
  if (!walletDir) return { outcome: "unknown", cause: `no eudi-dev credential from ${t.scenario.needs}` };
  const mint = await mintRequest(network, t);
  const requestUri = requestUriOf(mint.url);
  if (!requestUri) return { outcome: "unknown", cause: `the request carries no request_uri: ${mint.url}` };
  const fetched = await fetchWithTimeout(requestUri, { headers: { accept: "application/oauth-authz-req+jwt" } });
  const inline = inlineRequest(mint.url, (await fetched.text()).trim());
  if (!fetched.ok || !inline) return { outcome: "unknown", cause: `request_uri answered HTTP ${fetched.status} without a compact request object` };

  const port = await freePortPair();
  const first = await presentWithEudi(mint.url, { walletDir, port });
  const evidence: Record<string, unknown> = { holder: holder.version, args: first.args };
  if (first.status !== "completed") return { outcome: "unknown", cause: `the first presentation did not go through, so there is nothing to replay: ${first.cause}`, evidence };
  if (!first.result.accepted) return { outcome: "unknown", cause: `the verifier refused the first presentation (HTTP ${first.result.httpStatus}), so there is nothing to replay`, evidence };

  const byUri = await presentWithEudi(mint.url, { walletDir, port });
  const byObject = await presentWithEudi(inline, { walletDir, port });
  const state = await pollState(() => presentationState(network, t.service, mint, t.scenario.login));
  const verdict = refusalVerdict(
    [
      ["the answered request_uri", agentRefusal(byUri)],
      ["the answered request object, inline", agentRefusal(byObject)],
    ],
    { ...evidence, state },
  );
  if (state.done && state.verified) return verdict;
  const stateProblem = `after the replays the session reads ${state.state ?? "unknown"}, verified ${state.verified}`;
  return { ...verdict, outcome: "broken", cause: verdict.outcome === "broken" ? `${verdict.cause} | ${stateProblem}` : stateProblem };
};

const garbageRequest: Runner = async (network, t, holder) => {
  const mint = await mintRequest(network, t);
  const garbage = withRequestId(mint.url, randomUUID());
  if (!garbage) return { outcome: "unknown", cause: `the request carries no request_uri: ${mint.url}` };
  const run = await presentWithEudi(garbage, { walletDir: freshDir(holder, `${t.scenario.id}-garbage`), port: await freePortPair() });
  return refusalVerdict([["an unknown request_uri on the verifier", agentRefusal(run)]], { holder: holder.version, args: run.args });
};

const haipPresent: Runner = async (network, t, holder) => {
  if (!t.scenario.needs) throw new Error(`${t.scenario.id}: present scenario has no needs`);
  const source = holder.issued.get(t.scenario.needs)?.walletDir;
  if (!source) return { outcome: "unknown", cause: `no eudi-dev credential from ${t.scenario.needs}` };
  const walletDir = freshDir(holder, `${t.scenario.id}-haip`);
  fs.cpSync(source, walletDir, { recursive: true });
  const mint = await mintRequest(network, t);
  const served = await withEudiServer({ walletDir, haip: true }, (server) => presentViaServer(mint.url, server));
  if (served.status === "unknown") return { outcome: "unknown", cause: served.cause, evidence: { holder: holder.version } };
  const run = served.result;
  const evidence: Record<string, unknown> = { holder: holder.version, args: run.args };
  if (run.status === "unknown") return notCompleted(run, evidence);
  if (run.status === "failed") return verdictOf([`eudi-dev (HAIP 1.0, strict) refused the request: ${run.cause}`], evidence);
  const submitted = run.result;
  evidence.submitted = submitted;
  if (submitted.status === "no_match") return verdictOf([`eudi-dev under HAIP found no credential for the request: ${submitted.error}`], evidence);
  if (!submitted.accepted) return verdictOf([`the verifier answered HTTP ${submitted.httpStatus}: ${submitted.body}`], evidence);
  const state = await pollState(() => presentationState(network, t.service, mint, t.scenario.login));
  const problems: string[] = [];
  if (!state.done) problems.push(`presentation did not complete: state ${state.state ?? "unknown"}`);
  if (!state.verified) problems.push("service reports verified: false");
  return verdictOf(problems, { ...evidence, state });
};

const ISSUE_CHECKS: [string, Runner][] = [
  ["reference-holder-decode", decodeIssuer],
  ["reference-holder-validate", issueAndValidate],
  ["reference-holder-replay-offer", replayOffer],
  ["reference-holder-haip", haipIssue],
];

const PRESENT_CHECKS: [string, Runner][] = [
  ["reference-holder-decode", decodeVerifier],
  ["reference-holder-error-response", errorResponse],
  ["reference-holder-replay-presentation", replayPresentation],
  ["reference-holder-garbage-request", garbageRequest],
  ["reference-holder-haip", haipPresent],
];

describe("tier 2 reference holder, deep [CONF-T2-1]", () => {
  describeNetworks("tier 2 reference holder deep", (network) => {
    const holder: Holder = { root: "", version: null, issued: new Map(), errorResponses: new Map() };

    beforeAll(async () => {
      if (!mintsEnabled()) return;
      holder.root = fs.mkdtempSync(path.join(os.tmpdir(), "eudi-dev-deep-"));
      holder.version = await eudiVersion();
    });

    afterAll(() => {
      if (holder.root) fs.rmSync(holder.root, { recursive: true, force: true });
    });

    for (const t of targets(listCastServices(network))) {
      for (const [checkId, runner] of t.scenario.kind === "issue" ? ISSUE_CHECKS : PRESENT_CHECKS) {
        const base = {
          tier: "t2" as const,
          check: checkId,
          clause: "CONF-T2-1",
          network: network.id,
          cast: t.service.cast,
          service: t.service.id,
          scenario: t.scenario.id,
        };
        it(
          `eudi-dev ${checkId} ${t.scenario.id} on ${t.service.id}`,
          (ctx) => {
            if (!mintsEnabled()) return ctx.skip("CONFORMANCE_MINTS is not 1");
            return check(base, async (): Promise<Verdict> => {
              if (!holder.version) return { outcome: "unknown", cause: `eudi-dev binary ${eudiBin()} did not answer 'version'` };
              return runner(network, t, holder);
            });
          },
          FLOW_TIMEOUT_MS,
        );
      }
    }
  });
});
