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

function matchesOn(issue: KnownIssue, cell: GateCell, fields: readonly (typeof MATCH_FIELDS)[number][]): boolean {
  return fields.every((field) => {
    const wanted = issue.match[field];
    if (wanted === undefined) return true;
    const actual = cell[field];
    if (actual === undefined) return false;
    return Array.isArray(wanted) ? wanted.includes(actual) : wanted === actual;
  });
}

export const matches = (issue: KnownIssue, cell: GateCell): boolean => matchesOn(issue, cell, MATCH_FIELDS);

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
    const ranTiers = new Set(input.cells.map((c) => c.tier));
    for (const key of new Set(input.baseline.filter((c) => ranTiers.has(c.tier)).map(cellKey))) {
      if (!current.has(key)) failures.push({ kind: "missing", key, cause: "present in the baseline run, absent now" });
    }
  }

  const ran = (issue: KnownIssue): boolean => input.cells.some((c) => matchesOn(issue, c, ["tier", "network", "check", "cast"]));
  return { failures, known, resolved: active.filter((i) => !used.has(i) && ran(i)), expired };
}

export function renderMarkdown(report: GateReport): string {
  const verdict = report.failures.length === 0 ? "pass" : `${report.failures.length} failing`;
  const lines = [`## Conformance gate: ${verdict}`, ""];
  const section = (title: string, rows: string[]): void => {
    if (rows.length > 0) lines.push(`### ${title} (${rows.length})`, "", ...rows, "");
  };
  const oneLine = (text: string): string => text.replace(/\s+/g, " ").trim();
  section("New failures", report.failures.map((f) => `- \`${f.kind}\` ${f.key}${f.cause ? `: ${oneLine(f.cause)}` : ""}`));
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
