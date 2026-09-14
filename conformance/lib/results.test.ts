import { describe, expect, it } from "vitest";
import { buildResults } from "./results";

const header = {
  id: "run-1",
  startedAt: "2026-09-14T10:00:00.000Z",
  gitSha: "abc",
  gitBranch: "feat/x",
  networks: ["testnet-v3"],
};

const lines = [
  { tier: "t1", check: "metadata-parses", clause: "CONF-T1-1", network: "testnet-v3", cast: "demo", service: "a", outcome: "works" },
  { tier: "t1", check: "metadata-parses", clause: "CONF-T1-1", network: "testnet-v3", cast: "demo", service: "b", outcome: "broken", cause: "no display" },
  { tier: "t1", check: "serving-version", clause: "CONF-OPS-2", network: "testnet-v3", cast: "demo", service: "a", outcome: "unknown", evidence: { host: "a.example", pinnedTag: "v1", servingTag: null, packageVersion: "1.12.0" } },
]
  .map((c) => JSON.stringify(c))
  .join("\n");

describe("buildResults", () => {
  it("merges cells, counts outcomes and lifts service identities", () => {
    const results = buildResults(header, `${lines}\n`, "2026-09-14T10:05:00.000Z");
    expect(results.cells).toHaveLength(3);
    expect(results.totals).toEqual({ works: 1, broken: 1, "incompatible-by-design": 0, unknown: 1, "not-testable": 0 });
    expect(results.services).toEqual([
      { network: "testnet-v3", cast: "demo", id: "a", host: "a.example", pinnedTag: "v1", servingTag: null, packageVersion: "1.12.0" },
    ]);
    expect(results.finishedAt).toBe("2026-09-14T10:05:00.000Z");
  });

  it("sorts cells by code point so two runs diff line by line on any machine", () => {
    const shuffled = lines.split("\n").reverse().join("\n");
    const a = buildResults(header, lines, "t");
    const b = buildResults(header, shuffled, "t");
    expect(a.cells).toEqual(b.cells);
    expect(a.cells.map((c) => c.service)).toEqual(["a", "b", "a"]);
  });

  it("rejects a malformed cell", () => {
    expect(() => buildResults(header, '{"tier":"t1"}', "t")).toThrow(/cell/);
  });
});
