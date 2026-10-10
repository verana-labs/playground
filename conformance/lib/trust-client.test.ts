import { afterEach, describe, expect, it, vi } from "vitest";
import CREDENTIAL_SCHEMA from "./fixtures/devnet-v4/credential-schema-8.json";
import ECOSYSTEM from "./fixtures/devnet-v4/ecosystem-6.json";
import INDEXER_VERSION from "./fixtures/devnet-v4/indexer-version.json";
import ISSUER_PARTICIPANTS from "./fixtures/devnet-v4/participants-demo-issuer-accredited-issuer.json";
import VERIFIER_PARTICIPANTS from "./fixtures/devnet-v4/participants-demo-verifier-accredited-verifier.json";
import NO_PARTICIPANTS from "./fixtures/devnet-v4/participants-none.json";
import ECOSYSTEM_LOG_ENTRY from "./fixtures/devnet-v4/playground-demo-did-log-entry.json";
import ACCREDITED_ISSUER_RESOLUTION from "./fixtures/devnet-v4/resolve-demo-issuer-accredited.json";
import UNTRUSTED_ISSUER_RESOLUTION from "./fixtures/devnet-v4/resolve-demo-issuer-untrusted.json";
import TYPE_METADATA from "./fixtures/devnet-v4/vct-8.json";
import VTJSC from "./fixtures/devnet-v4/vtjsc-8.json";
import type { Network } from "./network";
import { IndexerTrustClient, ResolverTrustClient, trustClientFor } from "./trust-client";

const INDEXER = "https://idx.devnet.verana.network";
const VCT = TYPE_METADATA.vct;
const ISSUER_DID = ACCREDITED_ISSUER_RESOLUTION.did;
const UNACCREDITED_ISSUER_DID = "did:webvh:Qmbep95zc1AokqrHBvFVPZWWz13SewXd2dcKS2RjHyKNH7:demo-issuer-unaccredited.playground.devnet.verana.network";
const UNTRUSTED_ISSUER_DID = "did:webvh:QmXpoZWmomGyTCQ2j4UUokXLHtuz11LnRsFWcBsaBddLXB:demo-issuer-untrusted.playground.devnet.verana.network";
const VERIFIER_DID = VERIFIER_PARTICIPANTS.participants[0]?.did ?? "";
const ECOSYSTEM_DID = ECOSYSTEM.ecosystem.did;

type Route = { status?: number; body: unknown };

function serve(routes: Record<string, Route>) {
  const fetchMock = vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    const route = routes[String(input)] ?? { status: 404, body: { error: "no route" } };
    return new Response(typeof route.body === "string" ? route.body : JSON.stringify(route.body), { status: route.status ?? 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const participantUrl = (did: string, role: string): string =>
  `${INDEXER}/v4/participant/list?did=${encodeURIComponent(did)}&role=${role}&schema_id=8&participant_state=ACTIVE`;

const devnet = (overrides: Record<string, Route> = {}) =>
  serve({
    [VCT]: { body: TYPE_METADATA },
    [TYPE_METADATA.relatedJsonSchemaCredentialId]: { body: VTJSC },
    [`${INDEXER}/v4/credential-schema/get/8`]: { body: CREDENTIAL_SCHEMA },
    [`${INDEXER}/v4/ecosystem/get/6`]: { body: ECOSYSTEM },
    "https://playground-demo.playground.devnet.verana.network/.well-known/did.jsonl": { body: `${JSON.stringify(ECOSYSTEM_LOG_ENTRY)}\n` },
    [participantUrl(ISSUER_DID, "ISSUER")]: { body: ISSUER_PARTICIPANTS },
    [participantUrl(ISSUER_DID, "VERIFIER")]: { body: NO_PARTICIPANTS },
    [participantUrl(UNACCREDITED_ISSUER_DID, "ISSUER")]: { body: NO_PARTICIPANTS },
    [participantUrl(VERIFIER_DID, "VERIFIER")]: { body: VERIFIER_PARTICIPANTS },
    ...overrides,
  });

const indexer = (vpr = "vna-devnet-1") => new IndexerTrustClient(INDEXER, vpr);

const TESTNET: Network = {
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

const DEVNET: Network = {
  ...TESTNET,
  id: "devnet-v4",
  vpr: "vna-devnet-1",
  protocol: "v4",
  castToken: "devnet",
  resolver: null,
  indexer: INDEXER,
  playground: "https://playground.devnet.verana.network",
  vocabulary: { ecosystem: "Ecosystem", participant: "Participant" },
};

describe("trustClientFor", () => {
  it("asks the v3 resolver when the network has one", () => {
    const client = trustClientFor(TESTNET);
    expect(client).toBeInstanceOf(ResolverTrustClient);
    expect(client.protocol).toBe("v3");
    expect(client.endpoint).toBe("https://resolver.testnet.verana.network");
  });

  it("asks the v4 indexer when the network has an indexer and no resolver", () => {
    const client = trustClientFor(DEVNET);
    expect(client).toBeInstanceOf(IndexerTrustClient);
    expect(client.protocol).toBe("v4");
    expect(client.endpoint).toBe(INDEXER);
  });

  it("reads a network without a resolver key at all as v4", () => {
    const { resolver: _resolver, ...withoutResolver } = DEVNET;
    expect(trustClientFor(withoutResolver as Network).protocol).toBe("v4");
  });

  it("refuses a network with neither", () => {
    expect(() => trustClientFor({ ...DEVNET, indexer: null })).toThrow(/devnet-v4: neither a resolver nor an indexer/);
  });
});

describe("ResolverTrustClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("follows the vct to its schema credential and asks the issuer authorization endpoint", async () => {
    const vtjscId = TYPE_METADATA.relatedJsonSchemaCredentialId;
    const fetchMock = serve({
      [VCT]: { body: TYPE_METADATA },
      [`https://r/v1/trust/issuer-authorization?did=d&vtjscId=${encodeURIComponent(vtjscId)}`]: { body: { did: "d", vtjscId, authorized: true, evaluatedAt: "t" } },
    });
    expect(await new ResolverTrustClient("https://r").issuerAuthorization("d", VCT)).toEqual({ did: "d", vct: VCT, vtjscId, authorized: true, evaluatedAt: "t" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not ask the resolver when the vct names no schema credential", async () => {
    const fetchMock = serve({ [VCT]: { body: { vct: VCT, name: "DemoCredential" } } });
    const answer = await new ResolverTrustClient("https://r").verifierAuthorization("d", VCT);
    expect(answer).toMatchObject({ authorized: null, cause: `vct document at ${VCT} has no relatedJsonSchemaCredentialId` });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("IndexerTrustClient Q1", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps the recorded devnet answer for the accredited issuer onto the shape the checks read", async () => {
    const fetchMock = serve({ [`${INDEXER}/v4/verifiable-trust/resolve`]: { body: ACCREDITED_ISSUER_RESOLUTION } });
    const resolution = await indexer().resolve(ISSUER_DID);

    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe("POST");
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      did: ISSUER_DID,
      participations: { states: ["ACTIVE", "EXPIRED", "REVOKED"] },
      presentations: { unresolvableCredentialIds: true },
      ecsCredentials: true,
    });
    expect(resolution).toMatchObject({
      did: ISSUER_DID,
      trustStatus: "TRUSTED",
      production: null,
      evaluatedAt: "2026-10-01T15:56:44.662Z",
      expiresAt: "2027-10-01T00:00:00.000Z",
      dereferenceErrors: [],
      failedCredentials: [],
      indexer: { registered: true, unresolvableCredentialIds: ["https://demo-issuer-accredited.playground.devnet.verana.network/vt/schemas-8-jsc.json"] },
    });
    expect(resolution?.credentials.map(({ ecsType, result, issuedBy }) => ({ ecsType, result, issuedBy }))).toEqual([
      { ecsType: "ServiceCredential", result: "VALID", issuedBy: ECOSYSTEM_DID },
      { ecsType: "OrganizationCredential", result: "VALID", issuedBy: "did:webvh:QmQsrFSoTjpbutWFvdu7aeiR1748JbmTZBB2SSK1ygEyAp:ecs-org-issuer.devnet.verana.network" },
    ]);
    expect(resolution?.credentials[0]?.claims.name).toBe("Accredited Issuer (demo)");
  });

  it("reads a DID the indexer does not know as untrusted, not as an unanswered question", async () => {
    serve({ [`${INDEXER}/v4/verifiable-trust/resolve`]: { status: 404, body: UNTRUSTED_ISSUER_RESOLUTION } });
    expect(await indexer().resolve(UNTRUSTED_ISSUER_DID)).toMatchObject({
      did: UNTRUSTED_ISSUER_DID,
      trustStatus: "UNTRUSTED",
      expiresAt: null,
      credentials: [],
      indexer: { registered: false },
    });
  });

  it("fails loudly on any other error", async () => {
    serve({ [`${INDEXER}/v4/verifiable-trust/resolve`]: { status: 404, body: "<html>" } });
    await expect(indexer().resolve(ISSUER_DID)).rejects.toThrow(/HTTP 404/);
    serve({ [`${INDEXER}/v4/verifiable-trust/resolve`]: { status: 502, body: {} } });
    await expect(indexer().resolve(ISSUER_DID)).rejects.toThrow(/HTTP 502/);
  });

  it("refreshes nothing, so a fresh reading is one resolve", async () => {
    const fetchMock = serve({ [`${INDEXER}/v4/verifiable-trust/resolve`]: { body: ACCREDITED_ISSUER_RESOLUTION } });
    expect(await indexer().refresh()).toBe("no-op");
    expect(fetchMock).not.toHaveBeenCalled();
    expect((await indexer().resolveFresh(ISSUER_DID))?.trustStatus).toBe("TRUSTED");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports the indexer version", async () => {
    serve({ [`${INDEXER}/v4/indexer/version`]: { body: INDEXER_VERSION } });
    expect(await indexer().version()).toBe("v2.0.1-dev.2");
  });
});

describe("IndexerTrustClient Q2/Q3", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("authorizes the accredited devnet issuer through the VTJSC chain", async () => {
    devnet();
    expect(await indexer().issuerAuthorization(ISSUER_DID, VCT)).toMatchObject({
      did: ISSUER_DID,
      vct: VCT,
      vtjscId: TYPE_METADATA.relatedJsonSchemaCredentialId,
      authorized: true,
      evidence: { schemaId: 8, ecosystemDid: ECOSYSTEM_DID, participantIds: [24] },
    });
  });

  it("does not authorize the unaccredited devnet issuer", async () => {
    devnet();
    expect(await indexer().issuerAuthorization(UNACCREDITED_ISSUER_DID, VCT)).toMatchObject({ authorized: false, evidence: { participantIds: [] } });
  });

  it("authorizes the accredited devnet verifier and keeps the roles apart", async () => {
    devnet({ [participantUrl(ISSUER_DID, "VERIFIER")]: { body: ISSUER_PARTICIPANTS } });
    expect(await indexer().verifierAuthorization(VERIFIER_DID, VCT)).toMatchObject({ authorized: true, evidence: { participantIds: [28] } });
    expect(await indexer().verifierAuthorization(ISSUER_DID, VCT)).toMatchObject({ authorized: false });
  });

  it("does not answer when the VTJSC proof does not verify", async () => {
    devnet({ [TYPE_METADATA.relatedJsonSchemaCredentialId]: { body: { ...VTJSC, validUntil: "2099-01-01T00:00:00.000Z" } } });
    const answer = await indexer().issuerAuthorization(ISSUER_DID, VCT);
    expect(answer).toMatchObject({ authorized: null, cause: expect.stringMatching(/eddsa-jcs-2022 proof does not verify/) });
  });

  it("does not answer when the VTJSC issuer is not the ecosystem that owns the schema", async () => {
    devnet({ [`${INDEXER}/v4/ecosystem/get/6`]: { body: { ecosystem: { id: 6, did: "did:webvh:QmOther:other.example" } } } });
    const answer = await indexer().issuerAuthorization(ISSUER_DID, VCT);
    expect(answer).toMatchObject({ authorized: null, cause: expect.stringMatching(/is not did:webvh:QmOther:other.example, the ecosystem that owns schema 8/) });
  });

  it("does not answer for a schema on another chain", async () => {
    devnet();
    const answer = await indexer("vna-testnet-1").issuerAuthorization(ISSUER_DID, VCT);
    expect(answer).toMatchObject({ authorized: null, cause: expect.stringMatching(/references a schema on vna-devnet-1, not vna-testnet-1/) });
  });

  it("does not answer when the vct names no schema credential", async () => {
    devnet({ [VCT]: { body: { vct: VCT, name: "DemoCredential" } } });
    expect(await indexer().issuerAuthorization(ISSUER_DID, VCT)).toMatchObject({ authorized: null, vtjscId: null });
  });

  it("fails loudly when the indexer does not answer", async () => {
    devnet({ [participantUrl(ISSUER_DID, "ISSUER")]: { status: 503, body: {} } });
    await expect(indexer().issuerAuthorization(ISSUER_DID, VCT)).rejects.toThrow(/HTTP 503/);
  });
});
