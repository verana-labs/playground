import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { afterEach, describe, expect, it, vi } from "vitest";
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

describe("PLAYGROUND_WALLETS allowlist", () => {
  const load = async () => {
    vi.resetModules();
    const mod = await import("./wallets");
    return mod.listPersonalWallets();
  };
  const prev = process.env.PLAYGROUND_WALLETS;
  afterEach(() => {
    if (prev === undefined) delete process.env.PLAYGROUND_WALLETS;
    else process.env.PLAYGROUND_WALLETS = prev;
  });

  it("an empty value filters nothing", async () => {
    process.env.PLAYGROUND_WALLETS = "";
    const wallets = await load();
    expect(wallets.length).toBeGreaterThan(1);
  });

  it("filters to the named wallets", async () => {
    process.env.PLAYGROUND_WALLETS = "eudi";
    const wallets = await load();
    expect(wallets.map((w) => w.id)).toEqual(["eudi"]);
  });

  it("throws on unknown wallet ids", async () => {
    process.env.PLAYGROUND_WALLETS = "eudi,notawallet";
    await expect(load()).rejects.toThrow(/notawallet/);
  });
});
