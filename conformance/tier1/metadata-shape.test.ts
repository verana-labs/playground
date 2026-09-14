import { zCredentialIssuerMetadataSchema } from "@openid4vc/openid4vci";
import { it } from "vitest";
import { listWalletProfiles } from "../../app/lib/wallet-profiles";
import { listCastServices } from "../lib/cast-services";
import { DisplayedConfigurationSchema, DRAFT_PARSERS, fetchIssuerMetadata, LegacyIssuerMetadataSchema, type VciDraft } from "../lib/issuer-metadata";
import { profilesDir } from "../lib/profiles-dir";
import { check } from "../lib/report";
import { describeNetworks } from "../lib/suite";

const fleetDrafts = [...new Set(listWalletProfiles(profilesDir()).flatMap((p) => p.openid4vc?.vciDrafts ?? []))].sort() as VciDraft[];

describeNetworks("issuer metadata", (network) => {
  for (const service of listCastServices(network).filter((s) => s.oid4vcRole === "issuer")) {
    const base = { tier: "t1" as const, network: network.id, cast: service.cast, service: service.id };

    it.concurrent(`${service.cast}/${service.id} parses under every draft the fleet speaks [CONF-T1-1]`, () =>
      check({ ...base, check: "metadata-parses", clause: "CONF-T1-1" }, async () => {
        const { url, raw, tried } = await fetchIssuerMetadata(service);
        const perDraft = Object.fromEntries(fleetDrafts.map((d) => [d, { parser: DRAFT_PARSERS[d].name, ownLibrary: DRAFT_PARSERS[d].own, ...DRAFT_PARSERS[d].parse(raw) }]));
        const failed = Object.entries(perDraft).filter(([, r]) => !r.success);
        return {
          outcome: failed.length ? "broken" : "works",
          cause: failed.length ? failed.map(([d, r]) => `${d}: ${"error" in r ? r.error : ""}`).join(" | ") : undefined,
          evidence: { url, tried, perDraft },
        };
      }),
    );

    it.concurrent(`${service.cast}/${service.id} publishes display and claims in both shapes [CONF-T1-2]`, () =>
      check({ ...base, check: "metadata-both-shapes", clause: "CONF-T1-2" }, async () => {
        const { url, raw } = await fetchIssuerMetadata(service);
        const modern = zCredentialIssuerMetadataSchema.safeParse(raw);
        if (!modern.success) return { outcome: "broken", cause: `not parseable as draft 14+: ${modern.error.message}`, evidence: { url } };
        const problems: string[] = [];
        for (const [id, configuration] of Object.entries(modern.data.credential_configurations_supported)) {
          const r = DisplayedConfigurationSchema.safeParse(configuration);
          if (!r.success) problems.push(`${id}: ${r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        }
        const legacy = LegacyIssuerMetadataSchema.safeParse(raw);
        if (!legacy.success) problems.push(`credentials_supported: ${legacy.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`);
        const legacyClaims = legacy.success ? legacy.data.credentials_supported.map((c) => ({ id: c.id, claims: "claims" in c && typeof c.claims === "object" && c.claims !== null })) : [];
        return {
          outcome: problems.length ? "broken" : "works",
          cause: problems.join(" | ") || undefined,
          evidence: { url, configurations: Object.keys(modern.data.credential_configurations_supported), legacyClaims },
        };
      }),
    );
  }
});
