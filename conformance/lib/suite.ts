import { describe, it } from "vitest";
import { testableNetworks, untestableNetworks, type Network } from "./network";
import { record } from "./report";

export function describeNetworks(title: string, body: (network: Network) => void): void {
  const testable = testableNetworks();
  if (testable.length === 0) {
    describe(title, () => {
      it("no selected network is testable", () => {
        for (const network of untestableNetworks())
          record({ tier: "t1", check: title, clause: "CONF-NET-3", network: network.id, outcome: "not-testable", cause: network.reason });
      });
    });
    return;
  }
  for (const network of testable) describe(`${network.id} ${title}`, () => body(network));
}
