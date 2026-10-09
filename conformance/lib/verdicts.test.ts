import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { listWalletProfiles, WalletProfileSchema } from "../../app/lib/wallet-profiles";
import { parseListing, readListingText } from "./listing-gate";
import { profilesDir } from "./profiles-dir";
import { readDevnetServices, renderVerdicts, ServicesSchema, walletVerdicts, type Services } from "./verdicts";

const today = new Date().toISOString().slice(0, 10);

const services: Services = ServicesSchema.parse({
  network: "devnet-v4",
  offer: {
    openid4vc: {
      grants: ["pre-authorized_code"],
      proofTypes: ["jwt"],
      formats: ["dc+sd-jwt"],
      queryLanguages: ["dcql", "presentation_exchange"],
      clientIdPrefixes: ["x509_hash"],
      responseModes: ["direct_post.jwt"],
    },
    anoncreds: { didcommVersions: ["v2"] },
  },
  gaps: [
    { id: "pe", rail: "openid4vc-sdjwt", blocks: { queryLanguages: ["presentation_exchange"] }, cause: "PE broken", until: "the fix", expires: "2026-11-16" },
    { id: "haip", rail: "openid4vc-sdjwt", blocks: { sendsWalletAttestation: "yes" }, cause: "attestation refused", until: "the bump", expires: "2026-11-16" },
  ],
});

const openid4vc = {
  grants: { "pre-authorized_code": "yes" },
  proofTypes: { jwt: "yes" },
  formats: { "dc+sd-jwt": "yes" },
  queryLanguages: { dcql: "yes" },
  clientIdPrefixes: { x509_hash: "yes" },
  responseModes: { "direct_post.jwt": "yes" },
  sendsWalletAttestation: "no",
  requiresMetadataKid: "no",
};

const wallet = (caps: Record<string, unknown>, demoParams = "signer=x5c", query = "dcql") =>
  WalletProfileSchema.parse({
    id: "w",
    rails: ["openid4vc-sdjwt"],
    openid4vc: {
      library: "lib",
      proxy: "proxy",
      vciDrafts: ["v1"],
      offerSchemes: ["openid-credential-offer"],
      requestSchemes: ["openid4vp"],
      asDiscovery: ["oauth-authorization-server"],
      presentation: { query, clientId: "x509_hash", responseMode: "direct_post.jwt" },
      demoParams,
    },
    builds: [{ kind: "store", listed: true, label: "store", obtain: "https://play.google.com/store/apps/details?id=a.w", identity: { package: "a.w", version: "1" }, platforms: ["android"], promises: "x" }],
    quirks: { actsOnLinkOnlyAtColdStart: false, locksOnBackground: false, viewTree: "readable" },
    capabilities: { openid4vc: { ...openid4vc, ...caps } },
  });

const verdictOf = (caps: Record<string, unknown>, demoParams?: string, query?: string) => walletVerdicts([wallet(caps, demoParams, query)], services)[0];

describe("walletVerdicts", () => {
  it("says works when every dimension meets what devnet offers", () => {
    expect(verdictOf({})).toMatchObject({ verdict: "works", reasons: [] });
  });

  it("says will not work when nothing the wallet takes is offered", () => {
    expect(verdictOf({ formats: { mso_mdoc: "yes", "dc+sd-jwt": "no" } })).toMatchObject({
      verdict: "will not work",
      reasons: ["formats: it takes mso_mdoc, devnet offers dc+sd-jwt"],
    });
  });

  it("says will not work, naming the gap, when the listing mints a rail a known gap breaks", () => {
    const pe = verdictOf({ queryLanguages: { presentation_exchange: "yes", dcql: "yes" } }, "signer=x5c&query=pe", "presentation_exchange");
    expect(pe).toMatchObject({ verdict: "will not work", reasons: ["known gap pe"] });
    expect(verdictOf({ sendsWalletAttestation: "yes" })?.reasons).toEqual(["known gap haip"]);
  });

  it("says unknown when the capability devnet needs is not established", () => {
    expect(verdictOf({ grants: {} })).toMatchObject({ verdict: "unknown" });
    expect(verdictOf({ sendsWalletAttestation: "unknown" })).toMatchObject({ verdict: "unknown" });
  });

  it("says works with known issues under a gap that blocks nothing", () => {
    const degraded = { ...services, gaps: [...services.gaps, { id: "decline", rail: "openid4vc-sdjwt" as const, cause: "decline answered 500", until: "Credo 0.8", expires: "2026-11-16" }] };
    expect(walletVerdicts([wallet({})], degraded)[0]).toMatchObject({ verdict: "works with known issues", reasons: ["known gap decline"] });
  });

  it("refuses an unknown dimension in a gap", () => {
    expect(ServicesSchema.safeParse({ ...services, gaps: [{ ...services.gaps[0], blocks: { queryLanguage: ["dcql"] } }] }).success).toBe(false);
  });
});

describe("the listed wallets on devnet", () => {
  const devnet = readDevnetServices();
  const listing = parseListing(readListingText());
  const statusOf = (id: string) => listing.find((w) => w.id === id)?.status ?? "testing";
  const order = ["recommended", "compatible", "testing"];
  const rows = walletVerdicts(listWalletProfiles(profilesDir()), devnet)
    .map((r) => ({ ...r, status: statusOf(r.wallet) }))
    .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));

  it("writes the verdict table for the job summary", () => {
    fs.mkdirSync(new URL("../results/", import.meta.url), { recursive: true });
    fs.writeFileSync(new URL("../results/wallet-verdicts.md", import.meta.url), renderVerdicts(devnet, rows));
  });

  it("list a wallet as recommended or compatible only when devnet can serve it", () => {
    const contradicted = rows
      .filter((r) => r.status !== "testing" && (r.verdict === "will not work" || r.verdict === "unknown"))
      .map((r) => `${r.wallet} (${r.status}) ${r.verdict}: ${r.reasons.join("; ")}`);
    expect(contradicted, "fix the capabilities, or list the wallet as testing").toEqual([]);
  });

  it("carry no service gap past its re-check date", () => {
    const expired = devnet.gaps.filter((g) => g.expires < today).map((g) => `${g.id} expired ${g.expires}`);
    expect(expired, "re-check conformance/devnet-services.yaml: drop the gap if fixed, or push the date").toEqual([]);
  });
});
