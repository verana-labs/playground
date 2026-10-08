import { afterEach, describe, expect, it, vi } from "vitest";

// The network is read when the module loads, so each test loads the module
// again with its own NEXT_PUBLIC_VERANA_NETWORK value.
async function load(network: "testnet" | "devnet") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_VERANA_NETWORK", network);
  return import("./verandia-cast");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("verandia-cast", () => {
  it("keeps the testnet hosts and DIDs on testnet (V3)", async () => {
    const { VERANDIA_CAST, displayDid, VERANDIA_CITIZEN_ID_JSC } = await load("testnet");
    expect(VERANDIA_CAST.civilRegistry.host).toBe(
      "civil-registry.verandia.playground.testnet.verana.network",
    );
    expect(VERANDIA_CAST.civilRegistry.did).toMatch(
      /^did:webvh:Qm\w+:civil-registry\.verandia\.playground\.testnet\.verana\.network$/,
    );
    expect(displayDid(VERANDIA_CAST.civilRegistry)).toBe(VERANDIA_CAST.civilRegistry.did);
    expect(VERANDIA_CITIZEN_ID_JSC).toBe(
      "https://civil-registry.verandia.playground.testnet.verana.network/vt/schemas-verandia-citizen-id-jsc.json",
    );
  });

  it("uses the devnet hosts and no DIDs on devnet (V4)", async () => {
    const { VERANDIA_CAST, displayDid, isPendingDid } = await load("devnet");
    for (const member of Object.values(VERANDIA_CAST)) {
      expect(member.host).toMatch(/\.verandia\.playground\.devnet\.verana\.network$/);
      expect(member.did).toBeUndefined();
      expect(isPendingDid(member.did)).toBe(false);
    }
    expect(displayDid(VERANDIA_CAST.businessRegistry)).toBe(
      "did:web:business-registry.verandia.playground.devnet.verana.network",
    );
  });
});
