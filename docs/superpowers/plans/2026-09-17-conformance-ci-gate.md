# Conformance CI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the conformance workflow a regression gate: tier 1 and tier 2 run in parallel on every relevant change and nightly, and a gate job fails only on new `broken` or `unknown` cells, cells missing since the last nightly, or a tier that produced nothing, with known failures committed in an expiring ledger.

**Architecture:** A pure, unit-tested module `conformance/lib/gate.ts` reads the tiers' `latest.json` files and `conformance/known-issues.yaml`, classifies every cell, renders a markdown report and sets the exit code. It runs directly under Node's type stripping (`node --experimental-strip-types lib/gate.ts`), so it only uses `import type` for local modules and imports packages (`zod`, `js-yaml`) by name. `.github/workflows/conformance.yml` becomes a `tier` matrix job (`t1`, `t2`) whose test steps never fail the job, plus a `gate` job that downloads both artifacts and the previous nightly's artifacts and runs the gate.

**Tech Stack:** TypeScript 5.7 strict, vitest 4, zod 4, js-yaml 4, Node 22 type stripping, GitHub Actions (`actions/download-artifact`, `gh run download`).

**Spec:** `docs/superpowers/specs/2026-09-17-conformance-ci-gate-design.md`. Existing reporting code this builds on: `conformance/lib/report.ts` (the `Cell` type and outcomes), `conformance/lib/results.ts` (the `latest.json` shape: an object with a `cells` array), `conformance/lib/global-setup.ts` (writes `results/<run id>/results.json` and `results/latest.json`).

## Global Constraints

- Work only in the git worktree you were started in, on branch `feat/conformance-ci-gate`. Never push, never open a PR, never run `gh` commands that write.
- Do not add or upgrade dependencies. Do not edit `package.json`, `package-lock.json`, `tsconfig.json` or `vitest.config.ts` in the root or in `conformance/`.
- TypeScript strict, never `any`, named exports, kebab-case files.
- Zero comments in code. No JSDoc, no section banners, no commented-out code.
- `lib/gate.ts` must stay runnable by Node type stripping: no `enum`, no `namespace`, no constructor parameter properties, and every import of a local file is `import type`.
- Conventional commits, subject only, lowercase after the colon, one commit per task.
- Commands run from `conformance/` unless marked `(root)`. Install once before Task 1: `npm ci` in `conformance/`.
- Do not run `npm run t1` or `npm run t2`: they need cluster credentials and create live sessions.
- The checks that must stay green after every task: `npm run typecheck` and `npm run test:lib` in `conformance/`.

---

### Task 1: Gate module

**Files:**
- Create: `conformance/lib/gate.ts`
- Test: `conformance/lib/gate.test.ts`

**Interfaces:**
- Consumes: `type Cell` from `conformance/lib/report.ts` (fields `tier`, `check`, `network`, `cast?`, `service?`, `wallet?`, `build?`, `scenario?`, `outcome`, `cause?`).
- Produces:
  - `type GateCell = Pick<Cell, "tier" | "check" | "network" | "cast" | "service" | "wallet" | "build" | "scenario" | "outcome" | "cause">`
  - `type KnownIssue` (zod-inferred: `{ match: { tier; check; network?; cast?; service?; wallet?; build?; scenario? }, cause: string, reference?: string, expires: string }`, each match value `string | string[]`)
  - `type Failure = { kind: "broken" | "unknown" | "missing"; key: string; cause?: string }`
  - `type GateReport = { failures: Failure[]; known: { key: string; cause: string }[]; resolved: KnownIssue[]; expired: KnownIssue[] }`
  - `type GateInput = { cells: GateCell[]; issues: KnownIssue[]; today: string; baseline: GateCell[] | null; requiredTiers: string[]; failOnMissing: boolean }`
  - `parseKnownIssues(text: string): KnownIssue[]`
  - `cellKey(cell: GateCell): string`
  - `matches(issue: KnownIssue, cell: GateCell): boolean`
  - `evaluate(input: GateInput): GateReport`
  - `renderMarkdown(report: GateReport): string`
  - CLI: `node --experimental-strip-types lib/gate.ts --issues <yaml> [--results <latest.json>]... [--baseline <latest.json>]... [--require-tier <tier>]... [--fail-on-missing] [--today YYYY-MM-DD]`, prints markdown to stdout, exit code 1 when `failures` is not empty.

- [ ] **Step 1: Write the failing test**

Create `conformance/lib/gate.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/gate.test.ts`
Expected: FAIL, the suite cannot import `./gate`.

- [ ] **Step 3: Write the implementation**

Create `conformance/lib/gate.ts`:

```ts
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import { z } from "zod";
import type { Cell } from "./report";

export type GateCell = Pick<Cell, "tier" | "check" | "network" | "cast" | "service" | "wallet" | "build" | "scenario" | "outcome" | "cause">;

const Selector = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]);

const KnownIssueSchema = z
  .object({
    match: z
      .object({
        tier: Selector,
        check: Selector,
        network: Selector.optional(),
        cast: Selector.optional(),
        service: Selector.optional(),
        wallet: Selector.optional(),
        build: Selector.optional(),
        scenario: Selector.optional(),
      })
      .strict(),
    cause: z.string().min(1),
    reference: z.url().optional(),
    expires: z.iso.date(),
  })
  .strict();

const KnownIssuesFileSchema = z.object({ issues: z.array(KnownIssueSchema) }).strict();

export type KnownIssue = z.infer<typeof KnownIssueSchema>;

export type Failure = { kind: "broken" | "unknown" | "missing"; key: string; cause?: string };

export type GateReport = {
  failures: Failure[];
  known: { key: string; cause: string }[];
  resolved: KnownIssue[];
  expired: KnownIssue[];
};

export type GateInput = {
  cells: GateCell[];
  issues: KnownIssue[];
  today: string;
  baseline: GateCell[] | null;
  requiredTiers: string[];
  failOnMissing: boolean;
};

const MATCH_FIELDS = ["tier", "check", "network", "cast", "service", "wallet", "build", "scenario"] as const;

export function parseKnownIssues(text: string): KnownIssue[] {
  return KnownIssuesFileSchema.parse(yaml.load(text, { schema: yaml.CORE_SCHEMA })).issues;
}

export function cellKey(cell: GateCell): string {
  return [cell.tier, cell.check, cell.network, cell.cast ?? "", cell.service ?? "", cell.wallet ?? "", cell.build ?? "", cell.scenario ?? ""].join("|");
}

export function matches(issue: KnownIssue, cell: GateCell): boolean {
  return MATCH_FIELDS.every((field) => {
    const wanted = issue.match[field];
    if (wanted === undefined) return true;
    const actual = cell[field];
    if (actual === undefined) return false;
    return Array.isArray(wanted) ? wanted.includes(actual) : wanted === actual;
  });
}

export function evaluate(input: GateInput): GateReport {
  const active = input.issues.filter((i) => i.expires >= input.today);
  const expired = input.issues.filter((i) => i.expires < input.today);
  const used = new Set<KnownIssue>();
  const failures: Failure[] = [];
  const known: GateReport["known"] = [];

  for (const cell of input.cells) {
    if (cell.outcome !== "broken" && cell.outcome !== "unknown") continue;
    const issue = active.find((i) => matches(i, cell));
    if (issue) {
      used.add(issue);
      known.push({ key: cellKey(cell), cause: issue.cause });
    } else {
      failures.push({ kind: cell.outcome, key: cellKey(cell), cause: cell.cause });
    }
  }

  for (const tier of input.requiredTiers) {
    if (!input.cells.some((c) => c.tier === tier)) failures.push({ kind: "missing", key: `${tier}|*`, cause: `no ${tier} results were produced` });
  }

  if (input.baseline && input.failOnMissing) {
    const current = new Set(input.cells.map(cellKey));
    for (const key of new Set(input.baseline.map(cellKey))) {
      if (!current.has(key)) failures.push({ kind: "missing", key, cause: "present in the baseline run, absent now" });
    }
  }

  return { failures, known, resolved: active.filter((i) => !used.has(i)), expired };
}

export function renderMarkdown(report: GateReport): string {
  const verdict = report.failures.length === 0 ? "pass" : `${report.failures.length} failing`;
  const lines = [`## Conformance gate: ${verdict}`, ""];
  const section = (title: string, rows: string[]): void => {
    if (rows.length > 0) lines.push(`### ${title} (${rows.length})`, "", ...rows, "");
  };
  section("New failures", report.failures.map((f) => `- \`${f.kind}\` ${f.key}${f.cause ? `: ${f.cause}` : ""}`));
  section("Expired known issues", report.expired.map((i) => `- ${i.cause} (expired ${i.expires})`));
  section("Known issues no longer seen, remove them from known-issues.yaml", report.resolved.map((i) => `- ${i.cause}`));
  section("Known broken", report.known.map((k) => `- ${k.key}: ${k.cause}`));
  return `${lines.join("\n")}\n`;
}

function readCells(files: string[]): GateCell[] {
  return files.flatMap((file) => (JSON.parse(readFileSync(file, "utf8")) as { cells: GateCell[] }).cells);
}

function main(): void {
  const { values } = parseArgs({
    options: {
      issues: { type: "string" },
      results: { type: "string", multiple: true },
      baseline: { type: "string", multiple: true },
      "require-tier": { type: "string", multiple: true },
      "fail-on-missing": { type: "boolean" },
      today: { type: "string" },
    },
  });
  if (!values.issues) throw new Error("--issues is required");
  const baselineFiles = values.baseline ?? [];
  const report = evaluate({
    cells: readCells(values.results ?? []),
    issues: parseKnownIssues(readFileSync(values.issues, "utf8")),
    today: values.today ?? new Date().toISOString().slice(0, 10),
    baseline: baselineFiles.length > 0 ? readCells(baselineFiles) : null,
    requiredTiers: values["require-tier"] ?? [],
    failOnMissing: values["fail-on-missing"] ?? false,
  });
  process.stdout.write(renderMarkdown(report));
  process.exitCode = report.failures.length > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
```

- [ ] **Step 4: Run the tests and the typecheck**

Run: `npx vitest run lib/gate.test.ts && npm run typecheck && npm run test:lib`
Expected: every `lib/gate.test.ts` test passes, typecheck prints no error, `test:lib` passes.

If `z.iso.date()` or `z.url()` do not exist in the installed zod (check `node_modules/zod/package.json` is 4.x), stop and report instead of rewriting the schema.

- [ ] **Step 5: Check the CLI runs under Node type stripping**

Run:
```bash
printf 'issues: []\n' > /tmp/gate-empty.yaml
printf '{"cells":[{"tier":"t1","check":"x","network":"testnet-v3","outcome":"works"}]}' > /tmp/gate-works.json
node --experimental-strip-types lib/gate.ts --issues /tmp/gate-empty.yaml --results /tmp/gate-works.json --require-tier t1; echo "exit=$?"
node --experimental-strip-types lib/gate.ts --issues /tmp/gate-empty.yaml --results /tmp/gate-works.json --require-tier t2; echo "exit=$?"
```
Expected: the first prints `## Conformance gate: pass` and `exit=0`. The second prints `## Conformance gate: 1 failing`, a `missing` line for `t2|*`, and `exit=1`. An `ExperimentalWarning` on stderr is fine.

- [ ] **Step 6: Commit**

```bash
git add conformance/lib/gate.ts conformance/lib/gate.test.ts
git commit -m "feat: add a conformance gate that fails only on new breaks"
```

---

### Task 2: Seed the known issues from the last nightly

**Files:**
- Create: `conformance/known-issues.yaml`
- Modify: `conformance/lib/gate.test.ts` (append one test)

**Interfaces:**
- Consumes: `parseKnownIssues`, `evaluate`, and the CLI from Task 1.
- Produces: `conformance/known-issues.yaml`, read by the gate job in Task 3 with `--issues known-issues.yaml`.

- [ ] **Step 1: Write the failing test**

Append to `conformance/lib/gate.test.ts`, and add `import { readFileSync } from "node:fs";` as the first import line:

```ts
describe("known-issues.yaml", () => {
  it("parses, and every entry names a cause and an expiry", () => {
    const issues = parseKnownIssues(readFileSync(new URL("../known-issues.yaml", import.meta.url), "utf8"));
    expect(issues.length).toBeGreaterThan(0);
    for (const i of issues) expect(i.expires >= "2026-09-17").toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/gate.test.ts -t "known-issues.yaml"`
Expected: FAIL with `ENOENT` for `known-issues.yaml`.

- [ ] **Step 3: Create the ledger**

Create `conformance/known-issues.yaml` with exactly this content:

```yaml
issues:
  - match:
      tier: t1
      check: ["as-discovery:oauth-authorization-server", did-resolves, metadata-both-shapes, metadata-parses, no-cleartext, serving-version, "strings:ecs-claims", "strings:issuer-metadata", tls-certificate, webvh-log-signed]
      cast: ccm
    cause: the ccm cast has never been deployed (no StatefulSet, no wildcard DNS record or certificate)
    expires: 2026-10-01

  - match:
      tier: t1
      check: serving-version
      cast: demo
      service: [demo-issuer-accredited, demo-issuer-unaccredited, demo-issuer-untrusted, demo-untrusted, demo-verifier-accredited, demo-verifier-unaccredited, demo-verifier-untrusted, playground-demo]
    cause: demo serves uiprofile .42/.43/.45 while its template pins .49; the demo workflows were not re-dispatched
    expires: 2026-10-01

  - match:
      tier: t1
      check: serving-version
      cast: bhi
      service: [caledonian, cirrus, halcyon, institute, jobsearch, meridian-tech, orchestrating-identity, tvs]
    cause: bhi serves uiprofile .35 while its template pins .41
    expires: 2026-10-01

  - match:
      tier: t1
      check: serving-version
      cast: bolivia
      service: [banco-union, impuestos, prestamista, segip, seprec]
    cause: bolivia serves uiprofile .31/.39 while its template pins .41
    expires: 2026-10-01

  - match:
      tier: t1
      check: serving-version
      cast: cexa
      service: [borealis, darkpool, novara]
    cause: cexa serves uiprofile .31 while the per-org config.env pins .39
    expires: 2026-10-01

  - match:
      tier: t1
      check: serving-version
      cast: verandia
      service: [business-registry, civil-registry, meridian-bank, quickcash, tax-buro]
    cause: verandia serves uiprofile .31/.39 while its template pins .41
    expires: 2026-10-01

  - match:
      tier: t1
      check: serving-version
      cast: vesta
      service: [helvetia-trust, iso-certification, normacert, umbra, vesta, vesta-iberia, vesta-nordics, vesta-portal, vesta-repair-network, zenith]
    cause: vesta serves uiprofile .31 while its template pins .41 (.39 for vesta-portal and vesta-repair-network)
    expires: 2026-10-01

  - match:
      tier: t1
      check: metadata-both-shapes
      cast: [bhi, bolivia, cexa, verandia, vesta]
      service: [caledonian, cirrus, northbank, segip, seprec, aurum, novara, business-registry, civil-registry, umbra, vesta, zenith]
    cause: images up to .41 publish no display or claims on the credential configuration itself
    expires: 2026-10-01

  - match:
      tier: t1
      check: webvh-log-signed
      cast: [demo, vesta]
      service: [demo-untrusted, playground-demo, helvetia-trust, iso-certification, normacert, umbra, vesta, vesta-iberia, vesta-nordics, vesta-portal, vesta-repair-network, zenith]
    cause: did:webvh logs created before the 2026-08-03 fix; only reset_identity repairs them
    expires: 2026-10-01

  - match:
      tier: t1
      check: short-link-browser
      cast: [demo, eventos]
      service: [demo-issuer-accredited, demo-issuer-unaccredited, taquilla]
    cause: the short link answers 502 to a browser Accept header
    expires: 2026-10-01

  - match:
      tier: t1
      check: "strings:invitation-label"
      cast: eventos
      service: [evento-costa-rica, evento-guatemala, evento-panama]
    cause: "*-00_core.yml sets didcommLabel with yq env(), which parses a name containing ': ' as a map; it needs strenv()"
    expires: 2026-10-01

  - match:
      tier: t1
      check: "strings:invitation-label"
      cast: demo
      service: [demo-issuer-untrusted, demo-verifier-untrusted]
    cause: the untrusted demo services answer with a plain invitation page that has no label to read
    expires: 2026-10-01

  - match:
      tier: t1
      check: ["link:issue", "link:present"]
      cast: demo
      service: demo-untrusted
      wallet: hologram
    cause: DIDComm connection scenarios have no tier 2 coverage yet
    expires: 2026-10-01

  - match:
      tier: t1
      check: "strings:ecs-claims"
      cast: bhi
      service: jobsearch
    cause: the resolver holds no ECS credentials for bhi/jobsearch
    expires: 2026-10-01

  - match:
      tier: t2
      check: resolver-production-flag
    cause: the resolver reports production true for demo DIDs while networks.yaml marks testnet as not production; to raise with the team
    expires: 2026-09-30
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/gate.test.ts && npm run typecheck`
Expected: all tests pass, including `known-issues.yaml`.

- [ ] **Step 5: Prove the ledger covers the last nightly exactly**

Run from `conformance/`:
```bash
mkdir -p /tmp/nightly && gh run download 35178512507 --repo verana-labs/playground --dir /tmp/nightly
node --experimental-strip-types lib/gate.ts --issues known-issues.yaml --today 2026-09-17 --results "$(find /tmp/nightly -name latest.json | head -1)"; echo "exit=$?"
```
Expected: `## Conformance gate: pass`, a `Known broken (92)` section, one resolved entry (the tier 2 `resolver-production-flag`, because that nightly has no tier 2 cells) and `exit=0`.

If it prints any `New failures`, add the uncovered cell to the matching entry above (same cause) or report the cell; never widen an entry by dropping its `service` list.

- [ ] **Step 6: Commit**

```bash
git add conformance/known-issues.yaml conformance/lib/gate.test.ts
git commit -m "feat: seed conformance known issues from the 17 september nightly"
```

---

### Task 3: Workflows

**Files:**
- Modify: `.github/workflows/conformance.yml` (replace the whole file)
- Modify: `.github/workflows/ci.yml:31-60` (delete the `conformance-t1` job)

**Interfaces:**
- Consumes: the CLI from Task 1, `conformance/known-issues.yaml` from Task 2, `npm run t1`, `npm run t2`, `npm run summary` from `conformance/package.json`.
- Produces: artifacts named `conformance-t1-<run id>-<attempt>` and `conformance-t2-<run id>-<attempt>`, each holding `conformance/results/` (with `latest.json` at its root); a `gate` job whose result is the workflow's verdict.

- [ ] **Step 1: Replace `.github/workflows/conformance.yml`**

Write exactly:

```yaml
name: conformance
on:
  schedule:
    - cron: "17 3 * * *"
  workflow_dispatch:
    inputs:
      network:
        description: "network id from conformance/networks.yaml (empty = every testable network)"
        default: ""
      casts:
        description: "casts that receive live mints"
        default: "demo,eventos"
  push:
    branches: [main]
    paths:
      - "conformance/**"
      - "personal-wallets.yaml"
      - "app/lib/wallet-profiles.ts"
      - ".github/workflows/conformance.yml"
  pull_request:
    paths:
      - "conformance/**"
      - "personal-wallets.yaml"
      - "app/lib/wallet-profiles.ts"
      - ".github/workflows/conformance.yml"

permissions:
  contents: read
  actions: read

concurrency:
  group: conformance-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  tier:
    if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: 45
    strategy:
      fail-fast: false
      matrix:
        tier: [t1, t2]
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: |
            package-lock.json
            conformance/package-lock.json
      - name: Set up kubeconfig
        run: |
          mkdir -p ~/.kube
          cat > ~/.kube/config <<'KUBEEOF'
          ${{ secrets.KUBECONFIG_VERANA_DEV }}
          KUBEEOF
          chmod 600 ~/.kube/config
      - run: npm ci
      - run: npm ci
        working-directory: conformance
      - run: npm run ${{ matrix.tier }}
        working-directory: conformance
        continue-on-error: true
        env:
          CONFORMANCE_RUN_ID: ${{ github.run_id }}-${{ github.run_attempt }}-${{ matrix.tier }}
          CONFORMANCE_NETWORK: ${{ inputs.network }}
          CONFORMANCE_CASTS: ${{ inputs.casts || 'demo,eventos' }}
          CONFORMANCE_MINTS: "1"
          CONFORMANCE_K8S_NAMESPACE: ${{ secrets.K8S_NAMESPACE }}
      - if: always()
        run: npm run summary >> "$GITHUB_STEP_SUMMARY"
        working-directory: conformance
      - if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: conformance-${{ matrix.tier }}-${{ github.run_id }}-${{ github.run_attempt }}
          path: conformance/results/
          retention-days: 90

  gate:
    needs: tier
    if: always() && (github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository)
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: conformance/package-lock.json
      - run: npm ci
        working-directory: conformance
      - uses: actions/download-artifact@d3f86a106a0bac45b974a628896c90dbdf5c8093 # v4.3.0
        with:
          pattern: conformance-t*-${{ github.run_id }}-${{ github.run_attempt }}
          path: current
      - name: Download the previous nightly as baseline
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          previous=$(gh run list --repo "$GITHUB_REPOSITORY" --workflow conformance.yml --branch main --event schedule --status completed --limit 5 --json databaseId --jq '.[].databaseId' | grep -vx "$GITHUB_RUN_ID" | head -1 || true)
          if [ -n "$previous" ]; then
            gh run download "$previous" --repo "$GITHUB_REPOSITORY" --pattern 'conformance-t*' --dir baseline || echo "run $previous has no tier artifacts"
          fi
      - name: Gate
        working-directory: conformance
        run: |
          args=(--issues known-issues.yaml --require-tier t1 --require-tier t2)
          while IFS= read -r f; do args+=(--results "$f"); done < <(find ../current -name latest.json)
          while IFS= read -r f; do args+=(--baseline "$f"); done < <(find ../baseline -name latest.json 2> /dev/null)
          if [ "${{ github.event_name }}" = "schedule" ]; then args+=(--fail-on-missing); fi
          node --experimental-strip-types lib/gate.ts "${args[@]}" | tee -a "$GITHUB_STEP_SUMMARY"
          exit "${PIPESTATUS[0]}"
```

- [ ] **Step 2: Delete the `conformance-t1` job from `.github/workflows/ci.yml`**

Remove lines 31 to 60 (from `  conformance-t1:` to the end of the file) and the blank line before them, so the file ends with the `ci` job's last step:

```yaml
      - run: npm run test:lib
        working-directory: conformance
```

- [ ] **Step 3: Validate both workflows parse and reference real things**

Run from `conformance/`:
```bash
node -e 'const y=require("js-yaml");for(const f of ["../.github/workflows/conformance.yml","../.github/workflows/ci.yml"]){const d=y.load(require("fs").readFileSync(f,"utf8"));console.log(f,Object.keys(d.jobs).join(","))}'
grep -c "conformance-t1" ../.github/workflows/ci.yml
```
Expected: `../.github/workflows/conformance.yml tier,gate`, `../.github/workflows/ci.yml ci`, and `0`.

If `actionlint` is installed (`command -v actionlint`), also run `actionlint ../.github/workflows/conformance.yml ../.github/workflows/ci.yml` and expect no output. Do not install it.

- [ ] **Step 4: Rehearse the gate step locally**

Run from `conformance/`:
```bash
rm -rf ../current ../baseline && mkdir -p ../current/conformance-t1-1-1 && cp "$(find /tmp/nightly -name latest.json | head -1)" ../current/conformance-t1-1-1/latest.json
args=(--issues known-issues.yaml --require-tier t1 --require-tier t2 --today 2026-09-17)
while IFS= read -r f; do args+=(--results "$f"); done < <(find ../current -name latest.json)
node --experimental-strip-types lib/gate.ts "${args[@]}"; echo "exit=$?"
rm -rf ../current
```
Expected: `## Conformance gate: 1 failing`, one `missing` failure `t2|*` (no tier 2 results in that nightly), `exit=1`. This is the correct verdict for a run where tier 2 produced nothing.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/conformance.yml .github/workflows/ci.yml
git commit -m "ci: run conformance tiers in parallel behind a known-issues gate"
```

---

### Task 4: Document the gate

**Files:**
- Modify: `conformance/README.md`

- [ ] **Step 1: Fix the stale lines at the top**

Replace the `tier1/` bullet with:

```markdown
- `tier1/` contract checks: what a wallet fetches, asserted without running a wallet.
```

Replace the `tier2/` bullet's second sentence `Nightly only, behind \`CONFORMANCE_MINTS=1\`.` with `Behind \`CONFORMANCE_MINTS=1\`.`

In the `## Tier 2` section, replace `` `npm run t2` (nightly only, `CONFORMANCE_MINTS=1`) `` with `` `npm run t2` (`CONFORMANCE_MINTS=1`) ``.

- [ ] **Step 2: Add a section after `## Reading a run`**

Insert before `## Tier 2`:

```markdown
## Gate

CI never trusts a tier's exit code. `.github/workflows/conformance.yml` runs tier 1 and tier 2 in parallel on the
nightly schedule, on dispatch, on push to `main` and on same-repository pull requests that touch conformance, the
wallet list or the profile schema. The `gate` job then merges their `latest.json` files and runs:

    node --experimental-strip-types lib/gate.ts --issues known-issues.yaml --results <latest.json>... --require-tier t1 --require-tier t2

It fails on a `broken` or `unknown` cell that no active entry in `known-issues.yaml` covers, on a required tier with
no cells, and, on the nightly only, on a cell that existed in the previous nightly and is gone. An entry names the
cells it covers (`tier` and `check` required, then `network`, `cast`, `service`, `wallet`, `build`, `scenario`, each a
value or a list), a `cause` and an `expires` date; after that date its cells fail again. The gate lists entries that
matched nothing so they can be deleted. Add an entry only for a failure that is understood and has an owner; never
widen an entry to silence a new cell.
```

- [ ] **Step 3: Check nothing else broke**

Run: `npm run typecheck && npm run test:lib`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add conformance/README.md
git commit -m "docs: explain the conformance gate and known issues"
```

---

## After merge (not for the executor)

- The first push to `main` runs tier 2 for real for the first time. Expect new failures in the gate; triage each into a fix, a PR B task or a known-issues entry.
- Measure tier 2's duration from that run before deciding whether it stays on every push or only on PRs and nightly.
- `K8S_NAMESPACE` is a secret, so every occurrence of the namespace is masked in logs; moving it to a repository variable needs admin rights.
