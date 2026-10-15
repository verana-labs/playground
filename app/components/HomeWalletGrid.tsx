"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { BuildsHint, WalletStatusChip } from "./WalletBuilds";
import { WalletIcon } from "../personal-wallets/WalletPicker";
import type { PersonalWallet } from "../lib/wallets";

const COLLAPSED_WALLETS = 5;
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
          <WalletStatusChip
            status={w.status}
            viaFork={Boolean(w.fork)}
            showRecommended
            compact
          />
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
  const [expanded, setExpanded] = useState(false);
  const collapsible = wallets.length > COLLAPSED_WALLETS + 1;
  const shown =
    collapsible && !expanded ? wallets.slice(0, COLLAPSED_WALLETS) : wallets;

  return (
    <div className="reveal-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((w) => (
        <HomeWalletTile key={w.id} w={w} />
      ))}
      {collapsible && !expanded ? null : trailing}
      {collapsible ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className={`${TILE} text-left`}
        >
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700"
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-gray-900">
              {expanded ? "Show fewer" : `Show all ${wallets.length} wallets`}
            </span>
            <span className="block truncate text-sm text-gray-500">
              {expanded
                ? `Back to the first ${COLLAPSED_WALLETS}`
                : `${wallets.length - COLLAPSED_WALLETS} more, and how to add yours`}
            </span>
          </span>
        </button>
      ) : null}
    </div>
  );
}
