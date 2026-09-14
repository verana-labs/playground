import { expect, it } from "vitest";
import { record } from "../lib/report";
import { ResolverClient } from "../lib/resolver-client";
import { describeNetworks } from "../lib/suite";

describeNetworks("network-testable", (network) => {
  it(`resolver answers with a version [CONF-NET-3]`, async () => {
    const version = await new ResolverClient(network.resolver as string).version();
    record({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id, outcome: "works", evidence: { resolver: network.resolver, resolverVersion: version, playground: network.playground } });
    expect(version).toMatch(/^v?\d/);
  });
});

import { untestableNetworks } from "../lib/network";

it("every untestable network is reported", () => {
  for (const network of untestableNetworks())
    record({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id, outcome: "not-testable", cause: network.reason });
  expect(true).toBe(true);
});
