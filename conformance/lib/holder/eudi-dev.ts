import { execFile } from "node:child_process";
import { z } from "zod";

export type EudiOptions = { walletDir: string; haip?: boolean; timeoutMs?: number };

export type EudiIssuance = {
  deferred: boolean;
  credentialId: string | null;
  format: string | null;
  issuer: string | null;
  signature: string | null;
  signatureDetail: string | null;
};

export type EudiPresentation = { accepted: boolean; httpStatus: number; body: string; redirectUri: string | null };

export type EudiOutcome<T> =
  | { status: "completed"; result: T; args: string[] }
  | { status: "failed"; cause: string; args: string[] }
  | { status: "unknown"; cause: string; args: string[] };

type Parsed<T> = { ok: true; result: T } | { ok: false; failed: boolean; cause: string };

type Run = { kind: "exited"; code: number; stdout: string; stderr: string } | { kind: "unknown"; cause: string };

const DEFAULT_TIMEOUT_MS = 90_000;

const IssuanceJsonSchema = z.looseObject({
  credential_id: z.string().optional(),
  format: z.string().optional(),
  issuer: z.string().optional(),
  verification_status: z.string().optional(),
  verification_detail: z.string().optional(),
  error: z.string().optional(),
  pending: z.boolean().optional(),
});

const PresentationJsonSchema = z.looseObject({
  status_code: z.number().int(),
  body: z.string(),
  redirect_uri: z.string().optional(),
});

export const eudiBin = (): string => process.env.EUDI_DEV_BIN || "eudi";

export function acceptArgs(uri: string, opts: Pick<EudiOptions, "walletDir" | "haip">): string[] {
  const args = ["wallet", "accept", uri, "--auto-accept", "--json", "--no-open", "--no-color", "--storage", "file", "--wallet-dir", opts.walletDir, "--mode", "strict"];
  return opts.haip ? [...args, "--haip"] : args;
}

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

async function accept<T>(uri: string, opts: EudiOptions, parse: (json: unknown) => Parsed<T>): Promise<EudiOutcome<T>> {
  const args = acceptArgs(uri, opts);
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  // EUDI_DEV_HOME keeps a `wallet use` remote or a registered URL handler from taking the flow.
  const outcome = await sequential(() => run(eudiBin(), args, { ...process.env, EUDI_DEV_HOME: opts.walletDir }, timeoutMs));
  if (outcome.kind === "unknown") return { status: "unknown", cause: outcome.cause, args };
  if (outcome.code !== 0) return { status: "failed", cause: lastLine(outcome.stderr) ?? `eudi-dev exited with code ${outcome.code}`, args };
  const json = trailingJson(outcome.stdout);
  if (json === undefined) return { status: "unknown", cause: `eudi-dev printed no JSON result: ${lastLine(outcome.stdout) ?? "empty output"}`, args };
  const parsed = parse(json);
  if (parsed.ok) return { status: "completed", result: parsed.result, args };
  return { status: parsed.failed ? "failed" : "unknown", cause: parsed.cause, args };
}

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
  const parsed = PresentationJsonSchema.safeParse(json);
  if (!parsed.success) return { ok: false, failed: false, cause: `unrecognised eudi-dev presentation result: ${JSON.stringify(json)}` };
  const r = parsed.data;
  return { ok: true, result: { accepted: r.status_code >= 200 && r.status_code < 400, httpStatus: r.status_code, body: r.body, redirectUri: r.redirect_uri ?? null } };
}

export const receiveWithEudi = (offerUrl: string, opts: EudiOptions): Promise<EudiOutcome<EudiIssuance>> => accept(offerUrl, opts, parseIssuance);

export const presentWithEudi = (requestUrl: string, opts: EudiOptions): Promise<EudiOutcome<EudiPresentation>> => accept(requestUrl, opts, parsePresentation);

export async function eudiVersion(): Promise<string | null> {
  const outcome = await run(eudiBin(), ["version"], process.env, 10_000);
  return outcome.kind === "exited" && outcome.code === 0 ? (lastLine(outcome.stdout) ?? null) : null;
}
