import { ENDPOINTS } from "./site";

export type TrustState = "TRUSTED" | "UNTRUSTED" | "UNVERIFIED";
export type PotCredential = { ecsType?: string; result?: string; issuedBy?: string;
  schema?: { id?: number }; claims: Record<string, unknown>; permissionChain?: unknown[] };
export type PotResolution = {
  state: TrustState; did: string; trustStatus?: string; evaluatedAt?: string;
  evaluatedAtBlock?: number; expiresAt?: string;
  credentials: PotCredential[];
  failedCredentials: { id?: string; error?: string; errorCode?: string }[];
  dereferenceErrors?: unknown[];
};

const RESOLVER = process.env.RESOLVER_URL ?? ENDPOINTS.resolver;

const unverified = (did: string): PotResolution =>
  ({ state: "UNVERIFIED", did, credentials: [], failedCredentials: [] });

async function fetchResolve(did: string, timeoutMs: number): Promise<Response> {
  return fetch(
    `${RESOLVER}/v1/trust/resolve?did=${encodeURIComponent(did)}&detail=full`,
    { signal: AbortSignal.timeout(timeoutMs), next: { revalidate: 60 } },
  );
}

function trustState(status: string): TrustState {
  if (status === "TRUSTED") return "TRUSTED";
  if (status === "UNTRUSTED" || status === "PARTIAL") return "UNTRUSTED";
  return "UNVERIFIED";
}

function mapBody(did: string, body: unknown): PotResolution {
  if (typeof body !== "object" || body === null) return unverified(did);
  const b = body as Record<string, unknown>;
  if (b.did !== did || typeof b.trustStatus !== "string") return unverified(did);
  const credentials = Array.isArray(b.credentials)
    ? (b.credentials as PotCredential[]).map((c) => ({ ...c, claims: c.claims ?? {} }))
    : [];
  const failedCredentials = Array.isArray(b.failedCredentials)
    ? (b.failedCredentials as PotResolution["failedCredentials"])
    : [];
  return {
    state: trustState(b.trustStatus),
    did,
    trustStatus: b.trustStatus,
    evaluatedAt: typeof b.evaluatedAt === "string" ? b.evaluatedAt : undefined,
    evaluatedAtBlock: typeof b.evaluatedAtBlock === "number" ? b.evaluatedAtBlock : undefined,
    expiresAt: typeof b.expiresAt === "string" ? b.expiresAt : undefined,
    credentials,
    failedCredentials,
    dereferenceErrors: Array.isArray(b.dereferenceErrors)
      ? (b.dereferenceErrors as unknown[])
      : undefined,
  };
}

export async function resolveTrust(
  did: string,
  opts?: { timeoutMs?: number },
): Promise<PotResolution> {
  const timeoutMs = opts?.timeoutMs ?? 15_000;
  try {
    let res = await fetchResolve(did, timeoutMs);
    if (res.status === 404) {
      await fetch(`${RESOLVER}/v1/trust/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ did }),
        signal: AbortSignal.timeout(timeoutMs),
      }).catch(() => undefined);
      res = await fetchResolve(did, timeoutMs);
      if (res.status === 404) return unverified(did);
    }
    if (!res.ok) return unverified(did);
    return mapBody(did, await res.json());
  } catch {
    return unverified(did);
  }
}
