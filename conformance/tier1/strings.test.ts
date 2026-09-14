import { describe, it } from "vitest";
import { inScope, listCastServices } from "../lib/cast-services";
import { fetchJson } from "../lib/http";
import { fetchIssuerMetadata, vctDocumentUrl } from "../lib/issuer-metadata";
import { fetchOobInvitation } from "../lib/links";
import { issuanceParamsFor, mintsEnabled } from "../lib/mints";
import { mintIssuance, mintPresentation } from "../lib/playground-client";
import { check } from "../lib/report";
import { ResolverClient } from "../lib/resolver-client";
import { serviceDid } from "../lib/service-did";
import { collectStrings, encodingDamage } from "../lib/strings";
import { describeNetworks } from "../lib/suite";

type Damage = { source: string; path: string; value: string; damage: string };

function scan(source: string, value: unknown): Damage[] {
  return collectStrings(value).flatMap(({ path, value }) => {
    const damage = encodingDamage(value);
    return damage ? [{ source, path, value, damage }] : [];
  });
}

const describeDamage = (damage: Damage[]): string | undefined => damage.map((d) => `${d.source}.${d.path}: ${d.damage}`).join(" | ") || undefined;

describeNetworks("human-visible strings [CONF-T1-7]", (network) => {
  const resolver = new ResolverClient(network.resolver as string);
  const services = listCastServices(network);
  for (const service of services) {
    const base = { tier: "t1" as const, clause: "CONF-T1-7", network: network.id, cast: service.cast, service: service.id };

    it.concurrent(`${service.cast}/${service.id} trust credentials read cleanly`, () =>
      check({ ...base, check: "strings:ecs-claims" }, async () => {
        const { did } = await serviceDid(service);
        const answer = await resolver.resolve(did);
        if (!answer || answer.credentials.length === 0)
          return { outcome: "unknown", cause: answer ? "resolver holds no credentials for this service (cached negative or never provisioned)" : "resolver has no verdict", evidence: { did, trustStatus: answer?.trustStatus, evaluatedAt: answer?.evaluatedAt } };
        const damage = answer.credentials.flatMap((c) => scan(`${c.ecsType} claims`, c.claims));
        return { outcome: damage.length ? "broken" : "works", cause: describeDamage(damage), evidence: { did, damage } };
      }),
    );

    if (service.oid4vcRole === "issuer")
      it.concurrent(`${service.cast}/${service.id} issuer metadata and vct documents read cleanly`, () =>
        check({ ...base, check: "strings:issuer-metadata" }, async () => {
          const { raw } = await fetchIssuerMetadata(service);
          const damage = scan("issuer metadata", raw);
          const configurations = Object.keys((raw as { credential_configurations_supported?: Record<string, unknown> }).credential_configurations_supported ?? {});
          for (const id of configurations) {
            const url = vctDocumentUrl(raw, id);
            if (url) damage.push(...scan(`vct ${id}`, await fetchJson(url)));
          }
          return { outcome: damage.length ? "broken" : "works", cause: describeDamage(damage), evidence: { damage } };
        }),
      );
  }

  describe.skipIf(!mintsEnabled())("invitation labels (CONFORMANCE_MINTS=1)", () => {
    for (const service of services.filter((s) => inScope(s) && (s.oid4vcRole !== null || s.demoPerm !== null))) {
      it.concurrent(`${service.cast}/${service.id} DIDComm invitation label reads cleanly`, () =>
        check({ tier: "t1", check: "strings:invitation-label", clause: "CONF-T1-7", network: network.id, cast: service.cast, service: service.id }, async () => {
          const verifier = service.oid4vcRole === "verifier" || service.demoPerm === "verifier";
          const eventosVerifier = verifier && service.cast === "eventos";
          const mint = verifier
            ? await mintPresentation(network, service, { format: "anoncreds", demoParams: "", login: eventosVerifier ? { evento: service.id.replace(/^evento-/, ""), rol: "asistente" } : undefined })
            : await mintIssuance(network, service, { format: "anoncreds", demoParams: "", ...issuanceParamsFor(service) });
          if (mint.kind === "invitation") return { outcome: "unknown", cause: "plain invitation page, no label to read", evidence: { url: mint.url } };
          const invitation = await fetchOobInvitation(mint.url);
          const damage = scan("invitation", { label: invitation.label });
          return { outcome: damage.length ? "broken" : "works", cause: describeDamage(damage), evidence: { url: mint.url, label: invitation.label, damage } };
        }),
      );
    }
  });
});
