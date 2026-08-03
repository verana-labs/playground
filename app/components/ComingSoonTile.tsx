import type { ComingSoonWallet } from "../lib/coming-soon";
import { Chip } from "./ui";

const TONES = [
  "bg-violet-50 text-violet-700",
  "bg-blue-50 text-blue-700",
  "bg-amber-50 text-amber-700",
  "bg-emerald-50 text-emerald-700",
];

function Logo({ w, size }: { w: ComingSoonWallet; size: number }) {
  const box = size === 40 ? "h-10 w-10 rounded-lg text-base" : "h-9 w-9 rounded-lg text-sm";
  if (w.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- matches WalletLogo: small pre-optimized assets
      <img
        src={w.logo}
        alt=""
        aria-hidden
        width={size}
        height={size}
        className={`${box} shrink-0 bg-white object-contain opacity-60 ring-1 ring-black/5 grayscale`}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${box} flex shrink-0 items-center justify-center font-bold opacity-60 grayscale ${
        TONES[w.name.charCodeAt(0) % TONES.length]
      }`}
    >
      {w.name.charAt(0)}
    </span>
  );
}

/** A FIDES-catalog wallet we have not integrated yet. Same tile geometry as an
 *  integrated business wallet so the grid stays even, greyed out and with no
 *  playground link. */
export function ComingSoonWalletTile({ w }: { w: ComingSoonWallet }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-5">
      <div className="flex items-center gap-3">
        <Logo w={w} size={40} />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-500">{w.name}</h3>
          <p className="truncate text-sm text-gray-400">{w.vendor}</p>
        </div>
      </div>
      <div className="mt-3 mb-4 flex flex-wrap gap-1.5">
        <Chip tone="pending">coming soon</Chip>
        {w.license ? <Chip>{w.license}</Chip> : null}
      </div>
      {w.note ? (
        <p className="mb-4 text-sm leading-relaxed text-gray-400">{w.note}</p>
      ) : null}
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
        {w.repo ? (
          <a
            href={w.repo}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-700"
          >
            Source
          </a>
        ) : null}
        {w.website ? (
          <a
            href={w.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:border-violet-300 hover:text-violet-700"
          >
            Website
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** The picker variant: same row geometry as a selectable wallet on
 *  /personal-wallets, greyed out and inert. */
export function ComingSoonPickerTile({ w }: { w: ComingSoonWallet }) {
  return (
    <div
      aria-disabled
      title={`${w.name} - not integrated yet`}
      className="flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50/70 p-3 text-left"
    >
      <Logo w={w} size={36} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-gray-500">
          {w.name}
        </span>
        <span className="block truncate text-xs text-gray-400">
          {w.vendor} · coming soon
        </span>
      </span>
    </div>
  );
}
