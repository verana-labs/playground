"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Download, QrCode } from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { ServiceQr } from "../../components/ServiceQr";
import { Chip } from "../../components/ui";

// The chapter-4 wallet flow: pick one of the integrated personal wallets
// (from personal-wallets.yaml, same list as /personal-wallets), install it,
// then run the "Obtain an ECS-Badge" demo - live OOB credential offers from
// Vesta and Zenith, and Umbra's untrusted invitation for the red path.
// The ECS-Badge runs on the AnonCreds/DIDComm rail (Hologram first); wallets
// on other rails get a pointer to the DemoCredential playground.

export type BadgeOffer = {
  org: string;
  serviceId: string;
  expect: string;
  tone: "emerald" | "red";
};

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

export default function DemoWalletFlow({
  wallets,
  offers,
}: {
  wallets: PersonalWallet[];
  offers: BadgeOffer[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initial = searchParams.get("wallet");
  const [selectedId, setSelectedId] = useState<string>(
    wallets.some((w) => w.id === initial) ? (initial as string) : wallets[0]?.id,
  );
  // One QR at a time: revealing an offer hides the others.
  const [activeOffer, setActiveOffer] = useState<string | null>(null);
  const wallet = useMemo(
    () => wallets.find((w) => w.id === selectedId) ?? wallets[0],
    [wallets, selectedId],
  );

  const select = (id: string) => {
    setSelectedId(id);
    setActiveOffer(null);
    router.replace(`${pathname}?wallet=${id}`, { scroll: false });
  };

  if (!wallet) return null;

  const badgeReady = wallet.formats.includes("anoncreds");

  return (
    <div className="mt-6 space-y-6">
      {/* Wallet picker */}
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

      {/* Install panel for the selected wallet */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <WalletIcon w={wallet} size={48} />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-bold tracking-tight text-gray-900">
              {wallet.name}
            </span>
            <span className="block text-sm text-gray-500">{wallet.vendor}</span>
          </span>
          <span className="flex flex-wrap items-center gap-2">
            <a
              href={wallet.download}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
            >
              <Download className="h-4 w-4" aria-hidden />
              {wallet.verana_builtin ? "Get the app" : "Download the APK"}
            </a>
            {wallet.appstore && wallet.appstore !== wallet.download ? (
              <a
                href={wallet.appstore}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
              >
                App Store
              </a>
            ) : null}
            {wallet.web ? (
              <a
                href={wallet.web}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
              >
                Web wallet
              </a>
            ) : null}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          {wallet.verana_builtin
            ? `${wallet.name} supports Verana out of the box - install the standard build, no special version needed.`
            : `Install the Verana-integrated build of ${wallet.name} from the download link - store builds may not include the integration.`}{" "}
          <Link
            href={`/personal-wallets?wallet=${wallet.id}`}
            className="whitespace-nowrap font-medium text-violet-700 hover:underline"
          >
            Full wallet details
            <ArrowRight className="ml-0.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden />
          </Link>
        </p>
      </div>

      {/* The three badge offers */}
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
