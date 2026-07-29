// Publishes integrations/<slug>/{logo.*,screenshots/*} to public/wallets/<slug>/
// so Next can serve them. The registry keeps the layout the guidelines ask
// vendors to PR (descriptor + media side by side); public/ holds served copies.

import fs from "node:fs";
import path from "node:path";

const REGISTRY = path.join(process.cwd(), "integrations");
const OUT = path.join(process.cwd(), "public", "wallets");
const MEDIA = /\.(svg|webp|png|jpe?g|mp4)$/i;

fs.rmSync(OUT, { recursive: true, force: true });

let files = 0;
for (const slug of fs.readdirSync(REGISTRY).sort()) {
  const dir = path.join(REGISTRY, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const entry of fs.readdirSync(dir, { recursive: true })) {
    const rel = String(entry);
    const src = path.join(dir, rel);
    if (!MEDIA.test(rel) || !fs.statSync(src).isFile()) continue;
    const dest = path.join(OUT, slug, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    files++;
  }
}
console.log(`synced ${files} media file(s) to public/wallets`);
