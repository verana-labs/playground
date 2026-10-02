import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import DECODED_CREDENTIAL from "../fixtures/eudi-dev/decode-credential.json";
import DECODED_OFFER from "../fixtures/eudi-dev/decode-offer.json";
import DECODED_REQUEST_DCQL from "../fixtures/eudi-dev/decode-request-dcql.json";
import DECODED_REQUEST_PE from "../fixtures/eudi-dev/decode-request-pe.json";
import DECODED_METADATA from "../fixtures/eudi-dev/decode-signed-metadata.json";
import ISSUANCE_LOG from "../fixtures/eudi-dev/wallet-log-issuance.json";
import {
  acceptArgs,
  agentRefusal,
  credentialFindings,
  decodeArgs,
  decodeWithEudi,
  eudiVersion,
  inlineOffer,
  inlineRequest,
  parseHaipFindings,
  presentViaServer,
  presentWithEudi,
  receiveViaServer,
  receiveWithEudi,
  remoteAcceptArgs,
  serveArgs,
  serverLog,
  signedMetadataFindings,
  storedCredential,
  asksKeyAttestation,
  logsArgs,
  offerConfigurationIds,
  offeredProofTypes,
  offerTxCode,
  requestIncompatibility,
  walletLog,
  withHostLock,
  trailingJson,
  validateWithEudi,
  verifierAnswers,
  withEudiServer,
  withRequestId,
  type EudiIssuance,
  type EudiOutcome,
  type EudiPresentation,
  type EudiServer,
} from "./eudi-dev";

const ISSUER = "https://demo-issuer-accredited.playground.devnet.verana.network/oid4vci/issuer";
const OFFER = "openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fdemo-issuer-accredited.playground.devnet.verana.network%2Foid4vci%2Fissuer%2Foffers%2Fabc";
const REQUEST = "openid4vp://?client_id=x509_hash%3Aabc&request_uri=https%3A%2F%2Fdemo-verifier-accredited.playground.devnet.verana.network%2Foid4vp%2Frequest%2Fabc";

const ISSUANCE_STDOUT = `Received dc+sd-jwt credential from ${ISSUER} (ID: 0f5c3d7e-2b1a-4c8e-9a51-3e0f6b7d2c19)
Verification: Signature valid (ES256, via x5c) [pass]
{
  "credential_id": "0f5c3d7e-2b1a-4c8e-9a51-3e0f6b7d2c19",
  "format": "dc+sd-jwt",
  "issuer": "${ISSUER}",
  "verification_status": "pass",
  "verification_detail": "Signature valid (ES256, via x5c)"
}
`;

const DEFERRED_STDOUT = `Issuer ${ISSUER} deferred the credential (transaction 6a02ebb4, retry every 1m0s)
Run 'eudi wallet serve' and accept the offer there to have the wallet collect it in the background.
{
  "credential_id": "",
  "format": "",
  "issuer": "${ISSUER}",
  "pending": true,
  "transaction_id": "6a02ebb4",
  "retry_interval": "1m0s"
}
`;

const presentationStdout = (status: number, body: string): string => `───────────────────────────────────────
  Verifier: x509_hash:abc
  Trust List:  http://127.0.0.1:8085/api/trustlist
               http://host.docker.internal:8085/api/trustlist
  Credential: dc+sd-jwt (https://playground-demo.playground.devnet.verana.network/vt/vct/8)
  Disclosing: [demoId name]
───────────────────────────────────────
  Submitted: Response: ${status}
───────────────────────────────────────
${JSON.stringify({ status_code: status, body }, null, 2)}
`;

const REQUEST_FAILURE_STDERR = `Generated holder key: /tmp/w/holder.pem
Generated issuer key: /tmp/w/issuer.pem
parsing authorization request: parsing authorization request: fetching request_uri: fetching https://demo-verifier-accredited.playground.devnet.verana.network/oid4vp/request/abc: 404
`;

const stubDir = fs.mkdtempSync(path.join(os.tmpdir(), "eudi-stub-"));
const walletDir = path.join(stubDir, "wallet");
let stubCount = 0;

type Stub = { bin: string; record: string };

function writeStub(behaviour: { stdout?: string; stderr?: string; code?: number; sleepMs?: number; log?: string }): Stub {
  stubCount += 1;
  const bin = path.join(stubDir, `eudi-${stubCount}.cjs`);
  const record = path.join(stubDir, `record-${stubCount}.json`);
  const script = `
const fs = require("node:fs");
fs.writeFileSync(${JSON.stringify(record)}, JSON.stringify({ argv: process.argv.slice(2), home: process.env.EUDI_DEV_HOME }));
const log = ${JSON.stringify(behaviour.log ?? null)};
if (log) fs.appendFileSync(log, "start\\n");
setTimeout(() => {
  if (log) fs.appendFileSync(log, "end\\n");
  process.stdout.write(${JSON.stringify(behaviour.stdout ?? "")});
  process.stderr.write(${JSON.stringify(behaviour.stderr ?? "")});
  process.exitCode = ${behaviour.code ?? 0};
}, ${behaviour.sleepMs ?? 0});
`;
  fs.writeFileSync(bin, `#!${process.execPath}\n${script}`, { mode: 0o755 });
  vi.stubEnv("EUDI_DEV_BIN", bin);
  return { bin, record };
}

const recorded = (stub: Stub): { argv: string[]; home: string } => JSON.parse(fs.readFileSync(stub.record, "utf8"));

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => {
  fs.rmSync(stubDir, { recursive: true, force: true });
});

describe("acceptArgs", () => {
  it("runs a strict, headless, file-backed accept in the given wallet", () => {
    expect(acceptArgs(OFFER, { walletDir: "/w" })).toEqual([
      "wallet", "accept", OFFER, "--auto-accept", "--json", "--no-open", "--no-color", "--storage", "file", "--wallet-dir", "/w", "--mode", "strict",
    ]);
  });

  it("adds --haip on request", () => {
    expect(acceptArgs(REQUEST, { walletDir: "/w", haip: true }).at(-1)).toBe("--haip");
  });
});

describe("trailingJson", () => {
  it("reads the indented object printed after the human-readable lines", () => {
    expect(trailingJson(presentationStdout(200, "{}"))).toEqual({ status_code: 200, body: "{}" });
  });

  it("returns undefined when stdout carries no object", () => {
    expect(trailingJson("Presentation denied.\n")).toBeUndefined();
  });
});

describe("receiveWithEudi", () => {
  it("returns the received credential, its format and the signature check", async () => {
    const stub = writeStub({ stdout: ISSUANCE_STDOUT });
    const outcome = await receiveWithEudi(OFFER, { walletDir });
    expect(outcome).toEqual({
      status: "completed",
      args: acceptArgs(OFFER, { walletDir }),
      result: {
        deferred: false,
        credentialId: "0f5c3d7e-2b1a-4c8e-9a51-3e0f6b7d2c19",
        format: "dc+sd-jwt",
        issuer: ISSUER,
        signature: "pass",
        signatureDetail: "Signature valid (ES256, via x5c)",
      },
    });
    expect(recorded(stub)).toEqual({ argv: acceptArgs(OFFER, { walletDir }), home: walletDir });
  });

  it("reports a deferred credential", async () => {
    writeStub({ stdout: DEFERRED_STDOUT });
    const outcome = await receiveWithEudi(OFFER, { walletDir });
    expect(outcome.status === "completed" && outcome.result.deferred).toBe(true);
  });

  it("is failed with the last stderr line when eudi-dev exits non-zero", async () => {
    writeStub({ stderr: "processing credential offer: credential request failed: invalid_proof\n", code: 1 });
    expect(await receiveWithEudi(OFFER, { walletDir })).toMatchObject({ status: "failed", cause: "processing credential offer: credential request failed: invalid_proof" });
  });

  it("is unknown when the result has no credential id", async () => {
    writeStub({ stdout: '{\n  "format": "dc+sd-jwt"\n}\n' });
    expect((await receiveWithEudi(OFFER, { walletDir })).status).toBe("unknown");
  });
});

describe("presentWithEudi", () => {
  it("returns the verifier's HTTP status and passes --haip through", async () => {
    const stub = writeStub({ stdout: presentationStdout(200, "{}") });
    const outcome = await presentWithEudi(REQUEST, { walletDir, haip: true });
    expect(outcome).toMatchObject({ status: "completed", result: { accepted: true, httpStatus: 200, body: "{}", redirectUri: null } });
    expect(recorded(stub).argv).toEqual(acceptArgs(REQUEST, { walletDir, haip: true }));
  });

  it("is completed but not accepted when the verifier answers 4xx", async () => {
    writeStub({ stdout: presentationStdout(400, '{"error":"invalid_request"}') });
    expect(await presentWithEudi(REQUEST, { walletDir })).toMatchObject({ status: "completed", result: { accepted: false, httpStatus: 400 } });
  });

  it("is failed when eudi-dev refuses the request", async () => {
    writeStub({ stderr: REQUEST_FAILURE_STDERR, code: 1 });
    const outcome = await presentWithEudi(REQUEST, { walletDir });
    expect(outcome.status).toBe("failed");
    expect(outcome.status === "failed" && outcome.cause.startsWith("parsing authorization request:")).toBe(true);
  });

  it("is unknown when a running wallet server answered instead", async () => {
    writeStub({ stdout: '{"status":"submitted","response":{"status_code":200,"body":"{}"},"vp_token_keys":["c1"]}\n' });
    expect((await presentWithEudi(REQUEST, { walletDir })).status).toBe("unknown");
  });
});

describe("unavailable eudi-dev", () => {
  it("is unknown, never completed, when the binary is missing", async () => {
    vi.stubEnv("EUDI_DEV_BIN", path.join(stubDir, "does-not-exist"));
    expect(await receiveWithEudi(OFFER, { walletDir })).toMatchObject({ status: "unknown", cause: expect.stringContaining("not found") });
    expect(await eudiVersion()).toBeNull();
  });

  it("is unknown, never completed, when the run times out", async () => {
    writeStub({ stdout: ISSUANCE_STDOUT, sleepMs: 5_000 });
    expect(await receiveWithEudi(OFFER, { walletDir, timeoutMs: 300 })).toMatchObject({ status: "unknown", cause: expect.stringContaining("within 300 ms") });
  });
});

describe("sequential runs", () => {
  it("never overlaps two accepts", async () => {
    const log = path.join(stubDir, "overlap.log");
    writeStub({ stdout: presentationStdout(200, "{}"), sleepMs: 150, log });
    await Promise.all([presentWithEudi(REQUEST, { walletDir }), presentWithEudi(REQUEST, { walletDir })]);
    expect(fs.readFileSync(log, "utf8").trim().split("\n")).toEqual(["start", "end", "start", "end"]);
  });
});

describe("eudiVersion", () => {
  it("returns the version line", async () => {
    writeStub({ stdout: "eudi v2.4.4 (eudi-dev)\n" });
    expect(await eudiVersion()).toBe("eudi v2.4.4 (eudi-dev)");
  });
});

const VALIDATE_STDOUT = fs.readFileSync(new URL("../fixtures/eudi-dev/validate-haip.txt", import.meta.url), "utf8");
const SD_JWT = "eyJhbGciOiJFUzI1NiJ9.eyJ2Y3QiOiJ4In0.c2ln~WyJzYWx0IiwiZGVtb0lkIiwiZGVtby0xIl0~";
const REQUEST_OBJECT = "eyJhbGciOiJFUzI1NiJ9.eyJjbGllbnRfaWQiOiJ4NTA5X2hhc2g6YWJjIn0.c2ln";
const HAIP_PRESENTATION_STDERR = "remote wallet: authorization request validation failed: HAIP 1.0 §5: the certificate signing the request MUST NOT be self-signed (HTTP 400)\n";

type ServerStub = { record: string; stopped: string };

function writeServerStub(behaviour: { crash?: string; reportHaip?: boolean; log?: unknown[] } = {}): ServerStub {
  stubCount += 1;
  const bin = path.join(stubDir, `eudi-serve-${stubCount}.cjs`);
  const record = path.join(stubDir, `serve-record-${stubCount}.json`);
  const stopped = path.join(stubDir, `serve-stopped-${stubCount}.log`);
  const script = `
const fs = require("node:fs");
const http = require("node:http");
const argv = process.argv.slice(2);
fs.writeFileSync(${JSON.stringify(record)}, JSON.stringify({ argv, home: process.env.EUDI_DEV_HOME }));
const behaviour = ${JSON.stringify(behaviour)};
if (behaviour.crash) {
  process.stderr.write(behaviour.crash);
  process.exit(1);
}
const flag = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const config = {
  wallet_dir: flag("--wallet-dir"),
  require_haip: behaviour.reportHaip ?? argv.includes("--haip"),
  validation_mode: flag("--mode"),
  auto_accept: argv.includes("--auto-accept"),
  vci_version: flag("--vci-version") ?? "1.0",
  key_attestation_level: flag("--key-attestation-level") ?? "",
};
const server = http.createServer((req, res) => {
  res.setHeader("content-type", "application/json");
  if (req.url === "/api/config") return res.end(JSON.stringify(config));
  if (req.url === "/api/log") return res.end(JSON.stringify(behaviour.log ?? []));
  if (req.url === "/api/shutdown" && req.method === "POST") {
    fs.appendFileSync(${JSON.stringify(stopped)}, "shutdown\\n");
    res.end("{}");
    server.close();
    setTimeout(() => process.exit(0), 10);
    return;
  }
  res.statusCode = 404;
  res.end("{}");
});
server.listen(Number(flag("--port")), "127.0.0.1");
`;
  fs.writeFileSync(bin, `#!${process.execPath}\n${script}`, { mode: 0o755 });
  vi.stubEnv("EUDI_DEV_BIN", bin);
  return { record, stopped };
}

const failed = (cause: string): EudiOutcome<EudiIssuance | EudiPresentation> => ({ status: "failed", cause, args: [] });
const presented = (httpStatus: number): EudiOutcome<EudiIssuance | EudiPresentation> => ({
  status: "completed",
  args: [],
  result: { accepted: httpStatus < 400, httpStatus, body: "{}", redirectUri: null },
});
const server: EudiServer = { url: "http://127.0.0.1:18085", walletDir: "/w", haip: true, mode: "strict" };

describe("argument builders", () => {
  it("passes an explicit presentation port before --haip", () => {
    expect(acceptArgs(REQUEST, { walletDir: "/w", port: 50123, haip: true }).slice(-3)).toEqual(["--port", "50123", "--haip"]);
  });

  it("serves a strict, headless, file-backed wallet and adds --haip on request", () => {
    expect(serveArgs({ walletDir: "/w", port: 50123, haip: false })).toEqual([
      "wallet", "serve", "--auto-accept", "--no-open", "--no-register", "--no-color", "--storage", "file", "--wallet-dir", "/w", "--port", "50123", "--mode", "strict",
    ]);
    expect(serveArgs({ walletDir: "/w", port: 50123, haip: true }).at(-1)).toBe("--haip");
  });

  it("sends accepts to the running wallet server and pins the decode format", () => {
    expect(remoteAcceptArgs(OFFER, server)).toEqual(["wallet", "accept", OFFER, "--remote", server.url, "--auto-accept", "--json", "--no-open", "--no-color"]);
    expect(decodeArgs("/m.jwt", "jwt")).toEqual(["decode", "/m.jwt", "--json", "--no-color", "--format", "jwt"]);
  });
});

describe("withEudiServer", () => {
  it("starts a strict HAIP wallet server, hands it to the body and shuts it down", async () => {
    const stub = writeServerStub();
    const dir = fs.mkdtempSync(path.join(stubDir, "serve-"));
    const outcome = await withEudiServer({ walletDir: dir, haip: true }, async (s) => {
      const res = await fetch(`${s.url}/api/config`);
      const config: unknown = await res.json();
      return config;
    });
    expect(outcome).toMatchObject({ status: "ran", result: { require_haip: true, validation_mode: "strict" } });
    const rec = JSON.parse(fs.readFileSync(stub.record, "utf8")) as { argv: string[]; home: string };
    expect(rec.home).toBe(dir);
    expect(rec.argv.slice(-3)).toEqual(["--mode", "strict", "--haip"]);
    expect(fs.readFileSync(stub.stopped, "utf8")).toBe("shutdown\n");
  });

  it("is unknown when the port answers with another HAIP setting", async () => {
    writeServerStub({ reportHaip: false });
    const dir = fs.mkdtempSync(path.join(stubDir, "serve-"));
    const outcome = await withEudiServer({ walletDir: dir, haip: true }, async () => "ran");
    expect(outcome).toMatchObject({ status: "unknown", cause: expect.stringContaining("another wallet configuration") });
  });

  it("is unknown with the last stderr line when the server exits before answering", async () => {
    writeServerStub({ crash: "listen tcp :50123: bind: address already in use\n" });
    const outcome = await withEudiServer({ walletDir: walletDir, haip: false }, async () => "ran");
    expect(outcome).toEqual({ status: "unknown", cause: "eudi-dev wallet serve exited before answering: listen tcp :50123: bind: address already in use" });
  });

  it("is unknown when the binary is missing", async () => {
    vi.stubEnv("EUDI_DEV_BIN", path.join(stubDir, "does-not-exist"));
    expect(await withEudiServer({ walletDir, haip: false }, async () => "ran")).toMatchObject({ status: "unknown", cause: expect.stringContaining("not found") });
  });

  it("reads what the verifier answered from the server's activity log", async () => {
    writeServerStub({
      log: [
        { action: "presentation", details: { event: "presentation_error_response", error: "access_denied" } },
        { action: "presentation", details: { event: "verifier_response", status_code: 500, response_body: '{\n  "error": "server_error"\n}' } },
      ],
    });
    const dir = fs.mkdtempSync(path.join(stubDir, "serve-"));
    const outcome = await withEudiServer({ walletDir: dir, haip: false }, async (s) => verifierAnswers(await serverLog(s)));
    expect(outcome).toEqual({ status: "ran", result: [{ statusCode: 500, body: '{\n  "error": "server_error"\n}' }] });
  });
});

describe("accepts through a wallet server", () => {
  it("reads a submitted presentation and a no_match", async () => {
    writeStub({ stdout: JSON.stringify({ status: "submitted", response: { status_code: 200, body: "{}" }, vp_token_keys: ["cs-8"] }, null, 2) });
    expect(await presentViaServer(REQUEST, server)).toMatchObject({ status: "completed", result: { status: "submitted", accepted: true, httpStatus: 200 } });
    writeStub({ stdout: JSON.stringify({ status: "no_match", error: "no matching credentials found", error_description: "no stored credential satisfies the requested query" }, null, 2) });
    expect(await presentViaServer(REQUEST, server)).toMatchObject({ status: "completed", result: { status: "no_match", error: "no stored credential satisfies the requested query" } });
  });

  it("is failed with the wallet's refusal, and with any other server status", async () => {
    writeStub({ stderr: HAIP_PRESENTATION_STDERR, code: 1 });
    expect(await presentViaServer(REQUEST, server)).toMatchObject({ status: "failed", cause: HAIP_PRESENTATION_STDERR.trim() });
    writeStub({ stdout: '{\n  "status": "denied",\n  "error": "user denied"\n}\n' });
    expect(await presentViaServer(REQUEST, server)).toMatchObject({ status: "failed", cause: "wallet server answered denied: user denied" });
  });

  it("reads an issuance and sends the wallet home along", async () => {
    const stub = writeStub({ stdout: ISSUANCE_STDOUT });
    expect(await receiveViaServer(OFFER, server)).toMatchObject({ status: "completed", result: { credentialId: "0f5c3d7e-2b1a-4c8e-9a51-3e0f6b7d2c19" } });
    expect(recorded(stub)).toEqual({ argv: remoteAcceptArgs(OFFER, server), home: "/w" });
  });
});

describe("decode and validate", () => {
  it("returns the decoded object", async () => {
    const stub = writeStub({ stdout: `${JSON.stringify(DECODED_METADATA, null, 2)}\n` });
    expect(await decodeWithEudi("/m.jwt", { format: "jwt" })).toMatchObject({ status: "completed", result: { header: { typ: "openidvci-issuer-metadata+jwt" } } });
    expect(recorded(stub).argv).toEqual(decodeArgs("/m.jwt", "jwt"));
  });

  it("is failed when decode exits non-zero", async () => {
    writeStub({ stderr: "unable to auto-detect format (not a credential, OpenID4VCI/VP request, or trust list)\n", code: 1 });
    expect((await decodeWithEudi("garbage")).status).toBe("failed");
  });

  it("reads the HAIP findings of a valid credential", async () => {
    writeStub({ stdout: VALIDATE_STDOUT });
    expect(await validateWithEudi("/c.txt")).toMatchObject({
      status: "completed",
      result: { valid: true, failure: null, haipFindings: ["HAIP 1.0 §6.1.1: the certificate signing the credential MUST NOT be self-signed"] },
    });
  });

  it("reports why validation failed, and no HAIP findings when the section is missing", async () => {
    writeStub({ stdout: "SD-JWT Credential\n", stderr: "signature verification failed\n", code: 1 });
    expect(await validateWithEudi("/c.txt")).toMatchObject({ status: "completed", result: { valid: false, failure: "signature verification failed", haipFindings: null } });
    expect(parseHaipFindings("\n  HAIP 1.0: no findings\n")).toEqual([]);
  });

  it("reads a stored credential and refuses anything that is not an SD-JWT", async () => {
    const stub = writeStub({ stdout: `${SD_JWT}\n` });
    expect(await storedCredential("63fc", walletDir)).toMatchObject({ status: "completed", result: SD_JWT });
    expect(recorded(stub).argv).toEqual(["wallet", "show", "63fc", "--wallet-dir", walletDir, "--storage", "file", "--remote", "local", "--no-color"]);
    writeStub({ stdout: "no credential\n" });
    expect((await storedCredential("63fc", walletDir)).status).toBe("unknown");
  });
});

describe("signedMetadataFindings", () => {
  it("flags nothing on the signed metadata of a devnet issuer", () => {
    expect(signedMetadataFindings(DECODED_METADATA, ISSUER)).toEqual({ findings: [] });
  });

  it("flags a metadata JWT signed for another issuer, with the wrong typ or a failed signature", () => {
    const other = signedMetadataFindings(DECODED_METADATA, "https://other.example/oid4vci/issuer");
    expect("findings" in other && other.findings.map((f) => f.split(" ")[0])).toEqual(["sub", "credential_issuer"]);
    const tampered = {
      ...DECODED_METADATA,
      header: { ...DECODED_METADATA.header, typ: "JWT" },
      validation: { checks: [{ name: "signature", status: "fail", detail: "invalid" }] },
    };
    const result = signedMetadataFindings(tampered, ISSUER);
    expect("findings" in result && result.findings).toEqual([
      'typ "JWT" is not openidvci-issuer-metadata+jwt (OID4VCI 1.0 §12.2.3)',
      "signature fail: invalid",
    ]);
  });

  it("is unknown without a signature check", () => {
    expect(signedMetadataFindings({ ...DECODED_METADATA, validation: { checks: [] } }, ISSUER)).toEqual({ unknown: "eudi-dev decode reported no signature check" });
  });
});

describe("credentialFindings", () => {
  it("flags nothing on a devnet credential and returns its payload", () => {
    const result = credentialFindings(DECODED_CREDENTIAL);
    expect(result).toMatchObject({ findings: [], payload: { vct: "https://playground-demo.playground.devnet.verana.network/vt/vct/8" } });
  });

  it("flags failed checks and an unverified signature", () => {
    const checks = [
      { name: "expiry", status: "fail", detail: "expired 2 days ago" },
      { name: "signature", status: "skipped", detail: "no key" },
    ];
    const result = credentialFindings({ ...DECODED_CREDENTIAL, validation: { checks } });
    expect("findings" in result && result.findings).toEqual(["expiry: expired 2 days ago", "signature not verified: no key"]);
  });
});

describe("replay inputs", () => {
  it("inlines a decoded offer with its pre-authorized code", () => {
    const uri = inlineOffer(DECODED_OFFER);
    expect(uri?.startsWith("openid-credential-offer://?credential_offer=")).toBe(true);
    const offer = JSON.parse(decodeURIComponent(uri?.split("credential_offer=")[1] ?? "")) as { credential_issuer: string; grants: Record<string, { "pre-authorized_code": string }> };
    expect(offer.credential_issuer).toBe(ISSUER);
    expect(offer.grants["urn:ietf:params:oauth:grant-type:pre-authorized_code"]?.["pre-authorized_code"]).toBe("fqiT6ejc1KXkGL8BoamAL9nwIUqXUIGcFD1ujhHbUg4");
    expect(inlineOffer({ credential_issuer: ISSUER })).toBeNull();
  });

  it("inlines a fetched request object under the same client_id", () => {
    expect(inlineRequest(REQUEST, REQUEST_OBJECT)).toBe(`openid4vp://?client_id=x509_hash%3Aabc&request=${REQUEST_OBJECT}`);
    expect(inlineRequest(REQUEST, "not-a-jwt")).toBeNull();
  });

  it("points a request at another id on the same verifier", () => {
    const garbage = withRequestId(REQUEST, "d57034f5-a37f-4377-be91-65cff26cf15c");
    expect(garbage).toBe(
      "openid4vp://?client_id=x509_hash%3Aabc&request_uri=https%3A%2F%2Fdemo-verifier-accredited.playground.devnet.verana.network%2Foid4vp%2Frequest%2Fd57034f5-a37f-4377-be91-65cff26cf15c",
    );
    expect(withRequestId("openid4vp://?client_id=x", "id")).toBeNull();
  });
});

describe("agentRefusal", () => {
  it("is refused when the agent answers the replay with an OAuth error or a 4xx", () => {
    expect(agentRefusal(failed("processing credential offer: token exchange: invalid_grant: Invalid authorization code")).kind).toBe("refused");
    expect(agentRefusal(failed(`processing credential offer: parsing credential offer: fetching credential_offer_uri: fetching ${ISSUER}/offers/abc: HTTP 404`)).kind).toBe("refused");
    expect(agentRefusal(failed("parsing authorization request: parsing authorization request: fetching request_uri: fetching https://v/oid4vp/abc: HTTP 400")).kind).toBe("refused");
    expect(agentRefusal(presented(400)).kind).toBe("refused");
  });

  it("is accepted when the replay goes through", () => {
    expect(agentRefusal(presented(200)).kind).toBe("accepted");
    expect(agentRefusal({ status: "completed", args: [], result: { deferred: false, credentialId: "c1", format: "dc+sd-jwt", issuer: ISSUER, signature: "pass", signatureDetail: null } })).toEqual({
      kind: "accepted",
      detail: "the issuer issued credential c1",
    });
  });

  it("is errored when the agent answers 5xx instead of refusing", () => {
    expect(agentRefusal(presented(500)).kind).toBe("errored");
    expect(agentRefusal(failed("parsing authorization request: fetching request_uri: fetching https://v/oid4vp/abc: HTTP 502")).kind).toBe("errored");
  });

  it("is unknown when eudi-dev stopped on its own", () => {
    expect(agentRefusal(failed("no matching credentials found for the DCQL query"))).toEqual({
      kind: "unknown",
      cause: "eudi-dev stopped before the agent answered: no matching credentials found for the DCQL query",
    });
    expect(agentRefusal({ status: "unknown", cause: "eudi-dev did not finish within 300 ms", args: [] }).kind).toBe("unknown");
  });
});

describe("server variants", () => {
  it("passes the OpenID4VCI feature level, the key attestation level and the validation mode", () => {
    expect(serveArgs({ walletDir: "/w", port: 50123, haip: false, mode: "debug", vciVersion: "1.1", keyAttestationLevel: "iso_18045_high" }).slice(-6)).toEqual([
      "--mode", "debug", "--vci-version", "1.1", "--key-attestation-level", "iso_18045_high",
    ]);
  });

  it("starts a server with the requested variant and refuses one that reports another", async () => {
    const stub = writeServerStub();
    const dir = fs.mkdtempSync(path.join(stubDir, "serve-"));
    const ran = await withEudiServer({ walletDir: dir, haip: false, mode: "debug", vciVersion: "1.1", keyAttestationLevel: "none" }, async (s) => s.mode);
    expect(ran).toEqual({ status: "ran", result: "debug" });
    expect((JSON.parse(fs.readFileSync(stub.record, "utf8")) as { argv: string[] }).argv).toEqual(
      expect.arrayContaining(["--mode", "debug", "--vci-version", "1.1", "--key-attestation-level", "none"]),
    );
    writeServerStub({ reportHaip: true });
    const other = fs.mkdtempSync(path.join(stubDir, "serve-"));
    expect((await withEudiServer({ walletDir: other, haip: false }, async () => "ran")).status).toBe("unknown");
  });
});

describe("withHostLock", () => {
  it("waits for a live holder and takes over a lock its holder left behind", async () => {
    const lock = path.join(stubDir, "host.lock");
    fs.writeFileSync(lock, String(process.pid));
    const order: string[] = [];
    const waiting = withHostLock(lock, async () => {
      order.push("second");
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    order.push("first");
    fs.rmSync(lock);
    await waiting;
    expect(order).toEqual(["first", "second"]);
    expect(fs.existsSync(lock)).toBe(false);

    fs.writeFileSync(lock, "999999");
    expect(await withHostLock(lock, async () => "taken")).toBe("taken");
  });
});

describe("wallet log", () => {
  it("reads the persisted log of a file wallet", async () => {
    const stub = writeStub({ stdout: `${JSON.stringify(ISSUANCE_LOG, null, 2)}\n` });
    expect(await walletLog(walletDir)).toMatchObject({ status: "completed", result: ISSUANCE_LOG });
    expect(recorded(stub).argv).toEqual(logsArgs(walletDir));
    writeStub({ stdout: "no log\n" });
    expect((await walletLog(walletDir)).status).toBe("unknown");
  });

  it("finds the proof types eudi-dev was offered for the offered configuration", () => {
    const ids = offerConfigurationIds(DECODED_OFFER);
    expect(ids).toEqual(["https://playground-demo.playground.devnet.verana.network/vt/schemas-8-jsc.json"]);
    const proofTypes = offeredProofTypes(ISSUANCE_LOG, ids);
    expect(proofTypes).toEqual({ jwt: { proof_signing_alg_values_supported: ["ES256"] } });
    expect(proofTypes && asksKeyAttestation(proofTypes)).toBe(false);
    expect(asksKeyAttestation({ jwt: { key_attestations_required: {} } })).toBe(true);
    expect(asksKeyAttestation({ attestation: {} })).toBe(true);
    expect(offeredProofTypes([], ids)).toBeNull();
  });

  it("tells whether an offer carries a transaction code", () => {
    expect(offerTxCode(DECODED_OFFER)).toBe(false);
    const grant = { "urn:ietf:params:oauth:grant-type:pre-authorized_code": { "pre-authorized_code": "x", tx_code: { length: 4 } } };
    expect(offerTxCode({ ...DECODED_OFFER, grants: grant })).toBe(true);
  });
});

describe("requestIncompatibility", () => {
  it("names a draft 21 presentation_definition request as outside OpenID4VP 1.0", () => {
    const pe = requestIncompatibility(DECODED_REQUEST_PE);
    expect(pe?.cause).toContain("presentation_definition");
    expect(pe?.marker.test("authorization request validation failed: OID4VP 1.0 §5.1: a vp_token request must carry either dcql_query or scope")).toBe(true);
  });

  it("names a DID-signed request as one eudi-dev cannot verify", () => {
    const did = requestIncompatibility({ ...DECODED_REQUEST_DCQL, client_id: "decentralized_identifier:did:webvh:abc" });
    expect(did?.marker.test("Request Object signature was not verified: decentralized_identifier: resolves its key through the DID")).toBe(true);
  });

  it("finds nothing in an x509_hash DCQL request", () => {
    expect(requestIncompatibility(DECODED_REQUEST_DCQL)).toBeNull();
  });
});
