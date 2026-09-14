import { z } from "zod";
import { fetchJson, fetchText } from "./http";

export function parseWalletLink(url: string): { scheme: string; params: URLSearchParams } {
  const m = /^([a-z][a-z0-9.+-]*):\/\/([^?]*)\??(.*)$/i.exec(url);
  if (!m || !m[1]) throw new Error(`link has no scheme: ${url}`);
  return { scheme: m[1].toLowerCase(), params: new URLSearchParams(m[3] ?? "") };
}

const b64 = (s: string): string => Buffer.from(s, "base64url").toString("utf8");

export function decodeJwtParts(jwt: string): { header: Record<string, unknown>; payload: Record<string, unknown> } {
  const [h, p] = jwt.trim().split(".");
  if (!h || !p) throw new Error("not a compact JWT");
  const object = z.record(z.string(), z.unknown());
  return { header: object.parse(JSON.parse(b64(h))), payload: object.parse(JSON.parse(b64(p))) };
}

export function clientIdMatches(clientId: string, expected: "x509_hash" | "did"): boolean {
  if (expected === "x509_hash") return clientId.startsWith("x509_hash:");
  return clientId.startsWith("did:") || clientId.startsWith("decentralized_identifier:did:");
}

export const CredentialOfferSchema = z.looseObject({
  credential_issuer: z.url(),
  credential_configuration_ids: z.array(z.string().min(1)).min(1),
  grants: z.record(z.string(), z.unknown()),
});

export const OobInvitationSchema = z.looseObject({
  "@type": z.string().regex(/out-of-band\/1\.[01]\/invitation$/),
  "@id": z.string().min(1),
  label: z.string().min(1),
  services: z.array(z.union([z.string().min(1), z.looseObject({ serviceEndpoint: z.string().min(1) })])).min(1),
  "requests~attach": z.array(z.unknown()).optional(),
});

export async function fetchCredentialOffer(uri: string): Promise<z.infer<typeof CredentialOfferSchema>> {
  return CredentialOfferSchema.parse(await fetchJson(uri));
}

export async function fetchAuthorizationRequest(uri: string): Promise<{ jwt: string; header: Record<string, unknown>; payload: Record<string, unknown> }> {
  const jwt = await fetchText(uri, { headers: { accept: "application/oauth-authz-req+jwt, */*" } });
  return { jwt, ...decodeJwtParts(jwt) };
}

export async function fetchOobInvitation(url: string): Promise<z.infer<typeof OobInvitationSchema>> {
  return OobInvitationSchema.parse(await fetchJson(url));
}
