"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { ServiceQr } from "../../components/ServiceQr";
import { Chip } from "../../components/ui";
import { useSelectedWallet } from "../vesta/DemoWalletFlow";

// The CEXA chapter-5 offer cards: live CEXA-Kyc credential offers revealed
// on click, minted on the rail the selected wallet speaks - AnonCreds/DIDComm
// for Hologram, OpenID4VC SD-JWT otherwise. Shares the ?wallet= query param
// with the WalletChooser (the Verandia precedent).

export type CexaOffer = {
  org: string;
  serviceId: string;
  /** /api/demo credential selector, e.g. "cexa-kyc". */
  credential: string;
  expect: string;
  tone: "emerald" | "red";
};

export default function CexaOffers({
  wallets,
  offers,
}: {
  wallets: PersonalWallet[];
  offers: CexaOffer[];
}) {
  const { wallet } = useSelectedWallet(wallets);
  // One QR at a time: revealing an offer hides the others.
  const [activeOffer, setActiveOffer] = useState<string | null>(null);
  if (!wallet) return null;

  // CEXA-Kyc rides the dual rail; AnonCreds first (Hologram's native rail),
  // SD-JWT otherwise.
  const format = wallet.formats.includes("anoncreds")
    ? "anoncreds"
    : wallet.formats.includes("openid4vc-sdjwt")
      ? "openid4vc-sdjwt"
      : null;

  return (
    <div className="mt-6 space-y-6">
      <div
        className={`reveal-stagger grid gap-4 ${
          offers.length > 1 ? "sm:grid-cols-2" : "mx-auto max-w-md"
        }`}
      >
        {offers.map((o) => (
          <div
            key={`${o.serviceId}-${o.credential}`}
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
              {!format ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
                  This demo does not support {wallet.name}&apos;s credential
                  formats yet - pick another wallet above.
                </div>
              ) : activeOffer === `${o.serviceId}-${o.credential}` ? (
                <ServiceQr
                  serviceId={o.serviceId}
                  label={o.org}
                  format={format}
                  credential={o.credential}
                  demoParams={wallet.demoParams}
                  bare
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveOffer(`${o.serviceId}-${o.credential}`)}
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
        single-use credential offer for your wallet.
      </p>
      {!format ? null : (
        <Chip tone="verified">
          Works with {wallet.name} -{" "}
          {format === "anoncreds" ? "AnonCreds/DIDComm" : "OpenID4VC SD-JWT"}
        </Chip>
      )}
    </div>
  );
}
