// Server-side helpers for the Verana testnet: the demo-service cast (from
// verana-labs/verana-demos), DID discovery, and the Trust Resolver client.

import { ENDPOINTS } from "./site";

/** The standing demo services (the demo cast; dedicated Vesta instances
 *  are being deployed per story participant), from
 *  verana-labs/verana-demos. */
export const DEMO_SERVICE_IDS = [
  "organization-vs",
  "issuer-chatbot-vs",
  "issuer-web-vs",
  "verifier-chatbot-vs",
  "verifier-web-vs",
] as const;

export type DemoServiceId = (typeof DEMO_SERVICE_IDS)[number];

export const DEMOS_BASE_DOMAIN =
  process.env.DEMOS_BASE_DOMAIN || "main.demos.testnet.verana.network";

export function isDemoServiceId(id: string): id is DemoServiceId {
  return (DEMO_SERVICE_IDS as readonly string[]).includes(id);
}

export async function fetchJson<T>(
  url: string,
  timeoutMs = 8_000,
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

type DidDoc = { id?: string; alsoKnownAs?: string[] };

/** Canonical DID of a service: the did:webvh alias when present. */
export async function serviceDid(host: string): Promise<string | null> {
  const doc = await fetchJson<DidDoc>(`https://${host}/.well-known/did.json`);
  if (!doc) return null;
  return (
    doc.alsoKnownAs?.find((d) => d.startsWith("did:webvh:")) ?? doc.id ?? null
  );
}

export type ResolvedCredential = {
  ecsType?: string;
  result?: string;
  claims?: Record<string, unknown>;
};

export type ResolveResult = {
  trustStatus?: string;
  credentials?: ResolvedCredential[];
};

/** Trust-resolve a DID against the public resolver (first-time resolutions
 *  can take a few seconds; the resolver caches results). */
export function resolveDid(did: string, timeoutMs = 30_000) {
  return fetchJson<ResolveResult>(
    `${ENDPOINTS.resolver}/v1/trust/resolve?did=${encodeURIComponent(did)}&detail=full`,
    timeoutMs,
  );
}

export function claimStr(
  cred: ResolvedCredential | undefined,
  key: string,
): string | null {
  const value = cred?.claims?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
