import type { CastService } from "./cast-services";
import type { Network } from "./network";
import { ResolverClient, type TrustResolution } from "./resolver-client";
import type { Scenario } from "./scenarios";

export type TrustExpectation = { q1: "TRUSTED" | "UNTRUSTED"; q2: boolean | null; q3: boolean | null };
export type TrustAssertion = { ok: boolean; problems: string[]; evidence: Record<string, unknown> };

function isUntrustedService(service: CastService): boolean {
  return service.demoPerm === null && service.oid4vcRole !== null && service.id.includes("untrusted");
}

function refusedForAnUntrustedService(scenario: Scenario): boolean {
  if (scenario.expect !== "refuse") return false;
  const ids = typeof scenario.service === "string" ? [scenario.service] : Object.values(scenario.service);
  return ids.some((id) => id.includes("untrusted"));
}

export function expectedTrust(scenario: Scenario, service: CastService): TrustExpectation {
  if (isUntrustedService(service) || refusedForAnUntrustedService(scenario)) return { q1: "UNTRUSTED", q2: null, q3: null };
  if (scenario.kind === "issue") return { q1: "TRUSTED", q2: service.id === "taquilla" ? true : scenario.expect === "accept", q3: null };
  return { q1: "TRUSTED", q2: null, q3: service.id.startsWith("evento-") ? true : scenario.expect === "accept" };
}

const freshResolutions = new Map<string, Promise<TrustResolution | null>>();

export function resolveFreshCached(resolver: ResolverClient, did: string): Promise<TrustResolution | null> {
  const cached = freshResolutions.get(did);
  if (cached) return cached;
  const pending = resolver.resolveFresh(did);
  freshResolutions.set(did, pending);
  return pending;
}

const ECS_OWNER_TYPES = new Set(["ECS-ORG", "ECS-PERSONA"]);

export async function assertTrust(resolver: ResolverClient, did: string, expectation: TrustExpectation, network: Network): Promise<TrustAssertion> {
  const resolution = await resolveFreshCached(resolver, did);
  if (!resolution) return { ok: false, problems: ["resolver has no verdict after refresh"], evidence: { did } };

  const problems: string[] = [];
  if (resolution.trustStatus !== expectation.q1) problems.push(`trustStatus ${resolution.trustStatus} is not ${expectation.q1}`);

  const evaluatedAtMs = Date.parse(resolution.evaluatedAt);
  const expiresAtMs = Date.parse(resolution.expiresAt);
  if (Number.isNaN(evaluatedAtMs)) problems.push(`evaluatedAt ${resolution.evaluatedAt} does not parse`);
  if (Number.isNaN(expiresAtMs)) problems.push(`expiresAt ${resolution.expiresAt} does not parse`);
  if (!Number.isNaN(evaluatedAtMs) && !Number.isNaN(expiresAtMs) && !(expiresAtMs > evaluatedAtMs))
    problems.push(`expiresAt ${resolution.expiresAt} is not after evaluatedAt ${resolution.evaluatedAt}`);

  if (expectation.q1 === "TRUSTED") {
    const validEcsService = resolution.credentials.some((c) => c.ecsType === "ECS-SERVICE" && c.result === "VALID");
    const validEcsOwner = resolution.credentials.some((c) => ECS_OWNER_TYPES.has(c.ecsType) && c.result === "VALID");
    if (!validEcsService) problems.push("no VALID ECS-SERVICE credential");
    if (!validEcsOwner) problems.push("no VALID ECS-ORG or ECS-PERSONA credential");
    if (resolution.dereferenceErrors.length) problems.push(`dereferenceErrors present: ${JSON.stringify(resolution.dereferenceErrors)}`);
    if (resolution.failedCredentials.length) problems.push(`failedCredentials present: ${JSON.stringify(resolution.failedCredentials)}`);
  }

  const evidence: Record<string, unknown> = {
    did,
    trustStatus: resolution.trustStatus,
    evaluatedAt: resolution.evaluatedAt,
    expiresAt: resolution.expiresAt,
    credentials: resolution.credentials.map((c) => ({ ecsType: c.ecsType, result: c.result })),
    selfIssued: resolution.credentials.filter((c) => c.issuedBy === did).map((c) => c.ecsType),
    dereferenceErrors: resolution.dereferenceErrors,
    failedCredentials: resolution.failedCredentials,
    production: resolution.production,
    networkProduction: network.production,
  };
  if (resolution.production !== network.production)
    evidence.productionFlagProblem = `production-flag: resolver reports production=${resolution.production}, networks.yaml says ${network.production}`;

  return { ok: problems.length === 0, problems, evidence };
}
