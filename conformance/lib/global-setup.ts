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
