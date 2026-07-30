import Link from "next/link";
import { Check, Plus } from "lucide-react";
import type { Integration } from "../lib/integrations";
import { Chip } from "./ui";
import WalletLogo from "./WalletLogo";

/** Uniform wallet tile (spec §3.3 / §3.4): logo · name · organization ·
 *  track chip · license chip · Get it · Open its playground. */
export default function WalletTile({ w }: { w: Integration }) {
  const playgroundHref =
    w.kind === "user-wallet" ? `/user-wallets/${w.slug}` : `/cloud-wallets/${w.slug}`;
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <WalletLogo w={w} size="tile" />
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-gray-900">{w.name}</h3>
          <p className="truncate text-sm text-gray-500">{w.organization}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
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
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
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

/** Closing card of each wallet list: Add your wallet → /integrate. */
export function AddYourWalletTile() {
  return (
    <Link
      href="/integrate"
      className="group flex flex-col items-start justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-white p-5 transition-colors hover:border-violet-400"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
        <Plus className="h-5 w-5" />
      </span>
      <h3 className="font-semibold text-gray-900">Add your wallet</h3>
      <p className="text-sm text-gray-500">
        Open source? Integrate Verana and get your own playground page.
      </p>
      <span className="text-sm font-medium text-violet-600 group-hover:underline">
        How to integrate →
      </span>
    </Link>
  );
}
