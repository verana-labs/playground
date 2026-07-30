import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { listPersonalWallets, WalletsFileSchema } from "./wallets";

describe("personal wallets configuration", () => {
  it("wallets.yaml parses against the schema", () => {
    const raw = yaml.load(
      fs.readFileSync(path.join(process.cwd(), "wallets.yaml"), "utf8"),
    );
    expect(() => WalletsFileSchema.parse(raw)).not.toThrow();
  });

  it("lists the wallets with their formats", () => {
    const wallets = listPersonalWallets();
    expect(wallets.length).toBeGreaterThan(0);
    const hologram = wallets.find((w) => w.id === "hologram");
    expect(hologram?.formats).toEqual(["anoncreds"]);
    expect(hologram?.verana_builtin).toBe(true);
    for (const w of wallets) {
      expect(w.formats.length).toBeGreaterThan(0);
      expect(w.download).toMatch(/^https:/);
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
