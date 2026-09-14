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
