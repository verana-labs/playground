import { z } from "zod";
import { fetchJson, fetchWithTimeout } from "./http";

export const TrustCredentialSchema = z.looseObject({
  ecsType: z.string(),
  result: z.string(),
  issuedBy: z.string(),
  presentedBy: z.string().optional(),
  claims: z.record(z.string(), z.unknown()),
  permissionChain: z.unknown().optional(),
});

export const TrustResolutionSchema = z.looseObject({
  did: z.string(),
  trustStatus: z.enum(["TRUSTED", "UNTRUSTED", "PARTIAL"]),
  production: z.boolean(),
  evaluatedAt: z.string(),
  evaluatedAtBlock: z.number().optional(),
  expiresAt: z.string(),
  credentials: z.array(TrustCredentialSchema),
  dereferenceErrors: z.array(z.unknown()),
  failedCredentials: z.array(z.unknown()),
});
export type TrustResolution = z.infer<typeof TrustResolutionSchema>;

export const AuthorizationSchema = z.looseObject({
  did: z.string(),
  vtjscId: z.string(),
  authorized: z.boolean(),
  evaluatedAt: z.string(),
});
export type Authorization = z.infer<typeof AuthorizationSchema>;

export class ResolverClient {
  constructor(private readonly base: string) {}

  async version(): Promise<string> {
    return z.object({ version: z.string() }).parse(await fetchJson(`${this.base}/resolver/v1/version`)).version;
  }

  async resolve(did: string): Promise<TrustResolution | null> {
    const res = await fetchWithTimeout(`${this.base}/v1/trust/resolve?did=${encodeURIComponent(did)}&detail=full`, {
      headers: { accept: "application/json" },
      timeoutMs: 30_000,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`resolve ${did} -> HTTP ${res.status}`);
    return TrustResolutionSchema.parse(await res.json());
  }

  async refresh(did: string): Promise<"ok" | "failed"> {
    const body = await fetchJson(`${this.base}/v1/trust/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ did }),
      timeoutMs: 60_000,
    });
    return z.object({ result: z.enum(["ok", "failed"]) }).parse(body).result;
  }

  async resolveFresh(did: string): Promise<TrustResolution | null> {
    const before = await this.resolve(did);
    await this.refresh(did);
    const after = await this.resolve(did);
    if (before && after && after.evaluatedAt <= before.evaluatedAt)
      throw new Error(`stale reading for ${did}: evaluatedAt ${after.evaluatedAt} did not advance after refresh`);
    return after;
  }

  issuerAuthorization(did: string, vtjscId: string): Promise<Authorization> {
    return this.authorization("issuer-authorization", did, vtjscId);
  }

  verifierAuthorization(did: string, vtjscId: string): Promise<Authorization> {
    return this.authorization("verifier-authorization", did, vtjscId);
  }

  private async authorization(endpoint: string, did: string, vtjscId: string): Promise<Authorization> {
    const url = `${this.base}/v1/trust/${endpoint}?did=${encodeURIComponent(did)}&vtjscId=${encodeURIComponent(vtjscId)}`;
    return AuthorizationSchema.parse(await fetchJson(url, { timeoutMs: 30_000 }));
  }
}
