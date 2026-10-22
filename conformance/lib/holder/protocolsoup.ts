import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { fetchJson, fetchText, fetchWithTimeout } from "../http";

export type Anchors = { verifiers: string[]; issuers: string[] };
export type Harness = { url: string; stop: () => Promise<void>; output: () => string };
export type HarnessReply = { status: number; body: Record<string, unknown> };
export type Exchange = { step: string; method: string; url: string; status: number };

const READY_MS = 20_000;
const STOP_MS = 5_000;
const CALL_TIMEOUT_MS = 120_000;

const JwtHeaderSchema = z.looseObject({ x5c: z.array(z.string().min(1)).min(1) });
const OfferSchema = z.looseObject({ credential_issuer: z.url() });
const ErrorSchema = z.looseObject({ error: z.string().min(1), error_description: z.string().optional() });
const ImportedSchema = z.looseObject({ credential_id: z.string().min(1), credential_format: z.string().optional(), credential_issuer: z.string().optional() });
const ResolvedSchema = z.looseObject({
  client_id: z.string(),
  response_mode: z.string(),
  dcql_query: z.unknown().optional(),
  trust: z.looseObject({ request_object_verification: z.looseObject({ verified: z.boolean() }).optional() }),
});
const PresentedSchema = z.looseObject({ upstream_status: z.number(), upstream_body: z.unknown().optional() });
const HopSchema = z.looseObject({ step: z.string().optional(), method: z.string().optional(), url: z.string().optional(), response_status: z.number().optional() });

export const protocolsoupBin = (): string | null => process.env.PROTOCOLSOUP_BIN || null;

export const protocolsoupRef = (): string | null => process.env.PROTOCOLSOUP_REF || null;

export function pemOf(der: string): string {
  return `-----BEGIN CERTIFICATE-----\n${(der.match(/.{1,64}/g) ?? []).join("\n")}\n-----END CERTIFICATE-----\n`;
}

export function x5cAnchor(jwt: string): string | null {
  const header = jwt.trim().split(".")[0];
  if (!header) return null;
  try {
    const parsed = JwtHeaderSchema.safeParse(JSON.parse(Buffer.from(header, "base64url").toString("utf8")));
    const root = parsed.success ? parsed.data.x5c.at(-1) : undefined;
    return root ? pemOf(root) : null;
  } catch {
    return null;
  }
}

export function signedMetadataUrl(credentialIssuer: string): string {
  const url = new URL(credentialIssuer);
  return `${url.origin}/.well-known/openid-credential-issuer${url.pathname.replace(/\/$/, "")}`;
}

export async function offerIssuer(offerUrl: string): Promise<string> {
  const params = new URL(offerUrl).searchParams;
  const inline = params.get("credential_offer");
  const byReference = params.get("credential_offer_uri");
  if (!inline && !byReference) throw new Error(`not a credential offer: ${offerUrl}`);
  const offer: unknown = inline ? JSON.parse(inline) : await fetchJson(byReference as string);
  return OfferSchema.parse(offer).credential_issuer;
}

export async function issuerAnchor(offerUrl: string): Promise<string> {
  const metadata = signedMetadataUrl(await offerIssuer(offerUrl));
  const anchor = x5cAnchor(await fetchText(metadata, { headers: { accept: "application/jwt" } }));
  if (!anchor) throw new Error(`${metadata} served no signed metadata with an x5c header`);
  return anchor;
}

export async function verifierAnchor(requestUrl: string): Promise<string> {
  const requestUri = new URL(requestUrl).searchParams.get("request_uri");
  if (!requestUri) throw new Error(`no request_uri in ${requestUrl}`);
  const anchor = x5cAnchor(await fetchText(requestUri, { headers: { accept: "application/oauth-authz-req+jwt" } }));
  if (!anchor) throw new Error(`the request object at ${requestUri} has no x5c header`);
  return anchor;
}

export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() => (address && typeof address === "object" ? resolve(address.port) : reject(new Error("no local port"))));
    });
  });
}

export function harnessEnv(home: string, port: number, anchors: Anchors): NodeJS.ProcessEnv {
  const url = `http://127.0.0.1:${port}`;
  return {
    PATH: process.env.PATH,
    HOME: home,
    WALLET_LISTEN_ADDR: `127.0.0.1:${port}`,
    WALLET_TARGET_BASE_URL: url,
    WALLET_ISSUER_BASE_URL: url,
    WALLET_ALLOWED_CORS_ORIGINS: url,
    WALLET_DEFAULT_CREDENTIAL_FORMAT: "dc+sd-jwt",
    WALLET_DEVICE_KEY_PATH: path.join(home, "device-key.pem"),
    WALLET_VERIFIER_X509_TRUST_ANCHOR_PEM: [...new Set(anchors.verifiers)].join(""),
    WALLET_MDOC_IACA_ROOT_PEM: [...new Set(anchors.issuers)].join(""),
  };
}

async function healthy(url: string): Promise<boolean> {
  try {
    return (await fetchWithTimeout(`${url}/health`, { timeoutMs: 1_000 })).ok;
  } catch {
    return false;
  }
}

export async function startHarness(bin: string, anchors: Anchors): Promise<Harness> {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "protocolsoup-"));
  const port = await freePort();
  const url = `http://127.0.0.1:${port}`;
  const lines: string[] = [];
  const child = spawn(bin, [], { env: harnessEnv(home, port, anchors), stdio: ["ignore", "pipe", "pipe"] });
  let exited: string | null = null;
  child.stdout.on("data", (d: Buffer) => lines.push(d.toString()));
  child.stderr.on("data", (d: Buffer) => lines.push(d.toString()));
  child.on("error", (e) => (exited = e.message));
  child.on("exit", (code, signal) => (exited ??= `exited with ${code ?? signal}`));
  const output = (): string => lines.join("").slice(-4_000);
  const stop = async (): Promise<void> => {
    if (child.exitCode === null && child.signalCode === null) {
      const gone = new Promise((resolve) => child.once("exit", resolve));
      child.kill("SIGTERM");
      await Promise.race([gone, new Promise((resolve) => setTimeout(resolve, STOP_MS))]);
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
    fs.rmSync(home, { recursive: true, force: true });
  };

  const deadline = Date.now() + READY_MS;
  while (Date.now() < deadline && exited === null) {
    if (await healthy(url)) return { url, stop, output };
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  await stop();
  throw new Error(`the ProtocolSoup wallet harness ${exited ?? `did not answer /health within ${READY_MS} ms`}: ${output()}`);
}

export async function callHarness(harness: Harness, route: string, session: string, body: unknown): Promise<HarnessReply> {
  const res = await fetchWithTimeout(`${harness.url}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-wallet-session": session },
    body: JSON.stringify(body),
    timeoutMs: CALL_TIMEOUT_MS,
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text.slice(0, 500) };
  }
  return { status: res.status, body: parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : { value: parsed } };
}

export function refusal(reply: HarnessReply): string | null {
  const error = ErrorSchema.safeParse(reply.body);
  if (error.success) return `${error.data.error}${error.data.error_description ? `: ${error.data.error_description}` : ""}`;
  return reply.status >= 400 ? `HTTP ${reply.status}` : null;
}

export function exchanges(reply: HarnessReply): Exchange[] {
  const hops = z.array(HopSchema).safeParse(reply.body._protocol_exchanges);
  if (!hops.success) return [];
  return hops.data.map((h) => ({ step: h.step ?? "", method: h.method ?? "", url: h.url ?? "", status: h.response_status ?? 0 }));
}

export function imported(reply: HarnessReply): { credentialId: string } | { problem: string } {
  const refused = refusal(reply);
  if (refused) return { problem: refused };
  const parsed = ImportedSchema.safeParse(reply.body);
  return parsed.success ? { credentialId: parsed.data.credential_id } : { problem: "the import answered without a stored credential_id" };
}

export function requestProblems(reply: HarnessReply): string[] {
  const refused = refusal(reply);
  if (refused) return [`ProtocolSoup refused the request: ${refused}`];
  const parsed = ResolvedSchema.safeParse(reply.body);
  if (!parsed.success) return [`unexpected /api/resolve answer: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`];
  const { client_id, response_mode, dcql_query, trust } = parsed.data;
  const problems: string[] = [];
  if (trust.request_object_verification?.verified !== true) problems.push("the request object signature was not verified against the verifier's x5c root");
  if (!client_id.startsWith("x509_hash:")) problems.push(`client_id ${client_id} is not an x509_hash client id`);
  if (response_mode !== "direct_post.jwt") problems.push(`response_mode is ${response_mode}, not direct_post.jwt`);
  if (dcql_query === undefined) problems.push("the request carries no dcql_query");
  return problems;
}

export function presentationProblems(reply: HarnessReply): string[] {
  const parsed = PresentedSchema.safeParse(reply.body);
  if (!parsed.success) return [`ProtocolSoup did not submit: ${refusal(reply) ?? `HTTP ${reply.status}`}`];
  const { upstream_status, upstream_body } = parsed.data;
  if (upstream_status === 200) return [];
  return [`verifier answered HTTP ${upstream_status}: ${JSON.stringify(upstream_body ?? null).slice(0, 300)}`];
}
