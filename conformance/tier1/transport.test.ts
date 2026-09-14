import { describe, it } from "vitest";
import { inScope, listCastServices } from "../lib/cast-services";
import { fetchWithTimeout } from "../lib/http";
import { issuanceParamsFor, mintsEnabled } from "../lib/mints";
import { mintIssuance } from "../lib/playground-client";
import { check } from "../lib/report";
import { describeNetworks } from "../lib/suite";
import { inspectTls } from "../lib/tls";

describeNetworks("transport [CONF-T1-6]", (network) => {
  const services = listCastServices(network);
  for (const service of services) {
    const base = { tier: "t1" as const, network: network.id, cast: service.cast, service: service.id };

    it.concurrent(`${service.cast}/${service.id} serves a real certificate for its host`, () =>
      check({ ...base, check: "tls-certificate", clause: "CONF-T1-6" }, async () => {
        const report = await inspectTls(service.host);
        const named = report.altNames?.includes(`DNS:${service.host}`) ?? false;
        const ok = report.authorized && named;
        return { outcome: ok ? "works" : "broken", cause: ok ? undefined : (report.error ?? `certificate for ${report.subject} does not name ${service.host}`), evidence: { ...report } };
      }),
    );

    it.concurrent(`${service.cast}/${service.id} refuses cleartext`, () =>
      check({ ...base, check: "no-cleartext", clause: "CONF-T1-6" }, async () => {
        try {
          const res = await fetchWithTimeout(`http://${service.host}/`, { redirect: "manual", timeoutMs: 15_000 });
          const location = res.headers.get("location") ?? "";
          const redirected = res.status >= 300 && res.status < 400 && location.startsWith("https://");
          return { outcome: redirected ? "works" : "broken", cause: redirected ? undefined : `cleartext answered ${res.status} -> ${location}`, evidence: { status: res.status, location } };
        } catch (e) {
          const message = e instanceof Error ? e.message + " " + String((e as { cause?: { code?: string } }).cause?.code ?? "") : String(e);
          if (/ECONNREFUSED|ECONNRESET/.test(message)) return { outcome: "works", evidence: { refused: message } };
          return { outcome: "unknown", cause: `cleartext probe could not complete: ${message}` };
        }
      }),
    );
  }

  describe.skipIf(!mintsEnabled())("short links (CONFORMANCE_MINTS=1)", () => {
    for (const service of services.filter((s) => inScope(s) && (s.oid4vcRole === "issuer" || s.demoPerm === "issuer"))) {
      it.concurrent(`${service.cast}/${service.id} invitation short link opens for a browser`, () =>
        check({ tier: "t1", check: "short-link-browser", clause: "CONF-T1-6", network: network.id, cast: service.cast, service: service.id }, async () => {
          const mint = await mintIssuance(network, service, { format: "anoncreds", demoParams: "", ...issuanceParamsFor(service) });
          const res = await fetchWithTimeout(mint.url, { headers: { accept: "text/html,application/xhtml+xml" }, redirect: "manual" });
          const location = res.headers.get("location") ?? "";
          const ok = res.status >= 200 && res.status < 400;
          return {
            outcome: ok ? "works" : "broken",
            cause: ok ? undefined : `HTTP ${res.status} with Accept: text/html`,
            evidence: { url: mint.url, status: res.status, locationBytes: Buffer.byteLength(location), locationScheme: location.split(":")[0] },
          };
        }),
      );
    }
  });
});
