import { describe, expect, it } from "vitest";
import { listIntegrations, userWallets } from "./integrations";

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
