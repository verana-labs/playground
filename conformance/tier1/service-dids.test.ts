import { it } from "vitest";
import { listCastServices } from "../lib/cast-services";
import { check } from "../lib/report";
import { ResolverClient } from "../lib/resolver-client";
import { serviceDid, webvhLogHealth } from "../lib/service-did";
import { describeNetworks } from "../lib/suite";

describeNetworks("service DIDs [CONF-T1-5]", (network) => {
  const resolver = new ResolverClient(network.resolver as string);
  for (const service of listCastServices(network)) {
    const base = { tier: "t1" as const, network: network.id, cast: service.cast, service: service.id };

    it.concurrent(`${service.cast}/${service.id} did:webvh log is signed with a fully qualified verification method`, () =>
      check({ ...base, check: "webvh-log-signed", clause: "CONF-T1-5" }, async () => {
        const health = await webvhLogHealth(service);
        return {
          outcome: health.ok ? "works" : "broken",
          cause: health.ok ? undefined : `unrepairable-by-rolling: ${health.error}`,
          evidence: { host: service.host, verificationMethod: health.verificationMethod, entries: health.entries },
        };
      }),
    );

    it.concurrent(`${service.cast}/${service.id} resolves at the trust resolver`, () =>
      check({ ...base, check: "did-resolves", clause: "CONF-T1-5" }, async () => {
        const { did, webvh } = await serviceDid(service);
        const answer = (await resolver.resolve(did)) ?? (await resolver.resolveFresh(did));
        const ok = answer !== null && answer.did === did;
        return {
          outcome: ok ? "works" : "broken",
          cause: ok ? undefined : answer === null ? "resolver has no verdict after refresh" : `resolver echoes ${answer.did}`,
          evidence: { did, webvh, trustStatus: answer?.trustStatus, evaluatedAt: answer?.evaluatedAt, dereferenceErrors: answer?.dereferenceErrors, failedCredentials: answer?.failedCredentials },
        };
      }),
    );
  }
});
