import { createHash, randomBytes } from "node:crypto";
import type { CallbackContext, Jwk, JwtSigner } from "@openid4vc/oauth2";
import { clientAuthenticationAnonymous } from "@openid4vc/oauth2";
import { CompactEncrypt, exportJWK, generateKeyPair, importJWK, importX509, jwtVerify, SignJWT, type CompactJWEHeaderParameters, type JWTHeaderParameters } from "jose";

export type HolderKey = { privateKey: CryptoKey; publicJwk: JsonWebKey; alg: "ES256" };

export async function createHolderKey(): Promise<HolderKey> {
  const { privateKey, publicKey } = await generateKeyPair("ES256", { extractable: true });
  const publicJwk = await exportJWK(publicKey);
  return { privateKey, publicJwk, alg: "ES256" };
}

function toPem(x5cEntry: string): string {
  const lines = x5cEntry.match(/.{1,64}/g) ?? [x5cEntry];
  return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
}

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Decode(input: string): Uint8Array {
  const bytes = [0];
  for (const char of input) {
    const digit = BASE58_ALPHABET.indexOf(char);
    if (digit === -1) throw new Error(`invalid base58 character: ${char}`);
    let carry = digit;
    for (let i = 0; i < bytes.length; i++) {
      carry += (bytes[i] ?? 0) * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of input) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse());
}

const MULTICODEC_ED25519_PUB = [0xed, 0x01];
const MULTICODEC_X25519_PUB = [0xec, 0x01];

function multikeyToJwk(publicKeyMultibase: string): JsonWebKey {
  if (!publicKeyMultibase.startsWith("z")) throw new Error(`unsupported multibase prefix: ${publicKeyMultibase}`);
  const decoded = base58Decode(publicKeyMultibase.slice(1));
  const [prefix0, prefix1] = decoded;
  const raw = decoded.slice(2);
  if (prefix0 === MULTICODEC_ED25519_PUB[0] && prefix1 === MULTICODEC_ED25519_PUB[1]) return { kty: "OKP", crv: "Ed25519", x: Buffer.from(raw).toString("base64url") };
  if (prefix0 === MULTICODEC_X25519_PUB[0] && prefix1 === MULTICODEC_X25519_PUB[1]) return { kty: "OKP", crv: "X25519", x: Buffer.from(raw).toString("base64url") };
  throw new Error(`unsupported multicodec prefix: 0x${(prefix0 ?? 0).toString(16)}${(prefix1 ?? 0).toString(16)}`);
}

type DidVerificationMethod = { id: string; publicKeyJwk?: JsonWebKey; publicKeyMultibase?: string };
type DidDocument = { id: string; verificationMethod?: DidVerificationMethod[] };

function didToDocumentUrl(did: string): string {
  const parts = did.split(":");
  if (parts[0] !== "did") throw new Error(`not a did: ${did}`);
  const method = parts[1];
  if (method !== "web" && method !== "webvh") throw new Error(`verifyJwt: unsupported did method '${method}'`);
  const rest = method === "webvh" ? parts.slice(3) : parts.slice(2);
  const domainPart = rest[0];
  if (!domainPart) throw new Error(`did has no web identifier: ${did}`);
  const domain = decodeURIComponent(domainPart);
  const path = rest.slice(1).map(decodeURIComponent);
  return path.length > 0 ? `https://${domain}/${path.join("/")}/did.json` : `https://${domain}/.well-known/did.json`;
}

async function resolveDidJwk(didUrl: string): Promise<JsonWebKey> {
  const [did, fragment] = didUrl.split("#");
  if (!did) throw new Error(`invalid didUrl: ${didUrl}`);
  const url = didToDocumentUrl(did);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  const doc = (await res.json()) as DidDocument;
  const methods = doc.verificationMethod ?? [];
  const match = fragment ? methods.find((m) => m.id === didUrl || m.id.endsWith(`#${fragment}`)) : methods[0];
  if (!match) throw new Error(`no verification method for ${didUrl} at ${url}`);
  if (match.publicKeyJwk) return match.publicKeyJwk;
  if (match.publicKeyMultibase) return multikeyToJwk(match.publicKeyMultibase);
  throw new Error(`verification method ${match.id} has neither publicKeyJwk nor publicKeyMultibase`);
}

export function callbacks(key: HolderKey): CallbackContext {
  return {
    fetch,
    hash: (data, alg) => new Uint8Array(createHash(alg.replace("-", "")).update(data).digest()),
    generateRandom: (byteLength) => new Uint8Array(randomBytes(byteLength)),
    clientAuthentication: clientAuthenticationAnonymous(),
    signJwt: async (jwtSigner: JwtSigner, jwt) => {
      if (jwtSigner.method !== "jwk") throw new Error(`signJwt: unsupported signer method '${jwtSigner.method}'`);
      const signed = await new SignJWT(jwt.payload).setProtectedHeader(jwt.header as JWTHeaderParameters).sign(key.privateKey);
      return { jwt: signed, signerJwk: key.publicJwk as Jwk };
    },
    verifyJwt: async (jwtSigner: JwtSigner, jwt) => {
      try {
        if (jwtSigner.method === "jwk") {
          const verifyKey = await importJWK(jwtSigner.publicJwk as JsonWebKey, jwtSigner.alg);
          await jwtVerify(jwt.compact, verifyKey, { algorithms: [jwtSigner.alg] });
          return { verified: true, signerJwk: jwtSigner.publicJwk as Jwk };
        }
        if (jwtSigner.method === "x5c") {
          const leaf = jwtSigner.x5c[0];
          if (!leaf) return { verified: false };
          const verifyKey = await importX509(toPem(leaf), jwtSigner.alg);
          await jwtVerify(jwt.compact, verifyKey, { algorithms: [jwtSigner.alg] });
          const signerJwk = (await exportJWK(verifyKey)) as Jwk;
          return { verified: true, signerJwk };
        }
        if (jwtSigner.method === "did") {
          const publicJwk = await resolveDidJwk(jwtSigner.didUrl);
          const verifyKey = await importJWK(publicJwk, jwtSigner.alg);
          await jwtVerify(jwt.compact, verifyKey, { algorithms: [jwtSigner.alg] });
          return { verified: true, signerJwk: publicJwk as Jwk };
        }
        return { verified: false };
      } catch {
        return { verified: false };
      }
    },
    encryptJwe: async (jweEncryptor, data) => {
      const encryptKey = await importJWK(jweEncryptor.publicJwk as JsonWebKey, jweEncryptor.alg);
      const header: CompactJWEHeaderParameters = { alg: jweEncryptor.alg, enc: jweEncryptor.enc };
      if (jweEncryptor.kid) header.kid = jweEncryptor.kid;
      if (jweEncryptor.apu) header.apu = jweEncryptor.apu;
      if (jweEncryptor.apv) header.apv = jweEncryptor.apv;
      const jwe = await new CompactEncrypt(new TextEncoder().encode(data)).setProtectedHeader(header).encrypt(encryptKey);
      return { encryptionJwk: jweEncryptor.publicJwk, jwe };
    },
    decryptJwe: async () => {
      throw new Error("decryptJwe: the headless holder never receives encrypted payloads in this flow");
    },
    // openid4vp checks this callback is present for every x509_* client id prefix, even x509_hash, which never calls it.
    getX509CertificateMetadata: () => ({ sanDnsNames: [], sanUriNames: [] }),
  };
}
