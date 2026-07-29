import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import yaml from "js-yaml";

const dir = join(process.cwd(), "integrations");
let failed = false;
for (const slug of readdirSync(dir)) {
  if (!statSync(join(dir, slug)).isDirectory()) continue;
  try {
    const raw = yaml.load(readFileSync(join(dir, slug, "integration.yaml"), "utf8"), { schema: yaml.JSON_SCHEMA });
    if (!raw?.name || !["user-wallet", "cloud-wallet"].includes(raw.kind))
      throw new Error("missing name or invalid kind");
    if (raw.kind === "user-wallet" && !raw.download)
      throw new Error("user-wallet requires a download link");
    console.log(`ok ${slug}`);
  } catch (e) {
    console.error(`FAIL ${slug}: ${e.message}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
