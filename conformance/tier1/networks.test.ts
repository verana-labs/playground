import { expect, it } from "vitest";
import { check, record } from "../lib/report";
import { ResolverClient } from "../lib/resolver-client";
import { describeNetworks } from "../lib/suite";

describeNetworks("network-testable", (network) => {
  it(`resolver answers with a version [CONF-NET-3]`, () =>
    check({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id }, async () => {
      const version = await new ResolverClient(network.resolver as string).version();
      const works = /^v?\d/.test(version);
      return { outcome: works ? "works" : "broken", cause: works ? undefined : `resolver version ${version} is not a version`, evidence: { resolver: network.resolver, resolverVersion: version, playground: network.playground } };
    }));
});

import { untestableNetworks } from "../lib/network";

it("every untestable network is reported", () => {
  for (const network of untestableNetworks())
    record({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id, outcome: "not-testable", cause: network.reason });
  expect(true).toBe(true);
});
