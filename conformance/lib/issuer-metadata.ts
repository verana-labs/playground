import { zCredentialIssuerMetadataSchema } from "@openid4vc/openid4vci";
import { z } from "zod";
import { VCI_DRAFTS } from "../../app/lib/wallet-profiles";
import { issuerMetadataUrls, type CastService } from "./cast-services";
import { fetchWithTimeout } from "./http";

export type VciDraft = (typeof VCI_DRAFTS)[number];

const DisplayNameSchema = z.looseObject({ name: z.string().min(1) });

export const LegacyConfigurationSchema = z.looseObject({
  id: z.string().min(1),
  format: z.string().min(1),
  display: z.array(DisplayNameSchema).min(1),
});

export const LegacyIssuerMetadataSchema = z.looseObject({
  credential_issuer: z.url(),
  credential_endpoint: z.url(),
  credentials_supported: z.array(LegacyConfigurationSchema).min(1),
});

export const DisplayedConfigurationSchema = z.looseObject({
  display: z.array(DisplayNameSchema).min(1),
  claims: z.record(z.string(), z.unknown()),
  credential_metadata: z.looseObject({
    display: z.array(DisplayNameSchema).min(1),
    claims: z.array(z.looseObject({ path: z.array(z.string()).min(1) })).min(1),
  }),
});

type ParseResult = { success: true } | { success: false; error: string };

const issues = (error: z.ZodError): string => error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");

const withZod = (schema: z.ZodType) => (raw: unknown): ParseResult => {
  const r = schema.safeParse(raw);
  return r.success ? { success: true } : { success: false, error: issues(r.error) };
};

export const DRAFT_PARSERS: Record<VciDraft, { name: string; own: boolean; parse: (raw: unknown) => ParseResult }> = {
  v1: { name: "@openid4vc/openid4vci zCredentialIssuerMetadataSchema", own: true, parse: withZod(zCredentialIssuerMetadataSchema) },
  draft15: { name: "@openid4vc/openid4vci zCredentialIssuerMetadataSchema", own: true, parse: withZod(zCredentialIssuerMetadataSchema) },
  draft13: { name: "hand-written legacy credentials_supported reader (no Node port of the Kotlin libraries)", own: false, parse: withZod(LegacyIssuerMetadataSchema) },
  draft11: { name: "hand-written legacy credentials_supported reader (no Node port of the Kotlin libraries)", own: false, parse: withZod(LegacyIssuerMetadataSchema) },
};

export async function fetchIssuerMetadata(service: CastService): Promise<{ url: string; raw: unknown; tried: Record<string, number> }> {
  const tried: Record<string, number> = {};
  for (const url of issuerMetadataUrls(service)) {
    const res = await fetchWithTimeout(url, { headers: { accept: "application/json" } });
    tried[url] = res.status;
    if (res.ok) return { url, raw: await res.json(), tried };
  }
  throw new Error(`${service.id}: no issuer metadata at ${JSON.stringify(tried)}`);
}

export function vctDocumentUrl(raw: unknown, configurationId: string): string | null {
  const parsed = z.looseObject({ credential_configurations_supported: z.record(z.string(), z.looseObject({ vct: z.string().optional() })) }).safeParse(raw);
  return parsed.success ? (parsed.data.credential_configurations_supported[configurationId]?.vct ?? null) : null;
}
