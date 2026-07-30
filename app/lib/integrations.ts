// Integration registry loader. Each integration lives in
// integrations/<slug>/integration.yaml (submitted by PR - see the
// user/business wallet guidelines). The site builds the wallet lists and the
// per-wallet playground pages from these descriptors at build/render time.

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { parseIntegration } from "./integration-schema";

export type IntegrationKind = "personal-wallet" | "business-wallet";

export type CaptureKey =
  | "issue-accredited"
  | "issue-unaccredited"
  | "issue-untrusted"
  | "present-accredited"
  | "present-unaccredited"
  | "present-untrusted";

export type Integration = {
  slug: string;
  name: string;
  organization: string;
  kind: IntegrationKind;
  repo: string;
  license: string;
  /** personal wallets: native | bridge · business wallets: native | sidecar | bridge */
  track: string;
  scenarios: string[];
  demo_video?: string;
  /** Recording conditions (speed, editing) — disclosed under the player. */
  demo_video_note?: string;
  logo?: string;
  /** Real captures of this wallet rendering Verana trust (spec §4 "the
   *  expected wallet rendering"). */
  screenshots?: { src: string; caption?: string }[];
  fides?: string;
  /** Mobile personal wallet: direct APK link (stores may complement). Web wallet
   *  or business wallet: URL. */
  download?: string;
  /** The standard published build supports Verana out of the box — no
   *  modified APK needed. */
  verana_builtin?: boolean;
  appstore?: string;
  playstore?: string;
  contact?: string;
  /** Whether the six DemoCredential scenarios are live for this wallet
   *  (over its track's rail) — spec §4. */
  demo_loop?: string;
  /** Per-scenario captures of this wallet's expected behavior; keys are the
   *  six scenario ids (issue|present × accredited|unaccredited|untrusted). */
  captures?: Partial<Record<CaptureKey, { src: string; caption?: string }>>;
  /** Business wallets: id of the standing demo service it hosts (from the
   *  verana-demos cast), rendered as a live Proof-of-Trust on its page. */
  demo_service?: string;
  notes?: string;
};

const REGISTRY_DIR = path.join(process.cwd(), "integrations");

let cache: Integration[] | null = null;

// Descriptors reference their media relatively (`logo: ./logo.svg`,
// `src: ./screenshots/1.webp`); scripts/sync-media.mjs publishes the tree under
// public/wallets/<slug>/. Absolute URLs pass through; missing files drop out.
function publicAsset(slug: string, ref: string | undefined) {
  if (!ref) return undefined;
  if (/^(https?:)?\/\//.test(ref)) return ref;
  const rel = ref.replace(/^\.\//, "");
  const url = `/wallets/${slug}/${rel}`;
  return fs.existsSync(path.join(process.cwd(), "public", url.slice(1)))
    ? url
    : undefined;
}

export function listIntegrations(): Integration[] {
  if (cache) return cache;
  if (!fs.existsSync(REGISTRY_DIR)) {
    cache = [];
    return cache;
  }
  const out: Integration[] = [];
  for (const slug of fs.readdirSync(REGISTRY_DIR).sort()) {
    const file = path.join(REGISTRY_DIR, slug, "integration.yaml");
    if (!fs.existsSync(file)) continue;
    const raw = yaml.load(fs.readFileSync(file, "utf8"));
    const data = parseIntegration(raw, slug);
    out.push({
      slug,
      name: data.name,
      organization: data.organization ?? "",
      kind: data.kind,
      repo: data.repo ?? "",
      license: data.license ?? "",
      track: data.track ?? "",
      scenarios: data.scenarios ?? [],
      demo_video: publicAsset(slug, data.demo_video),
      demo_video_note: data.demo_video_note,
      logo: publicAsset(slug, data.logo),
      screenshots: data.screenshots?.flatMap((s) => {
        const src = publicAsset(slug, s.src);
        return src ? [{ src, caption: s.caption }] : [];
      }),
      fides: data.fides,
      download: data.download,
      verana_builtin: data.verana_builtin,
      appstore: data.appstore,
      playstore: data.playstore,
      contact: data.contact,
      demo_loop: data.demo_loop ?? data.badge_loop ?? "coming",
      captures: data.captures
        ? Object.fromEntries(
            Object.entries(data.captures).flatMap(([k, v]) => {
              const src = publicAsset(slug, v.src);
              return src ? [[k, { src, caption: v.caption }]] : [];
            }),
          )
        : undefined,
      demo_service: data.demo_service,
      notes: data.notes,
    });
  }
  cache = out;
  return out;
}

export function businessWallets(): Integration[] {
  return listIntegrations().filter((i) => i.kind === "business-wallet");
}

export function getIntegration(slug: string): Integration | undefined {
  return listIntegrations().find((i) => i.slug === slug);
}
