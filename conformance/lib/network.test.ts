import { afterEach, describe, expect, it } from "vitest";
import { listNetworks, selectedNetworks, testableNetworks, untestableNetworks } from "./network";

describe("networks.yaml", () => {
  afterEach(() => {
    delete process.env.CONFORMANCE_NETWORK;
  });

  it("declares testnet v4 with the V4 vocabulary and endpoints", () => {
    const testnet = listNetworks().find((n) => n.id === "testnet-v4");
    expect(testnet?.protocol).toBe("v4");
    expect(testnet?.indexer).toBe("https://idx.testnet.verana.network");
    expect(testnet?.playground).toBe("https://playground.testnet.verana.network");
    expect(testnet?.production).toBe(false);
    expect(testnet?.vocabulary).toEqual({ ecosystem: "Ecosystem", participant: "Participant" });
  });

  it("declares testnet v4 as not testable, with a reason", () => {
    const testnet = listNetworks().find((n) => n.id === "testnet-v4");
    expect(testnet?.testable).toBe(false);
    expect(testnet?.reason).toMatch(/resolver/);
  });

  it("selects one network by env and rejects unknown ids", () => {
    process.env.CONFORMANCE_NETWORK = "testnet-v4";
    expect(selectedNetworks().map((n) => n.id)).toEqual(["testnet-v4"]);
    process.env.CONFORMANCE_NETWORK = "mainnet";
    expect(() => selectedNetworks()).toThrow(/unknown network mainnet/);
  });

  it("splits testable from untestable", () => {
    expect(testableNetworks().map((n) => n.id)).toEqual([]);
    expect(untestableNetworks().map((n) => n.id)).toEqual(["testnet-v4"]);
  });
});
