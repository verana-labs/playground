import { ENDPOINTS } from "./site";
import { PROTOCOL } from "./network";

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
const INDEXER = process.env.INDEXER_URL ?? ENDPOINTS.indexer;

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

// V4: the indexer resolves trust. An ECS schema title maps to the V3 ECS type,
// so the trust cards read one shape on both protocols.
const ECS_TYPES: Record<string, string> = {
  ServiceCredential: "ECS-SERVICE",
  OrganizationCredential: "ECS-ORG",
  PersonaCredential: "ECS-PERSONA",
  UserAgentCredential: "ECS-UA",
};

type V4EcsCredential = {
  ecsSchema?: string;
  id?: string;
  credentialSchemaId?: number;
  credentialSubject?: Record<string, unknown>;
};

export function mapV4Body(did: string, body: unknown): PotResolution {
  if (typeof body !== "object" || body === null) return unverified(did);
  const b = body as Record<string, unknown>;
  if (b.did !== did || typeof b.trusted !== "boolean") return unverified(did);
  const status = b.trusted ? "TRUSTED" : "UNTRUSTED";
  const credentials = Array.isArray(b.ecsCredentials)
    ? (b.ecsCredentials as V4EcsCredential[]).map((c) => ({
        ecsType: (c.ecsSchema && ECS_TYPES[c.ecsSchema]) ?? c.ecsSchema,
        // The indexer lists only the credentials it accepted.
        result: "VALID",
        // The credential id is "<issuer DID>#<uuid>".
        issuedBy: c.id?.split("#")[0],
        schema: { id: c.credentialSchemaId },
        claims: c.credentialSubject ?? {},
      }))
    : [];
  return {
    state: status,
    did,
    trustStatus: status,
    evaluatedAt: typeof b.evaluatedAtTime === "string" ? b.evaluatedAtTime : undefined,
    evaluatedAtBlock: typeof b.evaluatedAtBlock === "number" ? b.evaluatedAtBlock : undefined,
    expiresAt: typeof b.expiresAtTime === "string" ? b.expiresAtTime : undefined,
    credentials,
    failedCredentials: [],
  };
}

async function resolveTrustV4(did: string, timeoutMs: number): Promise<PotResolution> {
  try {
    const res = await fetch(`${INDEXER}/v4/verifiable-trust/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ did, ecsCredentials: true, participations: true }),
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate: 60 },
    });
    // The indexer knows only the DIDs of the VPR. A DID that is not in the
    // VPR is not trusted.
    if (res.status === 404) {
      return { ...unverified(did), state: "UNTRUSTED", trustStatus: "UNTRUSTED" };
    }
    if (!res.ok) return unverified(did);
    return mapV4Body(did, await res.json());
  } catch {
    return unverified(did);
  }
}

export async function resolveTrust(
  did: string,
  opts?: { timeoutMs?: number },
): Promise<PotResolution> {
  const timeoutMs = opts?.timeoutMs ?? 15_000;
  if (PROTOCOL === "v4") return resolveTrustV4(did, timeoutMs);
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
