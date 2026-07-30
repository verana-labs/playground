import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

const dir = join(process.cwd(), "integrations");
let failed = false;

// personal-wallets.yaml — the personal wallets configuration (one entry per wallet)
try {
  const raw = yaml.load(readFileSync(join(process.cwd(), "personal-wallets.yaml"), "utf8"), { schema: yaml.JSON_SCHEMA });
  if (!Array.isArray(raw?.wallets) || raw.wallets.length === 0)
    throw new Error("missing wallets list");
  const FORMATS = ["anoncreds", "openid4vc-sdjwt"];
  for (const w of raw.wallets) {
    if (!w?.id || !w?.name || !w?.vendor) throw new Error(`entry missing id/name/vendor (${w?.id ?? "?"})`);
    if (!Array.isArray(w.formats) || w.formats.length === 0 || !w.formats.every((f) => FORMATS.includes(f)))
      throw new Error(`${w.id}: formats must be a non-empty subset of ${FORMATS.join("|")}`);
    if (!w.download) throw new Error(`${w.id}: download link required`);
    const SCENARIOS = ["issue-accredited", "issue-unaccredited", "issue-untrusted",
      "present-accredited", "present-unaccredited", "present-untrusted"];
    if (w.captures != null) {
      if (Array.isArray(w.captures) || typeof w.captures !== "object")
        throw new Error(`${w.id}: captures must map scenario ids to {src, caption}`);
      for (const [k, v] of Object.entries(w.captures)) {
        if (!SCENARIOS.includes(k)) throw new Error(`${w.id}: unknown capture scenario '${k}'`);
        if (!v?.src) throw new Error(`${w.id}: capture '${k}' missing src`);
      }
    }
    if (w.video != null && !w.video.src) throw new Error(`${w.id}: video missing src`);
    if (!statSync(join(process.cwd(), "wallets", w.id)).isDirectory())
      throw new Error(`${w.id}: wallets/${w.id}/ directory missing`);
  }
  console.log(`ok personal-wallets.yaml (${raw.wallets.length} personal wallets)`);
} catch (e) {
  console.error(`FAIL personal-wallets.yaml: ${e.message}`);
  failed = true;
}
for (const slug of readdirSync(dir)) {
  if (!statSync(join(dir, slug)).isDirectory()) continue;
  try {
    const raw = yaml.load(readFileSync(join(dir, slug, "integration.yaml"), "utf8"), { schema: yaml.JSON_SCHEMA });
    // FIDES vocabulary; the pre-rename values stay accepted (see integration-schema.ts)
    if (!raw?.name || !["personal-wallet", "business-wallet", "user-wallet", "cloud-wallet"].includes(raw.kind))
      throw new Error("missing name or invalid kind");
    if (["personal-wallet", "user-wallet"].includes(raw.kind) && !raw.download)
      throw new Error("personal-wallet requires a download link");
    console.log(`ok ${slug}`);
  } catch (e) {
    console.error(`FAIL ${slug}: ${e.message}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
