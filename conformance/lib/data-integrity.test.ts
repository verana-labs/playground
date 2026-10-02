import { afterEach, describe, expect, it, vi } from "vitest";
import { base58btcDecode, canonicalize, didDocumentUrl, parseDidDocument, resolveDidDocument, verifyEddsaJcs2022, withinValidity } from "./data-integrity";
import ECOSYSTEM_LOG_ENTRY from "./fixtures/devnet-v4/playground-demo-did-log-entry.json";
import VTJSC from "./fixtures/devnet-v4/vtjsc-8.json";

const ECOSYSTEM_DID = VTJSC.issuer;
const ecosystemDocument = parseDidDocument(ECOSYSTEM_DID, ECOSYSTEM_LOG_ENTRY.state);
if (!ecosystemDocument) throw new Error("recorded ecosystem DID document does not parse");

describe("canonicalize", () => {
  it("sorts keys at every depth and drops undefined members", () => {
    expect(canonicalize({ b: 1, a: { d: [true, null], c: "x" }, e: undefined })).toBe('{"a":{"c":"x","d":[true,null]},"b":1}');
  });

  it("serializes numbers the way RFC 8785 does", () => {
    expect(canonicalize([1e21, 0.000001, -0, 10.5])).toBe("[1e+21,0.000001,0,10.5]");
  });
});

describe("base58btcDecode", () => {
  it("keeps leading zero bytes and rejects characters outside the alphabet", () => {
    expect(Array.from(base58btcDecode("112"))).toEqual([0, 0, 1]);
    expect(() => base58btcDecode("0OIl")).toThrow();
  });
});

describe("verifyEddsaJcs2022", () => {
  it("verifies the recorded devnet VTJSC against the ecosystem DID document", () => {
    expect(verifyEddsaJcs2022(VTJSC, ecosystemDocument)).toBe(true);
  });

  it("rejects a VTJSC whose schema reference was changed", () => {
    const tampered = { ...VTJSC, credentialSubject: { ...VTJSC.credentialSubject, jsonSchema: { $ref: "vpr:verana:vna-devnet-1:cs:9" } } };
    expect(verifyEddsaJcs2022(tampered, ecosystemDocument)).toBe(false);
  });

  it("rejects a key that is not an assertion method of the issuer", () => {
    expect(verifyEddsaJcs2022(VTJSC, { ...ecosystemDocument, assertionMethod: [] })).toBe(false);
  });

  it("rejects a VTJSC naming another issuer or another cryptosuite", () => {
    expect(verifyEddsaJcs2022({ ...VTJSC, issuer: "did:webvh:QmOther:other.example" }, ecosystemDocument)).toBe(false);
    expect(verifyEddsaJcs2022({ ...VTJSC, proof: { ...VTJSC.proof, cryptosuite: "eddsa-rdfc-2022" } }, ecosystemDocument)).toBe(false);
  });
});

describe("withinValidity", () => {
  const now = Date.parse("2026-10-02T00:00:00Z");

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
    expect(didDocumentUrl(ECOSYSTEM_DID)).toBe("https://playground-demo.playground.devnet.verana.network/.well-known/did.jsonl");
    expect(didDocumentUrl("did:webvh:Qm1:example.org%3A8443:a:b")).toBe("https://example.org:8443/a/b/did.jsonl");
    expect(didDocumentUrl("did:web:example.org")).toBe("https://example.org/.well-known/did.json");
    expect(didDocumentUrl("did:key:z6Mk")).toBeUndefined();
  });

  it("reads the last state of a did:webvh log and makes fragment ids absolute", async () => {
    const first = { versionId: "1-Qm", state: { id: ECOSYSTEM_DID, verificationMethod: [{ id: "#old", publicKeyMultibase: "z6Mk" }], assertionMethod: ["#old"] } };
    const fetchMock = vi.fn().mockResolvedValue(new Response(`${JSON.stringify(first)}\n${JSON.stringify(ECOSYSTEM_LOG_ENTRY)}\n`));
    vi.stubGlobal("fetch", fetchMock);
    const document = await resolveDidDocument(ECOSYSTEM_DID);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://playground-demo.playground.devnet.verana.network/.well-known/did.jsonl");
    expect(document?.assertionMethod).toEqual([VTJSC.proof.verificationMethod]);
    expect(document && verifyEddsaJcs2022(VTJSC, document)).toBe(true);
    expect(parseDidDocument(ECOSYSTEM_DID, first.state)?.verificationMethod[0]?.id).toBe(`${ECOSYSTEM_DID}#old`);
  });
});
