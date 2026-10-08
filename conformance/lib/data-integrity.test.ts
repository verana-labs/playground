import fs from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  base58btcDecode,
  base58btcEncode,
  canonicalize,
  didDocumentUrl,
  parseDidDocument,
  resolveDidDocument,
  verifiedWebvhState,
  verifyEddsaJcs2022,
  withinValidity,
} from "./data-integrity";
import VTJSC from "./fixtures/testnet-v4/vtjsc-7.json";

const ECOSYSTEM_DID = VTJSC.issuer;
const ECOSYSTEM_LOG = fs.readFileSync(new URL("./fixtures/testnet-v4/playground-demo-did.jsonl", import.meta.url), "utf8");
const LOG_ENTRIES = ECOSYSTEM_LOG.trim()
  .split("\n")
  .map((line) => JSON.parse(line) as Record<string, unknown> & { state: Record<string, unknown> });
const ecosystemDocument = parseDidDocument(ECOSYSTEM_DID, LOG_ENTRIES[LOG_ENTRIES.length - 1]?.state);
if (!ecosystemDocument) throw new Error("recorded ecosystem DID document does not parse");
const logOf = (entries: unknown[]): string => `${entries.map((e) => JSON.stringify(e)).join("\n")}\n`;

describe("canonicalize", () => {
  it("sorts keys at every depth and drops undefined members", () => {
    expect(canonicalize({ b: 1, a: { d: [true, null], c: "x" }, e: undefined })).toBe('{"a":{"c":"x","d":[true,null]},"b":1}');
  });

  it("serializes numbers the way RFC 8785 does", () => {
    expect(canonicalize([1e21, 0.000001, -0, 10.5])).toBe("[1e+21,0.000001,0,10.5]");
  });
});

describe("base58btc", () => {
  it("keeps leading zero bytes and rejects characters outside the alphabet", () => {
    expect(Array.from(base58btcDecode("112"))).toEqual([0, 0, 1]);
    expect(base58btcEncode(Uint8Array.from([0, 0, 1]))).toBe("112");
    expect(() => base58btcDecode("0OIl")).toThrow();
  });
});

describe("verifyEddsaJcs2022", () => {
  it("verifies the recorded testnet VTJSC against the ecosystem DID document", () => {
    expect(verifyEddsaJcs2022(VTJSC, ecosystemDocument)).toBe(true);
  });

  it("rejects a VTJSC whose schema reference was changed", () => {
    const tampered = { ...VTJSC, credentialSubject: { ...VTJSC.credentialSubject, jsonSchema: { $ref: "vpr:verana:vna-testnet-1:cs:8" } } };
    expect(verifyEddsaJcs2022(tampered, ecosystemDocument)).toBe(false);
  });

  it("rejects a key that is not an assertion method of the issuer", () => {
    expect(verifyEddsaJcs2022(VTJSC, { ...ecosystemDocument, assertionMethod: [] })).toBe(false);
  });

  it("rejects a proof whose @context does not open the document's @context", () => {
    const proof = { ...VTJSC.proof, "@context": ["https://www.w3.org/ns/credentials/v2", "https://example.org/other/v1"] };
    expect(verifyEddsaJcs2022({ ...VTJSC, proof }, ecosystemDocument)).toBe(false);
    expect(verifyEddsaJcs2022({ ...VTJSC, "@context": ["https://www.w3.org/ns/credentials/v2"] }, ecosystemDocument)).toBe(false);
  });

  it("hashes the document with the proof's @context, as eddsa-jcs-2022 verification does", () => {
    const extended = { ...VTJSC, "@context": [...VTJSC["@context"], "https://example.org/extra/v1"] };
    expect(verifyEddsaJcs2022(extended, ecosystemDocument)).toBe(true);
  });

  it("rejects a VTJSC naming another issuer or another cryptosuite", () => {
    expect(verifyEddsaJcs2022({ ...VTJSC, issuer: "did:webvh:QmOther:other.example" }, ecosystemDocument)).toBe(false);
    expect(verifyEddsaJcs2022({ ...VTJSC, proof: { ...VTJSC.proof, cryptosuite: "eddsa-rdfc-2022" } }, ecosystemDocument)).toBe(false);
  });
});

describe("withinValidity", () => {
  const now = Date.parse("2026-10-16T00:00:00Z");

  it("accepts the recorded VTJSC window and a credential with none", () => {
    expect(withinValidity(VTJSC, now)).toBe(true);
    expect(withinValidity({}, now)).toBe(true);
  });

  it("refuses an expired, not yet valid, or unreadable window", () => {
    expect(withinValidity({ validUntil: "2026-09-01T00:00:00Z" }, now)).toBe(false);
    expect(withinValidity({ validFrom: "2026-11-01T00:00:00Z" }, now)).toBe(false);
    expect(withinValidity({ validUntil: "soon" }, now)).toBe(false);
  });
});

describe("resolveDidDocument", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps did:webvh to its log and did:web to its document", () => {
    expect(didDocumentUrl(ECOSYSTEM_DID)).toBe("https://playground-demo.playground.testnet.verana.network/.well-known/did.jsonl");
    expect(didDocumentUrl("did:webvh:Qm1:example.org%3A8443:a:b")).toBe("https://example.org:8443/a/b/did.jsonl");
    expect(didDocumentUrl("did:web:example.org")).toBe("https://example.org/.well-known/did.json");
    expect(didDocumentUrl("did:key:z6Mk")).toBeUndefined();
  });

  it("reads the last state of a verified did:webvh log and makes fragment ids absolute", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(ECOSYSTEM_LOG));
    vi.stubGlobal("fetch", fetchMock);
    const document = await resolveDidDocument(ECOSYSTEM_DID);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://playground-demo.playground.testnet.verana.network/.well-known/did.jsonl");
    expect(document?.assertionMethod).toEqual([VTJSC.proof.verificationMethod]);
    expect(document && verifyEddsaJcs2022(VTJSC, document)).toBe(true);
    expect(parseDidDocument(ECOSYSTEM_DID, LOG_ENTRIES[0]?.state)?.assertionMethod).toEqual([`${ECOSYSTEM_DID}#wtyo7dmF`]);
  });
});

describe("verifiedWebvhState", () => {
  const rest = LOG_ENTRIES.slice(1);
  const last = LOG_ENTRIES[LOG_ENTRIES.length - 1]!;

  it("accepts the recorded testnet log", () => {
    expect(verifiedWebvhState(ECOSYSTEM_DID, ECOSYSTEM_LOG)).toEqual(last.state);
  });

  it("refuses a log whose last state was changed after it was signed", () => {
    const forged = { ...last, state: { ...last.state, assertionMethod: [`${ECOSYSTEM_DID}#attacker`] } };
    expect(verifiedWebvhState(ECOSYSTEM_DID, logOf([...LOG_ENTRIES.slice(0, -1), forged]))).toBeUndefined();
  });

  it("refuses a log that does not start at the first entry or does not hash to the DID's SCID", () => {
    expect(verifiedWebvhState(ECOSYSTEM_DID, logOf(rest))).toBeUndefined();
    expect(verifiedWebvhState(ECOSYSTEM_DID.replace("QmSq7", "QmXq7"), ECOSYSTEM_LOG)).toBeUndefined();
  });

  it("refuses an entry whose proof is not from an update key or does not verify", () => {
    const [proof] = [last.proof].flat() as Record<string, unknown>[];
    const outsider = "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
    const signedBy = { ...last, proof: [{ ...proof, verificationMethod: `did:key:${outsider}#${outsider}` }] };
    const tampered = { ...last, proof: [{ ...proof, proofValue: `z${"1".repeat(86)}` }] };
    expect(verifiedWebvhState(ECOSYSTEM_DID, logOf([...LOG_ENTRIES.slice(0, -1), signedBy]))).toBeUndefined();
    expect(verifiedWebvhState(ECOSYSTEM_DID, logOf([...LOG_ENTRIES.slice(0, -1), tampered]))).toBeUndefined();
  });

  it("fails closed on pre-rotation, witnesses and deactivation, which it does not verify", () => {
    for (const extra of [{ nextKeyHashes: ["Qm"] }, { witness: { threshold: 1, witnesses: [{ id: "did:key:z6Mk" }] } }, { deactivated: true }]) {
      const parameters = { ...last.parameters as Record<string, unknown>, ...extra };
      expect(verifiedWebvhState(ECOSYSTEM_DID, logOf([...LOG_ENTRIES.slice(0, -1), { ...last, parameters }]))).toBeUndefined();
    }
  });
});
