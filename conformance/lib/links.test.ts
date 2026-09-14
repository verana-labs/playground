import { describe, expect, it } from "vitest";
import { clientIdMatches, decodeJwtParts, parseWalletLink } from "./links";

describe("parseWalletLink", () => {
  it("splits a custom scheme link into scheme and params", () => {
    const link = parseWalletLink("openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fh%2Fo%2F1");
    expect(link.scheme).toBe("openid-credential-offer");
    expect(link.params.get("credential_offer_uri")).toBe("https://h/o/1");
  });

  it("handles https links and hosts", () => {
    const link = parseWalletLink("https://h/s?id=abc");
    expect(link.scheme).toBe("https");
    expect(link.params.get("id")).toBe("abc");
  });

  it("rejects a link without a scheme", () => {
    expect(() => parseWalletLink("garbage")).toThrow(/scheme/);
  });
});

describe("clientIdMatches", () => {
  it("accepts both did spellings and the x509_hash prefix", () => {
    expect(clientIdMatches("x509_hash:abc", "x509_hash")).toBe(true);
    expect(clientIdMatches("did:web:h", "did")).toBe(true);
    expect(clientIdMatches("decentralized_identifier:did:webvh:Qm:h", "did")).toBe(true);
    expect(clientIdMatches("did:web:h", "x509_hash")).toBe(false);
    expect(clientIdMatches("x509_hash:abc", "did")).toBe(false);
  });
});

describe("decodeJwtParts", () => {
  it("decodes header and payload without verifying", () => {
    const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const { header, payload } = decodeJwtParts(`${b64({ alg: "ES256", typ: "oauth-authz-req+jwt" })}.${b64({ client_id: "x" })}.sig`);
    expect(header.typ).toBe("oauth-authz-req+jwt");
    expect(payload.client_id).toBe("x");
  });
});
