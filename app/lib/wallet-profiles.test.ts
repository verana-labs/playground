import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  effectiveDemoParams,
  effectivePresentation,
  listWalletProfiles,
  listedBuild,
  WalletProfileSchema,
} from "./wallet-profiles";
import { WalletsFileSchema } from "./wallets";

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
      obtain: "https://example.org/app.apk",
      identity: { package: "org.example", version: "1.0.0", repo: "https://example.org/repo", ref: "verana-2026-09-01" },
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

  it("requires exactly one listed build", () => {
    const none = { ...valid, builds: valid.builds.map((b) => ({ ...b, listed: false })) };
    expect(WalletProfileSchema.safeParse(none).success).toBe(false);
    const two = { ...valid, builds: valid.builds.map((b) => ({ ...b, listed: true })) };
    expect(WalletProfileSchema.safeParse(two).success).toBe(false);
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

  it("requires an android build to carry a package and a device block, and a browser build a url", () => {
    const noPackage = { ...valid, builds: [{ ...valid.builds[0], identity: { version: "1", repo: "https://example.org/repo", ref: "v1" } }] };
    expect(WalletProfileSchema.safeParse(noPackage).success).toBe(false);
    const storeWithoutDevice = { ...valid, builds: [valid.builds[0], { ...valid.builds[1], device: undefined }] };
    expect(WalletProfileSchema.safeParse(storeWithoutDevice).success).toBe(false);
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
    const sha = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: "e6992fccc654" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(sha).success).toBe(true);
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
});

describe("profile helpers", () => {
  const profile = WalletProfileSchema.parse(valid);

  it("finds the listed build", () => {
    expect(listedBuild(profile).kind).toBe("fork");
  });

  it("lets a build override the request rail and the mint parameters", () => {
    const store = profile.builds[1];
    expect(effectivePresentation(profile, store)?.clientId).toBe("did");
    expect(effectiveDemoParams(profile, store)).toBe("");
    expect(effectiveDemoParams(profile, profile.builds[0])).toBe("signer=x5c");
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
});

describe("profiles match the listing", () => {
  const listing = WalletsFileSchema.parse(
    yaml.load(fs.readFileSync(path.join(process.cwd(), "personal-wallets.yaml"), "utf8")),
  ).wallets;
  const visible = listing.filter((w) => !w.hidden);
  const profiles = listWalletProfiles();
  const byId = new Map(profiles.map((p) => [p.id, p]));

  it("every visible wallet has a profile, whatever its scope", () => {
    expect(profiles.map((p) => p.id).sort()).toEqual(visible.map((w) => w.id).sort());
  });

  it("every profile names a wallet that exists in the listing", () => {
    for (const p of profiles) expect(listing.some((w) => w.id === p.id), p.id).toBe(true);
  });

  it("rails equal the listing formats", () => {
    for (const w of visible)
      expect([...(byId.get(w.id)?.rails ?? [])].sort(), w.id).toEqual([...w.formats].sort());
  });

  it("the listed build is the one the listing links to", () => {
    for (const w of visible) {
      const build = listedBuild(byId.get(w.id)!);
      expect(build.obtain, w.id).toBe(w.browser ? w.hosted : w.download);
    }
  });

  it("the listing mints with the listed build's parameters", () => {
    for (const w of visible) {
      const profile = byId.get(w.id)!;
      const expected = effectiveDemoParams(profile, listedBuild(profile)).split("&").filter(Boolean).sort();
      expect((w.demoParams ?? "").split("&").filter(Boolean).sort(), w.id).toEqual(expected);
    }
  });
});
