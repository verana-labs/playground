import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import VCT from "./fixtures/devnet-v4/vct-8.json";
import { integrityMatches } from "./sri";

const SERVED = Buffer.from(JSON.stringify(VCT));
const INTEGRITY = "sha384-K55yE8WKwlZbf1LCS9o+2Zkfa07tQAB+ZXuQkeDKzN2zuhS4n0kFxAoF/ER+9fPF";

describe("integrityMatches", () => {
  it("matches the vct#integrity of a devnet credential against the Type Metadata bytes it was served", () => {
    expect(integrityMatches(INTEGRITY, SERVED)).toBe(true);
  });

  it("does not match a document that changed by one byte", () => {
    expect(integrityMatches(INTEGRITY, Buffer.concat([SERVED, Buffer.from("\n")]))).toBe(false);
  });

  it("only compares the strongest algorithm listed", () => {
    const sha256 = `sha256-${createHash("sha256").update(SERVED).digest("base64")}`;
    expect(integrityMatches(`${sha256} sha512-AAAA`, SERVED)).toBe(false);
    expect(integrityMatches(`sha256-AAAA ${INTEGRITY}`, SERVED)).toBe(true);
  });

  it("ignores options and is null when no algorithm is supported", () => {
    expect(integrityMatches(`${INTEGRITY}?ct=application/json`, SERVED)).toBe(true);
    expect(integrityMatches("md5-AAAA", SERVED)).toBeNull();
    expect(integrityMatches("", SERVED)).toBeNull();
  });
});
