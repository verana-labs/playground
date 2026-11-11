import Link from "next/link";
import type { ReactNode } from "react";
import { BuildsHint, WalletStatusChip } from "./WalletBuilds";
import { WalletIcon } from "../personal-wallets/WalletPicker";
import type { PersonalWallet } from "../lib/wallets";

const TILE =
  "flex h-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-300";

function HomeWalletTile({ w }: { w: PersonalWallet }) {
  return (
    <Link href={`/personal-wallets?wallet=${w.id}`} className={TILE}>
      <WalletIcon w={w} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-gray-900" title={w.name}>
            {w.name}
          </span>
          <WalletStatusChip viaFork={Boolean(w.fork)} compact />
        </span>
        <span className="block truncate text-sm text-gray-500">{w.vendor}</span>
        <BuildsHint links={w.links} className="text-xs" />
      </span>
    </Link>
  );
}

export function HomeWalletGrid({
  wallets,
  trailing,
}: {
  wallets: PersonalWallet[];
  trailing: ReactNode;
}) {
  return (
    <div className="reveal-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {wallets.map((w) => (
        <HomeWalletTile key={w.id} w={w} />
      ))}
      {trailing}
    </div>
  );
}
