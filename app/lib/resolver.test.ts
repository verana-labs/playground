import { afterEach, describe, expect, it, vi } from "vitest";
import { mapV4Body, resolveTrust } from "./resolver";

const DID = "did:webvh:Qm:example.demos.testnet.verana.network";
const ok = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

afterEach(() => vi.unstubAllGlobals());

describe("resolveTrust", () => {
  it("maps TRUSTED with credentials", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      ok({ did: DID, trustStatus: "TRUSTED", credentials: [
        { ecsType: "ECS-SERVICE", result: "VALID", claims: { name: "Svc" } }] })));
    const r = await resolveTrust(DID);
    expect(r.state).toBe("TRUSTED");
    expect(r.credentials[0].claims.name).toBe("Svc");
  });

  it("maps PARTIAL to the untrusted state", async () => {
    vi.stubGlobal("fetch", vi.fn(() => ok({ did: DID, trustStatus: "PARTIAL", credentials: [] })));
    expect((await resolveTrust(DID)).state).toBe("UNTRUSTED");
  });

  it("maps an unknown trustStatus to UNVERIFIED, not a false negative", async () => {
    vi.stubGlobal("fetch", vi.fn(() => ok({ did: DID, trustStatus: "PENDING" })));
    expect((await resolveTrust(DID)).state).toBe("UNVERIFIED");
  });

  it("404 triggers refresh then one re-poll, then UNVERIFIED", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("{}", { status: 404 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 })) // refresh accepted
      .mockResolvedValueOnce(new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const r = await resolveTrust(DID);
    expect(r.state).toBe("UNVERIFIED");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1][0])).toContain("/v1/trust/refresh");
  });

  it("network error maps to UNVERIFIED, never UNTRUSTED", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("boom"))));
    expect((await resolveTrust(DID)).state).toBe("UNVERIFIED");
  });

  it("mismatched did in body is UNVERIFIED", async () => {
    vi.stubGlobal("fetch", vi.fn(() => ok({ did: "did:web:other", trustStatus: "TRUSTED" })));
    expect((await resolveTrust(DID)).state).toBe("UNVERIFIED");
  });
});

describe("mapV4Body (indexer trust resolution)", () => {
  const V4_DID = "did:webvh:Qm:verifier.example.demos.devnet.verana.network";
  const ORG_ISSUER = "did:webvh:Qm:ecs-org-issuer.devnet.verana.network";

  it("maps trusted with the ECS credentials to the V3 shape", () => {
    const r = mapV4Body(V4_DID, {
      did: V4_DID,
      trusted: true,
      evaluatedAtTime: "2026-09-29T18:50:32.517Z",
      evaluatedAtBlock: 15121,
      expiresAtTime: "2027-09-29T00:00:00.000Z",
      ecsCredentials: [
        { ecsSchema: "ServiceCredential", credentialSchemaId: 5,
          id: `${V4_DID}#a`, credentialSubject: { name: "Svc", type: "WEB_PORTAL" } },
        { ecsSchema: "OrganizationCredential", credentialSchemaId: 3,
          id: `${ORG_ISSUER}#b`, credentialSubject: { name: "Org", countryCode: "CH" } },
      ],
    });
    expect(r.state).toBe("TRUSTED");
    expect(r.trustStatus).toBe("TRUSTED");
    expect(r.evaluatedAt).toBe("2026-09-29T18:50:32.517Z");
    expect(r.expiresAt).toBe("2027-09-29T00:00:00.000Z");
    expect(r.credentials.map((c) => c.ecsType)).toEqual(["ECS-SERVICE", "ECS-ORG"]);
    expect(r.credentials[1].issuedBy).toBe(ORG_ISSUER);
    expect(r.credentials[1].claims.countryCode).toBe("CH");
    expect(r.credentials[0].schema?.id).toBe(5);
  });

  it("maps trusted=false to UNTRUSTED", () => {
    expect(mapV4Body(V4_DID, { did: V4_DID, trusted: false }).state).toBe("UNTRUSTED");
  });

  it("maps a body for another DID, or with no verdict, to UNVERIFIED", () => {
    expect(mapV4Body(V4_DID, { did: "did:web:other", trusted: true }).state).toBe("UNVERIFIED");
    expect(mapV4Body(V4_DID, { did: V4_DID }).state).toBe("UNVERIFIED");
  });
});
