import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, it } from "vitest";
import { z } from "zod";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import { routeCredentials } from "../lib/demo-route";
import {
  agentRefusal,
  asksKeyAttestation,
  credentialFindings,
  decodeWithEudi,
  eudiBin,
  eudiVersion,
  freePortPair,
  inlineOffer,
  inlineRequest,
  offerConfigurationIds,
  offeredProofTypes,
  offerTxCode,
  presentViaServer,
  presentWithEudi,
  receiveViaServer,
  receiveWithEudi,
  requestIncompatibility,
  requestUriOf,
  serverLog,
  signedMetadataFindings,
  storedCredential,
  validateWithEudi,
  verifierAnswers,
  walletLog,
  withEudiServer,
  withRequestId,
  type EudiIssuance,
  type EudiOutcome,
  type Incompatibility,
  type Refusal,
  type ServerOptions,
  type VerifierAnswer,
} from "../lib/holder/eudi-dev";
import { fetchWithTimeout } from "../lib/http";
import { fetchIssuerMetadata } from "../lib/issuer-metadata";
import { mintGap, planCredentials, probeFailure, type CredentialPlan, type Prober } from "../lib/mint-plan";
import { mintsEnabled } from "../lib/mints";
import { testableNetworks, type Network } from "../lib/network";
import { issuanceState, mintIssuance, mintPresentation, presentationState, type Mint } from "../lib/playground-client";
import { check, CheckFailed, record, type CellBase, type Verdict } from "../lib/report";
import { integrityMatches } from "../lib/sri";
import { describeNetworks } from "../lib/suite";

const RAIL = "openid4vc-sdjwt";
const FLOW_TIMEOUT_MS = 300_000;
const MINT_SPACING_MS = 1_000;
const PROBE_SPACING_MS = 400;
const EUDI_METADATA_ACCEPT = "application/json, application/jwt";

const FORMATS = [
  { id: "dcql", demoParams: "", replay: true, haip: false },
  { id: "dcql+x5c", demoParams: "signer=x5c", replay: true, haip: true },
  { id: "pe", demoParams: "query=pe", replay: false, haip: false },
  { id: "pe+x5c", demoParams: "query=pe&signer=x5c", replay: false, haip: false },
] as const;
type Format = (typeof FORMATS)[number];

type IssueVariant = { id: string; server: Partial<ServerOptions>; keyAttestation: boolean };
const ISSUE_VARIANTS: IssueVariant[] = [
  { id: "vci-1.1", server: { vciVersion: "1.1" }, keyAttestation: false },
  { id: "key-attestation-none", server: { keyAttestationLevel: "none" }, keyAttestation: true },
  { id: "key-attestation-high", server: { keyAttestationLevel: "iso_18045_high" }, keyAttestation: true },
];

type Issued = { walletDir: string; offerUrl: string; decodedOffer: unknown; credentialId: string | null; haipFindings: string[] | null; log: unknown[] | null };
type Presented = { mint: Mint; requestObject: string | null; walletDir: string; port: number } | { incompatibility: Incompatibility };
type ErrorResponse = { mint: Mint; answers: VerifierAnswer[]; walletMode: "strict" | "debug"; why?: string };
type Holder = { root: string; version: string | null; issued: Map<string, Issued>; presented: Map<string, Presented>; errorResponses: Map<string, ErrorResponse> };
type Ctx = { network: Network; plan: CredentialPlan; service: CastService; holder: Holder; format: Format };
type Runner = (ctx: Ctx) => Promise<Verdict>;
type Step = { check: string; variant?: string; format: Format; runner: Runner };

const SignedPayloadSchema = z.looseObject({ payload: z.looseObject({ credential_configurations_supported: z.record(z.string(), z.unknown()).optional() }) });
const RequestExpSchema = z.looseObject({ request_object: z.looseObject({ payload: z.looseObject({ exp: z.number() }) }) });

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
          : await mintPresentation(network, service, { format: RAIL, demoParams: "", credential });
      return { outcome: "mints", detail: mint.kind };
    } catch (e) {
      return probeFailure(e);
    }
  };

const PLANS = new Map<string, CredentialPlan[]>();
if (mintsEnabled()) {
  for (const network of testableNetworks().filter((n) => n.protocol === "v4")) {
    const services = listCastServices(network).filter(inScope);
    PLANS.set(network.id, await planCredentials(routeCredentials(), services, prober(network)));
  }
}

const issuedKey = (service: CastService, plan: CredentialPlan): string => `${service.id}|${plan.credential}`;
const requestKey = (ctx: Ctx): string => `${ctx.service.id}|${ctx.plan.credential}|${ctx.format.id}`;
const freshDir = (holder: Holder, name: string): string => fs.mkdtempSync(path.join(holder.root, `${name}-`));

async function mintOffer(ctx: Ctx): Promise<Mint> {
  await pace();
  return mintIssuance(ctx.network, ctx.service, { format: RAIL, demoParams: "", credential: ctx.plan.credential, params: ctx.plan.params });
}

async function mintRequest(ctx: Ctx): Promise<Mint> {
  await pace();
  return mintPresentation(ctx.network, ctx.service, { format: RAIL, demoParams: ctx.format.demoParams, credential: ctx.plan.credential });
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

function refusalVerdict(attempts: [string, Refusal][], evidence: Record<string, unknown>): Verdict {
  const problems: string[] = [];
  const unknowns: string[] = [];
  for (const [label, r] of attempts) {
    if (r.kind === "accepted") problems.push(`${label}: the agent accepted it (${r.detail})`);
    if (r.kind === "errored") problems.push(`${label}: the agent errored instead of refusing (${r.detail})`);
    if (r.kind === "unknown") unknowns.push(`${label}: ${r.cause}`);
  }
  return verdictOf(problems, { ...evidence, attempts: Object.fromEntries(attempts) }, unknowns);
}

const incompatible = (i: Incompatibility, evidence: Record<string, unknown>, detail?: string): Verdict => ({
  outcome: "incompatible-by-design",
  cause: detail ? `${i.cause} (strict eudi-dev: ${detail})` : i.cause,
  reference: i.reference,
  evidence,
});

function issuanceProblems(received: EudiIssuance, state: { done: boolean; declined: boolean; state: string | null }): string[] {
  const problems: string[] = [];
  if (received.deferred) problems.push("the issuer deferred the credential");
  if (received.signature !== "pass") problems.push(`issuer signature ${received.signature ?? "not checked"}${received.signatureDetail ? `: ${received.signatureDetail}` : ""}`);
  if (!state.done) problems.push(`issuance did not complete: state ${state.state ?? "unknown"}`);
  if (state.declined) problems.push("the issuer declined the credential request");
  return problems;
}

function credentialSource(holder: Holder, plan: CredentialPlan): { service: CastService; issued: Issued } | null {
  for (const service of plan.issuers) {
    const issued = holder.issued.get(issuedKey(service, plan));
    if (issued?.credentialId) return { service, issued };
  }
  return null;
}

function wellKnownMetadataUrl(issuer: string): string {
  const url = new URL(issuer);
  return `${url.origin}/.well-known/openid-credential-issuer${url.pathname.replace(/\/$/, "")}`;
}

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

const issue: Runner = async (ctx) => {
  const { holder, service, plan } = ctx;
  const mint = await mintOffer(ctx);
  const walletDir = freshDir(holder, `${service.id}-${plan.credential}`);
  const decodedOffer = await decodeWithEudi(mint.url);
  const offer = decodedOffer.status === "completed" ? decodedOffer.result : null;
  const run = await receiveWithEudi(mint.url, { walletDir });
  const evidence: Record<string, unknown> = { holder: holder.version, args: run.args, txCode: offer ? offerTxCode(offer) : "offer not decoded" };
  if (run.status !== "completed") return notCompleted(run, evidence);
  const received = run.result;
  evidence.received = received;
  const log = await walletLog(walletDir);
  holder.issued.set(issuedKey(service, plan), {
    walletDir,
    offerUrl: mint.url,
    decodedOffer: offer,
    credentialId: received.deferred ? null : received.credentialId,
    haipFindings: null,
    log: log.status === "completed" ? log.result : null,
  });
  const state = await pollState(() => issuanceState(ctx.network, service, mint));
  return verdictOf(issuanceProblems(received, state), { ...evidence, state }, decodedOffer.status === "completed" ? [] : [`eudi decode of the offer: ${decodedOffer.cause}`]);
};

const validate: Runner = async ({ holder, service, plan }) => {
  const issued = holder.issued.get(issuedKey(service, plan));
  if (!issued?.credentialId) return { outcome: "unknown", cause: `no credential from the strict issuance of ${plan.credential} by ${service.id}` };
  const evidence: Record<string, unknown> = { holder: holder.version, credentialId: issued.credentialId };
  const raw = await storedCredential(issued.credentialId, issued.walletDir);
  if (raw.status !== "completed") return notCompleted(raw, evidence);
  const file = path.join(issued.walletDir, `${issued.credentialId}.sd-jwt`);
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
  return verdictOf(problems, evidence, integrity.unknown ? [integrity.unknown] : []);
};

const decodeMetadata: Runner = async ({ holder, service, plan }) => {
  const { raw } = await fetchIssuerMetadata(service);
  const issuer = z.looseObject({ credential_issuer: z.url() }).parse(raw).credential_issuer;
  const url = wellKnownMetadataUrl(issuer);
  const signed = await fetchWithTimeout(url, { headers: { accept: "application/jwt" } });
  const contentType = signed.headers.get("content-type") ?? "";
  const jwt = (await signed.text()).trim();
  const servedToEudi = (await fetchWithTimeout(url, { headers: { accept: EUDI_METADATA_ACCEPT } })).headers.get("content-type");
  const evidence: Record<string, unknown> = { holder: holder.version, url, contentType, servedToEudiAccept: servedToEudi };
  if (!signed.ok || !contentType.startsWith("application/jwt"))
    return { outcome: "unknown", cause: `${url} served no signed metadata to Accept: application/jwt (HTTP ${signed.status}, ${contentType || "no content type"})`, evidence };

  const file = path.join(holder.root, `${service.id}-${plan.credential}-issuer-metadata.jwt`);
  fs.writeFileSync(file, jwt);
  const decoded = await decodeWithEudi(file, { format: "jwt" });
  evidence.args = decoded.args;
  if (decoded.status !== "completed") return notCompleted(decoded, evidence);
  evidence.validation = decoded.result.validation;
  const result = signedMetadataFindings(decoded.result, issuer);
  if ("unknown" in result) return { outcome: "unknown", cause: result.unknown, evidence };
  const problems = result.findings.map((f) => `signed issuer metadata: ${f}`);

  const offered = offerConfigurationIds(holder.issued.get(issuedKey(service, plan))?.decodedOffer);
  const listed = Object.keys(SignedPayloadSchema.safeParse(decoded.result).data?.payload.credential_configurations_supported ?? {});
  evidence.offeredConfigurations = offered;
  for (const id of offered) if (!listed.includes(id)) problems.push(`the offer names configuration ${id}, which the signed metadata does not list`);
  return verdictOf(problems, evidence, offered.length === 0 ? [`no decoded ${plan.credential} offer to hold against the metadata`] : []);
};

const replayOffer: Runner = async ({ holder, service, plan }) => {
  const issued = holder.issued.get(issuedKey(service, plan));
  if (!issued?.credentialId) return { outcome: "unknown", cause: `no redeemed ${plan.credential} offer from ${service.id} to replay` };
  const inline = inlineOffer(issued.decodedOffer);
  if (!inline) return { outcome: "unknown", cause: "eudi-dev could not decode the redeemed offer, so its pre-authorized code is unknown" };
  const byUri = await receiveWithEudi(issued.offerUrl, { walletDir: freshDir(holder, "replay-uri") });
  const byCode = await receiveWithEudi(inline, { walletDir: freshDir(holder, "replay-code") });
  return refusalVerdict(
    [
      ["redeemed credential_offer_uri", agentRefusal(byUri)],
      ["redeemed pre-authorized code", agentRefusal(byCode)],
    ],
    { holder: holder.version, args: [byUri.args, byCode.args] },
  );
};

const issueVia =
  (variant: IssueVariant): Runner =>
  async (ctx) => {
    const { holder, service, plan } = ctx;
    const evidence: Record<string, unknown> = { holder: holder.version, server: variant.server };
    if (variant.keyAttestation) {
      const issued = holder.issued.get(issuedKey(service, plan));
      if (!issued?.log) return { outcome: "unknown", cause: `no strict ${plan.credential} issuance log to read the proof types ${service.id} offers eudi-dev`, evidence };
      const proofTypes = offeredProofTypes(issued.log, offerConfigurationIds(issued.decodedOffer));
      if (!proofTypes) return { outcome: "unknown", cause: "eudi-dev logged no issuer metadata for the strict issuance", evidence };
      evidence.proofTypes = proofTypes;
      if (!asksKeyAttestation(proofTypes))
        return {
          outcome: "not-testable",
          cause: `the issuer offers eudi-dev the proof types ${JSON.stringify(proofTypes)} without key_attestations_required, so no key attestation level is ever sent`,
          evidence,
        };
    }
    const mint = await mintOffer(ctx);
    const served = await withEudiServer({ walletDir: freshDir(holder, variant.id), haip: false, ...variant.server }, (server) => receiveViaServer(mint.url, server));
    if (served.status === "unknown") return { outcome: "unknown", cause: served.cause, evidence };
    const run = served.result;
    evidence.args = run.args;
    if (run.status !== "completed") return notCompleted(run, evidence);
    const state = await pollState(() => issuanceState(ctx.network, service, mint));
    return verdictOf(issuanceProblems(run.result, state), { ...evidence, received: run.result, state });
  };

const haipIssue: Runner = async (ctx) => {
  const { holder, service, plan } = ctx;
  const mint = await mintOffer(ctx);
  const served = await withEudiServer({ walletDir: freshDir(holder, "haip-issue"), haip: true }, (server) => receiveViaServer(mint.url, server));
  if (served.status === "unknown") return { outcome: "unknown", cause: served.cause, evidence: { holder: holder.version } };
  const run = served.result;
  const credentialHaip = holder.issued.get(issuedKey(service, plan))?.haipFindings ?? null;
  const evidence: Record<string, unknown> = { holder: holder.version, args: run.args, credentialHaipFindings: credentialHaip };
  if (run.status === "unknown") return notCompleted(run, evidence);

  const problems: string[] = [];
  if (run.status === "failed") problems.push(`eudi-dev (HAIP 1.0, strict) refused the issuance: ${run.cause}`);
  else {
    const state = await pollState(() => issuanceState(ctx.network, service, mint));
    evidence.state = state;
    problems.push(...issuanceProblems(run.result, state));
  }
  for (const finding of credentialHaip ?? []) problems.push(`credential issued without HAIP: ${finding}`);
  return verdictOf(problems, evidence);
};

function emptyWalletRun(holder: Holder, mint: Mint, mode: "strict" | "debug") {
  return withEudiServer({ walletDir: freshDir(holder, `empty-${mode}`), haip: false, mode }, async (server) => {
    const run = await presentViaServer(mint.url, server);
    return { run, answers: verifierAnswers(await serverLog(server)) };
  });
}

const decodeRequest: Runner = async (ctx) => {
  const { holder } = ctx;
  const mint = await mintRequest(ctx);
  const decoded = await decodeWithEudi(mint.url);
  const incompatibility = decoded.status === "completed" ? requestIncompatibility(decoded.result) : null;
  const strict = await emptyWalletRun(holder, mint, "strict");
  const evidence: Record<string, unknown> = { holder: holder.version, decodeArgs: decoded.args, request: decoded.status === "completed" ? decoded.result : null };
  if (strict.status === "unknown") return { outcome: "unknown", cause: strict.cause, evidence };
  const { run, answers } = strict.result;
  evidence.args = run.args;

  if (run.status === "completed" && run.result.status === "no_match") holder.errorResponses.set(requestKey(ctx), { mint, answers, walletMode: "strict" });
  if (run.status === "failed") {
    const debug = await emptyWalletRun(holder, mint, "debug");
    if (debug.status === "ran" && debug.result.run.status === "completed" && debug.result.run.result.status === "no_match")
      holder.errorResponses.set(requestKey(ctx), { mint, answers: debug.result.answers, walletMode: "debug", why: run.cause });
  }

  if (run.status === "unknown") return { outcome: "unknown", cause: run.cause, evidence };
  if (run.status === "failed" && incompatibility?.marker.test(run.cause)) return incompatible(incompatibility, evidence, run.cause);
  const problems: string[] = [];
  if (decoded.status === "failed") problems.push(`eudi decode: ${decoded.cause}`);
  if (decoded.status === "completed" && !z.looseObject({ request_object: z.unknown() }).safeParse(decoded.result).data?.request_object)
    problems.push("eudi decode found no signed request object behind request_uri");
  if (run.status === "failed") problems.push(`strict eudi-dev refused the request: ${run.cause}`);
  else if (run.result.status === "submitted") return { outcome: "unknown", cause: "an empty eudi-dev wallet submitted a presentation", evidence };
  return verdictOf(problems, evidence, decoded.status === "unknown" ? [decoded.cause] : []);
};

const errorResponse: Runner = async (ctx) => {
  const observed = ctx.holder.errorResponses.get(requestKey(ctx));
  if (!observed) return { outcome: "unknown", cause: "neither a strict nor a debug eudi-dev wallet sent an access_denied error response to this request" };
  const answer = observed.answers.at(-1);
  if (!answer) return { outcome: "unknown", cause: "eudi-dev logged no verifier answer to its access_denied error response" };
  const state = await presentationState(ctx.network, ctx.service, observed.mint);
  const evidence = { holder: ctx.holder.version, walletMode: observed.walletMode, strictRefusal: observed.why, answer, state };
  if (answer.statusCode === 200) return { outcome: "works", evidence };
  return {
    outcome: "broken",
    cause: `the verifier answered HTTP ${answer.statusCode} ${answer.body.replace(/\s+/g, " ")} to an access_denied Authorization Error Response from a ${observed.walletMode} eudi-dev wallet (session state ${state.state ?? "unknown"}); OID4VP 1.0 §8.2 requires HTTP 200 once it is processed`,
    evidence,
  };
};

const present: Runner = async (ctx) => {
  const { holder, plan } = ctx;
  const source = credentialSource(holder, plan);
  if (!source) return { outcome: "unknown", cause: `no eudi-dev ${plan.credential} credential from ${plan.issuers.map((s) => s.id).join(", ") || "any issuer"}` };
  const mint = await mintRequest(ctx);
  const decoded = await decodeWithEudi(mint.url);
  const evidence: Record<string, unknown> = { holder: holder.version, credentialFrom: source.service.id, decodeArgs: decoded.args };
  const incompatibility = decoded.status === "completed" ? requestIncompatibility(decoded.result) : null;
  if (incompatibility) {
    holder.presented.set(requestKey(ctx), { incompatibility });
    return incompatible(incompatibility, evidence);
  }
  const requestUri = requestUriOf(mint.url);
  const fetched = requestUri ? await fetchWithTimeout(requestUri, { headers: { accept: "application/oauth-authz-req+jwt" } }) : null;
  const requestObject = fetched?.ok ? (await fetched.text()).trim() : null;

  const port = await freePortPair();
  const run = await presentWithEudi(mint.url, { walletDir: source.issued.walletDir, port });
  evidence.args = run.args;
  if (run.status !== "completed") return notCompleted(run, evidence);
  evidence.submitted = run.result;
  if (!run.result.accepted) return verdictOf([`the verifier answered HTTP ${run.result.httpStatus}: ${run.result.body}`], evidence);
  holder.presented.set(requestKey(ctx), { mint, requestObject, walletDir: source.issued.walletDir, port });
  const state = await pollState(() => presentationState(ctx.network, ctx.service, mint));
  const problems: string[] = [];
  if (!state.done) problems.push(`presentation did not complete: state ${state.state ?? "unknown"}`);
  if (!state.verified) problems.push("service reports verified: false");
  return verdictOf(problems, { ...evidence, state });
};

const replayPresentation: Runner = async (ctx) => {
  const presented = ctx.holder.presented.get(requestKey(ctx));
  if (!presented) return { outcome: "unknown", cause: "no completed presentation of this request to replay" };
  if ("incompatibility" in presented) return incompatible(presented.incompatibility, { holder: ctx.holder.version });
  const inline = presented.requestObject ? inlineRequest(presented.mint.url, presented.requestObject) : null;
  if (!inline) return { outcome: "unknown", cause: "request_uri served no compact request object to replay inline" };
  const opts = { walletDir: presented.walletDir, port: presented.port };
  const byUri = await presentWithEudi(presented.mint.url, opts);
  const byObject = await presentWithEudi(inline, opts);
  const state = await pollState(() => presentationState(ctx.network, ctx.service, presented.mint));
  const verdict = refusalVerdict(
    [
      ["the answered request_uri", agentRefusal(byUri)],
      ["the answered request object, inline", agentRefusal(byObject)],
    ],
    { holder: ctx.holder.version, args: [byUri.args, byObject.args], state },
  );
  if (state.done && state.verified) return verdict;
  const stateProblem = `after the replays the session reads ${state.state ?? "unknown"}, verified ${state.verified}`;
  return { ...verdict, outcome: "broken", cause: verdict.outcome === "broken" ? `${verdict.cause} | ${stateProblem}` : stateProblem };
};

const garbageRequest: Runner = async (ctx) => {
  const mint = await mintRequest(ctx);
  const garbage = withRequestId(mint.url, randomUUID());
  if (!garbage) return { outcome: "unknown", cause: `the request carries no request_uri: ${mint.url}` };
  const run = await presentWithEudi(garbage, { walletDir: freshDir(ctx.holder, "garbage"), port: await freePortPair() });
  return refusalVerdict([["an unknown request_uri on the verifier", agentRefusal(run)]], { holder: ctx.holder.version, args: run.args });
};

const haipPresent: Runner = async (ctx) => {
  const { holder, plan } = ctx;
  const source = credentialSource(holder, plan);
  if (!source) return { outcome: "unknown", cause: `no eudi-dev ${plan.credential} credential to present under HAIP` };
  const walletDir = freshDir(holder, "haip-present");
  fs.cpSync(source.issued.walletDir, walletDir, { recursive: true });
  const mint = await mintRequest(ctx);
  const served = await withEudiServer({ walletDir, haip: true }, (server) => presentViaServer(mint.url, server));
  const evidence: Record<string, unknown> = { holder: holder.version, credentialFrom: source.service.id };
  if (served.status === "unknown") return { outcome: "unknown", cause: served.cause, evidence };
  const run = served.result;
  evidence.args = run.args;
  if (run.status === "unknown") return notCompleted(run, evidence);
  if (run.status === "failed") return verdictOf([`eudi-dev (HAIP 1.0, strict) refused the request: ${run.cause}`], evidence);
  const submitted = run.result;
  evidence.submitted = submitted;
  if (submitted.status === "no_match") return verdictOf([`eudi-dev under HAIP found no credential for the request: ${submitted.error}`], evidence);
  if (!submitted.accepted) return verdictOf([`the verifier answered HTTP ${submitted.httpStatus}: ${submitted.body}`], evidence);
  const state = await pollState(() => presentationState(ctx.network, ctx.service, mint));
  const problems: string[] = [];
  if (!state.done) problems.push(`presentation did not complete: state ${state.state ?? "unknown"}`);
  if (!state.verified) problems.push("service reports verified: false");
  return verdictOf(problems, { ...evidence, state });
};

const DEFAULT_FORMAT = FORMATS[0];

const ISSUER_STEPS: Step[] = [
  { check: "reference-holder-issue", format: DEFAULT_FORMAT, runner: issue },
  { check: "reference-holder-validate", format: DEFAULT_FORMAT, runner: validate },
  { check: "reference-holder-decode", format: DEFAULT_FORMAT, runner: decodeMetadata },
  { check: "reference-holder-replay-offer", format: DEFAULT_FORMAT, runner: replayOffer },
  ...ISSUE_VARIANTS.map((v): Step => ({ check: "reference-holder-issue", variant: v.id, format: DEFAULT_FORMAT, runner: issueVia(v) })),
  { check: "reference-holder-haip", format: DEFAULT_FORMAT, runner: haipIssue },
];

const VERIFIER_STEPS: Step[] = [
  ...FORMATS.flatMap((format): Step[] => [
    { check: "reference-holder-decode", variant: format.id, format, runner: decodeRequest },
    { check: "reference-holder-error-response", variant: format.id, format, runner: errorResponse },
    { check: "reference-holder-present", variant: format.id, format, runner: present },
    ...(format.replay ? [{ check: "reference-holder-replay-presentation", variant: format.id, format, runner: replayPresentation }] : []),
  ]),
  { check: "reference-holder-garbage-request", variant: DEFAULT_FORMAT.id, format: DEFAULT_FORMAT, runner: garbageRequest },
  ...FORMATS.filter((f) => f.haip).map((format): Step => ({ check: "reference-holder-haip", variant: format.id, format, runner: haipPresent })),
];

function cellBase(network: Network, service: CastService | null, checkId: string, credential: string, variant?: string): CellBase {
  return {
    tier: "t2",
    check: checkId,
    clause: "CONF-T2-1",
    network: network.id,
    ...(service ? { cast: service.cast, service: service.id } : {}),
    scenario: variant ? `${credential}@${variant}` : credential,
  };
}

async function expiredRequests(network: Network, plans: CredentialPlan[], holder: Holder): Promise<[CellBase, Verdict][]> {
  const pending: { base: CellBase; plan: CredentialPlan; mint: Mint; exp: number | null }[] = [];
  for (const plan of plans) {
    for (const service of plan.verifiers) {
      const mint = await mintRequest({ network, plan, service, holder, format: DEFAULT_FORMAT });
      const decoded = await decodeWithEudi(mint.url);
      const exp = RequestExpSchema.safeParse(decoded.status === "completed" ? decoded.result : null).data?.request_object.payload.exp ?? null;
      pending.push({ base: cellBase(network, service, "reference-holder-expired-request", plan.credential, DEFAULT_FORMAT.id), plan, mint, exp });
    }
  }
  const wait = Math.max(0, ...pending.map((p) => p.exp ?? 0)) * 1000 + 5_000 - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  const results: [CellBase, Verdict][] = [];
  for (const p of pending) {
    if (p.exp === null) {
      results.push([p.base, { outcome: "unknown", cause: "eudi decode read no exp from the request object" }]);
      continue;
    }
    const walletDir = credentialSource(holder, p.plan)?.issued.walletDir ?? freshDir(holder, "expired");
    const run = await presentWithEudi(p.mint.url, { walletDir, port: await freePortPair() });
    const late = Math.round(Date.now() / 1000 - p.exp);
    results.push([p.base, refusalVerdict([[`a request presented ${late} s after its exp`, agentRefusal(run)]], { holder: holder.version, args: run.args })]);
  }
  return results;
}

describe("tier 2 reference holder, deep [CONF-T2-1]", () => {
  describeNetworks("tier 2 reference holder deep", (network) => {
    const plans = PLANS.get(network.id);
    if (!plans) {
      const reason = network.protocol === "v4" ? "CONFORMANCE_MINTS is not 1" : `${network.id} is a ${network.protocol} network; the deep matrix runs on v4 only`;
      it("eudi-dev deep matrix", (ctx) => ctx.skip(reason));
      return;
    }
    const holder: Holder = { root: "", version: null, issued: new Map(), presented: new Map(), errorResponses: new Map() };

    beforeAll(async () => {
      holder.root = fs.mkdtempSync(path.join(os.tmpdir(), "eudi-dev-deep-"));
      holder.version = await eudiVersion();
    });

    afterAll(() => {
      if (holder.root) fs.rmSync(holder.root, { recursive: true, force: true });
    });

    for (const plan of plans) {
      it(`which services mint ${plan.credential}`, () =>
        check(cellBase(network, null, "reference-holder-mint", plan.credential), async (): Promise<Verdict> => {
          const gap = mintGap(plan, network.id);
          const evidence = { probes: plan.probes };
          return gap ? { outcome: "unknown", cause: gap, evidence } : { outcome: "works", evidence };
        }));
    }

    const declare = (plan: CredentialPlan, service: CastService, step: Step): void => {
      const base = cellBase(network, service, step.check, plan.credential, step.variant);
      it(
        `eudi-dev ${step.check} ${base.scenario} on ${service.id}`,
        () =>
          check(base, async (): Promise<Verdict> => {
            if (!holder.version) return { outcome: "unknown", cause: `eudi-dev binary ${eudiBin()} did not answer 'version'` };
            return step.runner({ network, plan, service, holder, format: step.format });
          }),
        FLOW_TIMEOUT_MS,
      );
    };

    for (const plan of plans) {
      for (const service of plan.issuers) for (const step of ISSUER_STEPS) declare(plan, service, step);
      for (const service of plan.verifiers) for (const step of VERIFIER_STEPS) declare(plan, service, step);
    }

    if (process.env.CONFORMANCE_SLOW === "1") {
      it(
        "eudi-dev reference-holder-expired-request on every verifier",
        async () => {
          const results = await expiredRequests(network, plans, holder);
          for (const [base, verdict] of results) record({ ...base, ...verdict });
          const broken = results.filter(([, v]) => v.outcome === "broken");
          if (broken.length > 0) throw new CheckFailed(broken.map(([b, v]) => `${b.service}: ${v.cause}`).join(" | "));
        },
        FLOW_TIMEOUT_MS + 420_000,
      );
    }
  });
});
