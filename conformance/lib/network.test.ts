import { afterEach, describe, expect, it } from "vitest";
import { listNetworks, parseNetworks, selectedNetworks, testableNetworks, trustBackend, untestableNetworks } from "./network";

const v4Network = {
  id: "x-v4",
  vpr: "vna-x-1",
  protocol: "v4",
  production: false,
  castToken: "x",
  resolver: null,
  indexer: "https://idx.x.verana.network",
  rpc: null,
  playground: "https://playground.x.verana.network",
  vocabulary: { ecosystem: "Ecosystem", participant: "Participant" },
  testable: true,
};

const networksFile = (overrides: Record<string, unknown>): string => JSON.stringify({ networks: [{ ...v4Network, ...overrides }] });

describe("networks.yaml", () => {
  afterEach(() => {
    delete process.env.CONFORMANCE_NETWORK;
  });

  it("declares testnet v3 as testable through its resolver, on every cast", () => {
    const testnet = listNetworks().find((n) => n.id === "testnet-v3")!;
    expect(testnet.testable).toBe(true);
    expect(testnet.resolver).toBe("https://resolver.testnet.verana.network");
    expect(testnet.playground).toBe("https://playground.testnet.verana.network");
    expect(testnet.production).toBe(false);
    expect(testnet.vocabulary).toEqual({ ecosystem: "Trust Registry", participant: "Permission" });
    expect(testnet.casts).toBeUndefined();
    expect(trustBackend(testnet)).toEqual({ kind: "resolver", url: "https://resolver.testnet.verana.network" });
  });

  it("declares devnet v4 as testable through its indexer, on the demo cast only", () => {
    const devnet = listNetworks().find((n) => n.id === "devnet-v4")!;
    expect(devnet.testable).toBe(true);
    expect(devnet.resolver).toBeNull();
    expect(devnet.indexer).toBe("https://idx.devnet.verana.network");
    expect(devnet.rpc).toBe("https://rpc.devnet.verana.network");
    expect(devnet.playground).toBe("https://playground.devnet.verana.network");
    expect(devnet.vocabulary).toEqual({ ecosystem: "Ecosystem", participant: "Participant" });
    expect(devnet.casts).toEqual(["demo"]);
    expect(trustBackend(devnet)).toEqual({ kind: "indexer", url: "https://idx.devnet.verana.network" });
  });

  it("selects one network by env and rejects unknown ids", () => {
    process.env.CONFORMANCE_NETWORK = "testnet-v3";
    expect(selectedNetworks().map((n) => n.id)).toEqual(["testnet-v3"]);
    process.env.CONFORMANCE_NETWORK = "devnet-v4";
    expect(testableNetworks().map((n) => n.id)).toEqual(["devnet-v4"]);
    process.env.CONFORMANCE_NETWORK = "mainnet";
    expect(() => selectedNetworks()).toThrow(/unknown network mainnet/);
  });

  it("splits testable from untestable", () => {
    expect(testableNetworks().map((n) => n.id)).toEqual(["testnet-v3", "devnet-v4"]);
    expect(untestableNetworks()).toEqual([]);
  });
});

describe("parseNetworks", () => {
  it("accepts a testable v4 network with an indexer and no resolver", () => {
    expect(parseNetworks(networksFile({})).map((n) => n.id)).toEqual(["x-v4"]);
  });

  it("rejects a testable v4 network that only has a resolver", () => {
    expect(() => parseNetworks(networksFile({ resolver: "https://resolver.x.verana.network", indexer: null }))).toThrow(
      /x-v4: a testable v4 network needs a playground and its trust backend \(indexer\)/,
    );
  });

  it("rejects a testable v3 network that only has an indexer", () => {
    expect(() => parseNetworks(networksFile({ protocol: "v3" }))).toThrow(/a testable v3 network needs a playground and its trust backend \(resolver\)/);
  });

  it("rejects a testable network without a playground", () => {
    expect(() => parseNetworks(networksFile({ playground: null }))).toThrow(/needs a playground/);
  });

  it("rejects an untestable network without a reason, and an empty cast scope", () => {
    expect(() => parseNetworks(networksFile({ testable: false }))).toThrow(/an untestable network needs a reason/);
    expect(() => parseNetworks(networksFile({ casts: [] }))).toThrow();
  });

  it("refuses to name a trust backend the network does not have", () => {
    const [n] = parseNetworks(networksFile({ indexer: null, testable: false, reason: "no indexer yet" }));
    expect(() => trustBackend(n!)).toThrow(/x-v4: a v4 network resolves trust with its indexer, which is not set/);
  });
});
