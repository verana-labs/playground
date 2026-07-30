// Publishes wallet media to public/wallets/<slug>/ so Next can serve it:
// - wallets/<slug>/ (personal wallets — media next to their personal-wallets.yaml entry)
// - integrations/<slug>/ (business wallets — descriptor + media side by side)

import fs from "node:fs";
import path from "node:path";

const SOURCES = [
  path.join(process.cwd(), "wallets"),
  path.join(process.cwd(), "integrations"),
];
const OUT = path.join(process.cwd(), "public", "wallets");
const MEDIA = /\.(svg|webp|png|jpe?g|mp4)$/i;

fs.rmSync(OUT, { recursive: true, force: true });

let files = 0;
for (const source of SOURCES) {
  if (!fs.existsSync(source)) continue;
  for (const slug of fs.readdirSync(source).sort()) {
    const dir = path.join(source, slug);
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
}
console.log(`synced ${files} media file(s) to public/wallets`);
