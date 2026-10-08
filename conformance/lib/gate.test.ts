import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cellKey, evaluate, matches, parseServiceGaps, renderMarkdown, type GateCell, type KnownGap } from "./gate";
import { listNetworks } from "./network";
import { readCastServices } from "./verdicts";

const cell = (overrides: Partial<GateCell>): GateCell => ({
  tier: "t1",
  check: "serving-version",
  network: "testnet-v4",
  cast: "demo",
  service: "demo-issuer-accredited",
  outcome: "broken",
  ...overrides,
});

const gap = (overrides: Partial<KnownGap> = {}): KnownGap => ({
  id: "demo-not-rolled",
  network: "testnet-v4",
  cells: [{ tier: "t1", check: "serving-version", cast: "demo", service: ["demo-issuer-accredited", "playground-demo"] }],
  cause: "demo cast not rolled to .49",
  expires: "2026-10-01",
  ...overrides,
});

const base = { today: "2026-09-17", baseline: null, requiredTiers: [], failOnMissing: false };

const servicesFile = (gaps: string): string => `network: testnet-v4\noffer: {}\ngaps:\n${gaps}`;

describe("parseServiceGaps", () => {
  it("keeps the gaps that name cells, on the file's network, with one or several matchers", () => {
    const gaps = parseServiceGaps(
      servicesFile(
        '  - id: a\n    rail: openid4vc-sdjwt\n    cause: one\n    until: x\n    expires: "2026-10-01"\n    cells: { tier: t1, check: serving-version, cast: demo }\n' +
          '  - id: b\n    rail: openid4vc-sdjwt\n    cause: two\n    until: x\n    expires: "2026-10-01"\n    cells:\n      - { tier: t2, check: flow }\n      - { tier: t2, check: reference-holder }\n' +
          '  - id: c\n    rail: openid4vc-sdjwt\n    cause: verdicts only\n    until: x\n    expires: "2026-10-01"\n',
      ),
    );
    expect(gaps.map((g) => [g.id, g.network, g.cells.length])).toEqual([
      ["a", "testnet-v4", 1],
      ["b", "testnet-v4", 2],
    ]);
    expect(gaps[0]?.expires).toBe("2026-10-01");
  });

  it("rejects a matcher without tier and check, or with an unknown field", () => {
    const entry = (cells: string) => servicesFile(`  - id: a\n    cause: c\n    expires: "2026-10-01"\n    cells: ${cells}\n`);
    expect(() => parseServiceGaps(entry("{ cast: demo }"))).toThrow();
    expect(() => parseServiceGaps(entry("{ tier: t1, check: x, colour: red }"))).toThrow();
    expect(() => parseServiceGaps(entry("{ tier: t1, check: x, network: testnet-v4 }"))).toThrow();
  });

  it("rejects a gap without an expiry", () => {
    expect(() => parseServiceGaps(servicesFile("  - id: a\n    cause: forever\n    cells: { tier: t1, check: x }\n"))).toThrow();
  });
});

describe("matches", () => {
  it("matches listed values and ignores fields the issue does not name", () => {
    expect(matches(gap(), cell({}))).toBe(true);
    expect(matches(gap(), cell({ service: "playground-demo", wallet: "eudi" }))).toBe(true);
  });

  it("does not match another service, cast, check or network", () => {
    expect(matches(gap(), cell({ service: "demo-verifier-accredited" }))).toBe(false);
    expect(matches(gap(), cell({ cast: "vesta" }))).toBe(false);
    expect(matches(gap(), cell({ check: "tls-certificate" }))).toBe(false);
    expect(matches(gap(), cell({ network: "devnet-v4" }))).toBe(false);
  });

  it("matches when any of its matchers does", () => {
    const two = gap({ cells: [{ tier: "t2", check: "flow" }, { tier: "t1", check: "serving-version", service: "playground-demo" }] });
    expect(matches(two, cell({ service: "playground-demo" }))).toBe(true);
    expect(matches(two, cell({ tier: "t2", check: "flow" }))).toBe(true);
    expect(matches(two, cell({}))).toBe(false);
  });

  it("does not match a cell that lacks a field the issue names", () => {
    expect(matches(gap(), cell({ service: undefined }))).toBe(false);
  });
});

describe("evaluate", () => {
  it("turns a matched broken cell into a known gap", () => {
    const report = evaluate({ ...base, cells: [cell({})], gaps: [gap()] });
    expect(report.failures).toEqual([]);
    expect(report.known).toEqual([{ key: cellKey(cell({})), cause: "demo-not-rolled: demo cast not rolled to .49" }]);
  });

  it("fails on a broken or unknown cell no gap covers", () => {
    const report = evaluate({
      ...base,
      cells: [cell({ service: "demo-verifier-accredited" }), cell({ check: "did-resolves", outcome: "unknown", cause: "timeout" })],
      gaps: [gap()],
    });
    expect(report.failures.map((f) => f.kind)).toEqual(["broken", "unknown"]);
    expect(report.failures[1]?.cause).toBe("timeout");
  });

  it("never fails on works, incompatible-by-design or not-testable", () => {
    const report = evaluate({
      ...base,
      cells: [cell({ outcome: "works" }), cell({ outcome: "incompatible-by-design", cause: "policy" }), cell({ outcome: "not-testable" })],
      gaps: [],
    });
    expect(report.failures).toEqual([]);
  });

  it("stops covering a cell the day after the gap expires", () => {
    const report = evaluate({ ...base, today: "2026-10-02", cells: [cell({})], gaps: [gap()] });
    expect(report.failures).toHaveLength(1);
    expect(report.expired).toHaveLength(1);
  });

  it("still covers a cell on the expiry day", () => {
    const report = evaluate({ ...base, today: "2026-10-01", cells: [cell({})], gaps: [gap()] });
    expect(report.failures).toEqual([]);
  });

  it("lists active gaps that matched nothing as resolved", () => {
    const report = evaluate({ ...base, cells: [cell({ outcome: "works" })], gaps: [gap()] });
    expect(report.resolved).toHaveLength(1);
  });

  it("does not call a gap resolved when its tier or network did not run", () => {
    const onTestnet = gap({ cells: [{ tier: "t1", check: "serving-version" }] });
    const onDevice = gap({ cells: [{ tier: "t3", check: "gating" }] });
    const report = evaluate({ ...base, cells: [cell({ network: "devnet-v4", outcome: "works" })], gaps: [onTestnet, onDevice] });
    expect(report.resolved).toEqual([]);
  });

  it("does not call a gap resolved when its check or cast did not run", () => {
    const otherCheck = gap({ cells: [{ tier: "t1", check: "tls-certificate" }] });
    const otherCast = gap({ cells: [{ tier: "t1", check: "serving-version", cast: "vesta" }] });
    const report = evaluate({ ...base, cells: [cell({ outcome: "works" })], gaps: [otherCheck, otherCast] });
    expect(report.resolved).toEqual([]);
  });

  it("fails when a required tier produced no cells", () => {
    const report = evaluate({ ...base, requiredTiers: ["t1", "t2"], cells: [cell({ outcome: "works" })], gaps: [] });
    expect(report.failures).toEqual([{ kind: "missing", key: "t2|*", cause: "no t2 results were produced" }]);
  });

  it("fails on cells that disappeared since the baseline only when asked to", () => {
    const gone = cell({ service: "playground-demo", outcome: "works" });
    const input = { ...base, cells: [cell({ outcome: "works" })], gaps: [], baseline: [cell({ outcome: "works" }), gone] };
    expect(evaluate(input).failures).toEqual([]);
    expect(evaluate({ ...input, failOnMissing: true }).failures).toEqual([
      { kind: "missing", key: cellKey(gone), cause: "present in the baseline run, absent now" },
    ]);
  });

  it("leaves a tier that did not run this time to the required-tier check", () => {
    const deviceCell = cell({ tier: "t3", check: "gating", wallet: "inji", outcome: "works" });
    const input = { ...base, cells: [cell({ outcome: "works" })], gaps: [], baseline: [cell({ outcome: "works" }), deviceCell], failOnMissing: true };
    expect(evaluate(input).failures).toEqual([]);
    expect(evaluate({ ...input, requiredTiers: ["t3"] }).failures).toEqual([{ kind: "missing", key: "t3|*", cause: "no t3 results were produced" }]);
  });
});

describe("renderMarkdown", () => {
  it("says pass when nothing fails", () => {
    expect(renderMarkdown({ failures: [], known: [], resolved: [], expired: [] })).toContain("## Conformance gate: pass");
  });

  it("lists new failures before known gaps, with their cause", () => {
    const text = renderMarkdown({
      failures: [{ kind: "broken", key: "t1|tls-certificate|testnet-v4|demo|playground-demo|||", cause: "self-signed" }],
      known: [{ key: "k", cause: "c" }],
      resolved: [],
      expired: [],
    });
    expect(text).toContain("## Conformance gate: 1 failing");
    expect(text).toContain("self-signed");
    expect(text.indexOf("New failures")).toBeLessThan(text.indexOf("Known broken"));
  });

  it("keeps a multi-line cause on its list item", () => {
    const text = renderMarkdown({ failures: [{ kind: "unknown", key: "k", cause: 'unsupported\n{\n  "error": "invalid_request"\n}' }], known: [], resolved: [], expired: [] });
    expect(text).toContain('- `unknown` k: unsupported { "error": "invalid_request" }\n');
  });
});

describe("testnet-services.yaml", () => {
  const text = readFileSync(new URL("../testnet-services.yaml", import.meta.url), "utf8");

  it("names a network of networks.yaml, which every gap it lists is scoped to", () => {
    expect(listNetworks().map((n) => n.id)).toContain(readCastServices().network);
    for (const g of parseServiceGaps(text)) expect(g.network, g.id).toBe(readCastServices().network);
  });
});
