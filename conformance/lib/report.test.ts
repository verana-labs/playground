import fs from "node:fs";
import path from "node:path";
import { threadId } from "node:worker_threads";
import { describe, expect, inject, it } from "vitest";
import { check, CheckFailed, CellSchema, record, type Cell } from "./report";

const base = { tier: "t1" as const, check: "report-test", clause: "CONF-OUT-1", network: "testnet-v3", service: "unit" };

function lastCell(): Cell {
  const file = path.join(inject("runDir"), `cells-${process.pid}-${threadId}.jsonl`);
  const lines = fs.readFileSync(file, "utf8").split("\n").filter(Boolean);
  return CellSchema.parse(JSON.parse(lines[lines.length - 1] as string));
}

describe("check", () => {
  it("records a works cell and resolves", async () => {
    await check({ ...base, wallet: "w1" }, async () => ({ outcome: "works", evidence: { a: 1 } }));
    expect(lastCell()).toMatchObject({ ...base, wallet: "w1", outcome: "works", evidence: { a: 1 } });
  });

  it("records a broken cell and then fails the test", async () => {
    await expect(check({ ...base, wallet: "w2" }, async () => ({ outcome: "broken", cause: "nope" }))).rejects.toBeInstanceOf(CheckFailed);
    expect(lastCell()).toMatchObject({ wallet: "w2", outcome: "broken", cause: "nope" });
  });

  it("records an unknown cell when the body throws, and rethrows", async () => {
    await expect(check({ ...base, wallet: "w3" }, async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(lastCell()).toMatchObject({ wallet: "w3", outcome: "unknown" });
    expect(lastCell().cause).toContain("boom");
  });
});

describe("record", () => {
  it("refuses a malformed cell", () => {
    expect(() => record({ ...base, outcome: "maybe" } as unknown as Cell)).toThrow();
  });

  it("requires a cause on an incompatible-by-design cell", () => {
    expect(() => record({ ...base, outcome: "incompatible-by-design" })).toThrow(/cause/);
    expect(() => record({ ...base, outcome: "incompatible-by-design", cause: "policy", reference: "https://example.org" })).not.toThrow();
  });
});
