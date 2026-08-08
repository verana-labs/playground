import Link from "next/link";
import { Check, Plus } from "lucide-react";
import type { Integration } from "../lib/integrations";
import { Chip } from "./ui";
import WalletLogo from "./WalletLogo";

/** Uniform wallet tile (spec §3.3 / §3.4): logo · name · organization ·
 *  track chip · license chip · Get it · Open its playground. */
export default function WalletTile({ w }: { w: Integration }) {
  const playgroundHref =
    w.playgroundPage ??
    (w.kind === "personal-wallet"
      ? `/personal-wallets/${w.slug}`
      : `/business-wallets/${w.slug}`);
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <WalletLogo w={w} size="tile" />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">{w.name}</h3>
          <p className="truncate text-sm text-gray-500">{w.organization}</p>
        </div>
      </div>
      <div className="mt-3 mb-4 flex flex-wrap gap-1.5">
        <Chip>{w.track}</Chip>
        {w.license ? <Chip>{w.license}</Chip> : null}
        {w.demo_loop === "live" ? (
          <Chip tone="verified">
            <span className="inline-flex items-center gap-1">
              demo loop <Check className="h-3 w-3" aria-hidden />
            </span>
          </Chip>
        ) : (
          <Chip tone="pending">demo loop coming</Chip>
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        {w.download ? (
          <a
            href={w.download}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700"
          >
            Get it
          </a>
        ) : null}
        {w.fides ? (
          <a
            href={w.fides}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700"
          >
            on FIDES
          </a>
        ) : null}
        <Link
          href={playgroundHref}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          Open its playground
        </Link>
      </div>
    </div>
  );
}

/** Home-page variant: the tiles it sits beside are a single compact row, so it
 *  matches their height instead of standing up as a full card. */
export function AddYourWalletTileCompact() {
  return (
    <Link
      href="/integrate"
      className="group flex items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-5 transition-colors hover:border-violet-400 hover:bg-violet-50/30"
    >
      <span
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 transition-colors group-hover:bg-violet-100"
      >
        <Plus className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-gray-900">
          Add your wallet
        </span>
        <span className="block truncate text-sm text-gray-500">
          Integrate Verana, get your own page
        </span>
      </span>
    </Link>
  );
}

/** Closing card of each wallet list: Add your wallet → /integrate. */
export function AddYourWalletTile() {
  return (
    <Link
      href="/integrate"
      className="group flex h-full flex-col rounded-xl border border-dashed border-gray-300 bg-white p-5 transition-colors hover:border-violet-400 hover:bg-violet-50/30"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 transition-colors group-hover:bg-violet-100">
          <Plus className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">
            Add your wallet
          </h3>
          <p className="truncate text-sm text-gray-500">Any open-source team</p>
        </div>
      </div>
      <p className="mt-3 mb-4 text-sm leading-relaxed text-gray-500">
        Integrate the Verana trust registry and get your own playground page,
        with the six scenarios running against the live testnet.
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        <span className="rounded-lg border border-violet-200 px-3 py-1.5 text-sm font-medium text-violet-700 transition-colors group-hover:border-violet-400 group-hover:bg-violet-600 group-hover:text-white">
          How to integrate
        </span>
      </div>
    </Link>
  );
}
