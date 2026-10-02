import { z } from "zod";
import { isRecord, issuerOf, resolveDidDocument, verifyEddsaJcs2022, withinValidity } from "./data-integrity";
import { fetchJson, fetchWithTimeout } from "./http";
import type { Network } from "./network";
import { ResolverClient } from "./resolver-client";

export type TrustProtocol = "v3" | "v4";

export type TrustCredential = { ecsType: string; result: string; issuedBy: string; claims: Record<string, unknown> };

export type TrustResolution = {
  did: string;
  trustStatus: "TRUSTED" | "UNTRUSTED" | "PARTIAL";
  production: boolean | null;
  evaluatedAt: string;
  expiresAt: string | null;
  credentials: TrustCredential[];
  dereferenceErrors: unknown[];
  failedCredentials: unknown[];
  indexer?: { registered: boolean; unresolvableCredentialIds: string[] };
};

export type TrustAuthorization = {
  did: string;
  vct: string;
  vtjscId: string | null;
  evaluatedAt: string;
  evidence?: Record<string, unknown>;
} & ({ authorized: boolean } | { authorized: null; cause: string });

export interface TrustClient {
  readonly protocol: TrustProtocol;
  readonly endpoint: string;
  version(): Promise<string>;
  resolve(did: string): Promise<TrustResolution | null>;
  refresh(did: string): Promise<"ok" | "failed" | "no-op">;
  resolveFresh(did: string): Promise<TrustResolution | null>;
  issuerAuthorization(did: string, vct: string): Promise<TrustAuthorization>;
  verifierAuthorization(did: string, vct: string): Promise<TrustAuthorization>;
}

const VctDocumentSchema = z.looseObject({ relatedJsonSchemaCredentialId: z.string().min(1) });

async function vtjscIdOf(vct: string): Promise<string | null> {
  const parsed = VctDocumentSchema.safeParse(await fetchJson(vct));
  return parsed.success ? parsed.data.relatedJsonSchemaCredentialId : null;
}

const noSchemaCredential = (did: string, vct: string): TrustAuthorization => ({
  did,
  vct,
  vtjscId: null,
  authorized: null,
  evaluatedAt: new Date().toISOString(),
  cause: `vct document at ${vct} has no relatedJsonSchemaCredentialId`,
});

export class ResolverTrustClient implements TrustClient {
  readonly protocol = "v3";
  private readonly resolver: ResolverClient;

  constructor(readonly endpoint: string) {
    this.resolver = new ResolverClient(endpoint);
  }

  version(): Promise<string> {
    return this.resolver.version();
  }

  resolve(did: string): Promise<TrustResolution | null> {
    return this.resolver.resolve(did);
  }

  refresh(did: string): Promise<"ok" | "failed"> {
    return this.resolver.refresh(did);
  }

  resolveFresh(did: string): Promise<TrustResolution | null> {
    return this.resolver.resolveFresh(did);
  }

  issuerAuthorization(did: string, vct: string): Promise<TrustAuthorization> {
    return this.authorization("issuer", did, vct);
  }

  verifierAuthorization(did: string, vct: string): Promise<TrustAuthorization> {
    return this.authorization("verifier", did, vct);
  }

  private async authorization(role: "issuer" | "verifier", did: string, vct: string): Promise<TrustAuthorization> {
    const vtjscId = await vtjscIdOf(vct);
    if (!vtjscId) return noSchemaCredential(did, vct);
    const answer = role === "issuer" ? await this.resolver.issuerAuthorization(did, vtjscId) : await this.resolver.verifierAuthorization(did, vtjscId);
    return { did, vct, vtjscId, authorized: answer.authorized, evaluatedAt: answer.evaluatedAt };
  }
}

const V4ResolutionSchema = z.looseObject({
  did: z.string(),
  trusted: z.boolean(),
  evaluatedAtTime: z.string(),
  expiresAtTime: z.string().nullish(),
  ecsCredentials: z.array(z.looseObject({ ecsSchema: z.string(), id: z.string(), credentialSubject: z.record(z.string(), z.unknown()) })).nullish(),
  presentations: z.array(z.looseObject({ unresolvableCredentialIds: z.array(z.string()).nullish() })).nullish(),
});

const ParticipantListSchema = z.object({
  participants: z.array(z.looseObject({ id: z.number(), did: z.string(), role: z.string(), schema_id: z.number(), participant_state: z.string() })),
});

const SCHEMA_REF = /^vpr:verana:([^:]+):cs:(\d+)$/;

export class IndexerTrustClient implements TrustClient {
  readonly protocol = "v4";

  constructor(
    readonly endpoint: string,
    private readonly vpr: string,
  ) {}

  async version(): Promise<string> {
    return z.object({ app_version: z.string() }).parse(await fetchJson(`${this.endpoint}/v4/indexer/version`)).app_version;
  }

  async resolve(did: string): Promise<TrustResolution | null> {
    const res = await fetchWithTimeout(`${this.endpoint}/v4/verifiable-trust/resolve`, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify({
        did,
        participations: { states: ["ACTIVE", "EXPIRED", "REVOKED"] },
        presentations: { unresolvableCredentialIds: true },
        ecsCredentials: true,
      }),
      timeoutMs: 30_000,
    });
    if (res.status === 404) {
      const body: unknown = await res.json().catch(() => null);
      if (isRecord(body) && body.error === "DID not found") return notRegistered(did);
    }
    if (!res.ok) throw new Error(`resolve ${did} -> HTTP ${res.status}`);
    const answer = V4ResolutionSchema.parse(await res.json());
    return {
      did: answer.did,
      trustStatus: answer.trusted ? "TRUSTED" : "UNTRUSTED",
      production: null,
      evaluatedAt: answer.evaluatedAtTime,
      expiresAt: answer.expiresAtTime ?? null,
      credentials: (answer.ecsCredentials ?? []).map((c) => ({
        ecsType: c.ecsSchema,
        result: "VALID",
        issuedBy: c.id.split("#")[0] ?? c.id,
        claims: c.credentialSubject,
      })),
      dereferenceErrors: [],
      failedCredentials: [],
      indexer: { registered: true, unresolvableCredentialIds: (answer.presentations ?? []).flatMap((p) => p.unresolvableCredentialIds ?? []) },
    };
  }

  async refresh(): Promise<"no-op"> {
    return "no-op";
  }

  resolveFresh(did: string): Promise<TrustResolution | null> {
    return this.resolve(did);
  }

  issuerAuthorization(did: string, vct: string): Promise<TrustAuthorization> {
    return this.authorization("ISSUER", did, vct);
  }

  verifierAuthorization(did: string, vct: string): Promise<TrustAuthorization> {
    return this.authorization("VERIFIER", did, vct);
  }

  private async authorization(role: "ISSUER" | "VERIFIER", did: string, vct: string): Promise<TrustAuthorization> {
    const vtjscId = await vtjscIdOf(vct);
    if (!vtjscId) return noSchemaCredential(did, vct);
    const evaluatedAt = new Date().toISOString();
    const unanswered = (cause: string): TrustAuthorization => ({ did, vct, vtjscId, authorized: null, evaluatedAt, cause });

    const vtjsc = await fetchJson(vtjscId);
    if (!isRecord(vtjsc)) return unanswered(`VTJSC ${vtjscId} is not a JSON object`);
    const issuer = issuerOf(vtjsc);
    if (!issuer) return unanswered(`VTJSC ${vtjscId} names no issuer`);
    const subject = vtjsc.credentialSubject;
    const ref = isRecord(subject) && isRecord(subject.jsonSchema) ? subject.jsonSchema.$ref : undefined;
    const match = typeof ref === "string" ? SCHEMA_REF.exec(ref) : null;
    const [, chain, schemaId] = match ?? [];
    if (!chain || !schemaId) return unanswered(`VTJSC ${vtjscId} has no vpr:verana:<chain>:cs:<id> schema reference`);
    if (chain !== this.vpr) return unanswered(`VTJSC ${vtjscId} references a schema on ${chain}, not ${this.vpr}`);

    const ecosystemDid = await this.ecosystemDidOf(schemaId);
    if (ecosystemDid !== issuer) return unanswered(`VTJSC issuer ${issuer} is not ${ecosystemDid}, the ecosystem that owns schema ${schemaId}`);
    const ecosystemDocument = await resolveDidDocument(ecosystemDid);
    if (!ecosystemDocument) return unanswered(`ecosystem DID ${ecosystemDid} did not resolve to a DID document`);
    if (!verifyEddsaJcs2022(vtjsc, ecosystemDocument)) return unanswered(`VTJSC ${vtjscId} eddsa-jcs-2022 proof does not verify against ${ecosystemDid}`);
    if (!withinValidity(vtjsc, Date.now())) return unanswered(`VTJSC ${vtjscId} is outside its validity window`);

    const query = new URLSearchParams({ did, role, schema_id: schemaId, participant_state: "ACTIVE" });
    const { participants } = ParticipantListSchema.parse(await fetchJson(`${this.endpoint}/v4/participant/list?${query}`, { timeoutMs: 30_000 }));
    const active = participants.filter((p) => p.did === did && p.role === role && String(p.schema_id) === schemaId && p.participant_state === "ACTIVE");
    return { did, vct, vtjscId, authorized: active.length > 0, evaluatedAt, evidence: { schemaId: Number(schemaId), ecosystemDid, participantIds: active.map((p) => p.id) } };
  }

  private async ecosystemDidOf(schemaId: string): Promise<string> {
    const schema = z.object({ schema: z.looseObject({ ecosystem_id: z.number() }) }).parse(await fetchJson(`${this.endpoint}/v4/credential-schema/get/${schemaId}`));
    const ecosystem = z.object({ ecosystem: z.looseObject({ did: z.string() }) }).parse(await fetchJson(`${this.endpoint}/v4/ecosystem/get/${schema.schema.ecosystem_id}`));
    return ecosystem.ecosystem.did;
  }
}

function notRegistered(did: string): TrustResolution {
  return {
    did,
    trustStatus: "UNTRUSTED",
    production: null,
    evaluatedAt: new Date().toISOString(),
    expiresAt: null,
    credentials: [],
    dereferenceErrors: [],
    failedCredentials: [],
    indexer: { registered: false, unresolvableCredentialIds: [] },
  };
}

export function trustClientFor(network: Network): TrustClient {
  const raw: Record<string, unknown> = { ...network };
  const resolver = typeof raw.resolver === "string" && raw.resolver ? raw.resolver : null;
  const indexer = typeof raw.indexer === "string" && raw.indexer ? raw.indexer : null;
  if (resolver) return new ResolverTrustClient(resolver);
  if (indexer) return new IndexerTrustClient(indexer, network.vpr);
  throw new Error(`${network.id}: neither a resolver nor an indexer to ask for trust`);
}
