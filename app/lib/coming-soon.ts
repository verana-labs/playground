// Open-source wallets from the FIDES catalog that we have not integrated yet.
// One file - coming-soon.yaml - drives the "coming soon" tiles under both
// wallet lists. Entries carry no demo and no playground page; they exist so a
// reader can see the roadmap and the ecosystem we are working through.

import fs from "node:fs";
import { withBase } from "./base-path";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

const EntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  vendor: z.string().min(1),
  // ./coming-soon/<file> inside wallets/, or an absolute URL. Optional: the
  // tile falls back to the initial.
  logo: z.string().optional(),
  website: z.string().url().optional(),
  repo: z.string().url().optional(),
  fides: z.string().url().optional(),
  license: z.string().optional(),
  note: z.string().optional(),
});

export const ComingSoonFileSchema = z.object({
  personal: z.array(EntrySchema).default([]),
  business: z.array(EntrySchema).default([]),
});

export type ComingSoonWallet = z.infer<typeof EntrySchema>;

function publicAsset(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  if (/^(https?:)?\/\//.test(ref)) return ref;
  const url = `/wallets/${ref.replace(/^\.\//, "")}`;
  return fs.existsSync(path.join(process.cwd(), "public", url.slice(1)))
    ? withBase(url)
    : undefined;
}

let cache: z.infer<typeof ComingSoonFileSchema> | null = null;

function load() {
  if (cache) return cache;
  const file = path.join(process.cwd(), "coming-soon.yaml");
  if (!fs.existsSync(file)) {
    cache = { personal: [], business: [] };
    return cache;
  }
  const parsed = ComingSoonFileSchema.safeParse(
    yaml.load(fs.readFileSync(file, "utf8")),
  );
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`coming-soon.yaml invalid - ${issues}`);
  }
  const resolve = (w: ComingSoonWallet) => ({ ...w, logo: publicAsset(w.logo) });
  cache = {
    personal: parsed.data.personal.map(resolve),
    business: parsed.data.business.map(resolve),
  };
  return cache;
}

// The playground lists what a reader can actually pick up and test, so a wallet with no
// integration behind it stays out of the grids. The file, the logos and the tile all stay:
// each entry moves into personal-wallets.yaml as a real card when its integration lands.
const SHOW_COMING_SOON = false;

export function listComingSoon(kind: "personal" | "business"): ComingSoonWallet[] {
  return SHOW_COMING_SOON ? load()[kind] : [];
}
