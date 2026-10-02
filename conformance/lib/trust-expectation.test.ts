import { afterEach, describe, expect, it, vi } from "vitest";
import type { CastService } from "./cast-services";
import ACCREDITED_ISSUER_RESOLUTION from "./fixtures/devnet-v4/resolve-demo-issuer-accredited.json";
import UNTRUSTED_ISSUER_RESOLUTION from "./fixtures/devnet-v4/resolve-demo-issuer-untrusted.json";
import type { Network } from "./network";
import { listScenarios, serviceFor } from "./scenarios";
import { IndexerTrustClient, ResolverTrustClient } from "./trust-client";
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
    const assertion = await assertTrust(new ResolverTrustClient("https://r"), did, { q1: "UNTRUSTED", q2: null, q3: null }, NETWORK);
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
    const assertion = await assertTrust(new ResolverTrustClient("https://r"), did, { q1: "UNTRUSTED", q2: null, q3: null }, NETWORK);
    expect(assertion.ok).toBe(false);
    expect(assertion.problems).toEqual(["trustStatus TRUSTED is not UNTRUSTED"]);
  });
});

const DEVNET: Network = {
  ...NETWORK,
  id: "devnet-v4",
  vpr: "vna-devnet-1",
  protocol: "v4",
  castToken: "devnet",
  resolver: null,
  indexer: "https://idx.devnet.verana.network",
  playground: "https://playground.devnet.verana.network",
  vocabulary: { ecosystem: "Ecosystem", participant: "Participant" },
};

describe("assertTrust on the v4 indexer", () => {
  afterEach(() => vi.unstubAllGlobals());

  const answering = (body: unknown, status = 200): void => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json(body, status)));
  };

  it("accepts the recorded devnet answer for the accredited issuer by its v4 ECS schema names", async () => {
    answering(ACCREDITED_ISSUER_RESOLUTION);
    const assertion = await assertTrust(new IndexerTrustClient("https://idx-1", "vna-devnet-1"), ACCREDITED_ISSUER_RESOLUTION.did, { q1: "TRUSTED", q2: true, q3: null }, DEVNET);
    expect(assertion.problems).toEqual([]);
    expect(assertion.ok).toBe(true);
    expect(assertion.evidence.credentials).toEqual([
      { ecsType: "ServiceCredential", result: "VALID" },
      { ecsType: "OrganizationCredential", result: "VALID" },
    ]);
    expect(assertion.evidence.production).toBeNull();
    expect(assertion.evidence.productionFlagProblem).toBeUndefined();
    expect(assertion.evidence.indexer).toEqual({
      registered: true,
      unresolvableCredentialIds: ["https://demo-issuer-accredited.playground.devnet.verana.network/vt/schemas-8-jsc.json"],
    });
  });

  it("accepts a DID the indexer does not know when UNTRUSTED is expected", async () => {
    answering(UNTRUSTED_ISSUER_RESOLUTION, 404);
    const did = "did:webvh:QmXpoZWmomGyTCQ2j4UUokXLHtuz11LnRsFWcBsaBddLXB:demo-issuer-untrusted.playground.devnet.verana.network";
    const assertion = await assertTrust(new IndexerTrustClient("https://idx-2", "vna-devnet-1"), did, { q1: "UNTRUSTED", q2: null, q3: null }, DEVNET);
    expect(assertion.problems).toEqual([]);
    expect(assertion.evidence.indexer).toEqual({ registered: false, unresolvableCredentialIds: [] });
  });

  it("names the missing v4 owner credential", async () => {
    answering({ ...ACCREDITED_ISSUER_RESOLUTION, ecsCredentials: ACCREDITED_ISSUER_RESOLUTION.ecsCredentials.filter((c) => c.ecsSchema === "ServiceCredential") });
    const assertion = await assertTrust(new IndexerTrustClient("https://idx-3", "vna-devnet-1"), ACCREDITED_ISSUER_RESOLUTION.did, { q1: "TRUSTED", q2: true, q3: null }, DEVNET);
    expect(assertion.problems).toEqual(["no VALID OrganizationCredential or PersonaCredential credential"]);
  });

  it("does not read v3 ECS type names as v4 ones", async () => {
    answering({
      ...ACCREDITED_ISSUER_RESOLUTION,
      ecsCredentials: ACCREDITED_ISSUER_RESOLUTION.ecsCredentials.map((c) => ({ ...c, ecsSchema: c.ecsSchema === "ServiceCredential" ? "ECS-SERVICE" : "ECS-ORG" })),
    });
    const assertion = await assertTrust(new IndexerTrustClient("https://idx-4", "vna-devnet-1"), ACCREDITED_ISSUER_RESOLUTION.did, { q1: "TRUSTED", q2: true, q3: null }, DEVNET);
    expect(assertion.problems).toEqual(["no VALID ServiceCredential credential", "no VALID OrganizationCredential or PersonaCredential credential"]);
  });

  it("refuses a TRUSTED verdict that says nothing about when it expires", async () => {
    const { expiresAtTime: _expiresAtTime, ...withoutExpiry } = ACCREDITED_ISSUER_RESOLUTION;
    answering(withoutExpiry);
    const assertion = await assertTrust(new IndexerTrustClient("https://idx-5", "vna-devnet-1"), ACCREDITED_ISSUER_RESOLUTION.did, { q1: "TRUSTED", q2: true, q3: null }, DEVNET);
    expect(assertion.problems).toEqual(["a TRUSTED verdict carries no expiresAt"]);
  });
});
