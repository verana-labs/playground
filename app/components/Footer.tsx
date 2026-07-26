import Link from "next/link";
import { LINKS, ENDPOINTS } from "../lib/site";

const COLUMNS: {
  title: string;
  links: { label: string; href: string; ext?: boolean }[];
}[] = [
  {
    title: "Playground",
    links: [
      { label: "What is Verana", href: "/#what-is-verana" },
      { label: "Learn step by step", href: "/#learn" },
      { label: "User wallets", href: "/#user-wallets" },
      { label: "Cloud wallets", href: "/#cloud-wallets" },
      { label: "About", href: "/about" },
    ],
  },
  {
    title: "Integrate",
    links: [
      { label: "Add your wallet", href: "/integrate" },
      { label: "User-wallet guideline", href: LINKS.guidelineUserWallet, ext: true },
      { label: "Cloud-wallet guideline", href: LINKS.guidelineCloudWallet, ext: true },
      { label: "This site's spec", href: LINKS.spec, ext: true },
      { label: "Source (GitHub)", href: LINKS.repo, ext: true },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "Network frontend", href: ENDPOINTS.frontend, ext: true },
      { label: "Trust Resolver API", href: `${ENDPOINTS.resolver}/docs`, ext: true },
      { label: "Faucet", href: ENDPOINTS.faucet, ext: true },
      { label: "Verifiable Trust spec (v3)", href: LINKS.vtSpecV3, ext: true },
      { label: "VPR spec (v3)", href: LINKS.vprSpecV3, ext: true },
    ],
  },
  {
    title: "Related",
    links: [
      { label: "verana.io", href: LINKS.veranaIo, ext: true },
      { label: "Documentation", href: LINKS.docs, ext: true },
      { label: "Verana Foundation", href: LINKS.foundation, ext: true },
      { label: "Verana Council", href: LINKS.council, ext: true },
      { label: "github.com/verana-labs", href: LINKS.github, ext: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="eyebrow mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.ext ? (
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted hover:text-ink"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="text-sm text-muted hover:text-ink">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-rule pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()}{" "}
            <a href={LINKS.foundation} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              Verana Foundation
            </a>{" "}
            · Content CC BY-SA 4.0 · Code Apache-2.0
          </p>
          <p className="max-w-xl">
            Everything here runs on the Verana <strong>testnet</strong>. All demo
            entities are fictional and labeled (demo).
          </p>
        </div>
      </div>
    </footer>
  );
}
