import { createHash, createPublicKey, verify } from "node:crypto";
import { fetchText } from "./http";

export type VerificationMethod = { id: string; publicKeyMultibase?: string; publicKeyJwk?: Record<string, unknown> };
export type DidDocument = { id: string; verificationMethod: VerificationMethod[]; assertionMethod: (string | VerificationMethod)[] };

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

export function canonicalize(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (isRecord(value))
    return `{${Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export function base58btcDecode(value: string): Uint8Array {
  let number = 0n;
  for (const character of value) {
    const digit = BASE58_ALPHABET.indexOf(character);
    if (digit < 0) throw new Error(`invalid base58 character ${character}`);
    number = number * 58n + BigInt(digit);
  }
  const bytes: number[] = [];
  while (number > 0n) {
    bytes.unshift(Number(number % 256n));
    number /= 256n;
  }
  for (const character of value) {
    if (character !== "1") break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}

export function issuerOf(credential: Record<string, unknown>): string | undefined {
  const issuer = credential.issuer;
  if (typeof issuer === "string") return issuer;
  return isRecord(issuer) && typeof issuer.id === "string" ? issuer.id : undefined;
}

export function withinValidity(credential: Record<string, unknown>, now: number): boolean {
  const holds = (bound: unknown, test: (time: number) => boolean): boolean => {
    if (bound === undefined) return true;
    const time = typeof bound === "string" ? Date.parse(bound) : Number.NaN;
    return Number.isFinite(time) && test(time);
  };
  return holds(credential.validFrom, (from) => from <= now) && holds(credential.validUntil, (until) => until > now);
}

function ed25519PublicKey(method: VerificationMethod): Uint8Array | undefined {
  const multibase = method.publicKeyMultibase;
  if (multibase?.startsWith("z")) {
    const key = base58btcDecode(multibase.slice(1));
    return key.length === 34 && key[0] === 0xed && key[1] === 0x01 ? key.subarray(2) : undefined;
  }
  const jwk = method.publicKeyJwk;
  if (jwk?.kty === "OKP" && jwk.crv === "Ed25519" && typeof jwk.x === "string") return Buffer.from(jwk.x, "base64url");
  return undefined;
}

export function assertionMethods(document: DidDocument): VerificationMethod[] {
  return document.assertionMethod.flatMap((entry) => (typeof entry === "string" ? document.verificationMethod.filter((m) => m.id === entry) : [entry]));
}

const sha256 = (text: string): Buffer => createHash("sha256").update(text, "utf8").digest();

export function verifyEddsaJcs2022(document: Record<string, unknown>, issuerDocument: DidDocument): boolean {
  const { proof, ...unsecured } = document;
  if (!isRecord(proof)) return false;
  const { proofValue, ...proofConfig } = proof;
  if (
    proof.type !== "DataIntegrityProof" ||
    proof.cryptosuite !== "eddsa-jcs-2022" ||
    proof.proofPurpose !== "assertionMethod" ||
    typeof proofValue !== "string" ||
    !proofValue.startsWith("z") ||
    issuerOf(unsecured) !== issuerDocument.id
  )
    return false;

  const method = assertionMethods(issuerDocument).find((m) => m.id === proof.verificationMethod);
  const rawKey = method && ed25519PublicKey(method);
  if (!rawKey) return false;

  if (unsecured["@context"] !== undefined) proofConfig["@context"] = unsecured["@context"];
  const hashData = Buffer.concat([sha256(canonicalize(proofConfig)), sha256(canonicalize(unsecured))]);
  try {
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(rawKey).toString("base64url") }, format: "jwk" });
    return verify(null, hashData, key, base58btcDecode(proofValue.slice(1)));
  } catch {
    return false;
  }
}

const absoluteId = (did: string, id: string): string => (id.startsWith("#") ? `${did}${id}` : id);

function toVerificationMethod(did: string, value: unknown): VerificationMethod | undefined {
  if (!isRecord(value) || typeof value.id !== "string") return undefined;
  return {
    id: absoluteId(did, value.id),
    ...(typeof value.publicKeyMultibase === "string" ? { publicKeyMultibase: value.publicKeyMultibase } : {}),
    ...(isRecord(value.publicKeyJwk) ? { publicKeyJwk: value.publicKeyJwk } : {}),
  };
}

export function parseDidDocument(did: string, value: unknown): DidDocument | undefined {
  if (!isRecord(value) || value.id !== did) return undefined;
  const verificationMethod = Array.isArray(value.verificationMethod)
    ? value.verificationMethod.flatMap((m: unknown) => toVerificationMethod(did, m) ?? [])
    : [];
  const assertionMethod = Array.isArray(value.assertionMethod)
    ? value.assertionMethod.flatMap((entry: unknown): (string | VerificationMethod)[] => {
        if (typeof entry === "string") return [absoluteId(did, entry)];
        const method = toVerificationMethod(did, entry);
        return method ? [method] : [];
      })
    : [];
  return { id: did, verificationMethod, assertionMethod };
}

export function didDocumentUrl(did: string): string | undefined {
  const parts = did.split(":");
  const [, method] = parts;
  const rest = method === "webvh" ? parts.slice(3) : method === "web" ? parts.slice(2) : [];
  const [host, ...path] = rest.map(decodeURIComponent);
  if (!host) return undefined;
  const file = method === "webvh" ? "did.jsonl" : "did.json";
  return path.length ? `https://${host}/${path.join("/")}/${file}` : `https://${host}/.well-known/${file}`;
}

export async function resolveDidDocument(did: string): Promise<DidDocument | undefined> {
  const url = didDocumentUrl(did);
  if (!url) return undefined;
  const body = await fetchText(url);
  if (!did.startsWith("did:webvh:")) return parseDidDocument(did, JSON.parse(body));
  const lines = body.split("\n").filter((line) => line.trim());
  const last: unknown = JSON.parse(lines[lines.length - 1] ?? "null");
  return parseDidDocument(did, isRecord(last) ? last.state : undefined);
}
