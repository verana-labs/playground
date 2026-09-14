import type { CastService } from "./cast-services";
import { listScenarios, serviceFor } from "./scenarios";

export const mintsEnabled = (): boolean => process.env.CONFORMANCE_MINTS === "1";

export function issuanceParamsFor(service: CastService): { credential?: string; params?: Record<string, string> } {
  const scenario = listScenarios().find((s) => s.kind === "issue" && (serviceFor(s, "anoncreds") === service.id || serviceFor(s, "openid4vc-sdjwt") === service.id));
  return scenario ? { credential: scenario.credential, params: scenario.params } : {};
}
