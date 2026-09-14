import { zCredentialIssuerMetadataSchema } from "@openid4vc/openid4vci";
import { it } from "vitest";
import { z } from "zod";
import { listWalletProfiles } from "../../app/lib/wallet-profiles";
import { listCastServices } from "../lib/cast-services";
import { fetchWithTimeout } from "../lib/http";
import { fetchIssuerMetadata } from "../lib/issuer-metadata";
import { profilesDir } from "../lib/profiles-dir";
import { check } from "../lib/report";
import { describeNetworks } from "../lib/suite";

const documents = [...new Set(listWalletProfiles(profilesDir()).flatMap((p) => p.openid4vc?.asDiscovery ?? []))].sort();
const AsMetadataSchema = z.looseObject({ issuer: z.url(), token_endpoint: z.url() });

function forms(authorizationServer: string, document: string): { insertion: string; suffix: string } {
  const u = new URL(authorizationServer);
  const pathname = u.pathname.replace(/\/$/, "");
  return {
    insertion: `${u.origin}/.well-known/${document}${pathname}`,
    suffix: `${authorizationServer.replace(/\/$/, "")}/.well-known/${document}`,
  };
}

async function probe(url: string): Promise<{ url: string; status: number; ok: boolean; issuer?: string }> {
  const res = await fetchWithTimeout(url, { headers: { accept: "application/json" } });
  if (!res.ok) return { url, status: res.status, ok: false };
  const parsed = AsMetadataSchema.safeParse(await res.json().catch(() => null));
  return { url, status: res.status, ok: parsed.success, issuer: parsed.success ? parsed.data.issuer : undefined };
}

describeNetworks("authorization-server discovery [CONF-T1-3]", (network) => {
  for (const service of listCastServices(network).filter((s) => s.oid4vcRole === "issuer")) {
    for (const document of documents) {
      it.concurrent(`${service.cast}/${service.id} answers ${document} in both forms`, () =>
        check({ tier: "t1", check: `as-discovery:${document}`, clause: "CONF-T1-3", network: network.id, cast: service.cast, service: service.id }, async () => {
          const { raw } = await fetchIssuerMetadata(service);
          const metadata = zCredentialIssuerMetadataSchema.parse(raw);
          const authorizationServer = metadata.authorization_servers?.[0] ?? metadata.credential_issuer;
          const urls = forms(authorizationServer, document);
          const [insertion, suffix] = await Promise.all([probe(urls.insertion), probe(urls.suffix)]);
          const problems: string[] = [];
          for (const p of [insertion, suffix]) {
            if (!p.ok) problems.push(`${p.url} -> ${p.status}`);
            else if (p.issuer !== authorizationServer) problems.push(`${p.url} names issuer ${p.issuer}, expected ${authorizationServer}`);
          }
          return { outcome: problems.length ? "broken" : "works", cause: problems.join(" | ") || undefined, evidence: { authorizationServer, insertion, suffix } };
        }),
      );
    }
  }
});
