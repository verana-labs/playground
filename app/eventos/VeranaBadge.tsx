import { withBase } from "../lib/base-path";
import { LINKS } from "../lib/site";

// The "Built on the Verana Trust Infrastructure" mark of the events demo
// footers: the real-looking sites keep their own chrome, this badge is the
// one piece of Verana branding they carry. The logo is verana.io's own
// purple capsule (https://verana.io/logo.svg), kept in the repo.

export function VeranaBadge({ dark = false }: { dark?: boolean }) {
  return (
    <a
      href={LINKS.veranaIo}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-xs font-medium transition ${
        dark
          ? "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
          : "border-gray-200 bg-white text-gray-700 shadow-sm hover:border-violet-300 hover:text-violet-800"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- brand asset, tiny SVG */}
      <img
        src={withBase("/images/eventos/verana-logo.svg")}
        alt="Verana"
        width={28}
        height={28}
        className="h-7 w-7 rounded-lg"
      />
      <span>
        Built on the <span className="font-bold">Verana</span> Trust
        Infrastructure
      </span>
    </a>
  );
}
