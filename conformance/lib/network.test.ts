import { afterEach, describe, expect, it } from "vitest";
import { listNetworks, selectedNetworks, testableNetworks, untestableNetworks } from "./network";

describe("networks.yaml", () => {
  afterEach(() => {
    delete process.env.CONFORMANCE_NETWORK;
  });

  it("declares testnet v3 as testable with a resolver and a playground", () => {
    const testnet = listNetworks().find((n) => n.id === "testnet-v3");
    expect(testnet?.testable).toBe(true);
    expect(testnet?.resolver).toBe("https://resolver.testnet.verana.network");
    expect(testnet?.playground).toBe("https://playground.testnet.verana.network");
    expect(testnet?.production).toBe(false);
    expect(testnet?.vocabulary).toEqual({ ecosystem: "Trust Registry", participant: "Permission" });
  });

  it("declares devnet v4 as not testable, with a reason", () => {
    const devnet = listNetworks().find((n) => n.id === "devnet-v4");
    expect(devnet?.testable).toBe(false);
    expect(devnet?.reason).toMatch(/resolver/);
    expect(devnet?.vocabulary).toEqual({ ecosystem: "Ecosystem", participant: "Participant" });
  });

  it("selects one network by env and rejects unknown ids", () => {
    process.env.CONFORMANCE_NETWORK = "testnet-v3";
    expect(selectedNetworks().map((n) => n.id)).toEqual(["testnet-v3"]);
    process.env.CONFORMANCE_NETWORK = "mainnet";
    expect(() => selectedNetworks()).toThrow(/unknown network mainnet/);
  });

  it("splits testable from untestable", () => {
    expect(testableNetworks().map((n) => n.id)).toEqual(["testnet-v3"]);
    expect(untestableNetworks().map((n) => n.id)).toEqual(["devnet-v4"]);
  });
});
