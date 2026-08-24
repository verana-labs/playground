// Personal wallets configuration loader. All personal wallets live in one
// file - personal-wallets.yaml - with media under wallets/<id>/ (synced to
// public/wallets/<id>/ by scripts/sync-media.mjs). The single
// /personal-wallets page (picker, download section, captures, QR format)
// is generated from it.

import fs from "node:fs";
import { BASE_PATH } from "./base-path";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

export const CREDENTIAL_FORMATS = ["anoncreds", "openid4vc-sdjwt"] as const;
export type CredentialFormat = (typeof CREDENTIAL_FORMATS)[number];

// The six demo scenarios of the single personal-wallets page - capture keys.
export const SCENARIO_KEYS = [
  "issue-accredited",
  "issue-unaccredited",
  "issue-untrusted",
  "present-accredited",
  "present-unaccredited",
  "present-untrusted",
] as const;
export type ScenarioKey = (typeof SCENARIO_KEYS)[number];

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
  browser: z.boolean().optional(),
  hosted: z.string().url().optional(),
  download: z.string().url(),
  playstore: z.string().url().optional(),
  appstore: z.string().url().optional(),
  web: z.string().url().optional(),
  repo: z.string().url().optional(),
  // Our fork carrying the Verana integration, shown next to the download.
  fork: z.string().url().optional(),
  recommended: z.boolean().optional(),
  hidden: z.boolean().optional(),
  // Extra query the demo mint needs for THIS wallet. OpenID4VP rails are mutually
  // exclusive per request: a wallet that never implemented DCQL needs `query=pe`, and one
  // that resolves no DIDs needs `signer=x5c` for an x509_hash client_id. Without this the
  // page hands every wallet the DCQL rail and the scan fails for those that cannot read it.
  demoParams: z.string().optional(),
  // Vendor website; when present the vendor name links to it (new tab).
  website: z.string().url().optional(),
  license: z.string().optional(),
  contact: z.string().optional(),
  notes: z.string().optional(),
  // Up to one screen capture per demo scenario (optional), keyed by the
  // scenario id; rendered inside the corresponding demo card. `clip` is the
  // optional recording of that same scenario, shown beside its capture.
  captures: z
    .partialRecord(
      z.enum(SCENARIO_KEYS),
      MediaSchema.extend({ clip: z.string().optional() }),
    )
    .optional(),
  // A single optional video, rendered in Get-the-wallet after the download
  // link; note discloses recording conditions (speed, editing).
  video: MediaSchema.optional(),
});

export const WalletsFileSchema = z.object({
  wallets: z.array(WalletSchema).min(1),
});

export type PersonalWallet = Omit<
  z.infer<typeof WalletSchema>,
  "icon" | "captures" | "video"
> & {
  icon?: string;
  captures: Partial<
    Record<ScenarioKey, { src: string; caption?: string; clip?: string }>
  >;
  video?: { src: string; note?: string };
};

// ./<id>/… references inside wallets/ resolve to the synced public copy;
// absolute URLs pass through; missing files drop out.
function publicAsset(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  if (/^(https?:)?\/\//.test(ref)) return ref;
  const rel = ref.replace(/^\.\//, "");
  const url = `/wallets/${rel}`;
  return fs.existsSync(path.join(process.cwd(), "public", url.slice(1)))
    ? `${BASE_PATH}${url}`
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
    throw new Error(`personal-wallets.yaml invalid - ${issues}`);
  }
  const allow = process.env.PLAYGROUND_WALLETS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  cache = parsed.data.wallets
    .filter((w) => !w.hidden)
    .filter((w) => !allow || allow.includes(w.id))
    .map((w) => {
    const videoSrc = publicAsset(w.video?.src);
    return {
      ...w,
      icon: publicAsset(w.icon),
      captures: Object.fromEntries(
        Object.entries(w.captures ?? {}).flatMap(([key, m]) => {
          const src = publicAsset(m.src);
          return src
            ? [[key, { src, caption: m.caption, clip: publicAsset(m.clip) }]]
            : [];
        }),
      ),
      video: videoSrc ? { src: videoSrc, note: w.video?.note } : undefined,
    };
  });
  cache = [
    ...cache.filter((w) => w.recommended),
    ...cache.filter((w) => !w.recommended),
  ];
  return cache;
}

export function getPersonalWallet(id: string): PersonalWallet | undefined {
  return listPersonalWallets().find((w) => w.id === id);
}
