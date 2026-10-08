"use client";

import { useState, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { ComingSoonPickerTile } from "../components/ComingSoonTile";
import { BuildsHint, WalletStatusChip } from "../components/WalletBuilds";
import type { ComingSoonWallet } from "../lib/coming-soon";
import type { PersonalWallet } from "../lib/wallets";

const COLLAPSED_WALLETS = 5;

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
      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        selected
          ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300"
          : "border-gray-200 bg-white hover:border-violet-200"
      }`}
    >
      {children}
    </button>
  );
}

function statusList(wallets: PersonalWallet[]): string {
  const statuses = [...new Set(wallets.map((w) => w.status))];
  if (statuses.length < 2) return statuses.join("");
  return `${statuses.slice(0, -1).join(", ")} and ${statuses.at(-1)}`;
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
  const collapsible = wallets.length > COLLAPSED_WALLETS + 1;
  const [expanded, setExpanded] = useState(
    () => wallets.findIndex((w) => w.id === selectedId) >= COLLAPSED_WALLETS,
  );
  const showAll = expanded || !collapsible;
  const shown = showAll ? wallets : wallets.slice(0, COLLAPSED_WALLETS);
  const hidden = wallets.slice(COLLAPSED_WALLETS);

  return (
    <div
      id="wallet-picker"
      className="grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {shown.map((w) => (
        <PickerCard
          key={w.id}
          onClick={() => onSelect(w.id)}
          aria-pressed={w.id === selectedId}
          selected={w.id === selectedId}
        >
          <WalletIcon w={w} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="truncate font-semibold text-gray-900">
                {w.name}
              </span>
              <WalletStatusChip status={w.status} />
            </span>
            <span className="block truncate text-xs text-gray-500">
              {w.vendor}
            </span>
            <BuildsHint links={w.links} />
          </span>
        </PickerCard>
      ))}
      {showAll
        ? comingSoon.map((w) => <ComingSoonPickerTile key={w.id} w={w} />)
        : null}
      {collapsible ? (
        <PickerCard
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls="wallet-picker"
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
            <span className="block truncate text-xs text-gray-500">
              {expanded
                ? `Back to the first ${COLLAPSED_WALLETS}`
                : `${hidden.length} more: ${statusList(hidden)}`}
            </span>
          </span>
        </PickerCard>
      ) : null}
    </div>
  );
}
