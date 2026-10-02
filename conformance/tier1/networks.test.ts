import { expect, it } from "vitest";
import { check, record } from "../lib/report";
import { describeNetworks } from "../lib/suite";
import { trustClientFor } from "../lib/trust-client";

describeNetworks("network-testable", (network) => {
  it(`trust backend answers with a version [CONF-NET-3]`, () =>
    check({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id }, async () => {
      const trust = trustClientFor(network);
      const version = await trust.version();
      const works = /^v?\d/.test(version);
      return {
        outcome: works ? "works" : "broken",
        cause: works ? undefined : `${trust.protocol} trust backend version ${version} is not a version`,
        evidence: { trustProtocol: trust.protocol, trustEndpoint: trust.endpoint, trustVersion: version, playground: network.playground },
      };
    }));
});

import { untestableNetworks } from "../lib/network";

it("every untestable network is reported", () => {
  for (const network of untestableNetworks())
    record({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id, outcome: "not-testable", cause: network.reason });
  expect(true).toBe(true);
});
