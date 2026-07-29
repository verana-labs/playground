import { describe, expect, it } from "vitest";
import { listIntegrations, userWallets } from "./integrations";
import { parseIntegration } from "./integration-schema";

describe("integration registry", () => {
  it("loads every descriptor directory", () => {
    const slugs = listIntegrations().map((i) => i.slug).sort();
    expect(slugs).toContain("hologram");
    expect(slugs).toContain("vs-agent");
  });

  it("classifies kinds", () => {
    for (const w of userWallets()) expect(w.kind).toBe("user-wallet");
  });
});

describe("descriptor validation", () => {
  it("rejects a descriptor missing kind", () => {
    expect(() => parseIntegration({ name: "X" }, "x")).toThrow(/x/);
  });

  it("rejects an unknown kind", () => {
    expect(() =>
      parseIntegration({ name: "X", kind: "browser-extension" }, "x"),
    ).toThrow(/kind/);
  });

  it("accepts the hologram descriptor shape", () => {
    expect(() =>
      parseIntegration(
        { name: "H", organization: "2060", kind: "user-wallet", track: "native",
          license: "Apache-2.0", repo: "https://github.com/2060-io/hologram-app",
          download: "https://example.com", scenarios: ["iso-certification-loop"],
          badge_loop: "live" },
        "hologram",
      ),
    ).not.toThrow();
  });

  it("requires a download link for a user-wallet", () => {
    expect(() => parseIntegration({ name: "X", kind: "user-wallet" }, "x")).toThrow(/download/);
  });

  it("accepts a cloud-wallet without a download link", () => {
    expect(() => parseIntegration({ name: "X", kind: "cloud-wallet" }, "x")).not.toThrow();
  });

  it("accepts a fides use-case URL", () => {
    expect(() =>
      parseIntegration(
        { name: "X", kind: "cloud-wallet", fides: "https://fides.community/x" },
        "x",
      ),
    ).not.toThrow();
  });

  it("rejects a non-URL fides value", () => {
    expect(() =>
      parseIntegration({ name: "X", kind: "cloud-wallet", fides: "not-a-url" }, "x"),
    ).toThrow(/fides/);
  });
});
