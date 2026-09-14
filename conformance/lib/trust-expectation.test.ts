import { afterEach, describe, expect, it, vi } from "vitest";
import type { CastService } from "./cast-services";
import type { Network } from "./network";
import { ResolverClient } from "./resolver-client";
import { listScenarios, serviceFor } from "./scenarios";
import { assertTrust, expectedTrust, type TrustExpectation } from "./trust-expectation";

function service(id: string, demoPerm: CastService["demoPerm"], oid4vcRole: CastService["oid4vcRole"]): CastService {
  return { cast: "demo", org: id, id, host: `${id}.playground.testnet.verana.network`, pinnedTag: "v0", oid4vcRole, demoPerm, issuerId: null, configPath: id };
}

const SERVICES: Record<string, CastService> = {
  "demo-issuer-accredited": service("demo-issuer-accredited", "issuer", "issuer"),
  "demo-issuer-unaccredited": service("demo-issuer-unaccredited", "none", "issuer"),
  "demo-issuer-untrusted": service("demo-issuer-untrusted", null, "issuer"),
  "demo-verifier-accredited": service("demo-verifier-accredited", "verifier", "verifier"),
  "demo-verifier-unaccredited": service("demo-verifier-unaccredited", "none", "verifier"),
  "demo-verifier-untrusted": service("demo-verifier-untrusted", null, "verifier"),
  taquilla: service("taquilla", null, "issuer"),
  "evento-costa-rica": service("evento-costa-rica", null, "verifier"),
  "evento-guatemala": service("evento-guatemala", null, "verifier"),
  northbank: service("northbank", null, "issuer"),
  caledonian: service("caledonian", null, "issuer"),
  cirrus: service("cirrus", null, "issuer"),
  "meridian-tech": service("meridian-tech", null, "verifier"),
  halcyon: service("halcyon", null, "verifier"),
  segip: service("segip", null, "issuer"),
  seprec: service("seprec", null, "issuer"),
  aurum: service("aurum", null, "issuer"),
  novara: service("novara", null, "issuer"),
  borealis: service("borealis", null, "verifier"),
  darkpool: service("darkpool", null, "verifier"),
  "civil-registry": service("civil-registry", null, "issuer"),
  "business-registry": service("business-registry", null, "issuer"),
  vesta: service("vesta", null, "issuer"),
  zenith: service("zenith", null, "issuer"),
  umbra: service("umbra", null, "issuer"),
};

const EXPECTED: Record<string, TrustExpectation> = {
  "issue-accredited": { q1: "TRUSTED", q2: true, q3: null },
  "issue-unaccredited": { q1: "TRUSTED", q2: false, q3: null },
  "issue-untrusted": { q1: "UNTRUSTED", q2: null, q3: null },
  "present-accredited": { q1: "TRUSTED", q2: null, q3: true },
  "present-unaccredited": { q1: "TRUSTED", q2: null, q3: false },
  "present-untrusted": { q1: "UNTRUSTED", q2: null, q3: null },
  "boleto-asistente": { q1: "TRUSTED", q2: true, q3: null },
  "boleto-patrocinador": { q1: "TRUSTED", q2: true, q3: null },
  "entrada-costa-rica": { q1: "TRUSTED", q2: null, q3: true },
  "entrada-otro-evento": { q1: "TRUSTED", q2: null, q3: true },
  "bhi-northbank-issue-bhi-right-to-work": { q1: "TRUSTED", q2: true, q3: null },
  "bhi-northbank-issue-bhi-employment": { q1: "TRUSTED", q2: true, q3: null },
  "bhi-caledonian-issue-bhi-qualification": { q1: "TRUSTED", q2: true, q3: null },
  "bhi-cirrus-issue-bhi-qualification": { q1: "TRUSTED", q2: true, q3: null },
  "bhi-meridian-tech-present": { q1: "TRUSTED", q2: null, q3: true },
  "bhi-halcyon-present": { q1: "TRUSTED", q2: null, q3: false },
  "bolivia-segip-issue-bolivia-cedula": { q1: "TRUSTED", q2: true, q3: null },
  "bolivia-seprec-issue-bolivia-legal-rep": { q1: "TRUSTED", q2: true, q3: null },
  "cexa-aurum-issue-cexa-kyc": { q1: "TRUSTED", q2: true, q3: null },
  "cexa-novara-issue-cexa-kyc": { q1: "TRUSTED", q2: true, q3: null },
  "cexa-borealis-present": { q1: "TRUSTED", q2: null, q3: true },
  "cexa-darkpool-present": { q1: "TRUSTED", q2: null, q3: false },
  "verandia-civil-registry-issue-verandia-citizen-id": { q1: "TRUSTED", q2: true, q3: null },
  "verandia-business-registry-issue-verandia-legal-rep": { q1: "TRUSTED", q2: true, q3: null },
  "vesta-vesta-issue-ecs-badge": { q1: "TRUSTED", q2: true, q3: null },
  "vesta-zenith-issue-ecs-badge": { q1: "TRUSTED", q2: true, q3: null },
  "vesta-umbra-issue-ecs-badge": { q1: "TRUSTED", q2: true, q3: null },
};

describe("expectedTrust", () => {
  it("covers every scenario", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(
      listScenarios()
        .map((s) => s.id)
        .sort(),
    );
  });

  for (const scenario of listScenarios())
    it(`${scenario.id}`, () => {
      const serviceId = serviceFor(scenario, "openid4vc-sdjwt");
      const fixture = SERVICES[serviceId];
      if (!fixture) throw new Error(`no fixture service for ${serviceId}`);
      expect(expectedTrust(scenario, fixture)).toEqual(EXPECTED[scenario.id]);
    });
});

const NETWORK: Network = {
  id: "testnet-v3",
  vpr: "vna-testnet-1",
  protocol: "v3",
  production: false,
  castToken: "testnet",
  resolver: "https://resolver.testnet.verana.network",
  indexer: "https://idx.testnet.verana.network",
  rpc: "https://rpc.testnet.verana.network",
  playground: "https://playground.testnet.verana.network",
  vocabulary: { ecosystem: "Trust Registry", participant: "Permission" },
  testable: true,
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function resolveFreshSequence(did: string, before: Record<string, unknown>, after: Record<string, unknown>): void {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(json({ did, ...before }))
      .mockResolvedValueOnce(json({ did, result: "ok" }))
      .mockResolvedValueOnce(json({ did, ...after })),
  );
}

describe("assertTrust", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("an UNTRUSTED verdict with self-issued VALID credentials is ok", async () => {
    const did = "did:webvh:untrusted-self-issued";
    resolveFreshSequence(
      did,
      { trustStatus: "UNTRUSTED", production: false, evaluatedAt: "2026-09-14T10:00:00.000Z", expiresAt: "2026-09-14T11:00:00.000Z", credentials: [], dereferenceErrors: [], failedCredentials: [] },
      {
        trustStatus: "UNTRUSTED",
        production: false,
        evaluatedAt: "2026-09-14T10:05:00.000Z",
        expiresAt: "2026-09-14T11:05:00.000Z",
        credentials: [
          { ecsType: "ECS-SERVICE", result: "VALID", issuedBy: did, claims: {} },
          { ecsType: "ECS-ORG", result: "VALID", issuedBy: did, claims: {} },
        ],
        dereferenceErrors: [],
        failedCredentials: [],
      },
    );
    const assertion = await assertTrust(new ResolverClient("https://r"), did, { q1: "UNTRUSTED", q2: null, q3: null }, NETWORK);
    expect(assertion.ok).toBe(true);
    expect(assertion.problems).toEqual([]);
    expect(assertion.evidence.selfIssued).toEqual(["ECS-SERVICE", "ECS-ORG"]);
  });

  it("a TRUSTED verdict against an expected UNTRUSTED is a problem", async () => {
    const did = "did:webvh:unexpectedly-trusted";
    resolveFreshSequence(
      did,
      { trustStatus: "TRUSTED", production: false, evaluatedAt: "2026-09-14T10:00:00.000Z", expiresAt: "2026-09-14T11:00:00.000Z", credentials: [], dereferenceErrors: [], failedCredentials: [] },
      {
        trustStatus: "TRUSTED",
        production: false,
        evaluatedAt: "2026-09-14T10:05:00.000Z",
        expiresAt: "2026-09-14T11:05:00.000Z",
        credentials: [{ ecsType: "ECS-SERVICE", result: "VALID", issuedBy: "did:webvh:anchor", claims: {} }],
        dereferenceErrors: [],
        failedCredentials: [],
      },
    );
    const assertion = await assertTrust(new ResolverClient("https://r"), did, { q1: "UNTRUSTED", q2: null, q3: null }, NETWORK);
    expect(assertion.ok).toBe(false);
    expect(assertion.problems).toEqual(["trustStatus TRUSTED is not UNTRUSTED"]);
  });
});
