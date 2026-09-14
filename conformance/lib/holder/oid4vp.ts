import { randomUUID } from "node:crypto";
import { Openid4vpClient, type Openid4vpAuthorizationRequest, type VpToken } from "@openid4vc/openid4vp";
import { SDJwtVcInstance } from "@sd-jwt/sd-jwt-vc";
import { z } from "zod";
import { callbacks, type HolderKey } from "./keys";

type QueryKind = "dcql" | "presentation_exchange";

const DcqlQuerySchema = z.looseObject({
  credentials: z.array(z.looseObject({ id: z.string().min(1), meta: z.looseObject({ vct_values: z.array(z.string()).optional() }).optional() })).min(1),
});

const PexDefinitionSchema = z.looseObject({
  id: z.string().min(1).optional(),
  input_descriptors: z.array(z.looseObject({ id: z.string().min(1) })).min(1),
});

export function buildSubmission(inputDescriptorId: string, definitionId: string = randomUUID()): { id: string; definition_id: string; descriptor_map: Array<{ id: string; format: string; path: string }> } {
  return { id: randomUUID(), definition_id: definitionId, descriptor_map: [{ id: inputDescriptorId, format: "vc+sd-jwt", path: "$" }] };
}

export function vpTokenFor(query: QueryKind, opts: { credentialQueryId: string }, presentation: string): VpToken {
  return query === "dcql" ? { [opts.credentialQueryId]: presentation } : presentation;
}

type PresentFrame = { [key: string]: PresentFrame | boolean };

function presentationFrameFromPaths(paths: string[]): PresentFrame {
  const unescape = (segment: string) => segment.replace(/~1/g, ".").replace(/~0/g, "~");
  const root: PresentFrame = {};
  for (const path of paths) {
    const segments = path.split(".").map(unescape);
    let node = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      if (segment === undefined) continue;
      const next = node[segment];
      node = typeof next === "object" ? next : (node[segment] = {});
    }
    const last = segments[segments.length - 1];
    if (last !== undefined) node[last] = true;
  }
  return root;
}

export async function presentCredential(
  requestUrl: string,
  credential: string,
  key: HolderKey,
): Promise<{ submitted: true; responseMode: string; query: QueryKind; clientId: string; vctValues: string[] }> {
  const client = new Openid4vpClient({ callbacks: callbacks(key) });
  const parsed = client.parseOpenid4vpAuthorizationRequest({ authorizationRequest: requestUrl });
  if (parsed.type !== "jar" && parsed.type !== "openid4vp") throw new Error(`presentCredential: unsupported request type '${parsed.type}'`);

  const resolved = await client.resolveOpenId4vpAuthorizationRequest({ authorizationRequestPayload: parsed.params, responseMode: { type: "direct_post" } });
  // responseMode: {type: "direct_post"} guarantees the non-DC-API/IAE variant; the return type still carries the full union.
  const payload = resolved.authorizationRequestPayload as Openid4vpAuthorizationRequest;

  const clientId = payload.client_id;
  if (!clientId) throw new Error("authorization request has no client_id");
  const nonce = payload.nonce;
  const responseMode = payload.response_mode ?? "direct_post";
  const responseUri = payload.response_uri;
  if (!responseUri) throw new Error("authorization request has no response_uri");
  const clientMetadata = payload.client_metadata;

  let query: QueryKind;
  let credentialQueryId: string;
  let inputDescriptorId: string;
  let definitionId: string | undefined;
  let vctValues: string[] = [];

  if (resolved.dcql) {
    const dcql = DcqlQuerySchema.parse(resolved.dcql.query);
    const first = dcql.credentials[0];
    if (!first) throw new Error("dcql_query has no credentials");
    query = "dcql";
    credentialQueryId = first.id;
    inputDescriptorId = first.id;
    vctValues = first.meta?.vct_values ?? [];
  } else if (resolved.pex?.presentation_definition) {
    const definition = PexDefinitionSchema.parse(resolved.pex.presentation_definition);
    const firstDescriptor = definition.input_descriptors[0];
    if (!firstDescriptor) throw new Error("presentation_definition has no input_descriptors");
    query = "presentation_exchange";
    credentialQueryId = firstDescriptor.id;
    inputDescriptorId = firstDescriptor.id;
    definitionId = definition.id;
  } else {
    throw new Error("resolved authorization request has neither dcql nor pex");
  }

  const sdjwt = new SDJwtVcInstance({
    hasher: (data, alg) => {
      const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
      return crypto.subtle.digest(alg.toUpperCase(), bytes).then((d) => new Uint8Array(d));
    },
    saltGenerator: (length) => Buffer.from(crypto.getRandomValues(new Uint8Array(length))).toString("base64url"),
    kbSigner: async (data) => {
      const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key.privateKey, new TextEncoder().encode(data));
      return Buffer.from(signature).toString("base64url");
    },
    kbSignAlg: "ES256",
  });

  const presentableKeys = await sdjwt.presentableKeys(credential);
  const presentationFrame = presentationFrameFromPaths(presentableKeys);
  const iat = Math.floor(Date.now() / 1000);
  const presentation = await sdjwt.present(credential, presentationFrame, { kb: { payload: { iat, aud: clientId, nonce } } });

  const vpToken = vpTokenFor(query, { credentialQueryId }, presentation);
  const authorizationResponsePayload =
    query === "presentation_exchange" ? { vp_token: vpToken, presentation_submission: buildSubmission(inputDescriptorId, definitionId) } : { vp_token: vpToken };

  const jarm =
    responseMode === "direct_post.jwt"
      ? {
          // apu becomes this nonce, apv becomes the request's own nonce; jose rejects a JWE whose apu equals apv.
          encryption: { nonce: randomUUID() },
          serverMetadata: {
            authorization_signing_alg_values_supported: [],
            authorization_encryption_alg_values_supported: ["ECDH-ES"],
            authorization_encryption_enc_values_supported: ["A256GCM"],
          },
        }
      : undefined;

  const created = await client.createOpenid4vpAuthorizationResponse({ authorizationRequestPayload: payload, clientMetadata, authorizationResponsePayload, jarm });

  await client.submitOpenid4vpAuthorizationResponse({
    authorizationRequestPayload: { response_uri: responseUri },
    authorizationResponsePayload: created.authorizationResponsePayload,
    jarm: created.jarm ? { responseJwt: created.jarm.responseJwt } : undefined,
  });

  return { submitted: true, responseMode, query, clientId, vctValues };
}
