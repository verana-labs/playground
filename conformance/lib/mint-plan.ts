import type { CastService } from "./cast-services";
import { listScenarios } from "./scenarios";

export type MintRole = "issuer" | "verifier";
export type ProbeResult = { outcome: "mints" | "unsupported" | "error"; detail: string };
export type MintProbe = ProbeResult & { service: string; role: MintRole };
export type CredentialPlan = { credential: string; params?: Record<string, string>; issuers: CastService[]; verifiers: CastService[]; probes: MintProbe[] };
export type Prober = (service: CastService, role: MintRole, credential: string, params?: Record<string, string>) => Promise<ProbeResult>;

export function credentialParams(credential: string): Record<string, string> | undefined {
  return listScenarios().find((s) => s.credential === credential && s.params)?.params;
}

export function probeFailure(error: unknown): ProbeResult {
  const detail = error instanceof Error ? error.message : String(error);
  return { outcome: detail.startsWith("mint degraded") ? "unsupported" : "error", detail };
}

export async function planCredentials(credentials: string[], services: CastService[], probe: Prober): Promise<CredentialPlan[]> {
  const plans: CredentialPlan[] = [];
  for (const credential of credentials) {
    const params = credentialParams(credential);
    const probes: MintProbe[] = [];
    for (const service of services) {
      const role = service.oid4vcRole;
      if (!role) continue;
      probes.push({ service: service.id, role, ...(await probe(service, role, credential, params)) });
    }
    const minting = (role: MintRole): CastService[] => services.filter((s) => probes.some((p) => p.service === s.id && p.role === role && p.outcome === "mints"));
    plans.push({ credential, params, issuers: minting("issuer"), verifiers: minting("verifier"), probes });
  }
  return plans;
}

export function mintGap(plan: CredentialPlan, network: string): string | null {
  const missing = [plan.issuers.length === 0 ? "no issuer mints an offer" : null, plan.verifiers.length === 0 ? "no verifier mints a request" : null].filter(Boolean);
  if (missing.length === 0) return null;
  const tried = plan.probes.map((p) => `${p.service} ${p.outcome}${p.outcome === "error" ? ` (${p.detail})` : ""}`).join(", ");
  return `${missing.join(" and ")} for ${plan.credential} on ${network} (tried ${tried || "no OpenID4VC service in scope"})`;
}
