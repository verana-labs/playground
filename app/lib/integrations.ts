// Integration registry loader. Each integration lives in
// integrations/<slug>/integration.yaml (submitted by PR — see the
// user/cloud wallet guidelines). The site builds the wallet lists and the
// per-wallet playground pages from these descriptors at build/render time.

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export type IntegrationKind = "user-wallet" | "cloud-wallet";

export type Integration = {
  slug: string;
  name: string;
  organization: string;
  kind: IntegrationKind;
  repo: string;
  license: string;
  /** user wallets: native | bridge · cloud wallets: native | sidecar | bridge */
  track: string;
  scenarios: string[];
  demo_video?: string;
  /** Mobile user wallet: direct APK link (stores may complement). Web wallet
   *  or cloud wallet: URL. */
  download?: string;
  contact?: string;
  /** Which parts of the playground template are live for this wallet. */
  badge_loop?: "live" | "coming";
  notes?: string;
};

const REGISTRY_DIR = path.join(process.cwd(), "integrations");

export function listIntegrations(): Integration[] {
  if (!fs.existsSync(REGISTRY_DIR)) return [];
  const out: Integration[] = [];
  for (const slug of fs.readdirSync(REGISTRY_DIR).sort()) {
    const file = path.join(REGISTRY_DIR, slug, "integration.yaml");
    if (!fs.existsSync(file)) continue;
    const raw = yaml.load(fs.readFileSync(file, "utf8")) as Partial<Integration>;
    if (!raw || !raw.name || !raw.kind) continue;
    out.push({
      slug,
      name: raw.name,
      organization: raw.organization ?? "",
      kind: raw.kind,
      repo: raw.repo ?? "",
      license: raw.license ?? "",
      track: raw.track ?? "",
      scenarios: raw.scenarios ?? [],
      demo_video: raw.demo_video,
      download: raw.download,
      contact: raw.contact,
      badge_loop: raw.badge_loop ?? "coming",
      notes: raw.notes,
    });
  }
  return out;
}

export function userWallets(): Integration[] {
  return listIntegrations().filter((i) => i.kind === "user-wallet");
}

export function cloudWallets(): Integration[] {
  return listIntegrations().filter((i) => i.kind === "cloud-wallet");
}

export function getIntegration(slug: string): Integration | undefined {
  return listIntegrations().find((i) => i.slug === slug);
}
