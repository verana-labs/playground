import { it } from "vitest";
import { listCastServices } from "../lib/cast-services";
import { clusterNamespace, servingVersion } from "../lib/identity";
import { check } from "../lib/report";
import { describeNetworks } from "../lib/suite";

describeNetworks("version actually serving [CONF-OPS-2] [CONF-OPS-3]", (network) => {
  for (const service of listCastServices(network)) {
    it.concurrent(`${service.cast}/${service.id} serves the tag the repository pins`, () =>
      check({ tier: "t1", check: "serving-version", clause: "CONF-OPS-2", network: network.id, cast: service.cast, service: service.id }, async () => {
        const serving = await servingVersion(service);
        const evidence = { host: service.host, pinnedTag: service.pinnedTag, servingTag: serving.imageTag, packageVersion: serving.packageVersion, source: serving.source, configPath: service.configPath, error: serving.error };
        if (serving.imageTag === null)
          return { outcome: "unknown", cause: clusterNamespace() ? `image tag not readable from the cluster: ${serving.error}` : `no cluster access; landing page ${serving.error ?? "read"}`, evidence };
        if (serving.imageTag !== service.pinnedTag)
          return { outcome: "broken", cause: `pinned ${service.pinnedTag}, serving ${serving.imageTag}`, evidence };
        return { outcome: "works", evidence };
      }),
    );
  }
});
