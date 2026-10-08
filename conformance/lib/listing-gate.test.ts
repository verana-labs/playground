import { describe, expect, it } from "vitest";
import { listWalletProfiles, WalletProfileSchema } from "../../app/lib/wallet-profiles";
import {
  describeFinding,
  linkFindings,
  networkHostFindings,
  parseListing,
  readExceptions,
  readListingText,
  readRawProfiles,
  triage,
  unpinnedBuildFindings,
  type Finding,
} from "./listing-gate";
import { profilesDir } from "./profiles-dir";

const SHA = "e6992fccc6540ae297e20082ccc80e0c8cda0e5d";
const today = new Date().toISOString().slice(0, 10);

const profile = (builds: unknown[]) =>
  WalletProfileSchema.parse({
    id: "w",
    rails: ["anoncreds"],
    didcomm: { library: "credo", proxy: "credo", invitationSchemes: ["didcomm"], demoParams: "" },
    builds,
    quirks: { actsOnLinkOnlyAtColdStart: false, locksOnBackground: false, viewTree: "readable" },
  });

const fork = {
  kind: "fork",
  listed: true,
  label: "fork",
  obtain: "https://github.com/a/w/releases/download/verana-1/app.apk",
  identity: { package: "a.w", repo: "https://github.com/a/w", ref: "verana-1" },
  platforms: ["android"],
  promises: "x",
};

describe("linkFindings", () => {
  it("takes a fork link pinned to the tag of a listed release, and refuses a branch", () => {
    const listing = parseListing(
      JSON.stringify({
        wallets: [
          { id: "w", download: fork.obtain, fork: "https://github.com/a/w/tree/verana-1" },
          { id: "x", download: "https://github.com/a/x", fork: "https://github.com/a/x/tree/feat/verana-trust" },
        ],
      }),
    );
    const findings = linkFindings(listing, [profile([fork])]);
    expect(findings.map((f) => [f.wallet, f.where])).toEqual([
      ["x", "download"],
      ["x", "fork"],
    ]);
  });

  it("refuses a build obtained from a releases index", () => {
    const publisher = { ...fork, kind: "publisher", listed: false, obtain: "https://github.com/a/w/releases", identity: { package: "a.w" } };
    expect(linkFindings([], [profile([fork, publisher])]).map((f) => f.value)).toEqual(["https://github.com/a/w/releases"]);
  });
});

describe("unpinnedBuildFindings", () => {
  it("wants a repo and a ref for every build but a store build, which names its version", () => {
    const browser = { kind: "browser", label: "hosted", obtain: "https://w.example.org", identity: { url: "https://w.example.org", repo: "https://github.com/a/w" }, platforms: ["web"], promises: "x" };
    const store = { kind: "store", label: "store", obtain: "https://play.google.com/store/apps/details?id=a.w", identity: { package: "a.w" }, platforms: ["android"], promises: "x" };
    expect(unpinnedBuildFindings([profile([fork, browser, store])]).map((f) => f.where)).toEqual([
      "profile builds[1].identity",
      "profile builds[2].identity",
    ]);
  });
});

describe("networkHostFindings", () => {
  it("names the field that hard-codes a network host", () => {
    const findings = networkHostFindings("w", { builds: [{ obtain: "https://w.playground.testnet.verana.network" }] });
    expect(findings).toEqual([expect.objectContaining({ where: "builds[0].obtain", value: "w.playground.testnet.verana.network" })]);
  });
});

describe("triage", () => {
  const finding: Finding = { wallet: "w", where: "fork", value: "https://github.com/a/w/tree/main", problem: "pins main" };

  it("keeps the findings no exception covers, and reports stale and expired exceptions", () => {
    const covering = { wallet: "w", value: finding.value, reason: "no tag yet", expires: "2026-11-16" };
    const stale = { wallet: "w", value: "https://github.com/a/w/tree/gone", reason: "fixed", expires: "2026-11-16" };
    const expired = { ...covering, expires: "2026-01-01" };
    expect(triage([finding], [covering, stale], "2026-10-08")).toEqual({ open: [], stale: [stale], expired: [] });
    expect(triage([finding], [expired], "2026-10-08").expired).toEqual([expired]);
    expect(triage([finding], [], "2026-10-08").open).toEqual([finding]);
  });
});

describe("the listing and the profiles", () => {
  const listingText = readListingText();
  const listing = parseListing(listingText);
  const profiles = listWalletProfiles(profilesDir());
  const exceptions = readExceptions();
  const findings = [
    ...linkFindings(listing, profiles),
    ...unpinnedBuildFindings(profiles),
    ...listing.flatMap((w) => networkHostFindings(w.id, w)),
    ...readRawProfiles(profilesDir()).flatMap(({ file, raw }) => networkHostFindings(file.replace(/\.yaml$/, ""), raw, "profile")),
  ];
  const { open, stale, expired } = triage(findings, exceptions, today);

  it("pin every build and link to a release tag or a commit, and follow the network, unless excepted", () => {
    expect(open.map(describeFinding), "fix these links, or add a dated entry to conformance/listing-exceptions.yaml").toEqual([]);
  });

  it("carry no exception past its expiry date", () => {
    expect(expired.map((e) => `${e.wallet} ${e.value} expired ${e.expires}`), "fix the link, or re-check and push the date").toEqual([]);
  });

  it("carry no exception for a link that is already fixed", () => {
    expect(stale.map((e) => `${e.wallet} ${e.value}`), "remove these from conformance/listing-exceptions.yaml").toEqual([]);
  });
});
