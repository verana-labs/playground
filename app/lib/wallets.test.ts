import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { listPersonalWallets, WalletsFileSchema } from "./wallets";

describe("personal wallets configuration", () => {
  it("personal-wallets.yaml parses against the schema", () => {
    const raw = yaml.load(
      fs.readFileSync(path.join(process.cwd(), "personal-wallets.yaml"), "utf8"),
    );
    expect(() => WalletsFileSchema.parse(raw)).not.toThrow();
  });

  it("lists the wallets with their formats", () => {
    const wallets = listPersonalWallets();
    expect(wallets.length).toBeGreaterThan(0);
    const hologram = wallets.find((w) => w.id === "hologram");
    expect(hologram?.formats).toEqual(["anoncreds"]);
    // Nothing claims verana_builtin today: Hologram's published build resolves Q1 only, so it
    // cannot tell an accredited issuer from an unaccredited one. Assert the flag on whichever
    // wallet earns it first.
    expect(wallets.every((w) => w.verana_builtin !== true)).toBe(true);
    for (const w of wallets) {
      expect(w.formats.length).toBeGreaterThan(0);
      expect(w.download).toMatch(/^https:/);
      for (const key of Object.keys(w.captures)) {
        expect([
          "issue-accredited", "issue-unaccredited", "issue-untrusted",
          "present-accredited", "present-unaccredited", "present-untrusted",
        ]).toContain(key);
      }
    }
  });

  it("every entry has a matching wallets/<id> directory", () => {
    for (const w of listPersonalWallets()) {
      expect(
        fs.statSync(path.join(process.cwd(), "wallets", w.id)).isDirectory(),
      ).toBe(true);
    }
  });
});
