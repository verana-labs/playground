import { describe, expect, it } from "vitest";
import { cellKey, evaluate, matches, parseKnownIssues, renderMarkdown, type GateCell, type KnownIssue } from "./gate";

const cell = (overrides: Partial<GateCell>): GateCell => ({
  tier: "t1",
  check: "serving-version",
  network: "testnet-v3",
  cast: "demo",
  service: "demo-issuer-accredited",
  outcome: "broken",
  ...overrides,
});

const issue = (overrides: Partial<KnownIssue> = {}): KnownIssue => ({
  match: { tier: "t1", check: "serving-version", cast: "demo", service: ["demo-issuer-accredited", "playground-demo"] },
  cause: "demo cast not rolled to .49",
  expires: "2026-10-01",
  ...overrides,
});

const base = { today: "2026-09-17", baseline: null, requiredTiers: [], failOnMissing: false };

describe("parseKnownIssues", () => {
  it("reads a valid file and keeps unquoted dates as strings", () => {
    const issues = parseKnownIssues("issues:\n  - match: { tier: t1, check: serving-version, cast: demo }\n    cause: not rolled\n    expires: 2026-10-01\n");
    expect(issues).toHaveLength(1);
    expect(issues[0]?.match.cast).toBe("demo");
    expect(issues[0]?.expires).toBe("2026-10-01");
  });

  it("rejects an entry without tier and check", () => {
    expect(() => parseKnownIssues("issues:\n  - match: { cast: demo }\n    cause: too broad\n    expires: 2026-10-01\n")).toThrow();
  });

  it("rejects an unknown match field", () => {
    expect(() => parseKnownIssues("issues:\n  - match: { tier: t1, check: x, colour: red }\n    cause: typo\n    expires: 2026-10-01\n")).toThrow();
  });

  it("rejects an entry without an expiry", () => {
    expect(() => parseKnownIssues("issues:\n  - match: { tier: t1, check: x }\n    cause: forever\n")).toThrow();
  });
});

describe("matches", () => {
  it("matches listed values and ignores fields the issue does not name", () => {
    expect(matches(issue(), cell({}))).toBe(true);
    expect(matches(issue(), cell({ service: "playground-demo", wallet: "eudi" }))).toBe(true);
  });

  it("does not match another service, cast or check", () => {
    expect(matches(issue(), cell({ service: "demo-verifier-accredited" }))).toBe(false);
    expect(matches(issue(), cell({ cast: "vesta" }))).toBe(false);
    expect(matches(issue(), cell({ check: "tls-certificate" }))).toBe(false);
  });

  it("does not match a cell that lacks a field the issue names", () => {
    expect(matches(issue(), cell({ service: undefined }))).toBe(false);
  });
});

describe("evaluate", () => {
  it("turns a matched broken cell into a known issue", () => {
    const report = evaluate({ ...base, cells: [cell({})], issues: [issue()] });
    expect(report.failures).toEqual([]);
    expect(report.known).toEqual([{ key: cellKey(cell({})), cause: "demo cast not rolled to .49" }]);
  });

  it("fails on a broken or unknown cell no issue covers", () => {
    const report = evaluate({
      ...base,
      cells: [cell({ service: "demo-verifier-accredited" }), cell({ check: "did-resolves", outcome: "unknown", cause: "timeout" })],
      issues: [issue()],
    });
    expect(report.failures.map((f) => f.kind)).toEqual(["broken", "unknown"]);
    expect(report.failures[1]?.cause).toBe("timeout");
  });

  it("never fails on works, incompatible-by-design or not-testable", () => {
    const report = evaluate({
      ...base,
      cells: [cell({ outcome: "works" }), cell({ outcome: "incompatible-by-design", cause: "policy" }), cell({ outcome: "not-testable" })],
      issues: [],
    });
    expect(report.failures).toEqual([]);
  });

  it("stops covering a cell the day after the issue expires", () => {
    const report = evaluate({ ...base, today: "2026-10-02", cells: [cell({})], issues: [issue()] });
    expect(report.failures).toHaveLength(1);
    expect(report.expired).toHaveLength(1);
  });

  it("still covers a cell on the expiry day", () => {
    const report = evaluate({ ...base, today: "2026-10-01", cells: [cell({})], issues: [issue()] });
    expect(report.failures).toEqual([]);
  });

  it("lists active issues that matched nothing as resolved", () => {
    const report = evaluate({ ...base, cells: [cell({ outcome: "works" })], issues: [issue()] });
    expect(report.resolved).toHaveLength(1);
  });

  it("fails when a required tier produced no cells", () => {
    const report = evaluate({ ...base, requiredTiers: ["t1", "t2"], cells: [cell({ outcome: "works" })], issues: [] });
    expect(report.failures).toEqual([{ kind: "missing", key: "t2|*", cause: "no t2 results were produced" }]);
  });

  it("fails on cells that disappeared since the baseline only when asked to", () => {
    const gone = cell({ service: "playground-demo", outcome: "works" });
    const input = { ...base, cells: [cell({ outcome: "works" })], issues: [], baseline: [cell({ outcome: "works" }), gone] };
    expect(evaluate(input).failures).toEqual([]);
    expect(evaluate({ ...input, failOnMissing: true }).failures).toEqual([
      { kind: "missing", key: cellKey(gone), cause: "present in the baseline run, absent now" },
    ]);
  });
});

describe("renderMarkdown", () => {
  it("says pass when nothing fails", () => {
    expect(renderMarkdown({ failures: [], known: [], resolved: [], expired: [] })).toContain("## Conformance gate: pass");
  });

  it("lists new failures before known issues, with their cause", () => {
    const text = renderMarkdown({
      failures: [{ kind: "broken", key: "t1|tls-certificate|testnet-v3|ccm|camara|||", cause: "self-signed" }],
      known: [{ key: "k", cause: "c" }],
      resolved: [],
      expired: [],
    });
    expect(text).toContain("## Conformance gate: 1 failing");
    expect(text).toContain("self-signed");
    expect(text.indexOf("New failures")).toBeLessThan(text.indexOf("Known broken"));
  });
});
