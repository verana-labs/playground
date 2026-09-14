import { describe, expect, it } from "vitest";
import type { WalletBuild } from "../../app/lib/wallet-profiles";
import { incompatibilityFor } from "./incompatibility";

const build = (incompatibilities: WalletBuild["incompatibilities"]): WalletBuild => ({
  kind: "store",
  label: "x",
  obtain: "https://example.org",
  identity: { package: "p", version: "1" },
  platforms: ["android"],
  promises: "x",
  incompatibilities,
});

describe("incompatibilityFor", () => {
  it("matches every scenario when scoped to all", () => {
    const b = build([{ cause: "signed metadata", reference: "https://example.org/issues/1", scenarios: "all", verified: "2026-09-13" }]);
    expect(incompatibilityFor(b, "issue-accredited", "demo-issuer-accredited")).toEqual({ cause: "signed metadata", reference: "https://example.org/issues/1" });
  });

  it("matches only the listed scenarios and services", () => {
    const b = build([{ cause: "bad log", scenarios: ["issue-untrusted"], services: ["demo-untrusted"], verified: "2026-09-08" }]);
    expect(incompatibilityFor(b, "issue-untrusted", "demo-untrusted")).toEqual({ cause: "bad log", reference: undefined });
    expect(incompatibilityFor(b, "issue-untrusted", "demo-issuer-untrusted")).toBeNull();
    expect(incompatibilityFor(b, "issue-accredited", "demo-untrusted")).toBeNull();
  });

  it("returns null without incompatibilities", () => {
    expect(incompatibilityFor(build(undefined), "issue-accredited", "x")).toBeNull();
  });
});
