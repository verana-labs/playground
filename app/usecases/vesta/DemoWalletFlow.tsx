"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Download, QrCode } from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { ServiceQr } from "../../components/ServiceQr";
import { Chip } from "../../components/ui";

// The chapter-4 wallet flow, split in two sections that share the ?wallet=
// query param: WalletChooser (pick one of the integrated personal wallets
// from personal-wallets.yaml and install it - same buttons as the
// /personal-wallets page) and BadgeOffers (the "Obtain an ECS-Badge" demo -
// live OOB credential offers revealed one at a time). The ECS-Badge runs on
// the AnonCreds/DIDComm rail (Hologram first); wallets on other rails get a
// pointer to the DemoCredential playground.

export type BadgeOffer = {
  org: string;
  serviceId: string;
  expect: string;
  tone: "emerald" | "red";
};

function useSelectedWallet(wallets: PersonalWallet[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = searchParams.get("wallet");
  const selectedId = wallets.some((w) => w.id === initial)
    ? (initial as string)
    : wallets[0]?.id;
  const wallet = wallets.find((w) => w.id === selectedId) ?? wallets[0];

  const select = (id: string) => {
    router.replace(`${pathname}?wallet=${id}`, { scroll: false });
  };

  return { wallet, select };
}

function WalletIcon({ w, size = 40 }: { w: PersonalWallet; size?: number }) {
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

/** Wallet picker + install panel - the download options mirror the
 *  /personal-wallets page exactly (labels and links from
 *  personal-wallets.yaml). */
export function WalletChooser({ wallets }: { wallets: PersonalWallet[] }) {
  const { wallet, select } = useSelectedWallet(wallets);
  if (!wallet) return null;

  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {wallets.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => select(w.id)}
            aria-pressed={w.id === wallet.id}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
              w.id === wallet.id
                ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300"
                : "border-gray-200 bg-white hover:border-violet-200"
            }`}
          >
            <WalletIcon w={w} />
            <span className="min-w-0">
              <span className="block truncate font-semibold text-gray-900">
                {w.name}
              </span>
              <span className="block truncate text-xs text-gray-500">
                {w.vendor}
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <WalletIcon w={wallet} size={56} />
          <span className="min-w-0">
            <span className="block text-xl font-bold tracking-tight text-gray-900">
              {wallet.name}
            </span>
            {wallet.website ? (
              <a
                href={wallet.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-gray-500 hover:text-violet-700 hover:underline"
              >
                {wallet.vendor}
              </a>
            ) : (
              <span className="block text-sm text-gray-500">{wallet.vendor}</span>
            )}
          </span>
        </div>
        {wallet.verana_builtin ? (
          <p className="text-sm leading-relaxed text-gray-600">
            {wallet.name} supports Verana{" "}
            <strong className="font-semibold text-gray-900">
              out of the box
            </strong>{" "}
            - install the standard build from the links below; no special
            version needed.
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-gray-600">
            Download the{" "}
            <strong className="font-semibold text-gray-900">
              modified APK
            </strong>{" "}
            by clicking the link below - it is the Verana-integrated build of{" "}
            {wallet.name}, configured for the testnet. Store builds may not
            include the integration.
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a
            href={wallet.download}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
          >
            <Download className="h-4 w-4" />{" "}
            {wallet.verana_builtin
              ? "Get the wallet"
              : "Download the modified APK"}
          </a>
          {wallet.playstore ? (
            <a
              href={wallet.playstore}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Google Play
            </a>
          ) : null}
          {wallet.appstore ? (
            <a
              href={wallet.appstore}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              App Store
            </a>
          ) : null}
          {wallet.web ? (
            <a
              href={wallet.web}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              Open the web wallet
            </a>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-gray-500">
          <Link
            href={`/personal-wallets?wallet=${wallet.id}`}
            className="font-medium text-violet-700 hover:underline"
          >
            Full wallet details and the DemoCredential scenarios
            <ArrowRight className="ml-0.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
          </Link>
        </p>
      </div>
    </div>
  );
}

/** The three badge offers - QR revealed on click, one at a time. */
export function BadgeOffers({
  wallets,
  offers,
}: {
  wallets: PersonalWallet[];
  offers: BadgeOffer[];
}) {
  const { wallet } = useSelectedWallet(wallets);
  // One QR at a time: revealing an offer hides the others.
  const [activeOffer, setActiveOffer] = useState<string | null>(null);
  if (!wallet) return null;

  const badgeReady = wallet.formats.includes("anoncreds");

  return (
    <div className="mt-6 space-y-6">
      <div className="reveal-stagger grid gap-4 sm:grid-cols-3">
        {offers.map((o) => (
          <div
            key={o.serviceId}
            className={`flex flex-col rounded-2xl border bg-white p-5 shadow-sm ${
              o.tone === "red" ? "border-red-100" : "border-gray-200"
            }`}
          >
            <div className="font-semibold text-gray-900">{o.org}</div>
            <p
              className={`mt-2 flex-1 text-sm leading-relaxed ${
                o.tone === "red" ? "text-red-600" : "text-gray-500"
              }`}
            >
              {o.expect}
            </p>
            <div className="mt-4 border-t border-gray-100 pt-4">
              {!badgeReady ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
                  The ECS-Badge demo runs over AnonCreds/DIDComm today, which{" "}
                  {wallet.name} does not support yet. Pick Hologram above, or
                  run the{" "}
                  <Link
                    href={`/personal-wallets?wallet=${wallet.id}`}
                    className="font-medium text-violet-700 hover:underline"
                  >
                    DemoCredential scenarios
                  </Link>{" "}
                  with {wallet.name}.
                </div>
              ) : activeOffer === o.serviceId ? (
                <ServiceQr
                  serviceId={o.serviceId}
                  label={o.org}
                  format="anoncreds"
                  credential="ecs-badge"
                  bare
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveOffer(o.serviceId)}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-6 text-gray-400 transition-colors hover:border-violet-300 hover:text-violet-600"
                >
                  <QrCode className="h-10 w-10" aria-hidden />
                  <span className="text-xs font-medium">
                    Click to reveal the QR code
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Each QR is minted live by the issuing service when you reveal it - a
        single-use out-of-band DIDComm action for your wallet.
      </p>
      {!badgeReady ? null : (
        <Chip tone="verified">Works with {wallet.name} - AnonCreds/DIDComm</Chip>
      )}
    </div>
  );
}
