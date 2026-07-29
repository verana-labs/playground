// Copies integrations/<slug>/logo.* to public/wallets/<slug>.* so Next can
// serve them. The registry keeps the layout the guidelines ask vendors to PR
// (descriptor + logo side by side); only the served copy lives in public/.

import fs from "node:fs";
import path from "node:path";

const REGISTRY = path.join(process.cwd(), "integrations");
const OUT = path.join(process.cwd(), "public", "wallets");

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

let n = 0;
for (const slug of fs.readdirSync(REGISTRY).sort()) {
  const dir = path.join(REGISTRY, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  const logo = fs.readdirSync(dir).find((f) => /^logo\.(svg|webp|png|jpe?g)$/.test(f));
  if (!logo) continue;
  fs.copyFileSync(path.join(dir, logo), path.join(OUT, `${slug}${path.extname(logo)}`));
  n++;
}
console.log(`synced ${n} logo(s) to public/wallets`);
