// Personal wallets configuration loader. All personal wallets live in one
// file — personal-wallets.yaml — with media under wallets/<id>/ (synced to
// public/wallets/<id>/ by scripts/sync-media.mjs). The single
// /personal-wallets page (picker, download section, captures, QR format)
// is generated from it.

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

export const CREDENTIAL_FORMATS = ["anoncreds", "openid4vc-sdjwt"] as const;
export type CredentialFormat = (typeof CREDENTIAL_FORMATS)[number];

const MediaSchema = z.object({
  src: z.string().min(1),
  caption: z.string().optional(),
  note: z.string().optional(),
});

const WalletSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  vendor: z.string().min(1),
  icon: z.string().optional(),
  formats: z.array(z.enum(CREDENTIAL_FORMATS)).min(1),
  verana_builtin: z.boolean().optional(),
  download: z.string().url(),
  playstore: z.string().url().optional(),
  appstore: z.string().url().optional(),
  web: z.string().url().optional(),
  repo: z.string().url().optional(),
  license: z.string().optional(),
  contact: z.string().optional(),
  notes: z.string().optional(),
  captures: z.array(MediaSchema).optional(),
  videos: z.array(MediaSchema).optional(),
});

export const WalletsFileSchema = z.object({
  wallets: z.array(WalletSchema).min(1),
});

export type PersonalWallet = Omit<
  z.infer<typeof WalletSchema>,
  "icon" | "captures" | "videos"
> & {
  icon?: string;
  captures: { src: string; caption?: string }[];
  videos: { src: string; note?: string }[];
};

// ./<id>/… references inside wallets/ resolve to the synced public copy;
// absolute URLs pass through; missing files drop out.
function publicAsset(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  if (/^(https?:)?\/\//.test(ref)) return ref;
  const rel = ref.replace(/^\.\//, "");
  const url = `/wallets/${rel}`;
  return fs.existsSync(path.join(process.cwd(), "public", url.slice(1)))
    ? url
    : undefined;
}

let cache: PersonalWallet[] | null = null;

export function listPersonalWallets(): PersonalWallet[] {
  if (cache) return cache;
  const file = path.join(process.cwd(), "personal-wallets.yaml");
  if (!fs.existsSync(file)) {
    cache = [];
    return cache;
  }
  const raw = yaml.load(fs.readFileSync(file, "utf8"));
  const parsed = WalletsFileSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    throw new Error(`personal-wallets.yaml invalid — ${issues}`);
  }
  cache = parsed.data.wallets.map((w) => ({
    ...w,
    icon: publicAsset(w.icon),
    captures: (w.captures ?? []).flatMap((m) => {
      const src = publicAsset(m.src);
      return src ? [{ src, caption: m.caption }] : [];
    }),
    videos: (w.videos ?? []).flatMap((m) => {
      const src = publicAsset(m.src);
      return src ? [{ src, note: m.note }] : [];
    }),
  }));
  return cache;
}

export function getPersonalWallet(id: string): PersonalWallet | undefined {
  return listPersonalWallets().find((w) => w.id === id);
}
