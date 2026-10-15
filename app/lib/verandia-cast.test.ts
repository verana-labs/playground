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
  it("uses the testnet hosts and no DIDs on testnet (V4)", async () => {
    const { VERANDIA_CAST, displayDid, isPendingDid, VERANDIA_CITIZEN_ID_JSC } = await load("testnet");
    for (const member of Object.values(VERANDIA_CAST)) {
      expect(member.host).toMatch(/\.verandia\.playground\.testnet\.verana\.network$/);
      expect(member.did).toBeUndefined();
      expect(isPendingDid(member.did)).toBe(false);
    }
    expect(displayDid(VERANDIA_CAST.businessRegistry)).toBe(
      "did:web:business-registry.verandia.playground.testnet.verana.network",
    );
    expect(VERANDIA_CITIZEN_ID_JSC).toBe(
      "https://civil-registry.verandia.playground.testnet.verana.network/vt/schemas-verandia-citizen-id-jsc.json",
    );
  });

  it("uses the devnet hosts on devnet", async () => {
    const { VERANDIA_CAST, displayDid } = await load("devnet");
    expect(VERANDIA_CAST.civilRegistry.host).toBe(
      "civil-registry.verandia.playground.devnet.verana.network",
    );
    expect(displayDid(VERANDIA_CAST.businessRegistry)).toBe(
      "did:web:business-registry.verandia.playground.devnet.verana.network",
    );
  });
});
