import { afterEach, describe, expect, it, vi } from "vitest";

// network.ts reads NEXT_PUBLIC_VERANA_NETWORK when it loads, so each test
// loads the modules again.
const load = async () => {
  vi.resetModules();
  return import("./bhi-cast");
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("BHI cast", () => {
  it("keeps the V3 hosts and the live did:webvh values on testnet", async () => {
    const { BHI_CAST, bhiDisplayDid } = await load();
    for (const member of Object.values(BHI_CAST)) {
      expect(member.host).toMatch(/\.bhi\.playground\.testnet\.verana\.network$/);
      expect(member.did).toMatch(/^did:webvh:Qm/);
      expect(member.did?.endsWith(`:${member.host}`)).toBe(true);
      expect(bhiDisplayDid(member)).toBe(member.did);
    }
    expect(BHI_CAST.meridian.host).toBe("meridian.bhi.playground.testnet.verana.network");
  });

  it("uses the devnet hosts and no static DIDs on devnet", async () => {
    vi.stubEnv("NEXT_PUBLIC_VERANA_NETWORK", "devnet");
    const { BHI_CAST, bhiDisplayDid, BHI_QUALIFICATION_JSC } = await load();
    for (const member of Object.values(BHI_CAST)) {
      expect(member.host).toMatch(/\.bhi\.playground\.devnet\.verana\.network$/);
      expect(member.did).toBeUndefined();
      expect(bhiDisplayDid(member)).toBe(`did:web:${member.host}`);
    }
    expect(BHI_CAST.bhi.host).toBe("institute.bhi.playground.devnet.verana.network");
    expect(BHI_QUALIFICATION_JSC).toContain("caledonian.bhi.playground.devnet.verana.network");
  });
});
