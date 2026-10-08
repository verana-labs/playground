import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import yaml from "js-yaml";
import { z } from "zod";
import type { Cell } from "./report";

export type GateCell = Pick<Cell, "tier" | "check" | "network" | "cast" | "service" | "wallet" | "build" | "scenario" | "outcome" | "cause">;

const Selector = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]);

export const CellMatchSchema = z.strictObject({
  tier: Selector,
  check: Selector,
  cast: Selector.optional(),
  service: Selector.optional(),
  wallet: Selector.optional(),
  build: Selector.optional(),
  scenario: Selector.optional(),
});

export const GapCellsSchema = z.union([CellMatchSchema, z.array(CellMatchSchema).min(1)]);

const ServiceGapsFileSchema = z.looseObject({
  network: z.string().min(1),
  gaps: z.array(
    z.looseObject({
      id: z.string().min(1),
      cause: z.string().min(1),
      reference: z.url().optional(),
      expires: z.iso.date(),
      cells: GapCellsSchema.optional(),
    }),
  ),
});

export type CellMatch = z.infer<typeof CellMatchSchema>;

export type KnownGap = { id: string; network: string; cells: CellMatch[]; cause: string; reference?: string; expires: string };

export type Failure = { kind: "broken" | "unknown" | "missing"; key: string; cause?: string };

export type GateReport = {
  failures: Failure[];
  known: { key: string; cause: string }[];
  resolved: KnownGap[];
  expired: KnownGap[];
};

export type GateInput = {
  cells: GateCell[];
  gaps: KnownGap[];
  today: string;
  baseline: GateCell[] | null;
  requiredTiers: string[];
  failOnMissing: boolean;
};

const MATCH_FIELDS = ["tier", "check", "cast", "service", "wallet", "build", "scenario"] as const;

export function parseServiceGaps(text: string): KnownGap[] {
  const file = ServiceGapsFileSchema.parse(yaml.load(text, { schema: yaml.JSON_SCHEMA }));
  return file.gaps.flatMap((gap) =>
    gap.cells ? [{ id: gap.id, network: file.network, cells: [gap.cells].flat(), cause: gap.cause, reference: gap.reference, expires: gap.expires }] : [],
  );
}

export function cellKey(cell: GateCell): string {
  return [cell.tier, cell.check, cell.network, cell.cast ?? "", cell.service ?? "", cell.wallet ?? "", cell.build ?? "", cell.scenario ?? ""].join("|");
}

function matchesOn(gap: KnownGap, cell: GateCell, fields: readonly (typeof MATCH_FIELDS)[number][]): boolean {
  return (
    gap.network === cell.network &&
    gap.cells.some((match) =>
      fields.every((field) => {
        const wanted = match[field];
        if (wanted === undefined) return true;
        const actual = cell[field];
        if (actual === undefined) return false;
        return Array.isArray(wanted) ? wanted.includes(actual) : wanted === actual;
      }),
    )
  );
}

export const matches = (gap: KnownGap, cell: GateCell): boolean => matchesOn(gap, cell, MATCH_FIELDS);

export function evaluate(input: GateInput): GateReport {
  const active = input.gaps.filter((g) => g.expires >= input.today);
  const expired = input.gaps.filter((g) => g.expires < input.today);
  const used = new Set<KnownGap>();
  const failures: Failure[] = [];
  const known: GateReport["known"] = [];

  for (const cell of input.cells) {
    if (cell.outcome !== "broken" && cell.outcome !== "unknown") continue;
    const gap = active.find((g) => matches(g, cell));
    if (gap) {
      used.add(gap);
      known.push({ key: cellKey(cell), cause: `${gap.id}: ${gap.cause}` });
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

  const ran = (gap: KnownGap): boolean => input.cells.some((c) => matchesOn(gap, c, ["tier", "check", "cast"]));
  return { failures, known, resolved: active.filter((g) => !used.has(g) && ran(g)), expired };
}

export function renderMarkdown(report: GateReport): string {
  const verdict = report.failures.length === 0 ? "pass" : `${report.failures.length} failing`;
  const lines = [`## Conformance gate: ${verdict}`, ""];
  const section = (title: string, rows: string[]): void => {
    if (rows.length > 0) lines.push(`### ${title} (${rows.length})`, "", ...rows, "");
  };
  const oneLine = (text: string): string => text.replace(/\s+/g, " ").trim();
  section("New failures", report.failures.map((f) => `- \`${f.kind}\` ${f.key}${f.cause ? `: ${oneLine(f.cause)}` : ""}`));
  section("Expired known gaps", report.expired.map((g) => `- ${g.id}: ${oneLine(g.cause)} (expired ${g.expires})`));
  section("Known gaps no longer seen, drop their cells or the gap", report.resolved.map((g) => `- ${g.id}: ${oneLine(g.cause)}`));
  section("Known broken", report.known.map((k) => `- ${k.key}: ${k.cause}`));
  return `${lines.join("\n")}\n`;
}

function readCells(files: string[]): GateCell[] {
  return files.flatMap((file) => (JSON.parse(readFileSync(file, "utf8")) as { cells: GateCell[] }).cells);
}

function main(): void {
  const { values } = parseArgs({
    options: {
      services: { type: "string", multiple: true },
      results: { type: "string", multiple: true },
      baseline: { type: "string", multiple: true },
      "require-tier": { type: "string", multiple: true },
      "fail-on-missing": { type: "boolean" },
      today: { type: "string" },
    },
  });
  if (!values.services?.length) throw new Error("--services is required");
  const baselineFiles = values.baseline ?? [];
  const report = evaluate({
    cells: readCells(values.results ?? []),
    gaps: values.services.flatMap((file) => parseServiceGaps(readFileSync(file, "utf8"))),
    today: values.today ?? new Date().toISOString().slice(0, 10),
    baseline: baselineFiles.length > 0 ? readCells(baselineFiles) : null,
    requiredTiers: values["require-tier"] ?? [],
    failOnMissing: values["fail-on-missing"] ?? false,
  });
  process.stdout.write(renderMarkdown(report));
  process.exitCode = report.failures.length > 0 ? 1 : 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
