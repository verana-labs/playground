# Tier 1 Contract Checks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Assert, on every change and without running a wallet, everything a wallet fetches from the deployed services: metadata shape under every draft the fleet speaks, authorization-server discovery, offer and request link shape, DID resolvability, transport, string encoding, and the vs-agent version actually serving. Every check writes a machine-readable, diffable cell that names what it tested, even when the check itself blows up.

**Architecture:** Vitest suites under `conformance/tier1/` iterate the deployed services (derived from the cast workflow configs) and the wallet profiles (plan A). Shared clients live in `conformance/lib/`. Every check body runs inside `check()`, which records exactly one `Cell` per (check, service, wallet, build, scenario) into a per-worker `cells-<worker>.jsonl`; the vitest global teardown concatenates them into `results/<run>/results.json` and `results/latest.json` with the run identity (git sha, network, resolver version, per-service pinned and serving tags). Read-only checks run on every PR and push; checks that mint live sessions run nightly and on dispatch, where cluster credentials also enable the serving-version and roll-detection checks.

**Tech Stack:** TypeScript 5.7 strict, vitest 4 (node environment), zod 4, js-yaml 4, `@openid4vc/openid4vci` 0.5.5 (the wallets' own metadata schema for drafts 14 and later), Node 22 `fetch` and `node:tls`, `kubectl` in the nightly job only.

**Spec:** `../../../verana-spec-conformance/playground/guidelines/wallet-conformance-testing.md` (PR verana-labs/verana-spec#92) sections 4 [CONF-T1], 7 [CONF-OUT], 8 [CONF-NET], 9 [CONF-OPS]. Verified endpoint facts and link shapes: `2026-09-14-conformance-roadmap.md`. Requires plan A merged (profiles, `conformance/` package, `lib/network.ts`).

## Global Constraints

- Work in the worktree `playground-eventos`, on branch `feat/wallet-matrix-store-builds` after plan A or on `feat/conformance-tier1` from it. Never touch the sibling `playground` checkout.
- TypeScript strict, never `any`, named exports, kebab-case files, zero comments (one line only for a hidden constraint, invariant, upstream workaround or surprising platform behaviour).
- Conventional commits, subject only, lowercase after the colon. Commit after every task.
- Every check body runs inside `check(base, body)` from `lib/report.ts`. It records one cell with one of `works`, `broken`, `incompatible-by-design`, `unknown`, `not-testable` [CONF-OUT-1]; a body that throws records `unknown` with the error as cause and still fails the test. A check with no cell is a defect.
- Nothing wallet-specific is hard-coded: rails, schemes, drafts, mint parameters and incompatibilities come from `listWalletProfiles()` [CONF-PROF-1].
- Nothing network-specific is hard-coded: resolver, playground and cast token come from `testableNetworks()` [CONF-NET-1]. Every suite registers through `describeNetworks()`, which records `not-testable` when no testable network is selected [CONF-NET-3].
- Mint parameters follow the site API as verified live: `signer=x5c` selects an `x509_hash` client id; no signer selects the service's DID (`decentralized_identifier:did:webvh:…` on the DCQL rail, `did:web:…` with `client_id_scheme=did` on the Presentation Exchange rail); `query=pe` selects `presentation_definition`.
- Checks that create sessions on the services (offer links, short-link redirect, invitation labels) run only when `CONFORMANCE_MINTS=1`. The per-change CI job leaves it unset; the nightly job sets it. Scope of mints defaults to the `demo` and `eventos` casts (`CONFORMANCE_CASTS`).
- All commands below run from `conformance/` unless prefixed with `(root)`.
- The root checks `npm run lint && npm run typecheck && npm run validate:registry && npx vitest run && npm run build` stay green.
- Unicode in regular expressions is written with `String.fromCodePoint`, never `\u` escapes, because the tooling that copies this plan into files rewrites those escapes.

---

### Task 1: Reporting core

**Files:**
- Create: `conformance/lib/report.ts`, `conformance/lib/results.ts`, `conformance/lib/results.test.ts`, `conformance/lib/global-setup.ts`, `conformance/lib/suite.ts`
- Modify: `conformance/vitest.config.ts`

**Interfaces:**
- Produces:
  - `type Outcome = "works" | "broken" | "incompatible-by-design" | "unknown" | "not-testable"`
  - `type Cell = { tier: "t1" | "t2" | "t3"; check: string; clause: string; network: string; cast?: string; service?: string; wallet?: string; build?: string; scenario?: string; outcome: Outcome; cause?: string; reference?: string; evidence?: Record<string, unknown> }`
  - `type CellBase = Omit<Cell, "outcome" | "cause" | "reference" | "evidence">`
  - `type Verdict = { outcome: Outcome; cause?: string; reference?: string; evidence?: Record<string, unknown> }`
  - `record(cell: Cell): void` appends to `<runDir>/cells-<pid>-<threadId>.jsonl`
  - `check(base: CellBase, body: () => Promise<Verdict>): Promise<void>` records the verdict; throws when the outcome is `broken`; on an exception records `unknown` with the message and rethrows
  - `type RunHeader = { id; startedAt; gitSha; gitBranch; networks: string[] }`
  - `type Results = RunHeader & { finishedAt: string; totals: Record<Outcome, number>; services: ServiceIdentity[]; cells: Cell[] }`
  - `buildResults(header, cellsJsonl, finishedAt): Results`
  - `type ServiceIdentity = { network; cast; id; host; pinnedTag; servingTag: string | null; packageVersion: string | null }` lifted from cells whose `check === "serving-version"`
  - `describeNetworks(title: string, body: (network: Network) => void): void` registers one `describe` per testable network, or a single test recording `not-testable` per untestable selected network when none is testable

- [ ] **Step 1: Write the failing results test**

Create `conformance/lib/results.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/results.test.ts`
Expected: FAIL with "Cannot find module './results'".

- [ ] **Step 3: Write the cell types, the collector and the check wrapper**

Create `conformance/lib/report.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { threadId } from "node:worker_threads";
import { inject } from "vitest";
import { z } from "zod";

export const OUTCOMES = ["works", "broken", "incompatible-by-design", "unknown", "not-testable"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const CellSchema = z.object({
  tier: z.enum(["t1", "t2", "t3"]),
  check: z.string().min(1),
  clause: z.string().regex(/^(CONF|PW)-[A-Z0-9-]+$/),
  network: z.string().min(1),
  cast: z.string().optional(),
  service: z.string().optional(),
  wallet: z.string().optional(),
  build: z.string().optional(),
  scenario: z.string().optional(),
  outcome: z.enum(OUTCOMES),
  cause: z.string().optional(),
  reference: z.string().optional(),
  evidence: z.record(z.string(), z.unknown()).optional(),
});
export type Cell = z.infer<typeof CellSchema>;
export type CellBase = Omit<Cell, "outcome" | "cause" | "reference" | "evidence">;
export type Verdict = Pick<Cell, "outcome" | "cause" | "reference" | "evidence">;

declare module "vitest" {
  export interface ProvidedContext {
    runDir: string;
  }
}

export function record(cell: Cell): void {
  const checked = CellSchema.parse(cell);
  fs.appendFileSync(path.join(inject("runDir"), `cells-${process.pid}-${threadId}.jsonl`), `${JSON.stringify(checked)}\n`);
}

export class CheckFailed extends Error {}

export async function check(base: CellBase, body: () => Promise<Verdict>): Promise<void> {
  let verdict: Verdict;
  try {
    verdict = await body();
  } catch (e) {
    const cause = e instanceof Error ? e.message : String(e);
    record({ ...base, outcome: "unknown", cause: `check could not complete: ${cause}` });
    throw e;
  }
  record({ ...base, ...verdict });
  if (verdict.outcome === "broken") throw new CheckFailed(`${base.check} ${base.service ?? ""} ${base.wallet ?? ""}: ${verdict.cause ?? "broken"}`);
}
```

Create `conformance/lib/results.ts`:

```ts
import { z } from "zod";
import { CellSchema, OUTCOMES, type Cell, type Outcome } from "./report";

export type RunHeader = {
  id: string;
  startedAt: string;
  gitSha: string;
  gitBranch: string;
  networks: string[];
};

export type ServiceIdentity = {
  network: string;
  cast: string;
  id: string;
  host: string;
  pinnedTag: string;
  servingTag: string | null;
  packageVersion: string | null;
};

export type Results = RunHeader & {
  finishedAt: string;
  totals: Record<Outcome, number>;
  services: ServiceIdentity[];
  cells: Cell[];
};

const IdentityEvidenceSchema = z.looseObject({
  host: z.string(),
  pinnedTag: z.string(),
  servingTag: z.string().nullable(),
  packageVersion: z.string().nullable(),
});

const cellKey = (c: Cell): string =>
  [c.tier, c.check, c.network, c.cast ?? "", c.service ?? "", c.wallet ?? "", c.build ?? "", c.scenario ?? ""].join("|");

const byCodePoint = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

export function parseCells(cellsJsonl: string): Cell[] {
  return cellsJsonl
    .split("\n")
    .filter((l) => l.trim())
    .map((line, i) => {
      const parsed = CellSchema.safeParse(JSON.parse(line));
      if (!parsed.success) throw new Error(`cell ${i + 1} is malformed: ${parsed.error.message}`);
      return parsed.data;
    });
}

export function buildResults(header: RunHeader, cellsJsonl: string, finishedAt: string): Results {
  const cells = parseCells(cellsJsonl).sort((a, b) => byCodePoint(cellKey(a), cellKey(b)));
  const totals = Object.fromEntries(OUTCOMES.map((o) => [o, 0])) as Record<Outcome, number>;
  for (const c of cells) totals[c.outcome] += 1;
  const services = cells
    .filter((c) => c.check === "serving-version" && c.cast && c.service)
    .map((c) => {
      const e = IdentityEvidenceSchema.parse(c.evidence);
      return { network: c.network, cast: c.cast as string, id: c.service as string, host: e.host, pinnedTag: e.pinnedTag, servingTag: e.servingTag, packageVersion: e.packageVersion };
    });
  return { ...header, finishedAt, totals, services, cells };
}
```

Create `conformance/lib/global-setup.ts`:

```ts
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";
import { selectedNetworks } from "./network";
import { buildResults, type RunHeader } from "./results";

const RESULTS_DIR = fileURLToPath(new URL("../results/", import.meta.url));

const git = (...args: string[]): string => execFileSync("git", args, { encoding: "utf8" }).trim();

export function collectCells(runDir: string): string {
  return fs
    .readdirSync(runDir)
    .filter((f) => f.startsWith("cells-") && f.endsWith(".jsonl"))
    .sort()
    .map((f) => fs.readFileSync(path.join(runDir, f), "utf8"))
    .join("");
}

export default function setup(project: TestProject): () => void {
  const id = process.env.CONFORMANCE_RUN_ID ?? new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(RESULTS_DIR, id);
  fs.mkdirSync(runDir, { recursive: true });
  const header: RunHeader = {
    id,
    startedAt: new Date().toISOString(),
    gitSha: git("rev-parse", "HEAD"),
    gitBranch: git("rev-parse", "--abbrev-ref", "HEAD"),
    networks: selectedNetworks().map((n) => n.id),
  };
  fs.writeFileSync(path.join(runDir, "run.json"), `${JSON.stringify(header, null, 2)}\n`);
  project.provide("runDir", runDir);
  return () => {
    const results = buildResults(header, collectCells(runDir), new Date().toISOString());
    const json = `${JSON.stringify(results, null, 2)}\n`;
    fs.writeFileSync(path.join(runDir, "results.json"), json);
    fs.writeFileSync(path.join(RESULTS_DIR, "latest.json"), json);
  };
}
```

Create `conformance/lib/suite.ts`:

```ts
import { describe, it } from "vitest";
import { testableNetworks, untestableNetworks, type Network } from "./network";
import { record } from "./report";

export function describeNetworks(title: string, body: (network: Network) => void): void {
  const testable = testableNetworks();
  if (testable.length === 0) {
    describe(title, () => {
      it("no selected network is testable", () => {
        for (const network of untestableNetworks())
          record({ tier: "t1", check: title, clause: "CONF-NET-3", network: network.id, outcome: "not-testable", cause: network.reason });
      });
    });
    return;
  }
  for (const network of testable) describe(`${network.id} ${title}`, () => body(network));
}
```

Update `conformance/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "results/**"],
    globalSetup: ["./lib/global-setup.ts"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `npx vitest run && npm run typecheck && ls results/ && head -20 results/latest.json`
Expected: PASS (network tests and 3 results tests); `results/latest.json` exists with `totals` all zero and `cells: []`.

- [ ] **Step 5: Commit**

```bash
git add lib/report.ts lib/results.ts lib/results.test.ts lib/global-setup.ts lib/suite.ts vitest.config.ts
git commit -m "feat: conformance result cells, run identity and merged results"
```

---

### Task 2: Deployed services from the cast configs

**Files:**
- Create: `conformance/lib/cast-services.ts`, `conformance/lib/cast-services.test.ts`

**Interfaces:**
- Consumes: `Network` from `lib/network.ts`.
- Produces:
  - `type CastService = { cast; org; id; host; pinnedTag; oid4vcRole: "issuer" | "verifier" | null; demoPerm: "issuer" | "verifier" | "none" | null; issuerId: string | null; configPath: string }`
  - `listCastServices(network: Network, workflowsDir?: string): CastService[]`
  - `scopedCasts(): string[]` (from `CONFORMANCE_CASTS`, default `["demo", "eventos"]`), `inScope(service): boolean`
  - `issuerMetadataUrls(service): string[]` (bare alias first, then `/oid4vci/<issuerId>/…`)
- `issuerId` comes from the org's own template: `OID4VC_ROLE=issuer` reads `oid4vc/issuer.json.tpl`, `OID4VC_ROLE=issuer-taquilla` reads `oid4vc/issuer-taquilla.json.tpl`. Casts with several issuers (bolivia, cexa, bhi, verandia) have one template per role value.

- [ ] **Step 1: Write the failing tests**

Create `conformance/lib/cast-services.test.ts`:

```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { inScope, issuerMetadataUrls, listCastServices, scopedCasts } from "./cast-services";
import { listNetworks } from "./network";

const testnet = listNetworks().find((n) => n.id === "testnet-v3")!;

function fixture(dir: string): void {
  const cast = path.join(dir, "demo");
  for (const org of ["a", "b", "c", "d"]) fs.mkdirSync(path.join(cast, "orgs", org), { recursive: true });
  fs.mkdirSync(path.join(cast, "oid4vc"), { recursive: true });
  fs.writeFileSync(path.join(cast, "deployment.template.yaml"), "chartVersion: v1.0\nimage:\n  repository: veranalabs/vs-agent\n  tag: v1.0\n");
  fs.writeFileSync(path.join(cast, "orgs", "a", "config.env"), 'RELEASE_NAME="a"\nINGRESS_HOST="a.playground.__NETWORK__.verana.network"\nOID4VC_ROLE="issuer"\nDEMO_PERM="issuer"\nVS_AGENT_IMAGE_TAG="v0.9"\n');
  fs.writeFileSync(path.join(cast, "orgs", "b", "config.env"), 'RELEASE_NAME="b"\nINGRESS_HOST="b.playground.__NETWORK__.verana.network"\nOID4VC_ROLE="verifier"\n');
  fs.writeFileSync(path.join(cast, "orgs", "c", "config.env"), 'RELEASE_NAME="c"\nINGRESS_HOST="c.playground.__NETWORK__.verana.network"\nOID4VC_ROLE="issuer-c"\n');
  fs.writeFileSync(path.join(cast, "orgs", "d", "config.env"), 'RELEASE_NAME="d"\nINGRESS_HOST="d.playground.__NETWORK__.verana.network"\nOID4VC_ROLE="verifier-overasking"\n');
  fs.writeFileSync(path.join(cast, "oid4vc", "issuer.json.tpl"), '{\n  "issuer": {\n    "id": "demo-did",\n    "displayName": "__SERVICE_NAME__"\n  }\n}\n');
  fs.writeFileSync(path.join(cast, "oid4vc", "issuer-c.json.tpl"), '{\n  "issuer": {\n    "id": "c-did"\n  }\n}\n');
  fs.mkdirSync(path.join(dir, "wwwallet"), { recursive: true });
  fs.writeFileSync(path.join(dir, "wwwallet", "manifests.yaml"), "kind: Deployment\n");
}

describe("listCastServices", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "workflows-"));
    fixture(dir);
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    delete process.env.CONFORMANCE_CASTS;
  });

  it("derives one service per org with the network token substituted", () => {
    const services = listCastServices(testnet, dir);
    expect(services.map((s) => s.id)).toEqual(["a", "b", "c", "d"]);
    expect(services[0]?.host).toBe("a.playground.testnet.verana.network");
    expect(services[0]?.cast).toBe("demo");
  });

  it("lets a per-org tag override the template tag", () => {
    const [a, b] = listCastServices(testnet, dir);
    expect(a?.pinnedTag).toBe("v0.9");
    expect(b?.pinnedTag).toBe("v1.0");
  });

  it("reads roles, permissions and the issuer id of the org's own template", () => {
    const [a, b, c, d] = listCastServices(testnet, dir);
    expect(a?.oid4vcRole).toBe("issuer");
    expect(a?.demoPerm).toBe("issuer");
    expect(a?.issuerId).toBe("demo-did");
    expect(b?.oid4vcRole).toBe("verifier");
    expect(b?.demoPerm).toBeNull();
    expect(b?.issuerId).toBeNull();
    expect(c?.oid4vcRole).toBe("issuer");
    expect(c?.issuerId).toBe("c-did");
    expect(d?.oid4vcRole).toBe("verifier");
  });

  it("ignores directories without orgs", () => {
    expect(listCastServices(testnet, dir).every((s) => s.cast === "demo")).toBe(true);
  });

  it("builds the metadata urls, bare alias first", () => {
    const [a] = listCastServices(testnet, dir);
    expect(issuerMetadataUrls(a!)).toEqual([
      "https://a.playground.testnet.verana.network/.well-known/openid-credential-issuer",
      "https://a.playground.testnet.verana.network/oid4vci/demo-did/.well-known/openid-credential-issuer",
    ]);
  });

  it("scopes casts from the environment", () => {
    expect(scopedCasts()).toEqual(["demo", "eventos"]);
    process.env.CONFORMANCE_CASTS = "vesta, bhi";
    expect(scopedCasts()).toEqual(["vesta", "bhi"]);
    const [a] = listCastServices(testnet, dir);
    expect(inScope(a!)).toBe(false);
  });

  it("reads the real repository and finds the demo and eventos casts", () => {
    const services = listCastServices(testnet);
    const ids = services.map((s) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["demo-issuer-accredited", "demo-verifier-accredited", "taquilla", "evento-costa-rica"]));
    expect(ids.length).toBeGreaterThanOrEqual(40);
    expect(services.find((s) => s.id === "taquilla")?.issuerId).not.toBeNull();
    expect(services.filter((s) => s.oid4vcRole === "verifier").length).toBeGreaterThanOrEqual(12);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/cast-services.test.ts`
Expected: FAIL with "Cannot find module './cast-services'".

- [ ] **Step 3: Write the module**

Create `conformance/lib/cast-services.ts`:

```ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import type { Network } from "./network";

export type CastService = {
  cast: string;
  org: string;
  id: string;
  host: string;
  pinnedTag: string;
  oid4vcRole: "issuer" | "verifier" | null;
  demoPerm: "issuer" | "verifier" | "none" | null;
  issuerId: string | null;
  configPath: string;
};

const DEFAULT_WORKFLOWS_DIR = fileURLToPath(new URL("../../.github/workflows/", import.meta.url));

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = /^([A-Z0-9_]+)=("?)(.*?)\2\s*$/.exec(line.trim());
    if (m && m[1] !== undefined && m[3] !== undefined) out[m[1]] = m[3];
  }
  return out;
}

function templateTag(castDir: string, cast: string): string {
  const doc = yaml.load(fs.readFileSync(path.join(castDir, "deployment.template.yaml"), "utf8"), { schema: yaml.JSON_SCHEMA });
  const record = doc as { image?: { tag?: unknown }; chartVersion?: unknown };
  const tag = record.image?.tag ?? record.chartVersion;
  if (typeof tag !== "string" || !tag) throw new Error(`${cast}: deployment.template.yaml has no image tag`);
  return tag;
}

function issuerIdOf(castDir: string, role: string | undefined): string | null {
  if (!role?.startsWith("issuer")) return null;
  const file = path.join(castDir, "oid4vc", `${role}.json.tpl`);
  if (!fs.existsSync(file)) return null;
  const m = /"issuer"\s*:\s*\{\s*"id"\s*:\s*"([^"]+)"/.exec(fs.readFileSync(file, "utf8"));
  return m?.[1] ?? null;
}

function roleOf(value: string | undefined): CastService["oid4vcRole"] {
  if (!value) return null;
  if (value.startsWith("issuer")) return "issuer";
  if (value.startsWith("verifier")) return "verifier";
  return null;
}

function permOf(value: string | undefined): CastService["demoPerm"] {
  return value === "issuer" || value === "verifier" || value === "none" ? value : null;
}

export function listCastServices(network: Network, workflowsDir: string = DEFAULT_WORKFLOWS_DIR): CastService[] {
  const casts = fs
    .readdirSync(workflowsDir)
    .filter((d) => fs.existsSync(path.join(workflowsDir, d, "orgs")))
    .sort();
  return casts.flatMap((cast) => {
    const castDir = path.join(workflowsDir, cast);
    const tag = templateTag(castDir, cast);
    return fs
      .readdirSync(path.join(castDir, "orgs"))
      .sort()
      .map((org) => {
        const configPath = path.join(castDir, "orgs", org, "config.env");
        const env = parseEnv(fs.readFileSync(configPath, "utf8"));
        const id = env.RELEASE_NAME;
        const host = env.INGRESS_HOST?.replaceAll("__NETWORK__", network.castToken);
        if (!id || !host) throw new Error(`${configPath}: RELEASE_NAME and INGRESS_HOST are required`);
        return {
          cast,
          org,
          id,
          host,
          pinnedTag: env.VS_AGENT_IMAGE_TAG || tag,
          oid4vcRole: roleOf(env.OID4VC_ROLE),
          demoPerm: permOf(env.DEMO_PERM),
          issuerId: issuerIdOf(castDir, env.OID4VC_ROLE),
          configPath,
        };
      });
  });
}

export function scopedCasts(): string[] {
  return (process.env.CONFORMANCE_CASTS ?? "demo,eventos")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const inScope = (service: CastService): boolean => scopedCasts().includes(service.cast);

export function issuerMetadataUrls(service: CastService): string[] {
  const urls = [`https://${service.host}/.well-known/openid-credential-issuer`];
  if (service.issuerId) urls.push(`https://${service.host}/oid4vci/${service.issuerId}/.well-known/openid-credential-issuer`);
  return urls;
}
```

- [ ] **Step 4: Run the tests and typecheck**

Run: `npx vitest run lib/cast-services.test.ts && npm run typecheck`
Expected: PASS (7 tests). If the real-repository test finds an issuer with `issuerId: null`, print that service's `OID4VC_ROLE` and the files under its cast's `oid4vc/`: a role without a matching template is a repo defect to report, not to paper over.

- [ ] **Step 5: Commit**

```bash
git add lib/cast-services.ts lib/cast-services.test.ts
git commit -m "feat: derive the deployed services from the cast workflow configs"
```

---

### Task 3: HTTP, resolver, playground and scenario clients

**Files:**
- Create: `conformance/lib/http.ts`, `conformance/lib/resolver-client.ts`, `conformance/lib/resolver-client.test.ts`, `conformance/lib/playground-client.ts`, `conformance/lib/playground-client.test.ts`, `conformance/scenarios.yaml`, `conformance/lib/scenarios.ts`, `conformance/lib/scenarios.test.ts`

**Interfaces:**
- Produces:
  - `fetchWithTimeout(url, init?: HttpInit): Promise<Response>`, `fetchJson(url, init?): Promise<unknown>`, `fetchText(url, init?): Promise<string>` where `HttpInit = { method?: string; headers?: Record<string, string>; body?: string; redirect?: RequestRedirect; timeoutMs?: number }`
  - `class ResolverClient { constructor(base: string); version(); resolve(did): Promise<TrustResolution | null>; refresh(did): Promise<"ok" | "failed">; resolveFresh(did): Promise<TrustResolution | null>; issuerAuthorization(did, vtjscId); verifierAuthorization(did, vtjscId) }`; `resolveFresh` refreshes, resolves, and throws when the answer's `evaluatedAt` is not later than the pre-refresh answer's [CONF-OPS-1]
  - `TrustResolutionSchema`, `AuthorizationSchema` (zod, loose)
  - `type Mint = { rail: "oid4vc" | "didcomm"; kind: string; url: string; id: string | null }`
  - `mintIssuance(network, service, opts: { format: Rail; demoParams: string; credential?: string; params?: Record<string, string> }): Promise<Mint>`
  - `mintPresentation(network, service, opts: { format: Rail; demoParams: string; login?: { evento: string; rol: string } }): Promise<Mint>`
  - `issuanceState(network, service, mint)`, `presentationState(network, service, mint, login?)`
  - `type Scenario = { id; kind: "issue" | "present"; expect: "accept" | "refuse"; service: string | Record<Rail, string>; credential?; params?; login?; needs? }`
  - `listScenarios(): Scenario[]`, `serviceFor(scenario, rail): string`
  - `type Rail = "anoncreds" | "openid4vc-sdjwt"`

- [ ] **Step 1: Write the failing client tests (fetch is stubbed)**

Create `conformance/lib/resolver-client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { ResolverClient } from "./resolver-client";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const answer = (evaluatedAt: string) => ({
  did: "did:webvh:x",
  trustStatus: "TRUSTED",
  production: false,
  evaluatedAt,
  evaluatedAtBlock: 1,
  expiresAt: "t2",
  credentials: [],
  dereferenceErrors: [],
  failedCredentials: [],
});

describe("ResolverClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("resolves with detail=full and validates the fields the guideline names", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(answer("2026-09-14T10:00:00.000Z")));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new ResolverClient("https://r").resolve("did:webvh:x");
    expect(result?.trustStatus).toBe("TRUSTED");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://r/v1/trust/resolve?did=did%3Awebvh%3Ax&detail=full");
  });

  it("returns null on 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 404)));
    expect(await new ResolverClient("https://r").resolve("did:webvh:x")).toBeNull();
  });

  it("resolveFresh refreshes and proves the evaluation moved", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(answer("2026-09-14T10:00:00.000Z")))
      .mockResolvedValueOnce(json({ did: "did:webvh:x", result: "ok" }))
      .mockResolvedValueOnce(json(answer("2026-09-14T10:05:00.000Z")));
    vi.stubGlobal("fetch", fetchMock);
    const fresh = await new ResolverClient("https://r").resolveFresh("did:webvh:x");
    expect(fresh?.evaluatedAt).toBe("2026-09-14T10:05:00.000Z");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://r/v1/trust/refresh");
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe("POST");
  });

  it("resolveFresh refuses a stale reading after refresh", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(answer("2026-09-14T10:00:00.000Z")))
      .mockResolvedValueOnce(json({ did: "did:webvh:x", result: "ok" }))
      .mockResolvedValueOnce(json(answer("2026-09-14T10:00:00.000Z")));
    vi.stubGlobal("fetch", fetchMock);
    await expect(new ResolverClient("https://r").resolveFresh("did:webvh:x")).rejects.toThrow(/stale/);
  });

  it("asks the issuer and verifier authorization endpoints by schema id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ did: "d", vtjscId: "s", authorized: true, evaluatedAt: "t" }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new ResolverClient("https://r");
    expect((await client.issuerAuthorization("d", "https://s")).authorized).toBe(true);
    expect((await client.verifierAuthorization("d", "https://s")).authorized).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://r/v1/trust/issuer-authorization?did=d&vtjscId=https%3A%2F%2Fs");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://r/v1/trust/verifier-authorization?did=d&vtjscId=https%3A%2F%2Fs");
  });

  it("reports the resolver version", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ version: "v1.0.3" })));
    expect(await new ResolverClient("https://r").version()).toBe("v1.0.3");
  });
});
```

Create `conformance/lib/playground-client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { listNetworks } from "./network";
import { issuanceState, mintIssuance, mintPresentation, presentationState } from "./playground-client";
import type { CastService } from "./cast-services";

const testnet = listNetworks().find((n) => n.id === "testnet-v3")!;
const issuer: CastService = { cast: "demo", org: "x", id: "demo-issuer-accredited", host: "h", pinnedTag: "t", oid4vcRole: "issuer", demoPerm: "issuer", issuerId: "demo-did", configPath: "p" };
const verifier: CastService = { ...issuer, id: "evento-costa-rica", oid4vcRole: "verifier", issuerId: null };
const json = (body: unknown, status = 200): Response => new Response(JSON.stringify(body), { status });

describe("playground client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("mints an oid4vc offer with the wallet parameters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ kind: "oid4vc-credential-offer", url: "openid-credential-offer://?credential_offer_uri=x", issuanceSessionId: "s1" }));
    vi.stubGlobal("fetch", fetchMock);
    const mint = await mintIssuance(testnet, issuer, { format: "openid4vc-sdjwt", demoParams: "signer=x5c", credential: "eventos-asistente", params: { evento: "costa-rica", nombre: "Conformance" } });
    expect(mint).toEqual({ rail: "oid4vc", kind: "oid4vc-credential-offer", url: "openid-credential-offer://?credential_offer_uri=x", id: "s1" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://playground.testnet.verana.network/api/demo/demo-issuer-accredited?format=openid4vc-sdjwt&credential=eventos-asistente&evento=costa-rica&nombre=Conformance&signer=x5c",
    );
  });

  it("keeps a plain invitation as a didcomm mint without id", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ kind: "invitation", url: "https://h/invitation" })));
    const mint = await mintIssuance(testnet, issuer, { format: "anoncreds", demoParams: "" });
    expect(mint).toEqual({ rail: "didcomm", kind: "invitation", url: "https://h/invitation", id: null });
  });

  it("refuses a degraded mint", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ kind: "invitation", url: "https://h/invitation", fallback: true })));
    await expect(mintIssuance(testnet, issuer, { format: "anoncreds", demoParams: "" })).rejects.toThrow(/degraded/);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ kind: "unsupported", format: "oid4vc" })));
    await expect(mintIssuance(testnet, issuer, { format: "openid4vc-sdjwt", demoParams: "" })).rejects.toThrow(/degraded/);
  });

  it("mints an event login through eventos-login", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ rail: "oid4vc", url: "openid4vp://?x", id: "v1" }));
    vi.stubGlobal("fetch", fetchMock);
    const mint = await mintPresentation(testnet, verifier, { format: "openid4vc-sdjwt", demoParams: "signer=x5c", login: { evento: "costa-rica", rol: "asistente" } });
    expect(mint).toEqual({ rail: "oid4vc", kind: "eventos-login", url: "openid4vp://?x", id: "v1" });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://playground.testnet.verana.network/api/eventos-login?evento=costa-rica&rol=asistente&format=openid4vc-sdjwt&signer=x5c");
  });

  it("reads exchange state on the mint's own rail", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json({ state: "OfferCreated", done: false, declined: false }))
      .mockResolvedValueOnce(json({ state: "done", verified: true, claims: {} }))
      .mockResolvedValueOnce(json({ done: true, verified: true, claims: {}, decision: "acceso" }));
    vi.stubGlobal("fetch", fetchMock);
    const issuance = await issuanceState(testnet, issuer, { rail: "oid4vc", kind: "k", url: "u", id: "s1" });
    expect(issuance).toEqual({ state: "OfferCreated", done: false, declined: false });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://playground.testnet.verana.network/api/demo/demo-issuer-accredited/credential/s1?rail=oid4vc");
    const proof = await presentationState(testnet, verifier, { rail: "oid4vc", kind: "k", url: "u", id: "p1" });
    expect(proof.done).toBe(true);
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://playground.testnet.verana.network/api/demo/evento-costa-rica/proof/p1?rail=oid4vc");
    const login = await presentationState(testnet, verifier, { rail: "oid4vc", kind: "eventos-login", url: "u", id: "p1" }, { evento: "costa-rica", rol: "asistente" });
    expect(login.decision).toBe("acceso");
    expect(String(fetchMock.mock.calls[2]?.[0])).toBe("https://playground.testnet.verana.network/api/eventos-login/p1?rail=oid4vc&evento=costa-rica&rol=asistente");
  });
});
```

Create `conformance/lib/scenarios.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CONFORMANCE_SCENARIOS } from "../../app/lib/wallet-profiles";
import { listScenarios, serviceFor } from "./scenarios";

describe("scenarios.yaml", () => {
  const scenarios = listScenarios();

  it("declares every conformance scenario exactly once", () => {
    expect(scenarios.map((s) => s.id).sort()).toEqual([...CONFORMANCE_SCENARIOS].sort());
  });

  it("names the untrusted service per rail", () => {
    const untrusted = scenarios.find((s) => s.id === "issue-untrusted")!;
    expect(serviceFor(untrusted, "anoncreds")).toBe("demo-untrusted");
    expect(serviceFor(untrusted, "openid4vc-sdjwt")).toBe("demo-issuer-untrusted");
    expect(serviceFor(scenarios.find((s) => s.id === "issue-accredited")!, "anoncreds")).toBe("demo-issuer-accredited");
  });

  it("chains presentations to the issuance they need", () => {
    for (const s of scenarios.filter((x) => x.kind === "present"))
      expect(scenarios.some((x) => x.id === s.needs && x.kind === "issue"), s.id).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/resolver-client.test.ts lib/playground-client.test.ts lib/scenarios.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write the HTTP helper and the resolver client**

Create `conformance/lib/http.ts`:

```ts
export type HttpInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  redirect?: RequestRedirect;
  timeoutMs?: number;
};

export function fetchWithTimeout(url: string, init: HttpInit = {}): Promise<Response> {
  const { timeoutMs = 20_000, ...rest } = init;
  return fetch(url, { ...rest, signal: AbortSignal.timeout(timeoutMs) });
}

export async function fetchJson(url: string, init: HttpInit = {}): Promise<unknown> {
  const res = await fetchWithTimeout(url, { ...init, headers: { accept: "application/json", ...init.headers } });
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${url} -> HTTP ${res.status}`);
  return res.json();
}

export async function fetchText(url: string, init: HttpInit = {}): Promise<string> {
  const res = await fetchWithTimeout(url, init);
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${url} -> HTTP ${res.status}`);
  return res.text();
}
```

Create `conformance/lib/resolver-client.ts`:

```ts
import { z } from "zod";
import { fetchJson, fetchWithTimeout } from "./http";

export const TrustCredentialSchema = z.looseObject({
  ecsType: z.string(),
  result: z.string(),
  issuedBy: z.string(),
  presentedBy: z.string().optional(),
  claims: z.record(z.string(), z.unknown()),
  permissionChain: z.unknown().optional(),
});

export const TrustResolutionSchema = z.looseObject({
  did: z.string(),
  trustStatus: z.enum(["TRUSTED", "UNTRUSTED", "PARTIAL"]),
  production: z.boolean(),
  evaluatedAt: z.string(),
  evaluatedAtBlock: z.number().optional(),
  expiresAt: z.string(),
  credentials: z.array(TrustCredentialSchema),
  dereferenceErrors: z.array(z.unknown()),
  failedCredentials: z.array(z.unknown()),
});
export type TrustResolution = z.infer<typeof TrustResolutionSchema>;

export const AuthorizationSchema = z.looseObject({
  did: z.string(),
  vtjscId: z.string(),
  authorized: z.boolean(),
  evaluatedAt: z.string(),
});
export type Authorization = z.infer<typeof AuthorizationSchema>;

export class ResolverClient {
  constructor(private readonly base: string) {}

  async version(): Promise<string> {
    return z.object({ version: z.string() }).parse(await fetchJson(`${this.base}/resolver/v1/version`)).version;
  }

  async resolve(did: string): Promise<TrustResolution | null> {
    const res = await fetchWithTimeout(`${this.base}/v1/trust/resolve?did=${encodeURIComponent(did)}&detail=full`, {
      headers: { accept: "application/json" },
      timeoutMs: 30_000,
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`resolve ${did} -> HTTP ${res.status}`);
    return TrustResolutionSchema.parse(await res.json());
  }

  async refresh(did: string): Promise<"ok" | "failed"> {
    const body = await fetchJson(`${this.base}/v1/trust/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ did }),
      timeoutMs: 60_000,
    });
    return z.object({ result: z.enum(["ok", "failed"]) }).parse(body).result;
  }

  async resolveFresh(did: string): Promise<TrustResolution | null> {
    const before = await this.resolve(did);
    await this.refresh(did);
    const after = await this.resolve(did);
    if (before && after && after.evaluatedAt <= before.evaluatedAt)
      throw new Error(`stale reading for ${did}: evaluatedAt ${after.evaluatedAt} did not advance after refresh`);
    return after;
  }

  issuerAuthorization(did: string, vtjscId: string): Promise<Authorization> {
    return this.authorization("issuer-authorization", did, vtjscId);
  }

  verifierAuthorization(did: string, vtjscId: string): Promise<Authorization> {
    return this.authorization("verifier-authorization", did, vtjscId);
  }

  private async authorization(endpoint: string, did: string, vtjscId: string): Promise<Authorization> {
    const url = `${this.base}/v1/trust/${endpoint}?did=${encodeURIComponent(did)}&vtjscId=${encodeURIComponent(vtjscId)}`;
    return AuthorizationSchema.parse(await fetchJson(url, { timeoutMs: 30_000 }));
  }
}
```

- [ ] **Step 4: Write the playground client**

Create `conformance/lib/playground-client.ts`:

```ts
import { z } from "zod";
import type { CastService } from "./cast-services";
import { fetchJson } from "./http";
import type { Network } from "./network";

export type Rail = "anoncreds" | "openid4vc-sdjwt";
export type Mint = { rail: "oid4vc" | "didcomm"; kind: string; url: string; id: string | null };
export type Login = { evento: string; rol: string };

const DemoMintSchema = z.looseObject({
  kind: z.string(),
  url: z.string().nullable().optional(),
  fallback: z.boolean().optional(),
  issuanceSessionId: z.string().nullable().optional(),
  credentialExchangeId: z.string().nullable().optional(),
  verificationSessionId: z.string().nullable().optional(),
  proofExchangeId: z.string().nullable().optional(),
});

const LoginMintSchema = z.looseObject({ rail: z.enum(["oid4vc", "didcomm"]), url: z.string(), id: z.string().nullable() });

const IssuanceStateSchema = z.looseObject({ state: z.string().nullable(), done: z.boolean(), declined: z.boolean() });
const ProofStateSchema = z.looseObject({ state: z.string().nullable().optional(), verified: z.boolean().optional(), claims: z.unknown().optional() });
const LoginStateSchema = z.looseObject({ done: z.boolean(), state: z.string().nullable().optional(), verified: z.boolean().optional(), claims: z.unknown().optional(), decision: z.string().optional(), trustVerdict: z.string().nullable().optional() });

function playground(network: Network): string {
  if (!network.playground) throw new Error(`${network.id} has no playground`);
  return network.playground;
}

function withParams(base: string, params: Record<string, string | undefined>, demoParams: string): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) search.set(k, v);
  const extra = demoParams.split("&").filter(Boolean);
  const query = [search.toString(), ...extra].filter(Boolean).join("&");
  return `${base}?${query}`;
}

function fromDemo(body: unknown, format: Rail): Mint {
  const mint = DemoMintSchema.parse(body);
  if (mint.kind === "unsupported" || mint.fallback || !mint.url)
    throw new Error(`mint degraded for ${format}: ${JSON.stringify(body)}`);
  const rail = mint.kind.startsWith("oid4vc") ? "oid4vc" : "didcomm";
  const id = mint.issuanceSessionId ?? mint.credentialExchangeId ?? mint.verificationSessionId ?? mint.proofExchangeId ?? null;
  return { rail, kind: mint.kind, url: mint.url, id };
}

export async function mintIssuance(
  network: Network,
  service: CastService,
  opts: { format: Rail; demoParams: string; credential?: string; params?: Record<string, string> },
): Promise<Mint> {
  const url = withParams(`${playground(network)}/api/demo/${service.id}`, { format: opts.format, credential: opts.credential, ...opts.params }, opts.demoParams);
  return fromDemo(await fetchJson(url, { timeoutMs: 40_000 }), opts.format);
}

export async function mintPresentation(
  network: Network,
  service: CastService,
  opts: { format: Rail; demoParams: string; login?: Login },
): Promise<Mint> {
  if (opts.login) {
    const url = withParams(`${playground(network)}/api/eventos-login`, { evento: opts.login.evento, rol: opts.login.rol, format: opts.format }, opts.demoParams);
    const mint = LoginMintSchema.parse(await fetchJson(url, { timeoutMs: 40_000 }));
    return { rail: mint.rail, kind: "eventos-login", url: mint.url, id: mint.id };
  }
  const url = withParams(`${playground(network)}/api/demo/${service.id}`, { format: opts.format }, opts.demoParams);
  return fromDemo(await fetchJson(url, { timeoutMs: 40_000 }), opts.format);
}

export async function issuanceState(network: Network, service: CastService, mint: Mint): Promise<z.infer<typeof IssuanceStateSchema>> {
  if (!mint.id) throw new Error("a plain invitation has no exchange to poll");
  return IssuanceStateSchema.parse(await fetchJson(`${playground(network)}/api/demo/${service.id}/credential/${encodeURIComponent(mint.id)}?rail=${mint.rail}`));
}

export async function presentationState(
  network: Network,
  service: CastService,
  mint: Mint,
  login?: Login,
): Promise<{ done: boolean; state: string | null; verified: boolean; claims?: unknown; decision?: string; trustVerdict?: string | null }> {
  if (!mint.id) throw new Error("a plain invitation has no exchange to poll");
  if (login) {
    const body = LoginStateSchema.parse(
      await fetchJson(`${playground(network)}/api/eventos-login/${encodeURIComponent(mint.id)}?rail=${mint.rail}&evento=${login.evento}&rol=${login.rol}`),
    );
    return { done: body.done, state: body.state ?? null, verified: body.verified === true, claims: body.claims, decision: body.decision, trustVerdict: body.trustVerdict ?? null };
  }
  const body = ProofStateSchema.parse(await fetchJson(`${playground(network)}/api/demo/${service.id}/proof/${encodeURIComponent(mint.id)}?rail=${mint.rail}`));
  return { done: body.state === "done", state: body.state ?? null, verified: body.verified === true, claims: body.claims };
}
```

- [ ] **Step 5: Write the scenarios file and loader**

Create `conformance/scenarios.yaml`:

```yaml
scenarios:
  - id: issue-accredited
    kind: issue
    expect: accept
    service: demo-issuer-accredited
  - id: issue-unaccredited
    kind: issue
    expect: refuse
    service: demo-issuer-unaccredited
  - id: issue-untrusted
    kind: issue
    expect: refuse
    service: { anoncreds: demo-untrusted, openid4vc-sdjwt: demo-issuer-untrusted }
  - id: present-accredited
    kind: present
    expect: accept
    service: demo-verifier-accredited
    needs: issue-accredited
  - id: present-unaccredited
    kind: present
    expect: refuse
    service: demo-verifier-unaccredited
    needs: issue-accredited
  - id: present-untrusted
    kind: present
    expect: refuse
    service: { anoncreds: demo-untrusted, openid4vc-sdjwt: demo-verifier-untrusted }
    needs: issue-accredited
  - id: boleto-asistente
    kind: issue
    expect: accept
    service: taquilla
    credential: eventos-asistente
    params: { evento: costa-rica, nombre: Conformance }
  - id: boleto-patrocinador
    kind: issue
    expect: accept
    service: taquilla
    credential: eventos-patrocinador
    params: { evento: panama, organizacion: INTEXUS, lema: Beyond the content }
  - id: entrada-costa-rica
    kind: present
    expect: accept
    service: evento-costa-rica
    login: { evento: costa-rica, rol: asistente }
    needs: boleto-asistente
  - id: entrada-otro-evento
    kind: present
    expect: refuse
    service: evento-guatemala
    login: { evento: guatemala, rol: asistente }
    needs: boleto-asistente
```

Create `conformance/lib/scenarios.ts`:

```ts
import fs from "node:fs";
import yaml from "js-yaml";
import { z } from "zod";
import { CONFORMANCE_SCENARIOS } from "../../app/lib/wallet-profiles";
import type { Rail } from "./playground-client";

const ScenarioSchema = z.object({
  id: z.enum(CONFORMANCE_SCENARIOS),
  kind: z.enum(["issue", "present"]),
  expect: z.enum(["accept", "refuse"]),
  service: z.union([z.string().min(1), z.object({ anoncreds: z.string().min(1), "openid4vc-sdjwt": z.string().min(1) })]),
  credential: z.string().min(1).optional(),
  params: z.record(z.string(), z.string()).optional(),
  login: z.object({ evento: z.string().min(1), rol: z.string().min(1) }).optional(),
  needs: z.enum(CONFORMANCE_SCENARIOS).optional(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

const FileSchema = z.object({ scenarios: z.array(ScenarioSchema).min(1) });
const SCENARIOS_FILE = new URL("../scenarios.yaml", import.meta.url);

export function listScenarios(): Scenario[] {
  const raw = yaml.load(fs.readFileSync(SCENARIOS_FILE, "utf8"), { schema: yaml.JSON_SCHEMA });
  const { scenarios } = FileSchema.parse(raw);
  const ids = new Set(scenarios.map((s) => s.id));
  if (ids.size !== scenarios.length) throw new Error("scenarios.yaml: duplicate scenario id");
  for (const s of scenarios) if (s.needs && !ids.has(s.needs)) throw new Error(`${s.id}: needs unknown scenario ${s.needs}`);
  return scenarios;
}

export function serviceFor(scenario: Scenario, rail: Rail): string {
  return typeof scenario.service === "string" ? scenario.service : scenario.service[rail];
}
```

- [ ] **Step 6: Run the tests and typecheck**

Run: `npx vitest run && npm run typecheck`
Expected: PASS. The `../../app/lib/wallet-profiles` import resolves `zod` and `js-yaml` from the root `node_modules`; CI installs both packages (Task 11).

- [ ] **Step 7: Commit**

```bash
git add lib/http.ts lib/resolver-client.ts lib/resolver-client.test.ts lib/playground-client.ts lib/playground-client.test.ts scenarios.yaml lib/scenarios.ts lib/scenarios.test.ts
git commit -m "feat: resolver, playground and scenario clients for the conformance tiers"
```

---

### Task 4: Networks, serving version and roll detection [CONF-NET-3] [CONF-OPS-1] [CONF-OPS-2] [CONF-OPS-3]

**Files:**
- Create: `conformance/lib/identity.ts`, `conformance/tier1/networks.test.ts`, `conformance/tier1/serving-version.test.ts`
- Modify: `conformance/lib/global-setup.ts`, `conformance/package.json` (script `t1`)

**Interfaces:**
- Produces: `servingVersion(service: CastService): Promise<ServingVersion>` with `ServingVersion = { imageTag: string | null; packageVersion: string | null; source: "kubectl" | "landing"; error?: string }`; reads `CONFORMANCE_K8S_NAMESPACE` and shells out to `kubectl get statefulset <release> -n <ns> -o jsonpath={.spec.template.spec.containers[*].image}`.
- `snapshotTags(network): Promise<Record<string, string | null>>` (service id to serving tag, cluster only).
- The global teardown, when `CONFORMANCE_K8S_NAMESPACE` is set, re-reads the tags and rewrites the outcome of every cell of a service whose tag changed during the run to `unknown` with cause `service rolled during the run` [CONF-OPS-1].

- [ ] **Step 1: Write the identity helper**

Create `conformance/lib/identity.ts`:

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { listCastServices, type CastService } from "./cast-services";
import { fetchWithTimeout } from "./http";
import type { Network } from "./network";

const exec = promisify(execFile);

export type ServingVersion = {
  imageTag: string | null;
  packageVersion: string | null;
  source: "kubectl" | "landing";
  error?: string;
};

export const clusterNamespace = (): string | undefined => process.env.CONFORMANCE_K8S_NAMESPACE || undefined;

async function fromCluster(service: CastService, namespace: string): Promise<ServingVersion> {
  try {
    const { stdout } = await exec(
      "kubectl",
      ["get", "statefulset", service.id, "-n", namespace, "-o", "jsonpath={.spec.template.spec.containers[*].image}"],
      { timeout: 20_000 },
    );
    const image = stdout.split(/\s+/).find((i) => i.includes("veranalabs/vs-agent"));
    return { imageTag: image?.split(":").pop() ?? null, packageVersion: null, source: "kubectl", ...(image ? {} : { error: `no vs-agent container in: ${stdout}` }) };
  } catch (e) {
    return { imageTag: null, packageVersion: null, source: "kubectl", error: e instanceof Error ? e.message : String(e) };
  }
}

async function fromLanding(service: CastService): Promise<ServingVersion> {
  try {
    const res = await fetchWithTimeout(`https://${service.host}/`, { headers: { accept: "text/html" } });
    const html = await res.text();
    const version = /"version":"([^"]+)"/.exec(html)?.[1] ?? null;
    return { imageTag: null, packageVersion: version, source: "landing", ...(res.ok ? {} : { error: `HTTP ${res.status}` }) };
  } catch (e) {
    return { imageTag: null, packageVersion: null, source: "landing", error: e instanceof Error ? e.message : String(e) };
  }
}

export function servingVersion(service: CastService): Promise<ServingVersion> {
  const namespace = clusterNamespace();
  return namespace ? fromCluster(service, namespace) : fromLanding(service);
}

export async function snapshotTags(network: Network): Promise<Record<string, string | null>> {
  const namespace = clusterNamespace();
  if (!namespace) return {};
  const entries = await Promise.all(listCastServices(network).map(async (s) => [s.id, (await fromCluster(s, namespace)).imageTag] as const));
  return Object.fromEntries(entries);
}
```

- [ ] **Step 2: Add roll detection to the global setup**

Replace `conformance/lib/global-setup.ts` with:

```ts
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TestProject } from "vitest/node";
import { clusterNamespace, snapshotTags } from "./identity";
import { selectedNetworks, testableNetworks } from "./network";
import type { Cell } from "./report";
import { buildResults, parseCells, type RunHeader } from "./results";

const RESULTS_DIR = fileURLToPath(new URL("../results/", import.meta.url));

const git = (...args: string[]): string => execFileSync("git", args, { encoding: "utf8" }).trim();

export function collectCells(runDir: string): string {
  return fs
    .readdirSync(runDir)
    .filter((f) => f.startsWith("cells-") && f.endsWith(".jsonl"))
    .sort()
    .map((f) => fs.readFileSync(path.join(runDir, f), "utf8"))
    .join("");
}

export function markRolled(cells: Cell[], before: Record<string, string | null>, after: Record<string, string | null>): Cell[] {
  const rolled = new Set(Object.keys(after).filter((id) => before[id] !== after[id]));
  return cells.map((c) =>
    c.service && rolled.has(c.service)
      ? { ...c, outcome: "unknown", cause: `service rolled during the run (${before[c.service] ?? "?"} to ${after[c.service] ?? "?"})` }
      : c,
  );
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  const id = process.env.CONFORMANCE_RUN_ID ?? new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(RESULTS_DIR, id);
  fs.mkdirSync(runDir, { recursive: true });
  const header: RunHeader = {
    id,
    startedAt: new Date().toISOString(),
    gitSha: git("rev-parse", "HEAD"),
    gitBranch: git("rev-parse", "--abbrev-ref", "HEAD"),
    networks: selectedNetworks().map((n) => n.id),
  };
  fs.writeFileSync(path.join(runDir, "run.json"), `${JSON.stringify(header, null, 2)}\n`);
  const before = clusterNamespace() ? Object.assign({}, ...(await Promise.all(testableNetworks().map(snapshotTags)))) : {};
  project.provide("runDir", runDir);
  return async () => {
    const after = clusterNamespace() ? Object.assign({}, ...(await Promise.all(testableNetworks().map(snapshotTags)))) : {};
    const cells = markRolled(parseCells(collectCells(runDir)), before, after);
    const results = buildResults(header, cells.map((c) => JSON.stringify(c)).join("\n"), new Date().toISOString());
    const json = `${JSON.stringify(results, null, 2)}\n`;
    fs.writeFileSync(path.join(runDir, "results.json"), json);
    fs.writeFileSync(path.join(RESULTS_DIR, "latest.json"), json);
  };
}
```

- [ ] **Step 3: Write the two checks**

Create `conformance/tier1/networks.test.ts`:

```ts
import { expect, it } from "vitest";
import { record } from "../lib/report";
import { ResolverClient } from "../lib/resolver-client";
import { describeNetworks } from "../lib/suite";

describeNetworks("network-testable", (network) => {
  it(`resolver answers with a version [CONF-NET-3]`, async () => {
    const version = await new ResolverClient(network.resolver as string).version();
    record({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id, outcome: "works", evidence: { resolver: network.resolver, resolverVersion: version, playground: network.playground } });
    expect(version).toMatch(/^v?\d/);
  });
});
```

`describeNetworks` itself records the `not-testable` cells for devnet when it is the only selected network; when testnet is selected too, add the untestable ones explicitly: append to the same file:

```ts
import { untestableNetworks } from "../lib/network";

it("every untestable network is reported", () => {
  for (const network of untestableNetworks())
    record({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id, outcome: "not-testable", cause: network.reason });
  expect(true).toBe(true);
});
```

Create `conformance/tier1/serving-version.test.ts`:

```ts
import { it } from "vitest";
import { listCastServices } from "../lib/cast-services";
import { clusterNamespace, servingVersion } from "../lib/identity";
import { check } from "../lib/report";
import { describeNetworks } from "../lib/suite";

describeNetworks("version actually serving [CONF-OPS-2] [CONF-OPS-3]", (network) => {
  for (const service of listCastServices(network)) {
    it.concurrent(`${service.cast}/${service.id} serves the tag the repository pins`, () =>
      check({ tier: "t1", check: "serving-version", clause: "CONF-OPS-2", network: network.id, cast: service.cast, service: service.id }, async () => {
        const serving = await servingVersion(service);
        const evidence = { host: service.host, pinnedTag: service.pinnedTag, servingTag: serving.imageTag, packageVersion: serving.packageVersion, source: serving.source, configPath: service.configPath, error: serving.error };
        if (serving.imageTag === null)
          return { outcome: "unknown", cause: clusterNamespace() ? `image tag not readable from the cluster: ${serving.error}` : `no cluster access; landing page ${serving.error ?? "read"}`, evidence };
        if (serving.imageTag !== service.pinnedTag)
          return { outcome: "broken", cause: `pinned ${service.pinnedTag}, serving ${serving.imageTag}`, evidence };
        return { outcome: "works", evidence };
      }),
    );
  }
});
```

Add to `conformance/package.json` scripts: `"t1": "vitest run tier1"`.

- [ ] **Step 4: Run the checks against testnet**

Run: `npm run t1 2>&1 | tail -30 && node -e 'const r=require("./results/latest.json");console.log(r.totals);console.log(r.cells.filter(c=>c.outcome!=="works").map(c=>c.service+" "+c.outcome+" "+c.cause))'`
Expected: `network-testable`: one `not-testable` for devnet-v4, one `works` for testnet-v3. `serving-version`: every cell `unknown` locally (no cluster), each with `packageVersion: "1.12.0"` where the landing page loads and the HTTP error where it does not (CCM). No test fails locally; the assertion bites only in the nightly job.

- [ ] **Step 5: Commit**

```bash
git add lib/identity.ts lib/global-setup.ts tier1/networks.test.ts tier1/serving-version.test.ts package.json
git commit -m "feat: tier 1 network, serving-version and roll-detection checks"
```

---

### Task 5: Issuer metadata shape [CONF-T1-1] [CONF-T1-2]

**Files:**
- Create: `conformance/lib/issuer-metadata.ts`, `conformance/tier1/metadata-shape.test.ts`
- Modify: `conformance/package.json` (add `@openid4vc/openid4vci`)

**Interfaces:**
- Produces:
  - `fetchIssuerMetadata(service): Promise<{ url: string; raw: unknown; tried: Record<string, number> }>` tries `issuerMetadataUrls(service)` in order, returns the first 200 JSON.
  - `DRAFT_PARSERS: Record<VciDraft, { name: string; own: boolean; parse: (raw: unknown) => { success: true } | { success: false; error: string } }>`: `v1`, `draft15` and `draft14` parse with `zCredentialIssuerMetadataSchema` (the library the Credo, Paradym and Sphereon family ship; `own: true`); `draft13` and `draft11` parse with `LegacyIssuerMetadataSchema`, a hand-written stand-in for the Kotlin readers that have no Node port (`own: false`, and the cell says so).
  - `LegacyIssuerMetadataSchema`, `DisplayedConfigurationSchema` (zod)
  - `vctDocumentUrl(raw, configurationId): string | null`
  - `profilesDir(): string` = `fileURLToPath(new URL("../profiles", import.meta.url))` in `conformance/lib/profiles-dir.ts` (create it here; every suite uses it)

- [ ] **Step 1: Add the wallets' library**

Run: `npm install @openid4vc/openid4vci@0.5.5`
Expected: `package.json` gains `"@openid4vc/openid4vci": "0.5.5"` (pinned, the version vs-agent's Credo line resolves). About 700 KB unpacked. `zCredentialIssuerMetadataSchema` is a public export of 0.5.5 (`packages/openid4vci/src/index.ts` line 112 re-exports the draft 14/15/v1 schema under that name).

- [ ] **Step 2: Write the helpers**

Create `conformance/lib/profiles-dir.ts`:

```ts
import { fileURLToPath } from "node:url";

export const profilesDir = (): string => fileURLToPath(new URL("../profiles", import.meta.url));
```

Create `conformance/lib/issuer-metadata.ts`:

```ts
import { zCredentialIssuerMetadataSchema } from "@openid4vc/openid4vci";
import { z } from "zod";
import { VCI_DRAFTS } from "../../app/lib/wallet-profiles";
import { issuerMetadataUrls, type CastService } from "./cast-services";
import { fetchWithTimeout } from "./http";

export type VciDraft = (typeof VCI_DRAFTS)[number];

const DisplayNameSchema = z.looseObject({ name: z.string().min(1) });

export const LegacyConfigurationSchema = z.looseObject({
  id: z.string().min(1),
  format: z.string().min(1),
  display: z.array(DisplayNameSchema).min(1),
});

export const LegacyIssuerMetadataSchema = z.looseObject({
  credential_issuer: z.url(),
  credential_endpoint: z.url(),
  credentials_supported: z.array(LegacyConfigurationSchema).min(1),
});

export const DisplayedConfigurationSchema = z.looseObject({
  display: z.array(DisplayNameSchema).min(1),
  claims: z.record(z.string(), z.unknown()),
  credential_metadata: z.looseObject({
    display: z.array(DisplayNameSchema).min(1),
    claims: z.array(z.looseObject({ path: z.array(z.string()).min(1) })).min(1),
  }),
});

type ParseResult = { success: true } | { success: false; error: string };

const issues = (error: z.ZodError): string => error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");

const withZod = (schema: z.ZodType) => (raw: unknown): ParseResult => {
  const r = schema.safeParse(raw);
  return r.success ? { success: true } : { success: false, error: issues(r.error) };
};

export const DRAFT_PARSERS: Record<VciDraft, { name: string; own: boolean; parse: (raw: unknown) => ParseResult }> = {
  v1: { name: "@openid4vc/openid4vci zCredentialIssuerMetadataSchema", own: true, parse: withZod(zCredentialIssuerMetadataSchema) },
  draft15: { name: "@openid4vc/openid4vci zCredentialIssuerMetadataSchema", own: true, parse: withZod(zCredentialIssuerMetadataSchema) },
  draft13: { name: "hand-written legacy credentials_supported reader (no Node port of the Kotlin libraries)", own: false, parse: withZod(LegacyIssuerMetadataSchema) },
  draft11: { name: "hand-written legacy credentials_supported reader (no Node port of the Kotlin libraries)", own: false, parse: withZod(LegacyIssuerMetadataSchema) },
};

export async function fetchIssuerMetadata(service: CastService): Promise<{ url: string; raw: unknown; tried: Record<string, number> }> {
  const tried: Record<string, number> = {};
  for (const url of issuerMetadataUrls(service)) {
    const res = await fetchWithTimeout(url, { headers: { accept: "application/json" } });
    tried[url] = res.status;
    if (res.ok) return { url, raw: await res.json(), tried };
  }
  throw new Error(`${service.id}: no issuer metadata at ${JSON.stringify(tried)}`);
}

export function vctDocumentUrl(raw: unknown, configurationId: string): string | null {
  const parsed = z.looseObject({ credential_configurations_supported: z.record(z.string(), z.looseObject({ vct: z.string().optional() })) }).safeParse(raw);
  return parsed.success ? (parsed.data.credential_configurations_supported[configurationId]?.vct ?? null) : null;
}
```

If `VCI_DRAFTS` in `app/lib/wallet-profiles.ts` does not contain `draft14`, do not add it here: `DRAFT_PARSERS` is typed by that constant and only the drafts a profile can name need a parser.

- [ ] **Step 3: Write the check**

Create `conformance/tier1/metadata-shape.test.ts`:

```ts
import { zCredentialIssuerMetadataSchema } from "@openid4vc/openid4vci";
import { it } from "vitest";
import { listWalletProfiles } from "../../app/lib/wallet-profiles";
import { listCastServices } from "../lib/cast-services";
import { DisplayedConfigurationSchema, DRAFT_PARSERS, fetchIssuerMetadata, LegacyIssuerMetadataSchema, type VciDraft } from "../lib/issuer-metadata";
import { profilesDir } from "../lib/profiles-dir";
import { check } from "../lib/report";
import { describeNetworks } from "../lib/suite";

const fleetDrafts = [...new Set(listWalletProfiles(profilesDir()).flatMap((p) => p.openid4vc?.vciDrafts ?? []))].sort() as VciDraft[];

describeNetworks("issuer metadata", (network) => {
  for (const service of listCastServices(network).filter((s) => s.oid4vcRole === "issuer")) {
    const base = { tier: "t1" as const, network: network.id, cast: service.cast, service: service.id };

    it.concurrent(`${service.cast}/${service.id} parses under every draft the fleet speaks [CONF-T1-1]`, () =>
      check({ ...base, check: "metadata-parses", clause: "CONF-T1-1" }, async () => {
        const { url, raw, tried } = await fetchIssuerMetadata(service);
        const perDraft = Object.fromEntries(fleetDrafts.map((d) => [d, { parser: DRAFT_PARSERS[d].name, ownLibrary: DRAFT_PARSERS[d].own, ...DRAFT_PARSERS[d].parse(raw) }]));
        const failed = Object.entries(perDraft).filter(([, r]) => !r.success);
        return {
          outcome: failed.length ? "broken" : "works",
          cause: failed.length ? failed.map(([d, r]) => `${d}: ${"error" in r ? r.error : ""}`).join(" | ") : undefined,
          evidence: { url, tried, perDraft },
        };
      }),
    );

    it.concurrent(`${service.cast}/${service.id} publishes display and claims in both shapes [CONF-T1-2]`, () =>
      check({ ...base, check: "metadata-both-shapes", clause: "CONF-T1-2" }, async () => {
        const { url, raw } = await fetchIssuerMetadata(service);
        const modern = zCredentialIssuerMetadataSchema.safeParse(raw);
        if (!modern.success) return { outcome: "broken", cause: `not parseable as draft 14+: ${modern.error.message}`, evidence: { url } };
        const problems: string[] = [];
        for (const [id, configuration] of Object.entries(modern.data.credential_configurations_supported)) {
          const r = DisplayedConfigurationSchema.safeParse(configuration);
          if (!r.success) problems.push(`${id}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        }
        const legacy = LegacyIssuerMetadataSchema.safeParse(raw);
        if (!legacy.success) problems.push(`credentials_supported: ${legacy.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        const legacyClaims = legacy.success ? legacy.data.credentials_supported.map((c) => ({ id: c.id, claims: "claims" in c && typeof c.claims === "object" && c.claims !== null })) : [];
        return {
          outcome: problems.length ? "broken" : "works",
          cause: problems.join(" | ") || undefined,
          evidence: { url, configurations: Object.keys(modern.data.credential_configurations_supported), legacyClaims },
        };
      }),
    );
  }
});
```

`legacyClaims` is evidence, not an assertion: the library derives `credentials_supported` from the configuration and drops `claims` today (verified on Taquilla `.42`); whether a draft-11 reader needs it there is a Tier 2 question answered with the Credo holder.

- [ ] **Step 4: Run the check and read the result**

Run: `npx vitest run tier1/metadata-shape.test.ts 2>&1 | tail -40 && node -e 'const r=require("./results/latest.json");for(const c of r.cells.filter(c=>c.outcome!=="works"))console.log(c.cast, c.service, c.check, c.outcome, c.cause)'`
Expected: every `taquilla` cell `works` (it serves `.42`). Demo cast issuers: `metadata-both-shapes` is `broken` for every service still serving an image before `.42` (missing configuration-level `display`/`claims`); Task 13 rolls them. Any `metadata-parses` failure is a new finding: report it verbatim.

- [ ] **Step 5: Typecheck and commit**

Run: `npm run typecheck`

```bash
git add package.json package-lock.json lib/profiles-dir.ts lib/issuer-metadata.ts tier1/metadata-shape.test.ts
git commit -m "feat: tier 1 issuer metadata checks per draft the fleet speaks"
```

---

### Task 6: Authorization-server discovery [CONF-T1-3]

**Files:**
- Create: `conformance/tier1/authorization-server.test.ts`

Both discovery forms must answer for every document a profile lists. Verified in the wallets' sources (2026-09-14): EUDI's `eudi-lib-jvm-openid4vci-kt` fetches only the RFC 8414 path-insertion form (`https://host/.well-known/oauth-authorization-server/oid4vci/demo-did`) and fails on a 404; Inji's `inji-vci-client` fetches only the suffix form (`https://host/oid4vci/demo-did/.well-known/oauth-authorization-server`); swiyu, wwWallet and openid4vc-ts try insertion then suffix. Every one of them stops at the first success and none requires `openid-configuration`, so the profiles list `oauth-authorization-server` alone and this check asserts both forms of it.

- [ ] **Step 1: Write the check**

```ts
import { zCredentialIssuerMetadataSchema } from "@openid4vc/openid4vci";
import { it } from "vitest";
import { z } from "zod";
import { listWalletProfiles } from "../../app/lib/wallet-profiles";
import { listCastServices } from "../lib/cast-services";
import { fetchWithTimeout } from "../lib/http";
import { fetchIssuerMetadata } from "../lib/issuer-metadata";
import { profilesDir } from "../lib/profiles-dir";
import { check } from "../lib/report";
import { describeNetworks } from "../lib/suite";

const documents = [...new Set(listWalletProfiles(profilesDir()).flatMap((p) => p.openid4vc?.asDiscovery ?? []))].sort();
const AsMetadataSchema = z.looseObject({ issuer: z.url(), token_endpoint: z.url() });

function forms(authorizationServer: string, document: string): { insertion: string; suffix: string } {
  const u = new URL(authorizationServer);
  const pathname = u.pathname.replace(/\/$/, "");
  return {
    insertion: `${u.origin}/.well-known/${document}${pathname}`,
    suffix: `${authorizationServer.replace(/\/$/, "")}/.well-known/${document}`,
  };
}

async function probe(url: string): Promise<{ url: string; status: number; ok: boolean; issuer?: string }> {
  const res = await fetchWithTimeout(url, { headers: { accept: "application/json" } });
  if (!res.ok) return { url, status: res.status, ok: false };
  const parsed = AsMetadataSchema.safeParse(await res.json().catch(() => null));
  return { url, status: res.status, ok: parsed.success, issuer: parsed.success ? parsed.data.issuer : undefined };
}

describeNetworks("authorization-server discovery [CONF-T1-3]", (network) => {
  for (const service of listCastServices(network).filter((s) => s.oid4vcRole === "issuer")) {
    for (const document of documents) {
      it.concurrent(`${service.cast}/${service.id} answers ${document} in both forms`, () =>
        check({ tier: "t1", check: `as-discovery:${document}`, clause: "CONF-T1-3", network: network.id, cast: service.cast, service: service.id }, async () => {
          const { raw } = await fetchIssuerMetadata(service);
          const metadata = zCredentialIssuerMetadataSchema.parse(raw);
          const authorizationServer = metadata.authorization_servers?.[0] ?? metadata.credential_issuer;
          const urls = forms(authorizationServer, document);
          const [insertion, suffix] = await Promise.all([probe(urls.insertion), probe(urls.suffix)]);
          const problems: string[] = [];
          for (const p of [insertion, suffix]) {
            if (!p.ok) problems.push(`${p.url} -> ${p.status}`);
            else if (p.issuer !== authorizationServer) problems.push(`${p.url} names issuer ${p.issuer}, expected ${authorizationServer}`);
          }
          return { outcome: problems.length ? "broken" : "works", cause: problems.join(" | ") || undefined, evidence: { authorizationServer, insertion, suffix } };
        }),
      );
    }
  }
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run tier1/authorization-server.test.ts 2>&1 | tail -30`
Expected: the suffix form of `oauth-authorization-server` answers on every issuer (Credo serves it under the issuer path). Whether the insertion form and `openid-configuration` answer is the finding this check exists to produce; report the evidence blocks for vs-agent. Do not weaken the check.

- [ ] **Step 3: Commit**

```bash
git add tier1/authorization-server.test.ts
git commit -m "feat: tier 1 authorization-server discovery check"
```

---

### Task 7: Service DIDs and did:webvh logs [CONF-T1-5] [CONF-OPS-1]

**Files:**
- Create: `conformance/lib/service-did.ts`, `conformance/tier1/service-dids.test.ts`

**Interfaces:**
- Produces: `serviceDid(service): Promise<{ did: string; webvh: string | null }>`, `webvhLogHealth(service): Promise<{ ok: boolean; verificationMethod: string | null; entries: number; error?: string }>`. Plan C reuses `serviceDid`.

- [ ] **Step 1: Write the helper**

Create `conformance/lib/service-did.ts`:

```ts
import { z } from "zod";
import type { CastService } from "./cast-services";
import { fetchJson, fetchText } from "./http";

const DidDocumentSchema = z.looseObject({ id: z.string().min(1), alsoKnownAs: z.array(z.string()).optional() });

export async function serviceDid(service: CastService): Promise<{ did: string; webvh: string | null }> {
  const doc = DidDocumentSchema.parse(await fetchJson(`https://${service.host}/.well-known/did.json`));
  const webvh = doc.alsoKnownAs?.find((a) => a.startsWith("did:webvh:")) ?? (doc.id.startsWith("did:webvh:") ? doc.id : null);
  return { did: webvh ?? doc.id, webvh };
}

const ProofSchema = z.looseObject({ verificationMethod: z.string() });
const LogEntrySchema = z.looseObject({ proof: z.union([z.array(ProofSchema), ProofSchema]) });

export async function webvhLogHealth(service: CastService): Promise<{ ok: boolean; verificationMethod: string | null; entries: number; error?: string }> {
  try {
    const text = await fetchText(`https://${service.host}/.well-known/did.jsonl`);
    const lines = text.split("\n").filter((l) => l.trim());
    const first = lines[0];
    if (!first) return { ok: false, verificationMethod: null, entries: 0, error: "empty log" };
    const entry = LogEntrySchema.parse(JSON.parse(first));
    const proofs = Array.isArray(entry.proof) ? entry.proof : [entry.proof];
    const bare = proofs.find((p) => !p.verificationMethod.includes("#"));
    return { ok: !bare, verificationMethod: proofs[0]?.verificationMethod ?? null, entries: lines.length, ...(bare ? { error: `first entry signed with bare ${bare.verificationMethod}` } : {}) };
  } catch (e) {
    return { ok: false, verificationMethod: null, entries: 0, error: e instanceof Error ? e.message : String(e) };
  }
}
```

- [ ] **Step 2: Write the check**

Create `conformance/tier1/service-dids.test.ts`:

```ts
import { it } from "vitest";
import { listCastServices } from "../lib/cast-services";
import { check } from "../lib/report";
import { ResolverClient } from "../lib/resolver-client";
import { serviceDid, webvhLogHealth } from "../lib/service-did";
import { describeNetworks } from "../lib/suite";

describeNetworks("service DIDs [CONF-T1-5]", (network) => {
  const resolver = new ResolverClient(network.resolver as string);
  for (const service of listCastServices(network)) {
    const base = { tier: "t1" as const, network: network.id, cast: service.cast, service: service.id };

    it.concurrent(`${service.cast}/${service.id} did:webvh log is signed with a fully qualified verification method`, () =>
      check({ ...base, check: "webvh-log-signed", clause: "CONF-T1-5" }, async () => {
        const health = await webvhLogHealth(service);
        return {
          outcome: health.ok ? "works" : "broken",
          cause: health.ok ? undefined : `unrepairable-by-rolling: ${health.error}`,
          evidence: { host: service.host, verificationMethod: health.verificationMethod, entries: health.entries },
        };
      }),
    );

    it.concurrent(`${service.cast}/${service.id} resolves at the trust resolver`, () =>
      check({ ...base, check: "did-resolves", clause: "CONF-T1-5" }, async () => {
        const { did, webvh } = await serviceDid(service);
        const answer = (await resolver.resolve(did)) ?? (await resolver.resolveFresh(did));
        const ok = answer !== null && answer.did === did;
        return {
          outcome: ok ? "works" : "broken",
          cause: ok ? undefined : answer === null ? "resolver has no verdict after refresh" : `resolver echoes ${answer.did}`,
          evidence: { did, webvh, trustStatus: answer?.trustStatus, evaluatedAt: answer?.evaluatedAt, dereferenceErrors: answer?.dereferenceErrors, failedCredentials: answer?.failedCredentials },
        };
      }),
    );
  }
});
```

- [ ] **Step 3: Run it**

Run: `npx vitest run tier1/service-dids.test.ts 2>&1 | tail -40 && node -e 'const r=require("./results/latest.json");console.log(r.cells.filter(c=>c.check==="webvh-log-signed"&&c.outcome!=="works").map(c=>c.cast+"/"+c.service))'`
Expected: `webvh-log-signed` broken for the services `scripts/wallet-matrix/check-dids.sh` flags today (14 of 44); run that script and compare the two lists, they must match. `did-resolves` works for every reachable service; CCM services fail both (never deployed) and record `unknown` with the connection error.

- [ ] **Step 4: Commit**

```bash
git add lib/service-did.ts tier1/service-dids.test.ts
git commit -m "feat: tier 1 service did and webvh log checks"
```

---

### Task 8: Transport [CONF-T1-6]

**Files:**
- Create: `conformance/lib/tls.ts`, `conformance/lib/mints.ts`, `conformance/tier1/transport.test.ts`

**Interfaces:**
- Produces: `inspectTls(host): Promise<TlsReport>`; `mintsEnabled(): boolean` (`CONFORMANCE_MINTS === "1"`); `issuanceParamsFor(service): { credential?: string; params?: Record<string, string> }` from `scenarios.yaml` (the first issue scenario naming the service on any rail).

- [ ] **Step 1: Write the helpers**

Create `conformance/lib/tls.ts`:

```ts
import tls from "node:tls";

export type TlsReport = { authorized: boolean; error?: string; subject?: string; altNames?: string; validTo?: string };

export function inspectTls(host: string): Promise<TlsReport> {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port: 443, servername: host, rejectUnauthorized: false, timeout: 15_000 }, () => {
      const cert = socket.getPeerCertificate();
      resolve({
        authorized: socket.authorized,
        error: socket.authorizationError ? String(socket.authorizationError) : undefined,
        subject: cert.subject?.CN,
        altNames: cert.subjectaltname,
        validTo: cert.valid_to,
      });
      socket.end();
    });
    socket.on("error", (e) => resolve({ authorized: false, error: e.message }));
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ authorized: false, error: "timeout" });
    });
  });
}
```

`rejectUnauthorized: false` is deliberate: this probe reports the certificate's validity instead of aborting on it; no data is exchanged over the socket.

Create `conformance/lib/mints.ts`:

```ts
import type { CastService } from "./cast-services";
import { listScenarios, serviceFor } from "./scenarios";

export const mintsEnabled = (): boolean => process.env.CONFORMANCE_MINTS === "1";

export function issuanceParamsFor(service: CastService): { credential?: string; params?: Record<string, string> } {
  const scenario = listScenarios().find((s) => s.kind === "issue" && (serviceFor(s, "anoncreds") === service.id || serviceFor(s, "openid4vc-sdjwt") === service.id));
  return scenario ? { credential: scenario.credential, params: scenario.params } : {};
}
```

- [ ] **Step 2: Write the check**

Create `conformance/tier1/transport.test.ts`:

```ts
import { describe, it } from "vitest";
import { inScope, listCastServices } from "../lib/cast-services";
import { fetchWithTimeout } from "../lib/http";
import { issuanceParamsFor, mintsEnabled } from "../lib/mints";
import { mintIssuance } from "../lib/playground-client";
import { check } from "../lib/report";
import { describeNetworks } from "../lib/suite";
import { inspectTls } from "../lib/tls";

describeNetworks("transport [CONF-T1-6]", (network) => {
  const services = listCastServices(network);
  for (const service of services) {
    const base = { tier: "t1" as const, network: network.id, cast: service.cast, service: service.id };

    it.concurrent(`${service.cast}/${service.id} serves a real certificate for its host`, () =>
      check({ ...base, check: "tls-certificate", clause: "CONF-T1-6" }, async () => {
        const report = await inspectTls(service.host);
        const named = report.altNames?.includes(`DNS:${service.host}`) ?? false;
        const ok = report.authorized && named;
        return { outcome: ok ? "works" : "broken", cause: ok ? undefined : (report.error ?? `certificate for ${report.subject} does not name ${service.host}`), evidence: { ...report } };
      }),
    );

    it.concurrent(`${service.cast}/${service.id} refuses cleartext`, () =>
      check({ ...base, check: "no-cleartext", clause: "CONF-T1-6" }, async () => {
        try {
          const res = await fetchWithTimeout(`http://${service.host}/`, { redirect: "manual", timeoutMs: 15_000 });
          const location = res.headers.get("location") ?? "";
          const redirected = res.status >= 300 && res.status < 400 && location.startsWith("https://");
          return { outcome: redirected ? "works" : "broken", cause: redirected ? undefined : `cleartext answered ${res.status} -> ${location}`, evidence: { status: res.status, location } };
        } catch (e) {
          return { outcome: "works", evidence: { refused: e instanceof Error ? e.message : String(e) } };
        }
      }),
    );
  }

  describe.skipIf(!mintsEnabled())("short links (CONFORMANCE_MINTS=1)", () => {
    for (const service of services.filter((s) => inScope(s) && (s.oid4vcRole === "issuer" || s.demoPerm === "issuer"))) {
      it.concurrent(`${service.cast}/${service.id} invitation short link opens for a browser`, () =>
        check({ tier: "t1", check: "short-link-browser", clause: "CONF-T1-6", network: network.id, cast: service.cast, service: service.id }, async () => {
          const mint = await mintIssuance(network, service, { format: "anoncreds", demoParams: "", ...issuanceParamsFor(service) });
          const res = await fetchWithTimeout(mint.url, { headers: { accept: "text/html,application/xhtml+xml" }, redirect: "manual" });
          const location = res.headers.get("location") ?? "";
          const ok = res.status < 500;
          return {
            outcome: ok ? "works" : "broken",
            cause: ok ? undefined : `HTTP ${res.status} with Accept: text/html`,
            evidence: { url: mint.url, status: res.status, locationBytes: Buffer.byteLength(location), locationScheme: location.split(":")[0] },
          };
        }),
      );
    }
  });
});
```

The redirect header size is evidence only: the failure a browser sees is the 5xx from the ingress, and that is what the check asserts.

- [ ] **Step 3: Run it**

Run: `CONFORMANCE_MINTS=1 npx vitest run tier1/transport.test.ts 2>&1 | tail -40`
Expected: `tls-certificate` broken for CCM (ingress default certificate), works elsewhere; `no-cleartext` works everywhere; `short-link-browser` broken for `taquilla` (the known 502), to be read for the demo issuers. Run once more without `CONFORMANCE_MINTS` and confirm the short-link block is skipped.

- [ ] **Step 4: Commit**

```bash
git add lib/tls.ts lib/mints.ts tier1/transport.test.ts
git commit -m "feat: tier 1 transport checks, including the browser short-link redirect"
```

---

### Task 9: Offer and request links per wallet rail [CONF-T1-4] [CONF-PROF-4]

**Files:**
- Create: `conformance/lib/links.ts`, `conformance/lib/links.test.ts`, `conformance/lib/incompatibility.ts`, `conformance/lib/incompatibility.test.ts`, `conformance/tier1/offer-links.test.ts`

**Interfaces:**
- Produces:
  - `parseWalletLink(url): { scheme: string; params: URLSearchParams }`
  - `decodeJwtParts(jwt): { header: Record<string, unknown>; payload: Record<string, unknown> }`
  - `fetchCredentialOffer(uri)`, `fetchAuthorizationRequest(uri)`, `fetchOobInvitation(url)` returning zod-validated objects
  - `clientIdMatches(clientId: string, expected: "x509_hash" | "did"): boolean` (`x509_hash:` prefix; or `did:` / `decentralized_identifier:did:`)
  - `incompatibilityFor(build, scenarioId, serviceId): { cause: string; reference?: string } | null` from `build.incompatibilities` (`scenarios: all` or listed; `services` absent or listed)

- [ ] **Step 1: Write the failing unit tests**

Create `conformance/lib/links.test.ts`:

```ts
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
```

Create `conformance/lib/incompatibility.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { WalletBuild } from "../../app/lib/wallet-profiles";
import { incompatibilityFor } from "./incompatibility";

const build = (incompatibilities: WalletBuild["incompatibilities"]): WalletBuild => ({
  kind: "store",
  label: "x",
  obtain: "https://example.org",
  identity: { package: "p", version: "1" },
  platforms: ["android"],
  promises: "x",
  incompatibilities,
});

describe("incompatibilityFor", () => {
  it("matches every scenario when scoped to all", () => {
    const b = build([{ cause: "signed metadata", reference: "https://example.org/issues/1", scenarios: "all", verified: "2026-09-13" }]);
    expect(incompatibilityFor(b, "issue-accredited", "demo-issuer-accredited")).toEqual({ cause: "signed metadata", reference: "https://example.org/issues/1" });
  });

  it("matches only the listed scenarios and services", () => {
    const b = build([{ cause: "bad log", scenarios: ["issue-untrusted"], services: ["demo-untrusted"], verified: "2026-09-08" }]);
    expect(incompatibilityFor(b, "issue-untrusted", "demo-untrusted")).toEqual({ cause: "bad log", reference: undefined });
    expect(incompatibilityFor(b, "issue-untrusted", "demo-issuer-untrusted")).toBeNull();
    expect(incompatibilityFor(b, "issue-accredited", "demo-untrusted")).toBeNull();
  });

  it("returns null without incompatibilities", () => {
    expect(incompatibilityFor(build(undefined), "issue-accredited", "x")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run lib/links.test.ts lib/incompatibility.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Write the helpers**

Create `conformance/lib/links.ts`:

```ts
import { z } from "zod";
import { fetchJson, fetchText } from "./http";

export function parseWalletLink(url: string): { scheme: string; params: URLSearchParams } {
  const m = /^([a-z][a-z0-9.+-]*):\/\/([^?]*)\??(.*)$/i.exec(url);
  if (!m || !m[1]) throw new Error(`link has no scheme: ${url}`);
  return { scheme: m[1].toLowerCase(), params: new URLSearchParams(m[3] ?? "") };
}

const b64 = (s: string): string => Buffer.from(s, "base64url").toString("utf8");

export function decodeJwtParts(jwt: string): { header: Record<string, unknown>; payload: Record<string, unknown> } {
  const [h, p] = jwt.trim().split(".");
  if (!h || !p) throw new Error("not a compact JWT");
  const object = z.record(z.string(), z.unknown());
  return { header: object.parse(JSON.parse(b64(h))), payload: object.parse(JSON.parse(b64(p))) };
}

export function clientIdMatches(clientId: string, expected: "x509_hash" | "did"): boolean {
  if (expected === "x509_hash") return clientId.startsWith("x509_hash:");
  return clientId.startsWith("did:") || clientId.startsWith("decentralized_identifier:did:");
}

export const CredentialOfferSchema = z.looseObject({
  credential_issuer: z.url(),
  credential_configuration_ids: z.array(z.string().min(1)).min(1),
  grants: z.record(z.string(), z.unknown()),
});

export const OobInvitationSchema = z.looseObject({
  "@type": z.string().regex(/out-of-band\/1\.[01]\/invitation$/),
  "@id": z.string().min(1),
  label: z.string().min(1),
  services: z.array(z.union([z.string(), z.looseObject({ serviceEndpoint: z.string().min(1) })])).min(1),
  "requests~attach": z.array(z.unknown()).optional(),
});

export async function fetchCredentialOffer(uri: string): Promise<z.infer<typeof CredentialOfferSchema>> {
  return CredentialOfferSchema.parse(await fetchJson(uri));
}

export async function fetchAuthorizationRequest(uri: string): Promise<{ jwt: string; header: Record<string, unknown>; payload: Record<string, unknown> }> {
  const jwt = await fetchText(uri, { headers: { accept: "application/oauth-authz-req+jwt, */*" } });
  return { jwt, ...decodeJwtParts(jwt) };
}

export async function fetchOobInvitation(url: string): Promise<z.infer<typeof OobInvitationSchema>> {
  return OobInvitationSchema.parse(await fetchJson(url));
}
```

Create `conformance/lib/incompatibility.ts`:

```ts
import type { WalletBuild } from "../../app/lib/wallet-profiles";

export function incompatibilityFor(build: WalletBuild, scenarioId: string, serviceId: string): { cause: string; reference?: string } | null {
  for (const i of build.incompatibilities ?? []) {
    const scenarioHit = i.scenarios === "all" || (i.scenarios as readonly string[]).includes(scenarioId);
    const serviceHit = !i.services || i.services.includes(serviceId);
    if (scenarioHit && serviceHit) return { cause: i.cause, reference: i.reference };
  }
  return null;
}
```

- [ ] **Step 4: Run the unit tests**

Run: `npx vitest run lib/links.test.ts lib/incompatibility.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Write the check**

Create `conformance/tier1/offer-links.test.ts`:

```ts
import { describe, it } from "vitest";
import { effectiveDemoParams, effectivePresentation, listWalletProfiles, type WalletBuild, type WalletProfile } from "../../app/lib/wallet-profiles";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import { incompatibilityFor } from "../lib/incompatibility";
import { clientIdMatches, fetchAuthorizationRequest, fetchCredentialOffer, fetchOobInvitation, parseWalletLink } from "../lib/links";
import { mintsEnabled } from "../lib/mints";
import { mintIssuance, mintPresentation, type Mint, type Rail } from "../lib/playground-client";
import { profilesDir } from "../lib/profiles-dir";
import { check, type Verdict } from "../lib/report";
import { listScenarios, serviceFor, type Scenario } from "../lib/scenarios";
import { describeNetworks } from "../lib/suite";

const profiles = listWalletProfiles(profilesDir());
const scenarios = listScenarios();

type Target = { profile: WalletProfile; build: WalletBuild; rail: Rail; scenario: Scenario; service: CastService };

function targets(services: CastService[]): Target[] {
  const out: Target[] = [];
  for (const profile of profiles)
    for (const rail of profile.rails)
      for (const scenario of scenarios) {
        const service = services.find((s) => s.id === serviceFor(scenario, rail));
        if (!service || !inScope(service)) continue;
        for (const build of profile.builds) out.push({ profile, build, rail, scenario, service });
      }
  return out;
}

const hostOf = (u: string): string => new URL(u).host;

async function checkOffer(t: Target, mint: Mint): Promise<string[]> {
  const problems: string[] = [];
  const link = parseWalletLink(mint.url);
  if (!t.profile.openid4vc?.offerSchemes.includes(link.scheme)) problems.push(`scheme ${link.scheme} not registered by ${t.profile.id}`);
  const uri = link.params.get("credential_offer_uri");
  if (!uri) return [...problems, "no credential_offer_uri"];
  if (!/credential_offer_uri=https%3A%2F%2F/.test(mint.url)) problems.push("credential_offer_uri is not percent-encoded");
  if (hostOf(uri) !== t.service.host) problems.push(`offer uri host ${hostOf(uri)} is not ${t.service.host}`);
  const offer = await fetchCredentialOffer(uri);
  if (hostOf(offer.credential_issuer) !== t.service.host) problems.push(`credential_issuer ${offer.credential_issuer} is off-host`);
  if (!("urn:ietf:params:oauth:grant-type:pre-authorized_code" in offer.grants)) problems.push("no pre-authorized_code grant");
  return problems;
}

async function checkRequest(t: Target, mint: Mint): Promise<string[]> {
  const problems: string[] = [];
  const presentation = effectivePresentation(t.profile, t.build);
  if (!presentation) return ["profile has no presentation rail"];
  const link = parseWalletLink(mint.url);
  if (!t.profile.openid4vc?.requestSchemes.includes(link.scheme)) problems.push(`scheme ${link.scheme} not registered by ${t.profile.id}`);
  const clientId = link.params.get("client_id") ?? "";
  if (!clientIdMatches(clientId, presentation.clientId)) problems.push(`client_id ${clientId} is not a ${presentation.clientId} client id`);
  const uri = link.params.get("request_uri");
  if (!uri) return [...problems, "no request_uri"];
  if (!/request_uri=https%3A%2F%2F/.test(mint.url)) problems.push("request_uri is not percent-encoded");
  if (hostOf(uri) !== t.service.host) problems.push(`request uri host ${hostOf(uri)} is not ${t.service.host}`);
  const { header, payload } = await fetchAuthorizationRequest(uri);
  if (header.typ !== "oauth-authz-req+jwt") problems.push(`typ ${String(header.typ)}`);
  if (presentation.clientId === "x509_hash" && !(Array.isArray(header.x5c) && header.x5c.length > 0)) problems.push("x509_hash request without x5c header");
  if (presentation.clientId === "did" && typeof header.kid !== "string") problems.push("did request without kid header");
  if (payload.client_id !== clientId) problems.push("payload client_id differs from the link");
  if (payload.response_mode !== presentation.responseMode) problems.push(`response_mode ${String(payload.response_mode)} is not ${presentation.responseMode}`);
  if (typeof payload.response_uri !== "string" || hostOf(payload.response_uri) !== t.service.host) problems.push("response_uri is missing or off-host");
  if (typeof payload.nonce !== "string" || typeof payload.state !== "string") problems.push("nonce or state missing");
  const hasDcql = typeof payload.dcql_query === "object" && payload.dcql_query !== null;
  const hasPe = typeof payload.presentation_definition === "object" && payload.presentation_definition !== null;
  if (presentation.query === "dcql" && !hasDcql) problems.push("dcql rail without dcql_query");
  if (presentation.query === "presentation_exchange" && !hasPe) problems.push("presentation_exchange rail without presentation_definition");
  return problems;
}

async function checkInvitation(t: Target, mint: Mint): Promise<string[]> {
  const problems: string[] = [];
  const link = parseWalletLink(mint.url);
  if (!t.profile.didcomm?.invitationSchemes.includes(link.scheme)) problems.push(`scheme ${link.scheme} not registered by ${t.profile.id}`);
  if (hostOf(mint.url) !== t.service.host) problems.push(`link host ${hostOf(mint.url)} is not ${t.service.host}`);
  const invitation = await fetchOobInvitation(mint.url);
  const endpoints = invitation.services.map((s) => (typeof s === "string" ? s : s.serviceEndpoint));
  if (!endpoints.some((e) => e.startsWith("wss://") || e.startsWith("https://"))) problems.push(`no secure service endpoint in ${endpoints.join(", ")}`);
  if (!invitation["requests~attach"]?.length) problems.push("no attached request");
  return problems;
}

describeNetworks("offer and request links [CONF-T1-4]", (network) => {
  describe.skipIf(!mintsEnabled())("live mints (CONFORMANCE_MINTS=1)", () => {
    for (const t of targets(listCastServices(network))) {
      const base = { tier: "t1" as const, check: `link:${t.scenario.kind}`, clause: "CONF-T1-4", network: network.id, cast: t.service.cast, service: t.service.id, wallet: t.profile.id, build: t.build.kind, scenario: t.scenario.id };
      it.concurrent(`${t.profile.id}/${t.build.kind} ${t.scenario.id} on ${t.service.id}`, () =>
        check(base, async (): Promise<Verdict> => {
          const incompatible = incompatibilityFor(t.build, t.scenario.id, t.service.id);
          if (incompatible) return { outcome: "incompatible-by-design", cause: incompatible.cause, reference: incompatible.reference };
          const demoParams = effectiveDemoParams(t.profile, t.build, t.rail);
          const mint = t.scenario.kind === "issue"
            ? await mintIssuance(network, t.service, { format: t.rail, demoParams, credential: t.scenario.credential, params: t.scenario.params })
            : await mintPresentation(network, t.service, { format: t.rail, demoParams, login: t.scenario.login });
          const evidence = { url: mint.url, kind: mint.kind, rail: mint.rail, demoParams };
          if (mint.kind === "invitation")
            return { outcome: "unknown", cause: "the service answers with its plain invitation page; connection-level scenarios are proven by Tier 2", evidence };
          const problems = t.rail === "anoncreds" ? await checkInvitation(t, mint) : t.scenario.kind === "issue" ? await checkOffer(t, mint) : await checkRequest(t, mint);
          return { outcome: problems.length ? "broken" : "works", cause: problems.join(" | ") || undefined, evidence };
        }),
      );
    }
  });
});
```

- [ ] **Step 6: Run it**

Run: `CONFORMANCE_MINTS=1 npx vitest run tier1/offer-links.test.ts 2>&1 | tail -60`
Expected: `works` for every listed build on the demo cast and eventos; `incompatible-by-design` for the EUDI publisher build on every scenario and for the swiyu store build on `demo-untrusted`; `unknown` for anoncreds scenarios whose service answers with a plain invitation. Any `broken` cell is a finding. Do not change a profile to make a cell pass unless the roadmap facts say the profile is wrong.

- [ ] **Step 7: Commit**

```bash
git add lib/links.ts lib/links.test.ts lib/incompatibility.ts lib/incompatibility.test.ts tier1/offer-links.test.ts
git commit -m "feat: tier 1 offer and request link checks per wallet rail"
```

---

### Task 10: Human-visible strings [CONF-T1-7]

**Files:**
- Create: `conformance/lib/strings.ts`, `conformance/lib/strings.test.ts`, `conformance/tier1/strings.test.ts`

**Interfaces:**
- Produces: `encodingDamage(value): string | null`; `collectStrings(value, path?): { path: string; value: string }[]`.

- [ ] **Step 1: Write the failing unit tests**

Create `conformance/lib/strings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { collectStrings, encodingDamage } from "./strings";

const cp = String.fromCodePoint;

describe("encodingDamage", () => {
  it("flags go-style map serialisation, mojibake, replacement characters and unreplaced placeholders", () => {
    expect(encodingDamage("map[Revolución del Contenido Empresarial:Costa Rica]")).toBe("map-serialisation");
    expect(encodingDamage(`Taquilla Boleter${cp(0xc3)}${cp(0xad)}a`)).toBe("mojibake");
    expect(encodingDamage(`Panam${cp(0xfffd)}`)).toBe("replacement-character");
    expect(encodingDamage("__SERVICE_NAME__")).toBe("template-placeholder");
    expect(encodingDamage("[object Object]")).toBe("object-tostring");
    expect(encodingDamage("undefined")).toBe("undefined-literal");
  });

  it("accepts real text", () => {
    expect(encodingDamage("Creando un mundo confiable: Costa Rica")).toBeNull();
    expect(encodingDamage("Taquilla Boletería S.A.S. (demo)")).toBeNull();
    expect(encodingDamage("Panamá")).toBeNull();
  });
});

describe("collectStrings", () => {
  it("walks nested json", () => {
    expect(collectStrings({ a: "x", b: [{ c: "y" }], d: 1 })).toEqual([
      { path: "a", value: "x" },
      { path: "b.0.c", value: "y" },
    ]);
  });
});
```

- [ ] **Step 2: Run to verify failure, then write the helper**

Run: `npx vitest run lib/strings.test.ts` (FAIL, module not found), then create `conformance/lib/strings.ts`:

```ts
const cp = String.fromCodePoint;

const MOJIBAKE = new RegExp(`${cp(0xc3)}[${cp(0x80)}-${cp(0xbf)}]|${cp(0xe2)}${cp(0x20ac)}`);
const REPLACEMENT = new RegExp(cp(0xfffd));

const PATTERNS: [string, RegExp][] = [
  ["map-serialisation", /\bmap\[/],
  ["replacement-character", REPLACEMENT],
  ["mojibake", MOJIBAKE],
  ["template-placeholder", /__[A-Z][A-Z0-9_]*__/],
  ["object-tostring", /\[object Object\]/],
  ["undefined-literal", /^(undefined|null|NaN)$/],
];

export function encodingDamage(value: string): string | null {
  for (const [name, re] of PATTERNS) if (re.test(value)) return name;
  return null;
}

export function collectStrings(value: unknown, path = ""): { path: string; value: string }[] {
  if (typeof value === "string") return [{ path, value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => collectStrings(v, path ? `${path}.${i}` : String(i)));
  if (value && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => collectStrings(v, path ? `${path}.${k}` : k));
  return [];
}
```

Run: `npx vitest run lib/strings.test.ts`
Expected: PASS.

- [ ] **Step 3: Write the check**

Create `conformance/tier1/strings.test.ts`:

```ts
import { describe, it } from "vitest";
import { inScope, listCastServices } from "../lib/cast-services";
import { fetchJson } from "../lib/http";
import { fetchIssuerMetadata, vctDocumentUrl } from "../lib/issuer-metadata";
import { fetchOobInvitation } from "../lib/links";
import { issuanceParamsFor, mintsEnabled } from "../lib/mints";
import { mintIssuance, mintPresentation } from "../lib/playground-client";
import { check } from "../lib/report";
import { ResolverClient } from "../lib/resolver-client";
import { serviceDid } from "../lib/service-did";
import { collectStrings, encodingDamage } from "../lib/strings";
import { describeNetworks } from "../lib/suite";

type Damage = { source: string; path: string; value: string; damage: string };

function scan(source: string, value: unknown): Damage[] {
  return collectStrings(value).flatMap(({ path, value }) => {
    const damage = encodingDamage(value);
    return damage ? [{ source, path, value, damage }] : [];
  });
}

const describeDamage = (damage: Damage[]): string | undefined => damage.map((d) => `${d.source}.${d.path}: ${d.damage}`).join(" | ") || undefined;

describeNetworks("human-visible strings [CONF-T1-7]", (network) => {
  const resolver = new ResolverClient(network.resolver as string);
  const services = listCastServices(network);
  for (const service of services) {
    const base = { tier: "t1" as const, clause: "CONF-T1-7", network: network.id, cast: service.cast, service: service.id };

    it.concurrent(`${service.cast}/${service.id} trust credentials read cleanly`, () =>
      check({ ...base, check: "strings:ecs-claims" }, async () => {
        const { did } = await serviceDid(service);
        const answer = await resolver.resolve(did);
        if (!answer || answer.credentials.length === 0)
          return { outcome: "unknown", cause: answer ? "resolver holds no credentials for this service (cached negative or never provisioned)" : "resolver has no verdict", evidence: { did, trustStatus: answer?.trustStatus, evaluatedAt: answer?.evaluatedAt } };
        const damage = answer.credentials.flatMap((c) => scan(`${c.ecsType} claims`, c.claims));
        return { outcome: damage.length ? "broken" : "works", cause: describeDamage(damage), evidence: { did, damage } };
      }),
    );

    if (service.oid4vcRole === "issuer")
      it.concurrent(`${service.cast}/${service.id} issuer metadata and vct documents read cleanly`, () =>
        check({ ...base, check: "strings:issuer-metadata" }, async () => {
          const { raw } = await fetchIssuerMetadata(service);
          const damage = scan("issuer metadata", raw);
          const configurations = Object.keys((raw as { credential_configurations_supported?: Record<string, unknown> }).credential_configurations_supported ?? {});
          for (const id of configurations) {
            const url = vctDocumentUrl(raw, id);
            if (url) damage.push(...scan(`vct ${id}`, await fetchJson(url)));
          }
          return { outcome: damage.length ? "broken" : "works", cause: describeDamage(damage), evidence: { damage } };
        }),
      );
  }

  describe.skipIf(!mintsEnabled())("invitation labels (CONFORMANCE_MINTS=1)", () => {
    for (const service of services.filter((s) => inScope(s) && (s.oid4vcRole !== null || s.demoPerm !== null))) {
      it.concurrent(`${service.cast}/${service.id} DIDComm invitation label reads cleanly`, () =>
        check({ tier: "t1", check: "strings:invitation-label", clause: "CONF-T1-7", network: network.id, cast: service.cast, service: service.id }, async () => {
          const verifier = service.oid4vcRole === "verifier" || service.demoPerm === "verifier";
          const eventosVerifier = verifier && service.cast === "eventos";
          const mint = verifier
            ? await mintPresentation(network, service, { format: "anoncreds", demoParams: "", login: eventosVerifier ? { evento: service.id.replace(/^evento-/, ""), rol: "asistente" } : undefined })
            : await mintIssuance(network, service, { format: "anoncreds", demoParams: "", ...issuanceParamsFor(service) });
          if (mint.kind === "invitation") return { outcome: "unknown", cause: "plain invitation page, no label to read", evidence: { url: mint.url } };
          const invitation = await fetchOobInvitation(mint.url);
          const damage = scan("invitation", { label: invitation.label });
          return { outcome: damage.length ? "broken" : "works", cause: describeDamage(damage), evidence: { url: mint.url, label: invitation.label, damage } };
        }),
      );
    }
  });
});
```

- [ ] **Step 4: Run it**

Run: `CONFORMANCE_MINTS=1 npx vitest run tier1/strings.test.ts 2>&1 | tail -40`
Expected: `strings:invitation-label` broken for the three eventos verifiers if their label is still serialised as `map[…]` (the open bug); everything else works or is `unknown` with a stated cause. Any other damage is a new finding.

- [ ] **Step 5: Commit**

```bash
git add lib/strings.ts lib/strings.test.ts tier1/strings.test.ts
git commit -m "feat: tier 1 encoding check on human-visible strings"
```

---

### Task 11: Summary, CI job and nightly workflow

**Files:**
- Create: `conformance/bin/summary.mjs`
- Modify: `.github/workflows/ci.yml` (add job `conformance-t1`)
- Create: `.github/workflows/conformance.yml`
- Modify: `conformance/package.json` (script `summary`)

- [ ] **Step 1: Write the summary renderer**

Create `conformance/bin/summary.mjs`:

```js
import { readFileSync } from "node:fs";

const file = process.argv[2] ?? new URL("../results/latest.json", import.meta.url);
const results = JSON.parse(readFileSync(file, "utf8"));
const lines = [];
const cell = (v) => String(v ?? "").replaceAll("|", "\\|").slice(0, 200);
const table = (headers, rows) => {
  lines.push(`| ${headers.join(" | ")} |`);
  lines.push(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const row of rows) lines.push(`| ${row.map(cell).join(" | ")} |`);
  lines.push("");
};

lines.push(`## Conformance ${results.id}`);
lines.push("");
lines.push(`Run ${results.startedAt} to ${results.finishedAt} on \`${results.gitBranch}\` @ \`${results.gitSha.slice(0, 8)}\`, networks: ${results.networks.join(", ")}`);
lines.push("");
table(["outcome", "cells"], Object.entries(results.totals));

const rowOf = (c) => [c.check, c.clause, `${c.cast ?? ""}/${c.service ?? ""}`, c.wallet ?? "", c.build ?? "", c.scenario ?? "", c.cause ?? ""];
const broken = results.cells.filter((c) => c.outcome === "broken");
const incompatible = results.cells.filter((c) => c.outcome === "incompatible-by-design");
const unknown = results.cells.filter((c) => c.outcome === "unknown");
if (broken.length) {
  lines.push("### Broken");
  table(["check", "clause", "service", "wallet", "build", "scenario", "cause"], broken.map(rowOf));
} else {
  lines.push("Nothing broken.");
  lines.push("");
}
if (incompatible.length) {
  lines.push("### Incompatible by design (not regressions)");
  table(["check", "clause", "service", "wallet", "build", "scenario", "cause"], incompatible.map(rowOf));
}
if (unknown.length) {
  lines.push(`### Unknown (${unknown.length})`);
  table(["check", "service", "cause"], unknown.map((c) => [c.check, `${c.cast ?? ""}/${c.service ?? ""}`, c.cause ?? ""]));
}
if (results.services.length) {
  lines.push("### Versions");
  table(["service", "pinned", "serving"], results.services.map((s) => [`${s.cast}/${s.id}`, s.pinnedTag, s.servingTag ?? `unknown (package ${s.packageVersion ?? "?"})`]));
}
process.stdout.write(`${lines.join("\n")}\n`);
```

Add to `conformance/package.json` scripts: `"summary": "node bin/summary.mjs"`.

Run: `npm run summary | head -40`
Expected: a markdown summary of the latest local run with separate tables for broken, incompatible and unknown cells.

- [ ] **Step 2: Add the per-change CI job**

The `ci` job already installs, typechecks and runs `npm test` inside `conformance/` (added by plan A's final fix). Once `tier1/` exists, `npm test` would run the network checks there too. Add the script `"test:lib": "vitest run lib"` to `conformance/package.json` and change that `ci` job step from `npm test` to `npm run test:lib`, so the site job keeps only the unit tests and the network checks live in their own job.

In `.github/workflows/ci.yml`, add a second job after `ci`:

```yaml
  conformance-t1:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: |
            package-lock.json
            conformance/package-lock.json
      - run: npm ci
      - run: npm ci
        working-directory: conformance
      - run: npm run typecheck
        working-directory: conformance
      - run: npm run t1
        working-directory: conformance
        env:
          CONFORMANCE_RUN_ID: ci-${{ github.run_id }}-${{ github.run_attempt }}
      - if: always()
        run: npm run summary >> "$GITHUB_STEP_SUMMARY"
        working-directory: conformance
      - if: always()
        uses: actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02 # v4.6.2
        with:
          name: conformance-t1-${{ github.run_id }}-${{ github.run_attempt }}
          path: conformance/results/
          retention-days: 90
```

The root `npm ci` is required: the suites import `app/lib/wallet-profiles.ts`, which resolves `zod` and `js-yaml` from the root `node_modules`. Confirm the upload-artifact SHA before committing: `gh api repos/actions/upload-artifact/git/ref/tags/v4.6.2 --jq .object.sha`, and if that is a tag object resolve it once more with `gh api repos/actions/upload-artifact/git/tags/<sha> --jq .object.sha`. Use whatever v4.6.2 resolves to.

- [ ] **Step 3: Add the nightly workflow**

Create `.github/workflows/conformance.yml`:

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
jobs:
  tier1:
    runs-on: ubuntu-latest
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
      - run: npm run t1
        working-directory: conformance
        env:
          CONFORMANCE_RUN_ID: nightly-${{ github.run_id }}-${{ github.run_attempt }}
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
          name: conformance-nightly-${{ github.run_id }}-${{ github.run_attempt }}
          path: conformance/results/
          retention-days: 90
```

`CONFORMANCE_NETWORK` empty means every testable network (`selectedNetworks` treats `""` as unset). `ubuntu-latest` ships `kubectl`.

- [ ] **Step 4: Validate the workflow files**

Run (root): `yq '.jobs | keys' .github/workflows/ci.yml && yq '.on | keys' .github/workflows/conformance.yml`
Expected: `ci` and `conformance-t1`; `schedule` and `workflow_dispatch`.

- [ ] **Step 5: Commit**

```bash
git add conformance/bin/summary.mjs conformance/package.json .github/workflows/ci.yml .github/workflows/conformance.yml
git commit -m "ci: run the tier 1 conformance checks on every change and nightly"
```

---

### Task 12: Full run, README, pull request

**Files:**
- Modify: `conformance/README.md` (running and reading results)

- [ ] **Step 1: Run the whole tier locally, with mints, and keep the results**

Run: `CONFORMANCE_MINTS=1 CONFORMANCE_RUN_ID=local-$(date +%Y%m%d-%H%M) npm run t1 2>&1 | tail -40; npm run summary`
Expected: a summary whose broken table holds only the known failures: `metadata-both-shapes` on demo issuers before `.42`, `webvh-log-signed` on the 14 pre-fix services, `short-link-browser` on taquilla, `strings:invitation-label` on the eventos verifiers, `tls-certificate` on CCM; `serving-version` unknown everywhere (no cluster). Anything else is a new finding: list it for Maxime with the evidence block.

- [ ] **Step 2: Document reading a run**

Append to `conformance/README.md`:

```markdown
## Reading a run

`npm run t1` writes `results/<run id>/results.json` and copies it to `results/latest.json`; `npm run summary`
renders the latest run as markdown (CI puts it in the job summary). Every cell names its check, the clause it
proves, the network, the service and, for wallet-specific checks, the wallet, build and scenario, with one
outcome: `works`, `broken`, `incompatible-by-design` (with cause and reference), `unknown` (the check could
not read what it needed and says why) or `not-testable` (a network without resolver or casts). Cells are
sorted by code point, so `diff` between two `results.json` shows exactly what changed.

Environment: `CONFORMANCE_NETWORK` selects one network; `CONFORMANCE_CASTS` limits the casts that receive
live mints (default `demo,eventos`); `CONFORMANCE_MINTS=1` enables the checks that create sessions on the
services (off in the per-change CI job, on nightly); `CONFORMANCE_K8S_NAMESPACE` enables the cluster read of
the image tag actually serving and the detection of services that rolled during the run (nightly only).
```

- [ ] **Step 3: Root checks**

Run (root): `npm run lint && npm run typecheck && npm run validate:registry && npx vitest run && npm run build 2>&1 | tail -3`
Expected: green.

- [ ] **Step 4: Commit, push, PR**

```bash
git add conformance/README.md
git commit -m "docs: how to run and read the tier 1 conformance results"
git push -u origin HEAD
```

PR title: `feat: tier 1 wallet conformance checks`

Body (fill the last paragraph from Step 1):

```
Every wallet failure we found in the field was visible from what the wallet fetches, and none of it was checked. This adds the Tier 1 contract checks from the conformance guideline as a vitest suite under `conformance/tier1`: issuer metadata parsed once per draft the fleet speaks and in both display shapes (the `.42` regression class), authorization-server discovery in both forms, offer and request links per wallet rail, DID resolution and did:webvh log signatures, TLS and the browser redirect on short links, encoding damage in visible strings, and the vs-agent tag actually serving versus the one the repo pins. Read-only checks run on every PR and push; the ones that mint sessions run nightly with cluster access, which also lets the run mark anything read while a service was rolling.

Each check writes a cell naming what it tested and one of `works`, `broken`, `incompatible-by-design`, `unknown` or `not-testable`, even when the check itself fails; the run merges them into `results.json`, sorted so two runs diff line by line, and the job summary shows what needs attention. Rails, schemes, drafts, mint parameters and known incompatibilities come from the wallet profiles, endpoints from `networks.yaml`, services from the cast workflow configs.

First run findings: <from Step 1>.
```

- [ ] **Step 5: Tell Maxime**

Report the PR URL, the first-run findings, and the follow-up: consider exposing the image tag from vs-agent's landing config so the serving-version check works without cluster access.

---

### Task 13: Roll the demo cast to `.42` [CONF-OPS-3] [CONF-OPS-4]

The demo cast's seven per-org `VS_AGENT_IMAGE_TAG` overrides (`.34` on `demo-issuer-accredited`, `.36` elsewhere) beat the template's `.41`, so the demo cast never received the metadata fix and the `.41` roll did not reach it. Until it serves `.42`, the six canonical scenarios cannot be proven and `metadata-both-shapes` stays broken. This task is an outward-facing deployment: announce it to Maxime before dispatching, dispatch one workflow at a time, and never during a client demo.

**Files:**
- Modify: `.github/workflows/demo/deployment.template.yaml` (`chartVersion` and `image.tag` to `v1.12.0-oidc4vc-uiprofile.42`)
- Modify: `.github/workflows/demo/orgs/*/config.env` (delete the `VS_AGENT_IMAGE_TAG` line in all eight orgs, so the template is the single pin from now on)

- [ ] **Step 1: Pin once, in the template**

Edit the two `.41` values in `.github/workflows/demo/deployment.template.yaml` to `v1.12.0-oidc4vc-uiprofile.42` and remove the `VS_AGENT_IMAGE_TAG="…"` line from each `config.env` under `.github/workflows/demo/orgs/`.

Run (root): `grep -rn VS_AGENT_IMAGE_TAG .github/workflows/demo/orgs/ ; grep -n "uiprofile" .github/workflows/demo/deployment.template.yaml`
Expected: no override lines; two `.42` lines. Then `cd conformance && npx vitest run lib/cast-services.test.ts` still passes and `listCastServices` reports `.42` for every demo service.

- [ ] **Step 2: Commit and merge through a PR**

```bash
git add .github/workflows/demo
git commit -m "chore(demo): pin the demo cast to vs-agent uiprofile.42 in one place"
```

Open a PR titled `chore(demo): pin the demo cast to vs-agent uiprofile.42` with the body: `The .41 roll never reached the demo cast: every demo org carried its own VS_AGENT_IMAGE_TAG override (.34 on demo-issuer-accredited, .36 on the rest), which wins over the template. This moves the pin to the template, at .42 so the demo issuers publish claim labels in both metadata shapes, and drops the overrides so the next roll is one line. Deploys follow one workflow at a time.` Merge it (granted for this work).

- [ ] **Step 3: Dispatch the deployments one at a time, issuers first**

For each of `demo-02_issuer-accredited`, `demo-03_issuer-unaccredited`, `demo-07_issuer-untrusted`, then `demo-04_verifier-accredited`, `demo-05_verifier-unaccredited`, `demo-08_verifier-untrusted`, then `demo-01_anchor` (whatever the anchor's workflow file is called; check `ls .github/workflows/demo-0*.yml`):

```bash
gh workflow run <file>.yml --ref main
sleep 20
RUN=$(gh run list --workflow <file>.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$RUN" --exit-status
```

Wait for `--exit-status` to return 0 before dispatching the next one; all cast workflows share the `vesta-cast` concurrency group and GitHub keeps one queued run per group, so a second dispatch while one runs is cancelled. If `gh workflow run` is refused by the permission classifier, stop and tell Maxime which workflows remain.

- [ ] **Step 4: Prove the roll**

Run: `curl -s https://demo-issuer-accredited.playground.testnet.verana.network/oid4vci/demo-did/.well-known/openid-credential-issuer | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const m=JSON.parse(s);for(const [k,v] of Object.entries(m.credential_configurations_supported))console.log(k, "display" in v, "claims" in v, "credential_metadata" in v)})'`
Expected: `demo-credential true true true`. Then trigger the nightly workflow by hand (`gh workflow run conformance.yml`) and read its summary: `serving-version` must be `works` with `.42` for every demo service, `metadata-both-shapes` `works` on the demo issuers, and the resolver `did-resolves` cells `works` (refresh handles the post-roll cache). Report the summary link to Maxime.
