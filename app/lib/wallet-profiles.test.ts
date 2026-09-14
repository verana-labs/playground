import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  effectiveDemoParams,
  effectivePresentation,
  listWalletProfiles,
  listedBuild,
  WalletProfileSchema,
} from "./wallet-profiles";

const valid = {
  id: "example",
  rails: ["openid4vc-sdjwt"],
  openid4vc: {
    library: "example lib",
    proxy: "@openid4vc/openid4vci",
    vciDraft: "v1",
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
      identity: { package: "org.example", version: "1.0.0" },
      platforms: ["android"],
      promises: "everything",
      device: { activity: ".Main", unlock: "passcode", secret: "123456", coldStart: false },
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
      demoParams: "signer=did",
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
    const pe = {
      ...valid,
      openid4vc: {
        ...valid.openid4vc,
        presentation: { query: "presentation_exchange", clientId: "did", responseMode: "direct_post" },
        demoParams: "signer=x5c",
      },
    };
    const result = WalletProfileSchema.safeParse(pe);
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain("query=pe");
  });

  it("rejects an android build without a package or a browser build without a url", () => {
    const noPackage = { ...valid, builds: [{ ...valid.builds[0], identity: { version: "1" } }] };
    expect(WalletProfileSchema.safeParse(noPackage).success).toBe(false);
    const browser = {
      ...valid,
      builds: [{ ...valid.builds[0], kind: "browser", platforms: ["web"], identity: { package: "x", version: "1" }, device: undefined }],
    };
    expect(WalletProfileSchema.safeParse(browser).success).toBe(false);
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
    expect(effectiveDemoParams(profile, store)).toBe("signer=did");
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
