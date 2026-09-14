import { afterEach, describe, expect, it, vi } from "vitest";
import { ResolverClient } from "./resolver-client";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

const answer = (evaluatedAt: string) => ({
  did: "did:webvh:x",
  trustStatus: "TRUSTED",
  production: false,
  evaluatedAt,
  evaluatedAtBlock: 1,
  expiresAt: "t2",
  credentials: [],
  dereferenceErrors: [],
  failedCredentials: [],
});

describe("ResolverClient", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("resolves with detail=full and validates the fields the guideline names", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(answer("2026-09-14T10:00:00.000Z")));
    vi.stubGlobal("fetch", fetchMock);
    const result = await new ResolverClient("https://r").resolve("did:webvh:x");
    expect(result?.trustStatus).toBe("TRUSTED");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://r/v1/trust/resolve?did=did%3Awebvh%3Ax&detail=full");
  });

  it("returns null on 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({}, 404)));
    expect(await new ResolverClient("https://r").resolve("did:webvh:x")).toBeNull();
  });

  it("resolveFresh refreshes and proves the evaluation moved", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(answer("2026-09-14T10:00:00.000Z")))
      .mockResolvedValueOnce(json({ did: "did:webvh:x", result: "ok" }))
      .mockResolvedValueOnce(json(answer("2026-09-14T10:05:00.000Z")));
    vi.stubGlobal("fetch", fetchMock);
    const fresh = await new ResolverClient("https://r").resolveFresh("did:webvh:x");
    expect(fresh?.evaluatedAt).toBe("2026-09-14T10:05:00.000Z");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://r/v1/trust/refresh");
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe("POST");
  });

  it("resolveFresh refuses a stale reading after refresh", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json(answer("2026-09-14T10:00:00.000Z")))
      .mockResolvedValueOnce(json({ did: "did:webvh:x", result: "ok" }))
      .mockResolvedValueOnce(json(answer("2026-09-14T10:00:00.000Z")));
    vi.stubGlobal("fetch", fetchMock);
    await expect(new ResolverClient("https://r").resolveFresh("did:webvh:x")).rejects.toThrow(/stale/);
  });

  it("asks the issuer and verifier authorization endpoints by schema id", async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ did: "d", vtjscId: "s", authorized: true, evaluatedAt: "t" }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new ResolverClient("https://r");
    expect((await client.issuerAuthorization("d", "https://s")).authorized).toBe(true);
    expect((await client.verifierAuthorization("d", "https://s")).authorized).toBe(true);
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe("https://r/v1/trust/issuer-authorization?did=d&vtjscId=https%3A%2F%2Fs");
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe("https://r/v1/trust/verifier-authorization?did=d&vtjscId=https%3A%2F%2Fs");
  });

  it("reports the resolver version", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ version: "v1.0.3" })));
    expect(await new ResolverClient("https://r").version()).toBe("v1.0.3");
  });
});
