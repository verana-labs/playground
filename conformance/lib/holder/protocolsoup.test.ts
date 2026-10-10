import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { exchanges, harnessEnv, imported, pemOf, presentationProblems, refusal, requestProblems, signedMetadataUrl, x5cAnchor, type HarnessReply } from "./protocolsoup";

const fixture = (name: string): string => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), "utf8");
const reply = (name: string): HarnessReply => JSON.parse(fixture(`protocolsoup/${name}`)) as HarnessReply;
const jwtWithHeader = (header: unknown): string => `${Buffer.from(JSON.stringify(header)).toString("base64url")}.e30.c2ln`;

describe("x5cAnchor", () => {
  const signedMetadataHeader = (JSON.parse(fixture("eudi-dev/decode-signed-metadata.json")) as { header: { x5c: string[] } }).header;

  it("turns the last x5c certificate of a JWT header into the PEM ProtocolSoup trusts", () => {
    expect(x5cAnchor(jwtWithHeader(signedMetadataHeader))).toBe(fixture("protocolsoup/issuer-root.pem"));
  });

  it("takes the root end of a chain", () => {
    expect(x5cAnchor(jwtWithHeader({ alg: "ES256", x5c: ["TEFG", "Uk9PVA"] }))).toBe(pemOf("Uk9PVA"));
  });

  it("returns null without an x5c header or for something that is not a JWT", () => {
    expect(x5cAnchor(jwtWithHeader({ alg: "ES256", kid: "k" }))).toBeNull();
    expect(x5cAnchor("<html>")).toBeNull();
  });
});

describe("signedMetadataUrl", () => {
  it("puts the well-known segment between the origin and the issuer path", () => {
    expect(signedMetadataUrl("https://demo-issuer-accredited.playground.devnet.verana.network/oid4vci/issuer")).toBe(
      "https://demo-issuer-accredited.playground.devnet.verana.network/.well-known/openid-credential-issuer/oid4vci/issuer",
    );
    expect(signedMetadataUrl("https://issuer.example/")).toBe("https://issuer.example/.well-known/openid-credential-issuer");
  });
});

describe("harnessEnv", () => {
  it("points the harness at itself and passes each anchor once", () => {
    const env = harnessEnv("/tmp/h", 8099, { verifiers: ["A", "A", "B"], issuers: ["C"] });
    expect(env.WALLET_TARGET_BASE_URL).toBe("http://127.0.0.1:8099");
    expect(env.WALLET_ISSUER_BASE_URL).toBe("http://127.0.0.1:8099");
    expect(env.WALLET_VERIFIER_X509_TRUST_ANCHOR_PEM).toBe("AB");
    expect(env.WALLET_MDOC_IACA_ROOT_PEM).toBe("C");
  });
});

describe("imported", () => {
  it("reports the iss and credential_issuer mismatch of the devnet issuers", () => {
    const result = imported(reply("import-iss-mismatch.json"));
    expect("problem" in result && result.problem).toMatch(/^wallet_import_failed: validate issuer signature: credential issuer ".*" does not match credential_issuer ".*\/oid4vci\/issuer"$/);
  });

  it("keeps the stored credential id of a successful import", () => {
    expect(imported({ status: 200, body: { credential_id: "cred-1", credential_format: "dc+sd-jwt" } })).toEqual({ credentialId: "cred-1" });
  });

  it("lists the protocol hops it took", () => {
    const hops = exchanges(reply("import-iss-mismatch.json"));
    expect(hops.map((h) => h.step)).toContain("Token Request");
    expect(hops.every((h) => h.status === 200)).toBe(true);
  });
});

describe("requestProblems", () => {
  it("accepts a verified x509_hash DCQL request answered by direct_post.jwt", () => {
    expect(requestProblems(reply("resolve-verified.json"))).toEqual([]);
  });

  it("is broken when the verifier's x5c root is not trusted", () => {
    expect(requestProblems(reply("resolve-unknown-authority.json"))).toEqual([
      expect.stringContaining("x509: certificate signed by unknown authority"),
    ]);
  });

  it("reports a Presentation Exchange request as refused", () => {
    expect(requestProblems(reply("resolve-pe.json"))[0]).toContain("exactly one of dcql_query or scope");
  });

  it("names every rule an unverified request breaks", () => {
    const body = { ...reply("resolve-verified.json").body, client_id: "redirect_uri:https://v.example", response_mode: "direct_post", dcql_query: undefined, trust: {} };
    expect(requestProblems({ status: 200, body })).toHaveLength(4);
  });
});

describe("presentationProblems", () => {
  it("is clean when the verifier answers 200", () => {
    expect(presentationProblems({ status: 200, body: { upstream_status: 200, upstream_body: {} } })).toEqual([]);
  });

  it("carries the verifier's answer when it refuses", () => {
    expect(presentationProblems({ status: 400, body: { upstream_status: 400, upstream_body: { error: "invalid_request" } } })[0]).toBe(
      'verifier answered HTTP 400: {"error":"invalid_request"}',
    );
  });

  it("carries ProtocolSoup's own refusal when it never submitted", () => {
    expect(presentationProblems(reply("present-no-credential.json"))[0]).toContain("wallet does not have a credential");
    expect(refusal({ status: 502, body: {} })).toBe("HTTP 502");
  });
});
