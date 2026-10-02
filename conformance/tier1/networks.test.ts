import { expect, it } from "vitest";
import { z } from "zod";
import { fetchJson } from "../lib/http";
import { trustBackend, type TrustBackend } from "../lib/network";
import { check, record } from "../lib/report";
import { ResolverClient } from "../lib/resolver-client";
import { describeNetworks } from "../lib/suite";

async function backendVersion({ kind, url }: TrustBackend): Promise<string> {
  if (kind === "resolver") return new ResolverClient(url).version();
  return z.object({ app_version: z.string() }).parse(await fetchJson(`${url}/v4/indexer/version`)).app_version;
}

describeNetworks("network-testable", (network) => {
  const backend = trustBackend(network);
  it(`${backend.kind} answers with a version [CONF-NET-3]`, () =>
    check({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id }, async () => {
      const version = await backendVersion(backend);
      const works = /^v?\d/.test(version);
      return { outcome: works ? "works" : "broken", cause: works ? undefined : `${backend.kind} version ${version} is not a version`, evidence: { [backend.kind]: backend.url, [`${backend.kind}Version`]: version, playground: network.playground } };
    }));
});

import { untestableNetworks } from "../lib/network";

it("every untestable network is reported", () => {
  for (const network of untestableNetworks())
    record({ tier: "t1", check: "network-testable", clause: "CONF-NET-3", network: network.id, outcome: "not-testable", cause: network.reason });
  expect(true).toBe(true);
});
