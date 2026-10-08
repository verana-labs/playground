import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  effectiveDemoParams,
  effectivePresentation,
  getWalletProfile,
  listWalletProfiles,
  listedBuilds,
  obtainUrls,
  WalletProfileSchema,
} from "./wallet-profiles";
import { WalletsFileSchema } from "./wallets";
import { walletLinks } from "./wallet-links";
import { NETWORK } from "./network";

const device = { activity: ".Main", unlock: "passcode", secret: "123456", coldStart: false };

const valid = {
  id: "example",
  rails: ["openid4vc-sdjwt"],
  openid4vc: {
    library: "example lib",
    proxy: "@openid4vc/openid4vci",
    vciDrafts: ["v1"],
    offerSchemes: ["openid-credential-offer"],
    requestSchemes: ["openid4vp"],
    asDiscovery: ["oauth-authorization-server"],
    presentation: { query: "dcql", clientId: "x509_hash", responseMode: "direct_post.jwt" },
    demoParams: "signer=x5c",
  },
  builds: [
    {
      kind: "fork",
      listed: true,
      label: "fork apk",
      obtain: "https://github.com/example/wallet/releases/download/verana-2026-09-01/app.apk",
      identity: { package: "org.example", version: "1.0.0", repo: "https://github.com/example/wallet", ref: "verana-2026-09-01" },
      platforms: ["android"],
      promises: "everything",
      device,
    },
    {
      kind: "store",
      label: "store",
      obtain: "https://play.google.com/store/apps/details?id=org.example",
      identity: { package: "org.example", version: "2.0.0" },
      platforms: ["android", "ios"],
      presumptive: ["ios"],
      promises: "q1 only",
      presentation: { query: "dcql", clientId: "did", responseMode: "direct_post.jwt" },
      demoParams: "",
      device,
    },
  ],
  quirks: { actsOnLinkOnlyAtColdStart: false, locksOnBackground: false, viewTree: "readable" },
};

const SHA = "e6992fccc6540ae297e20082ccc80e0c8cda0e5d";

describe("WalletProfileSchema", () => {
  it("accepts a complete profile", () => {
    expect(() => WalletProfileSchema.parse(valid)).not.toThrow();
  });

  it("requires an openid4vc block for the openid4vc-sdjwt rail", () => {
    const without = Object.fromEntries(Object.entries(valid).filter(([key]) => key !== "openid4vc"));
    expect(WalletProfileSchema.safeParse(without).success).toBe(false);
  });

  it("requires a didcomm block for the anoncreds rail", () => {
    expect(WalletProfileSchema.safeParse({ ...valid, rails: ["anoncreds"] }).success).toBe(false);
  });

  it("requires at least one listed build, and allows several", () => {
    const none = { ...valid, builds: valid.builds.map((b) => ({ ...b, listed: false })) };
    expect(WalletProfileSchema.safeParse(none).success).toBe(false);
    const two = { ...valid, builds: valid.builds.map((b) => ({ ...b, listed: true })) };
    expect(WalletProfileSchema.safeParse(two).success).toBe(true);
  });

  it("lets a build be obtained from one store per platform", () => {
    const stores = ["https://play.google.com/store/apps/details?id=org.example", "https://apps.apple.com/app/example/id1"];
    const both = { ...valid, builds: [valid.builds[0], { ...valid.builds[1], obtain: stores }] };
    expect(obtainUrls(WalletProfileSchema.parse(both).builds[1])).toEqual(stores);
    const empty = { ...valid, builds: [valid.builds[0], { ...valid.builds[1], obtain: [] }] };
    expect(WalletProfileSchema.safeParse(empty).success).toBe(false);
  });

  it("rejects a presumptive platform that is not declared", () => {
    const bad = { ...valid, builds: [{ ...valid.builds[0], presumptive: ["ios"] }] };
    expect(WalletProfileSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects mint parameters that contradict the request rail", () => {
    const withPresentation = (presentation: Record<string, string>, demoParams: string) => ({
      ...valid,
      openid4vc: { ...valid.openid4vc, presentation, demoParams },
    });
    const pe = withPresentation({ query: "presentation_exchange", clientId: "did", responseMode: "direct_post" }, "signer=x5c");
    const peResult = WalletProfileSchema.safeParse(pe);
    expect(peResult.success).toBe(false);
    expect(JSON.stringify(peResult.error?.issues)).toContain("query=pe");
    const x5cWithoutSigner = withPresentation({ query: "dcql", clientId: "x509_hash", responseMode: "direct_post.jwt" }, "");
    expect(WalletProfileSchema.safeParse(x5cWithoutSigner).success).toBe(false);
    const didWithSigner = withPresentation({ query: "dcql", clientId: "did", responseMode: "direct_post.jwt" }, "signer=x5c");
    expect(WalletProfileSchema.safeParse(didWithSigner).success).toBe(false);
  });

  it("requires an android build to carry a package, and a browser build a url", () => {
    const noPackage = { ...valid, builds: [{ ...valid.builds[0], identity: { version: "1", repo: "https://github.com/example/wallet", ref: SHA } }] };
    expect(WalletProfileSchema.safeParse(noPackage).success).toBe(false);
    const browser = {
      ...valid,
      builds: [{ ...valid.builds[0], kind: "browser", platforms: ["web"], identity: { package: "x", version: "1" }, device: undefined }],
    };
    expect(WalletProfileSchema.safeParse(browser).success).toBe(false);
  });

  it("requires a fork to be identified by a commit or a tag, never a branch", () => {
    const branch = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: "feat/verana-trust" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(branch).success).toBe(false);
    const main = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: "main" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(main).success).toBe(false);
    const sha = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: SHA } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(sha).success).toBe(true);
    const shortSha = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: SHA.slice(0, 12) } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(shortSha).success).toBe(false);
    const otherTag = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: "verana-2026-10-02" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(otherTag).success).toBe(false);
    const noRef = { ...valid, builds: [{ ...valid.builds[0], identity: { package: "org.example", version: "1.0.0" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(noRef).success).toBe(false);
  });

  it("rejects an incompatibility that names an unknown scenario", () => {
    const bad = {
      ...valid,
      builds: [
        {
          ...valid.builds[0],
          incompatibilities: [{ cause: "x", scenarios: ["issue-nowhere"], verified: "2026-09-13" }],
        },
      ],
    };
    expect(WalletProfileSchema.safeParse(bad).success).toBe(false);
  });

  it("lets an android build leave out the device block", () => {
    const storeWithoutDevice = { ...valid, builds: [valid.builds[0], { ...valid.builds[1], device: undefined }] };
    expect(WalletProfileSchema.safeParse(storeWithoutDevice).success).toBe(true);
  });

  it("rejects a browser build that carries a device block", () => {
    const browser = { ...valid, builds: [{ ...valid.builds[0], kind: "browser", platforms: ["web"], identity: { url: "https://example.org", repo: "https://github.com/example/wallet", ref: SHA } }] };
    expect(WalletProfileSchema.safeParse(browser).success).toBe(false);
  });

  it("takes a tag with a slash from the release the build is obtained from", () => {
    const publisher = {
      ...valid.builds[0],
      obtain: "https://github.com/example/wallet/releases/tag/Wallet/Demo_Version%3D1.2-Demo_Build%3D3",
      identity: { ...valid.builds[0].identity, ref: "Wallet/Demo_Version=1.2-Demo_Build=3" },
    };
    expect(WalletProfileSchema.safeParse({ ...valid, builds: [publisher] }).success).toBe(true);
  });

  it("rejects query=pe on the dcql rail", () => {
    const bad = { ...valid, openid4vc: { ...valid.openid4vc, demoParams: "signer=x5c&query=pe" } };
    expect(WalletProfileSchema.safeParse(bad).success).toBe(false);
  });
});

describe("profile helpers", () => {
  const profile = WalletProfileSchema.parse(valid);

  it("finds the listed builds", () => {
    expect(listedBuilds(profile).map((b) => b.kind)).toEqual(["fork"]);
    expect(obtainUrls(listedBuilds(profile)[0])).toEqual(["https://github.com/example/wallet/releases/download/verana-2026-09-01/app.apk"]);
  });

  it("lets a build override the request rail and the mint parameters", () => {
    const store = profile.builds[1];
    expect(effectivePresentation(profile, store)?.clientId).toBe("did");
    expect(effectiveDemoParams(profile, store)).toBe("");
    expect(effectiveDemoParams(profile, profile.builds[0])).toBe("signer=x5c");
  });

  it("keys the mint parameters by rail", () => {
    const dual = WalletProfileSchema.parse({
      ...valid,
      rails: ["anoncreds", "openid4vc-sdjwt"],
      didcomm: { library: "credo", proxy: "credo", invitationSchemes: ["didcomm"], demoParams: "" },
    });
    expect(effectiveDemoParams(dual, dual.builds[0], "anoncreds")).toBe("");
    expect(effectiveDemoParams(dual, dual.builds[0], "openid4vc-sdjwt")).toBe("signer=x5c");
    expect(effectiveDemoParams(dual, dual.builds[0])).toBe("signer=x5c");
  });
});

describe("listWalletProfiles", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "profiles-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("loads every yaml file and sorts by id", () => {
    fs.writeFileSync(path.join(dir, "b.yaml"), JSON.stringify({ ...valid, id: "b" }));
    fs.writeFileSync(path.join(dir, "a.yaml"), JSON.stringify({ ...valid, id: "a" }));
    expect(listWalletProfiles(dir).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("refuses a file whose name does not match its id", () => {
    fs.writeFileSync(path.join(dir, "wrong.yaml"), JSON.stringify(valid));
    expect(() => listWalletProfiles(dir)).toThrow(/wrong\.yaml/);
  });

  it("finds one profile by id", () => {
    fs.writeFileSync(path.join(dir, "a.yaml"), JSON.stringify({ ...valid, id: "a" }));
    expect(getWalletProfile("a", dir)?.id).toBe("a");
    expect(getWalletProfile("zz", dir)).toBeUndefined();
  });
});

describe("profiles match the listing", () => {
  // Resolve the __NETWORK__ placeholder as loadPersonalWallets does.
  const listing = WalletsFileSchema.parse(
    yaml.load(
      fs.readFileSync(path.join(process.cwd(), "personal-wallets.yaml"), "utf8")
        .replaceAll("__NETWORK__", NETWORK),
    ),
  ).wallets;
  const visible = listing.filter((w) => !w.hidden);
  const profiles = listWalletProfiles();
  const byId = new Map(profiles.map((p) => [p.id, p]));

  it("every visible wallet has a profile, whatever its scope", () => {
    expect(profiles.map((p) => p.id).sort()).toEqual(visible.map((w) => w.id).sort());
  });

  it("rails equal the listing formats", () => {
    for (const w of visible)
      expect([...(byId.get(w.id)?.rails ?? [])].sort(), w.id).toEqual([...w.formats].sort());
  });

  it("the listed builds are the ones the listing links to, and the other way round", () => {
    for (const w of visible) {
      const listed = listedBuilds(byId.get(w.id)!).flatMap(obtainUrls).sort();
      const links = walletLinks(w).map((l) => l.url).sort();
      expect(links, w.id).toEqual(listed);
    }
  });

  it("a linked build runs on the platform of its link", () => {
    const platform = { hosted: "web", web: "web", download: "android", playstore: "android", appstore: "ios" } as const;
    for (const w of visible) {
      const builds = listedBuilds(byId.get(w.id)!);
      for (const link of walletLinks(w)) {
        const build = builds.find((b) => obtainUrls(b).includes(link.url));
        expect(build?.platforms, `${w.id} ${link.kind}`).toContain(platform[link.kind]);
      }
    }
  });

  it("the listing mints with the listed build's parameters", () => {
    for (const w of visible) {
      const profile = byId.get(w.id)!;
      for (const build of listedBuilds(profile)) {
        const expected = effectiveDemoParams(profile, build).split("&").filter(Boolean).sort();
        expect((w.demoParams ?? "").split("&").filter(Boolean).sort(), `${w.id} ${build.label}`).toEqual(expected);
      }
    }
  });
});
