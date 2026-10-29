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

export function base58btcEncode(bytes: Uint8Array): string {
  let number = 0n;
  for (const byte of bytes) number = number * 256n + BigInt(byte);
  let encoded = "";
  while (number > 0n) {
    encoded = BASE58_ALPHABET.charAt(Number(number % 58n)) + encoded;
    number /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    encoded = `1${encoded}`;
  }
  return encoded;
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

const contextList = (value: unknown): unknown[] => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

function eddsaJcs2022Holds(document: Record<string, unknown>, rawKey: Uint8Array): boolean {
  const { proof, ...unsecured } = document;
  if (!isRecord(proof)) return false;
  const { proofValue, ...proofConfig } = proof;
  if (proof.type !== "DataIntegrityProof" || proof.cryptosuite !== "eddsa-jcs-2022" || typeof proofValue !== "string" || !proofValue.startsWith("z")) return false;

  if (proofConfig["@context"] !== undefined) {
    const documentContext = contextList(unsecured["@context"]);
    if (!contextList(proofConfig["@context"]).every((entry, i) => i < documentContext.length && canonicalize(entry) === canonicalize(documentContext[i]))) return false;
    unsecured["@context"] = proofConfig["@context"];
  } else if (unsecured["@context"] !== undefined) proofConfig["@context"] = unsecured["@context"];

  const hashData = Buffer.concat([sha256(canonicalize(proofConfig)), sha256(canonicalize(unsecured))]);
  try {
    const key = createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x: Buffer.from(rawKey).toString("base64url") }, format: "jwk" });
    return verify(null, hashData, key, base58btcDecode(proofValue.slice(1)));
  } catch {
    return false;
  }
}

export function verifyEddsaJcs2022(document: Record<string, unknown>, issuerDocument: DidDocument): boolean {
  const { proof, ...unsecured } = document;
  if (!isRecord(proof) || proof.proofPurpose !== "assertionMethod" || issuerOf(unsecured) !== issuerDocument.id) return false;
  const method = assertionMethods(issuerDocument).find((m) => m.id === proof.verificationMethod);
  const rawKey = method && ed25519PublicKey(method);
  return rawKey ? eddsaJcs2022Holds(document, rawKey) : false;
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

const multihashSha256 = (text: string): string => base58btcEncode(Buffer.concat([Buffer.from([0x12, 0x20]), sha256(text)]));

function entryProofHolds(entry: Record<string, unknown>, updateKeys: unknown[]): boolean {
  const { proof, ...unsigned } = entry;
  return [proof].flat().some((p) => {
    if (!isRecord(p) || p.proofPurpose !== "assertionMethod" || typeof p.verificationMethod !== "string") return false;
    const [didKey, fragment] = p.verificationMethod.split("#");
    const multibase = didKey?.startsWith("did:key:") ? didKey.slice("did:key:".length) : undefined;
    if (!multibase || fragment !== multibase || !updateKeys.includes(multibase)) return false;
    const rawKey = ed25519PublicKey({ id: p.verificationMethod, publicKeyMultibase: multibase });
    return rawKey ? eddsaJcs2022Holds({ ...unsigned, proof: p }, rawKey) : false;
  });
}

function unsupportedParameters(parameters: Record<string, unknown>): boolean {
  const witnesses = isRecord(parameters.witness) ? parameters.witness.witnesses : undefined;
  return (
    parameters.deactivated === true ||
    (Array.isArray(parameters.nextKeyHashes) && parameters.nextKeyHashes.length > 0) ||
    (Array.isArray(witnesses) && witnesses.length > 0)
  );
}

export function verifiedWebvhState(did: string, log: string): unknown {
  const scid = did.split(":")[2];
  const entries: unknown[] = log
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
  if (!scid || entries.length === 0) return undefined;
  let previousVersionId = scid;
  let updateKeys: unknown[] = [];
  for (const [index, entry] of entries.entries()) {
    if (!isRecord(entry) || !isRecord(entry.parameters) || unsupportedParameters(entry.parameters)) return undefined;
    const { proof: _proof, ...unsigned } = entry;
    if (index === 0) {
      if (entry.parameters.method !== "did:webvh:1.0" || entry.parameters.scid !== scid) return undefined;
      const preliminary: unknown = JSON.parse(JSON.stringify({ ...unsigned, versionId: "{SCID}" }).replaceAll(scid, "{SCID}"));
      if (multihashSha256(canonicalize(preliminary)) !== scid) return undefined;
    }
    if (entry.versionId !== `${index + 1}-${multihashSha256(canonicalize({ ...unsigned, versionId: previousVersionId }))}`) return undefined;
    if (index === 0 && Array.isArray(entry.parameters.updateKeys)) updateKeys = entry.parameters.updateKeys;
    if (!entryProofHolds(entry, updateKeys)) return undefined;
    if (Array.isArray(entry.parameters.updateKeys)) updateKeys = entry.parameters.updateKeys;
    previousVersionId = entry.versionId;
  }
  const last = entries[entries.length - 1];
  return isRecord(last) ? last.state : undefined;
}

export async function resolveDidDocument(did: string): Promise<DidDocument | undefined> {
  const url = didDocumentUrl(did);
  if (!url) return undefined;
  const body = await fetchText(url);
  if (!did.startsWith("did:webvh:")) return parseDidDocument(did, JSON.parse(body));
  return parseDidDocument(did, verifiedWebvhState(did, body));
}
