import { execFile, spawn } from "node:child_process";
import { randomInt } from "node:crypto";
import fs from "node:fs";
import net from "node:net";
import { z } from "zod";

export type EudiOptions = { walletDir: string; haip?: boolean; port?: number; timeoutMs?: number };

export type EudiIssuance = {
  deferred: boolean;
  credentialId: string | null;
  format: string | null;
  issuer: string | null;
  signature: string | null;
  signatureDetail: string | null;
};

export type EudiPresentation = { accepted: boolean; httpStatus: number; body: string; redirectUri: string | null };

export type EudiServerPresentation = ({ status: "submitted" } & EudiPresentation) | { status: "no_match"; error: string };

export type EudiValidation = { valid: boolean; failure: string | null; haipFindings: string[] | null };

export type EudiServer = { url: string; walletDir: string; haip: boolean };

export type EudiOutcome<T> =
  | { status: "completed"; result: T; args: string[] }
  | { status: "failed"; cause: string; args: string[] }
  | { status: "unknown"; cause: string; args: string[] };

export type ServerRun<T> = { status: "ran"; result: T } | { status: "unknown"; cause: string };

export type Refusal = { kind: "refused"; detail: string } | { kind: "accepted"; detail: string } | { kind: "errored"; detail: string } | { kind: "unknown"; cause: string };

export type VerifierAnswer = { statusCode: number; body: string };

type Parsed<T> = { ok: true; result: T } | { ok: false; failed: boolean; cause: string };

type Run = { kind: "exited"; code: number; stdout: string; stderr: string } | { kind: "unknown"; cause: string };

const DEFAULT_TIMEOUT_MS = 90_000;
const SERVER_READY_MS = 20_000;
const SERVER_STOP_MS = 5_000;

const IssuanceJsonSchema = z.looseObject({
  credential_id: z.string().optional(),
  format: z.string().optional(),
  issuer: z.string().optional(),
  verification_status: z.string().optional(),
  verification_detail: z.string().optional(),
  error: z.string().optional(),
  pending: z.boolean().optional(),
});

const DirectPostSchema = z.looseObject({
  status_code: z.number().int(),
  body: z.string(),
  redirect_uri: z.string().optional(),
});

const ServerPresentationSchema = z.looseObject({
  status: z.string(),
  response: DirectPostSchema.optional(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

const ServerConfigSchema = z.looseObject({
  wallet_dir: z.string(),
  require_haip: z.boolean(),
  validation_mode: z.string(),
  auto_accept: z.boolean(),
});

const CheckSchema = z.looseObject({ name: z.string(), status: z.string(), detail: z.string().optional() });

const DecodedJwtSchema = z.looseObject({
  header: z.record(z.string(), z.unknown()),
  payload: z.record(z.string(), z.unknown()),
  validation: z.looseObject({ checks: z.array(CheckSchema) }),
});

const DecodedOfferSchema = z.looseObject({
  credential_issuer: z.string().min(1),
  credential_configuration_ids: z.array(z.string()).min(1),
  grants: z.record(z.string(), z.unknown()),
});

const LogEntrySchema = z.looseObject({
  details: z.looseObject({ event: z.string().optional(), status_code: z.number().int().optional(), response_body: z.string().optional() }).optional(),
});

export const SIGNED_METADATA_TYP = "openidvci-issuer-metadata+jwt";

export const eudiBin = (): string => process.env.EUDI_DEV_BIN || "eudi";

export function acceptArgs(uri: string, opts: Pick<EudiOptions, "walletDir" | "haip" | "port">): string[] {
  const args = ["wallet", "accept", uri, "--auto-accept", "--json", "--no-open", "--no-color", "--storage", "file", "--wallet-dir", opts.walletDir, "--mode", "strict"];
  const withPort = opts.port ? [...args, "--port", String(opts.port)] : args;
  return opts.haip ? [...withPort, "--haip"] : withPort;
}

export function serveArgs(opts: { walletDir: string; port: number; haip: boolean }): string[] {
  const args = ["wallet", "serve", "--auto-accept", "--no-open", "--no-register", "--no-color", "--storage", "file", "--wallet-dir", opts.walletDir, "--port", String(opts.port), "--mode", "strict"];
  return opts.haip ? [...args, "--haip"] : args;
}

export const remoteAcceptArgs = (uri: string, server: EudiServer): string[] => ["wallet", "accept", uri, "--remote", server.url, "--auto-accept", "--json", "--no-open", "--no-color"];

export function decodeArgs(input: string, format?: string): string[] {
  const args = ["decode", input, "--json", "--no-color"];
  return format ? [...args, "--format", format] : args;
}

export const validateArgs = (file: string): string[] => ["validate", file, "--haip", "--no-color"];

export const showArgs = (id: string, walletDir: string): string[] => ["wallet", "show", id, "--wallet-dir", walletDir, "--storage", "file", "--remote", "local", "--no-color"];

export function trailingJson(stdout: string): unknown {
  const lines = stdout.split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!lines[i]?.startsWith("{")) continue;
    try {
      return JSON.parse(lines.slice(i).join("\n"));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function run(bin: string, args: string[], env: NodeJS.ProcessEnv, timeoutMs: number): Promise<Run> {
  return new Promise((resolve) => {
    execFile(bin, args, { env, timeout: timeoutMs, maxBuffer: 16 * 1024 * 1024, encoding: "utf8" }, (error, stdout, stderr) => {
      if (!error) return resolve({ kind: "exited", code: 0, stdout, stderr });
      if (error.code === "ENOENT") return resolve({ kind: "unknown", cause: `eudi-dev binary not found: ${bin}` });
      if (error.killed) return resolve({ kind: "unknown", cause: `eudi-dev did not finish within ${timeoutMs} ms` });
      if (typeof error.code === "number") return resolve({ kind: "exited", code: error.code, stdout, stderr });
      resolve({ kind: "unknown", cause: `eudi-dev could not run: ${error.message}` });
    });
  });
}

// Two accepts at once forward to each other's temporary wallet server on port 8085.
let queue: Promise<unknown> = Promise.resolve();

function sequential<T>(task: () => Promise<T>): Promise<T> {
  const next = queue.then(task, task);
  queue = next.catch(() => undefined);
  return next;
}

const lastLine = (text: string): string | undefined =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .at(-1);

const homeEnv = (walletDir: string | null): NodeJS.ProcessEnv => (walletDir ? { ...process.env, EUDI_DEV_HOME: walletDir } : process.env);

async function invoke<T>(args: string[], walletDir: string | null, timeoutMs: number, parse: (stdout: string) => Parsed<T>): Promise<EudiOutcome<T>> {
  // EUDI_DEV_HOME keeps a `wallet use` remote or a registered URL handler from taking the flow.
  const outcome = await run(eudiBin(), args, homeEnv(walletDir), timeoutMs);
  if (outcome.kind === "unknown") return { status: "unknown", cause: outcome.cause, args };
  if (outcome.code !== 0) return { status: "failed", cause: lastLine(outcome.stderr) ?? `eudi-dev exited with code ${outcome.code}`, args };
  const parsed = parse(outcome.stdout);
  if (parsed.ok) return { status: "completed", result: parsed.result, args };
  return { status: parsed.failed ? "failed" : "unknown", cause: parsed.cause, args };
}

const fromJson =
  <T>(parse: (json: unknown) => Parsed<T>) =>
  (stdout: string): Parsed<T> => {
    const json = trailingJson(stdout);
    if (json === undefined) return { ok: false, failed: false, cause: `eudi-dev printed no JSON result: ${lastLine(stdout) ?? "empty output"}` };
    return parse(json);
  };

function parseIssuance(json: unknown): Parsed<EudiIssuance> {
  const parsed = IssuanceJsonSchema.safeParse(json);
  if (!parsed.success) return { ok: false, failed: false, cause: `unrecognised eudi-dev issuance result: ${JSON.stringify(json)}` };
  const r = parsed.data;
  if (r.error) return { ok: false, failed: true, cause: r.error };
  if (!r.pending && !r.credential_id) return { ok: false, failed: false, cause: `eudi-dev issuance result has no credential_id: ${JSON.stringify(json)}` };
  return {
    ok: true,
    result: {
      deferred: r.pending === true,
      credentialId: r.credential_id || null,
      format: r.format || null,
      issuer: r.issuer || null,
      signature: r.verification_status || null,
      signatureDetail: r.verification_detail || null,
    },
  };
}

function parsePresentation(json: unknown): Parsed<EudiPresentation> {
  const parsed = DirectPostSchema.safeParse(json);
  if (!parsed.success) return { ok: false, failed: false, cause: `unrecognised eudi-dev presentation result: ${JSON.stringify(json)}` };
  const r = parsed.data;
  return { ok: true, result: { accepted: r.status_code >= 200 && r.status_code < 400, httpStatus: r.status_code, body: r.body, redirectUri: r.redirect_uri ?? null } };
}

export function parseServerPresentation(json: unknown): Parsed<EudiServerPresentation> {
  const parsed = ServerPresentationSchema.safeParse(json);
  if (!parsed.success) return { ok: false, failed: false, cause: `unrecognised eudi-dev wallet server result: ${JSON.stringify(json)}` };
  const r = parsed.data;
  const reason = r.error_description || r.error || "no reason given";
  if (r.status === "no_match") return { ok: true, result: { status: "no_match", error: reason } };
  if (r.status !== "submitted") return { ok: false, failed: true, cause: `wallet server answered ${r.status}: ${reason}` };
  if (!r.response) return { ok: false, failed: false, cause: `wallet server submitted without a verifier response: ${JSON.stringify(json)}` };
  const p = r.response;
  return { ok: true, result: { status: "submitted", accepted: p.status_code >= 200 && p.status_code < 400, httpStatus: p.status_code, body: p.body, redirectUri: p.redirect_uri ?? null } };
}

function parseObject(json: unknown): Parsed<Record<string, unknown>> {
  const parsed = z.record(z.string(), z.unknown()).safeParse(json);
  return parsed.success ? { ok: true, result: parsed.data } : { ok: false, failed: false, cause: `eudi-dev decode printed no JSON object: ${JSON.stringify(json)}` };
}

export function parseHaipFindings(stdout: string): string[] | null {
  const lines = stdout.split(/\r?\n/).map((l) => l.trim());
  if (lines.includes("HAIP 1.0: no findings")) return [];
  const start = lines.indexOf("HAIP 1.0 findings:");
  if (start < 0) return null;
  const findings: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith("- ")) break;
    findings.push(line.slice(2));
  }
  return findings;
}

const queuedAccept = <T>(uri: string, opts: EudiOptions, parse: (json: unknown) => Parsed<T>): Promise<EudiOutcome<T>> =>
  sequential(() => invoke(acceptArgs(uri, opts), opts.walletDir, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, fromJson(parse)));

export const receiveWithEudi = (offerUrl: string, opts: EudiOptions): Promise<EudiOutcome<EudiIssuance>> => queuedAccept(offerUrl, opts, parseIssuance);

export const presentWithEudi = (requestUrl: string, opts: EudiOptions): Promise<EudiOutcome<EudiPresentation>> => queuedAccept(requestUrl, opts, parsePresentation);

export const decodeWithEudi = (input: string, opts: { format?: string; timeoutMs?: number } = {}): Promise<EudiOutcome<Record<string, unknown>>> =>
  invoke(decodeArgs(input, opts.format), null, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS, fromJson(parseObject));

export async function validateWithEudi(file: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<EudiOutcome<EudiValidation>> {
  const args = validateArgs(file);
  const outcome = await run(eudiBin(), args, process.env, timeoutMs);
  if (outcome.kind === "unknown") return { status: "unknown", cause: outcome.cause, args };
  const failure = outcome.code === 0 ? null : (lastLine(outcome.stderr) ?? `eudi-dev exited with code ${outcome.code}`);
  return { status: "completed", result: { valid: outcome.code === 0, failure, haipFindings: parseHaipFindings(outcome.stdout) }, args };
}

export const storedCredential = (id: string, walletDir: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<EudiOutcome<string>> =>
  invoke(showArgs(id, walletDir), walletDir, timeoutMs, (stdout) => {
    const raw = stdout.trim();
    return raw.includes("~") ? { ok: true, result: raw } : { ok: false, failed: false, cause: `eudi-dev wallet show printed no SD-JWT: ${lastLine(stdout) ?? "empty output"}` };
  });

export const receiveViaServer = (offerUrl: string, server: EudiServer, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<EudiOutcome<EudiIssuance>> =>
  invoke(remoteAcceptArgs(offerUrl, server), server.walletDir, timeoutMs, fromJson(parseIssuance));

export const presentViaServer = (requestUrl: string, server: EudiServer, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<EudiOutcome<EudiServerPresentation>> =>
  invoke(remoteAcceptArgs(requestUrl, server), server.walletDir, timeoutMs, fromJson(parseServerPresentation));

function bindable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once("error", () => resolve(false));
    probe.listen(port, () => probe.close(() => resolve(true)));
  });
}

// Outgoing connections take their local port from the ephemeral range (49152+ on macOS), so a pair picked there can be gone by the time eudi-dev binds it.
const PAIR_RANGE = { from: 20_000, to: 40_000 };

export async function freePortPair(): Promise<number> {
  for (let i = 0; i < 50; i++) {
    const port = randomInt(PAIR_RANGE.from, PAIR_RANGE.to);
    if ((await bindable(port)) && (await bindable(port + 1))) return port;
  }
  throw new Error("no free pair of adjacent local ports");
}

const realpath = (p: string): string => {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
};

async function serverConfig(url: string): Promise<unknown> {
  try {
    const res = await fetch(`${url}/api/config`, { signal: AbortSignal.timeout(1_000) });
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  }
}

const SERVE_ATTEMPTS = 3;

export function withEudiServer<T>(opts: { walletDir: string; haip: boolean }, body: (server: EudiServer) => Promise<T>): Promise<ServerRun<T>> {
  return sequential(async (): Promise<ServerRun<T>> => {
    let run: ServerRun<T> = { status: "unknown", cause: "eudi-dev wallet serve never started" };
    for (let attempt = 0; attempt < SERVE_ATTEMPTS; attempt++) {
      run = await serveOnce(opts, await freePortPair(), body);
      if (run.status === "ran" || !run.cause.includes("address already in use")) return run;
    }
    return run;
  });
}

async function serveOnce<T>(opts: { walletDir: string; haip: boolean }, port: number, body: (server: EudiServer) => Promise<T>): Promise<ServerRun<T>> {
  const server: EudiServer = { url: `http://127.0.0.1:${port}`, walletDir: opts.walletDir, haip: opts.haip };
  const child = spawn(eudiBin(), serveArgs({ walletDir: opts.walletDir, port, haip: opts.haip }), { env: homeEnv(opts.walletDir), stdio: ["ignore", "ignore", "pipe"] });
  const proc: { stderr: string; spawnError: string | null; exited: boolean } = { stderr: "", spawnError: null, exited: false };
  child.stderr.on("data", (chunk: Buffer) => {
    proc.stderr = `${proc.stderr}${chunk.toString("utf8")}`.slice(-4_000);
  });
  child.on("error", (e: Error) => {
    const missing = "code" in e && e.code === "ENOENT";
    proc.spawnError = missing ? `eudi-dev binary not found: ${eudiBin()}` : `eudi-dev wallet serve could not run: ${e.message}`;
  });
  const exit = new Promise<void>((resolve) => {
    child.on("close", () => {
      proc.exited = true;
      resolve();
    });
  });
  const settle = (): Promise<unknown> => Promise.race([exit, new Promise((resolve) => setTimeout(resolve, SERVER_STOP_MS))]);

  const stop = async (): Promise<void> => {
    if (proc.exited) return;
    await fetch(`${server.url}/api/shutdown`, { method: "POST", signal: AbortSignal.timeout(2_000) }).catch(() => undefined);
    await settle();
    if (!proc.exited) child.kill("SIGKILL");
    await settle();
  };

  const deadline = Date.now() + SERVER_READY_MS;
  let config: z.infer<typeof ServerConfigSchema> | null = null;
  while (!config) {
    if (proc.spawnError) return { status: "unknown", cause: proc.spawnError };
    if (proc.exited) return { status: "unknown", cause: `eudi-dev wallet serve exited before answering: ${lastLine(proc.stderr) ?? "no output"}` };
    if (Date.now() > deadline) {
      await stop();
      return { status: "unknown", cause: `eudi-dev wallet serve did not answer within ${SERVER_READY_MS} ms` };
    }
    const parsed = ServerConfigSchema.safeParse(await serverConfig(server.url));
    if (parsed.success) config = parsed.data;
    else await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (realpath(config.wallet_dir) !== realpath(opts.walletDir) || config.require_haip !== opts.haip || config.validation_mode !== "strict" || !config.auto_accept) {
    await stop();
    return { status: "unknown", cause: `port ${port} answered with another wallet configuration: ${JSON.stringify(config)}` };
  }
  try {
    return { status: "ran", result: await body(server) };
  } finally {
    await stop();
  }
}

export async function serverLog(server: EudiServer): Promise<unknown> {
  const res = await fetch(`${server.url}/api/log`, { signal: AbortSignal.timeout(5_000) });
  if (!res.ok) throw new Error(`GET ${server.url}/api/log -> HTTP ${res.status}`);
  return res.json();
}

export function verifierAnswers(log: unknown): VerifierAnswer[] {
  const parsed = z.array(LogEntrySchema).safeParse(log);
  if (!parsed.success) return [];
  return parsed.data.flatMap((entry) => {
    const d = entry.details;
    return d?.event === "verifier_response" && d.status_code !== undefined ? [{ statusCode: d.status_code, body: d.response_body ?? "" }] : [];
  });
}

export function inlineOffer(decoded: unknown): string | null {
  const parsed = DecodedOfferSchema.safeParse(decoded);
  if (!parsed.success) return null;
  const { credential_issuer, credential_configuration_ids, grants } = parsed.data;
  return `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify({ credential_issuer, credential_configuration_ids, grants }))}`;
}

export function inlineRequest(requestUrl: string, requestObject: string): string | null {
  const clientId = new URL(requestUrl).searchParams.get("client_id");
  if (!clientId || requestObject.split(".").length !== 3) return null;
  return `openid4vp://?client_id=${encodeURIComponent(clientId)}&request=${requestObject}`;
}

export function requestUriOf(requestUrl: string): string | null {
  return new URL(requestUrl).searchParams.get("request_uri");
}

export function withRequestId(requestUrl: string, id: string): string | null {
  const url = new URL(requestUrl);
  const requestUri = url.searchParams.get("request_uri");
  const clientId = url.searchParams.get("client_id");
  if (!requestUri || !clientId) return null;
  const target = new URL(requestUri);
  target.pathname = target.pathname.replace(/[^/]+$/, id);
  return `openid4vp://?client_id=${encodeURIComponent(clientId)}&request_uri=${encodeURIComponent(target.toString())}`;
}

const AGENT_REFUSALS: RegExp[] = [
  /fetching credential_offer_uri: .*HTTP (4\d\d)\b/,
  /token exchange: (invalid_grant|invalid_request|invalid_client|unauthorized_client|access_denied)\b/,
  /fetching request_uri: .*HTTP (4\d\d)\b/,
];

const AGENT_ERRORS: RegExp[] = [/fetching credential_offer_uri: .*HTTP (5\d\d)\b/, /token exchange: server_error\b/, /fetching request_uri: .*HTTP (5\d\d)\b/];

export function agentRefusal(outcome: EudiOutcome<EudiIssuance | EudiPresentation>): Refusal {
  if (outcome.status === "unknown") return { kind: "unknown", cause: outcome.cause };
  if (outcome.status === "failed") {
    if (AGENT_REFUSALS.some((p) => p.test(outcome.cause))) return { kind: "refused", detail: outcome.cause };
    if (AGENT_ERRORS.some((p) => p.test(outcome.cause))) return { kind: "errored", detail: outcome.cause };
    return { kind: "unknown", cause: `eudi-dev stopped before the agent answered: ${outcome.cause}` };
  }
  const result = outcome.result;
  if (!("httpStatus" in result)) return { kind: "accepted", detail: result.deferred ? "the issuer deferred a credential" : `the issuer issued credential ${result.credentialId ?? "?"}` };
  if (result.accepted) return { kind: "accepted", detail: `verifier answered HTTP ${result.httpStatus}: ${result.body}` };
  if (result.httpStatus >= 500) return { kind: "errored", detail: `verifier answered HTTP ${result.httpStatus}: ${result.body}` };
  return { kind: "refused", detail: `verifier answered HTTP ${result.httpStatus}: ${result.body}` };
}

export function signedMetadataFindings(decoded: unknown, issuer: string): { findings: string[] } | { unknown: string } {
  const parsed = DecodedJwtSchema.safeParse(decoded);
  if (!parsed.success) return { unknown: `unrecognised eudi-dev decode result: ${JSON.stringify(decoded).slice(0, 300)}` };
  const { header, payload, validation } = parsed.data;
  const signature = validation.checks.find((c) => c.name === "signature");
  if (!signature) return { unknown: "eudi-dev decode reported no signature check" };
  const findings: string[] = [];
  if (header.typ !== SIGNED_METADATA_TYP) findings.push(`typ ${JSON.stringify(header.typ)} is not ${SIGNED_METADATA_TYP} (OID4VCI 1.0 §12.2.3)`);
  const alg = typeof header.alg === "string" ? header.alg : "";
  if (!alg || alg.toLowerCase() === "none" || alg.toUpperCase().startsWith("HS")) findings.push(`alg ${JSON.stringify(header.alg)} is not an asymmetric signature algorithm (OID4VCI 1.0 §12.2.3)`);
  if (!Array.isArray(header.x5c) || header.x5c.length === 0) findings.push("no x5c header, so eudi-dev cannot place the signer");
  if (payload.sub !== issuer) findings.push(`sub ${JSON.stringify(payload.sub)} is not the credential issuer identifier ${issuer} (OID4VCI 1.0 §12.2.3)`);
  if (payload.credential_issuer !== issuer) findings.push(`credential_issuer ${JSON.stringify(payload.credential_issuer)} is not ${issuer} (OID4VCI 1.0 §12.2.4)`);
  if (signature.status !== "pass") findings.push(`signature ${signature.status}: ${signature.detail ?? "no detail"}`);
  for (const c of validation.checks) if (c.status === "fail" && c.name !== "signature") findings.push(`${c.name}: ${c.detail ?? "failed"}`);
  return { findings };
}

export function credentialFindings(decoded: unknown): { findings: string[]; checks: z.infer<typeof CheckSchema>[]; payload: Record<string, unknown> } | { unknown: string } {
  const parsed = DecodedJwtSchema.safeParse(decoded);
  if (!parsed.success) return { unknown: `unrecognised eudi-dev decode result: ${JSON.stringify(decoded).slice(0, 300)}` };
  const { payload, validation } = parsed.data;
  const findings = validation.checks.filter((c) => c.status === "fail").map((c) => `${c.name}: ${c.detail ?? "failed"}`);
  const signature = validation.checks.find((c) => c.name === "signature");
  if (!signature) return { unknown: "eudi-dev decode reported no signature check" };
  if (signature.status === "skipped") findings.push(`signature not verified: ${signature.detail ?? "no detail"}`);
  return { findings, checks: validation.checks, payload };
}

export async function eudiVersion(): Promise<string | null> {
  const outcome = await run(eudiBin(), ["version"], process.env, 10_000);
  return outcome.kind === "exited" && outcome.code === 0 ? (lastLine(outcome.stdout) ?? null) : null;
}
