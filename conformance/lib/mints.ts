import type { CastService } from "./cast-services";
import { listScenarios, serviceFor, type Scenario } from "./scenarios";

export const mintsEnabled = (): boolean => process.env.CONFORMANCE_MINTS === "1";

const scenarioOf = (kind: Scenario["kind"], service: CastService): Scenario | undefined =>
  listScenarios().find((s) => s.kind === kind && (serviceFor(s, "anoncreds") === service.id || serviceFor(s, "openid4vc-sdjwt") === service.id));

export function issuanceParamsFor(service: CastService): { credential?: string; params?: Record<string, string> } {
  const scenario = scenarioOf("issue", service);
  return scenario ? { credential: scenario.credential, params: scenario.params } : {};
}

export function presentationParamsFor(service: CastService): { credential?: string; login?: Scenario["login"] } {
  const scenario = scenarioOf("present", service);
  return scenario ? { credential: scenario.credential, login: scenario.login } : {};
}
