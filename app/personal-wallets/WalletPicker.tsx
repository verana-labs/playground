"use client";

import type { ComponentProps } from "react";
import { ComingSoonPickerTile } from "../components/ComingSoonTile";
import { BuildsHint, WalletStatusChip } from "../components/WalletBuilds";
import type { ComingSoonWallet } from "../lib/coming-soon";
import type { PersonalWallet } from "../lib/wallets";

export function WalletIcon({ w, size = 40 }: { w: PersonalWallet; size?: number }) {
  if (w.icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- pre-optimized small assets from wallets/
      <img
        src={w.icon}
        alt=""
        aria-hidden
        width={size}
        height={size}
        className="shrink-0 rounded-lg bg-white object-contain ring-1 ring-black/5"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-lg bg-violet-50 font-bold text-violet-700"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {w.name.charAt(0)}
    </span>
  );
}

function PickerCard({
  selected = false,
  children,
  ...button
}: ComponentProps<"button"> & { selected?: boolean }) {
  return (
    <button
      type="button"
      {...button}
      className={`flex h-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300"
          : "border-gray-200 bg-white hover:border-violet-200"
      }`}
    >
      {children}
    </button>
  );
}

export function WalletPicker({
  wallets,
  comingSoon,
  selectedId,
  onSelect,
}: {
  wallets: PersonalWallet[];
  comingSoon: ComingSoonWallet[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      id="wallet-picker"
      className="grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {wallets.map((w) => (
        <PickerCard
          key={w.id}
          onClick={() => onSelect(w.id)}
          aria-pressed={w.id === selectedId}
          selected={w.id === selectedId}
        >
          <WalletIcon w={w} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex items-center gap-1.5">
              <span
                className="min-w-0 flex-1 truncate font-semibold text-gray-900"
                title={w.name}
              >
                {w.name}
              </span>
              <WalletStatusChip viaFork={Boolean(w.fork)} compact />
            </span>
            <span className="truncate text-xs text-gray-500" title={w.vendor}>
              {w.vendor}
            </span>
            <BuildsHint links={w.links} />
          </span>
        </PickerCard>
      ))}
      {comingSoon.map((w) => (
        <ComingSoonPickerTile key={w.id} w={w} />
      ))}
    </div>
  );
}
