import { afterEach, describe, expect, it, vi } from "vitest";

/** A new copy of cexa-cast.ts on a network (NETWORK is read at import time). */
async function castOn(network: "testnet" | "devnet") {
  vi.stubEnv("NEXT_PUBLIC_VERANA_NETWORK", network);
  vi.resetModules();
  return import("./cexa-cast");
}

afterEach(() => vi.unstubAllEnvs());

describe("CEXA cast", () => {
  it("keeps the V3 DIDs, ids, links and EGF on testnet", async () => {
    const cast = await castOn("testnet");
    expect(cast.CEXA_CAST.aurum.host).toBe("aurum.cexa.playground.testnet.verana.network");
    expect(cast.CEXA_CAST.association.did).toMatch(/^did:webvh:QmRp5/);
    expect(cast.isPendingDid(cast.CEXA_CAST.aurum.did)).toBe(false);
    expect(cast.CEXA_KYC_SCHEMA_ID).toBe(261);
    expect(cast.cexaEcosystemUrl(197)).toBe("https://app.testnet.verana.network/tr/197");
    expect(cast.cexaSchemaUrl(261)).toBe("https://app.testnet.verana.network/tr/cs/261");
    expect(cast.CEXA_EGF_URL).toBe("https://playground.testnet.verana.network/cexa/cexa-egf.md");
    expect(cast.CEXA_ECS_ORG_ISSUER).toBe("Helvetia Trust Services (demo)");
  });

  it("finds everything at run time on devnet", async () => {
    const cast = await castOn("devnet");
    expect(cast.CEXA_CAST.association.host).toBe("association.cexa.playground.devnet.verana.network");
    expect(cast.CEXA_CAST.association.did).toBeUndefined();
    expect(cast.isPendingDid(cast.CEXA_CAST.association.did)).toBe(false);
    expect(cast.CEXA_KYC_SCHEMA_ID).toBeUndefined();
    expect(cast.cexaEcosystemUrl(5)).toBe("https://app.devnet.verana.network/ecosystems/5");
    expect(cast.cexaSchemaUrl(6)).toBe("https://app.devnet.verana.network/credential-schemas/6");
    expect(cast.cexaParticipantsUrl(6)).toBe("https://app.devnet.verana.network/participants/6");
    expect(cast.CEXA_EGF_URL).toBe("https://playground.devnet.verana.network/cexa/cexa-egf-v4.md");
  });
});
