import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { acceptArgs, eudiVersion, presentWithEudi, receiveWithEudi, trailingJson } from "./eudi-dev";

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
