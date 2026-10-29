import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { x509CertificateMetadata } from "./keys";

const pem = readFileSync(new URL("../fixtures/protocolsoup/issuer-root.pem", import.meta.url), "utf8");
const x5cEntry = pem.replace(/-----(BEGIN|END) CERTIFICATE-----|\s/g, "");

describe("x509CertificateMetadata", () => {
  it("reads the DNS and URI SANs of the leaf certificate", () => {
    expect(x509CertificateMetadata(x5cEntry)).toEqual({
      sanDnsNames: ["demo-issuer-accredited.playground.devnet.verana.network"],
      sanUriNames: ["did:webvh:Qmaup6XHn4UMTEUu9PWMEwcRAYmZ74SpPpUGYpnXj9dTPf:demo-issuer-accredited.playground.devnet.verana.network"],
    });
  });
});
