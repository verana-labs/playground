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
