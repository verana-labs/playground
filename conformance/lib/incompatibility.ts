import type { WalletBuild } from "../../app/lib/wallet-profiles";

export function incompatibilityFor(build: WalletBuild, scenarioId: string, serviceId: string): { cause: string; reference?: string } | null {
  for (const i of build.incompatibilities ?? []) {
    const scenarioHit = i.scenarios === "all" || (i.scenarios as readonly string[]).includes(scenarioId);
    const serviceHit = !i.services || i.services.includes(serviceId);
    if (scenarioHit && serviceHit) return { cause: i.cause, reference: i.reference };
  }
  return null;
}
