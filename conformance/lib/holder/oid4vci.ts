import { Openid4vciClient } from "@openid4vc/openid4vci";
import type { CredentialResponse } from "@openid4vc/openid4vci";
import type { Jwk } from "@openid4vc/oauth2";
import { vctDocumentUrl } from "../issuer-metadata";
import { callbacks, type HolderKey } from "./keys";

function extractCredential(response: CredentialResponse): string {
  const entries = response.credentials;
  const first = entries?.[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object" && "credential" in first && typeof first.credential === "string") return first.credential;
  if (typeof response.credential === "string") return response.credential;
  throw new Error("credential response did not include a compact credential string");
}

export async function receiveCredential(
  offerUrl: string,
  key: HolderKey,
): Promise<{ credential: string; configurationId: string; issuerMetadata: unknown; vct: string | null }> {
  const client = new Openid4vciClient({ callbacks: callbacks(key) });
  const credentialOffer = await client.resolveCredentialOffer(offerUrl);
  const issuerMetadata = await client.resolveIssuerMetadata(credentialOffer.credential_issuer);

  const configurationId = credentialOffer.credential_configuration_ids[0];
  if (!configurationId) throw new Error("credential offer has no credential_configuration_ids");

  const preAuthorizedGrant = credentialOffer.grants?.["urn:ietf:params:oauth:grant-type:pre-authorized_code"];
  if (!preAuthorizedGrant) throw new Error("credential offer has no pre-authorized_code grant");

  const supportsDpop = Boolean(issuerMetadata.authorizationServers[0]?.dpop_signing_alg_values_supported?.length);
  const dpopSigner = supportsDpop ? { signer: { method: "jwk" as const, publicJwk: key.publicJwk as Jwk, alg: key.alg } } : undefined;

  const { accessTokenResponse, dpop: tokenDpop } = await client.retrievePreAuthorizedCodeAccessTokenFromOffer({
    credentialOffer,
    issuerMetadata,
    dpop: dpopSigner,
  });
  const dpop = tokenDpop ?? dpopSigner;

  const nonce = accessTokenResponse.c_nonce ?? (await client.requestNonce({ issuerMetadata })).c_nonce;

  const { jwt } = await client.createCredentialRequestJwtProof({
    issuerMetadata,
    credentialConfigurationId: configurationId,
    signer: { method: "jwk", publicJwk: key.publicJwk as Jwk, alg: key.alg },
    nonce,
  });

  const { credentialResponse } = await client.retrieveCredentials({
    issuerMetadata,
    credentialConfigurationId: configurationId,
    accessToken: accessTokenResponse.access_token,
    proof: { proof_type: "jwt", jwt },
    dpop,
  });

  return {
    credential: extractCredential(credentialResponse),
    configurationId,
    issuerMetadata,
    vct: vctDocumentUrl(issuerMetadata.credentialIssuer, configurationId),
  };
}
