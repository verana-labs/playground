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
