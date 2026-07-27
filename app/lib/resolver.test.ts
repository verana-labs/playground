import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveTrust } from "./resolver";

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
