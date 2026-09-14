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
