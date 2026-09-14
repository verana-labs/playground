import { z } from "zod";
import type { CastService } from "./cast-services";
import { fetchJson, fetchText } from "./http";

const DidDocumentSchema = z.looseObject({ id: z.string().min(1), alsoKnownAs: z.array(z.string()).optional() });

export async function serviceDid(service: CastService): Promise<{ did: string; webvh: string | null }> {
  const doc = DidDocumentSchema.parse(await fetchJson(`https://${service.host}/.well-known/did.json`));
  const webvh = doc.alsoKnownAs?.find((a) => a.startsWith("did:webvh:")) ?? (doc.id.startsWith("did:webvh:") ? doc.id : null);
  return { did: webvh ?? doc.id, webvh };
}

const ProofSchema = z.looseObject({ verificationMethod: z.string() });
const LogEntrySchema = z.looseObject({ proof: z.union([z.array(ProofSchema), ProofSchema]) });

export async function webvhLogHealth(service: CastService): Promise<{ ok: boolean; verificationMethod: string | null; entries: number; error?: string }> {
  try {
    const text = await fetchText(`https://${service.host}/.well-known/did.jsonl`);
    const lines = text.split("\n").filter((l) => l.trim());
    const first = lines[0];
    if (!first) return { ok: false, verificationMethod: null, entries: 0, error: "empty log" };
    const entry = LogEntrySchema.parse(JSON.parse(first));
    const proofs = Array.isArray(entry.proof) ? entry.proof : [entry.proof];
    const bare = proofs.find((p) => !p.verificationMethod.includes("#"));
    return { ok: !bare, verificationMethod: proofs[0]?.verificationMethod ?? null, entries: lines.length, ...(bare ? { error: `first entry signed with bare ${bare.verificationMethod}` } : {}) };
  } catch (e) {
    return { ok: false, verificationMethod: null, entries: 0, error: e instanceof Error ? e.message : String(e) };
  }
}
