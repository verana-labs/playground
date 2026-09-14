import fs from "node:fs";
import yaml from "js-yaml";
import { z } from "zod";
import type { Rail } from "./playground-client";

const scenarioId = z.string().regex(/^[a-z0-9-]+$/);

const ScenarioSchema = z.object({
  id: scenarioId,
  kind: z.enum(["issue", "present"]),
  expect: z.enum(["accept", "refuse"]),
  service: z.union([z.string().min(1), z.object({ anoncreds: z.string().min(1), "openid4vc-sdjwt": z.string().min(1) })]),
  credential: z.string().min(1).optional(),
  params: z.record(z.string(), z.string()).optional(),
  login: z.object({ evento: z.string().min(1), rol: z.string().min(1) }).optional(),
  needs: scenarioId.optional(),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

const FileSchema = z
  .object({ scenarios: z.array(ScenarioSchema).min(1) })
  .superRefine((file, ctx) => {
    const ids = new Set(file.scenarios.map((s) => s.id));
    file.scenarios.forEach((s, i) => {
      if (s.needs && !ids.has(s.needs))
        ctx.addIssue({ code: "custom", message: `needs unknown scenario ${s.needs}`, path: ["scenarios", i, "needs"] });
    });
  });
const SCENARIOS_FILE = new URL("../scenarios.yaml", import.meta.url);

export function listScenarios(): Scenario[] {
  const raw = yaml.load(fs.readFileSync(SCENARIOS_FILE, "utf8"), { schema: yaml.JSON_SCHEMA });
  const { scenarios } = FileSchema.parse(raw);
  const ids = new Set(scenarios.map((s) => s.id));
  if (ids.size !== scenarios.length) throw new Error("scenarios.yaml: duplicate scenario id");
  return scenarios;
}

export function serviceFor(scenario: Scenario, rail: Rail): string {
  return typeof scenario.service === "string" ? scenario.service : scenario.service[rail];
}
