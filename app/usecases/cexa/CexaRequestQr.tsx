"use client";

import type { PersonalWallet } from "../../lib/wallets";
import { ServiceQr } from "../../components/ServiceQr";
import { useSelectedWallet } from "../vesta/DemoWalletFlow";

// A live CEXA presentation request (Borealis, Novara, DarkPool): the service
// asks the selected wallet for the CEXA-Kyc credential on the rail the
// wallet speaks. The wallet's trust checks decide what happens next.

export default function CexaRequestQr({
  wallets,
  serviceId,
  label,
  credential,
}: {
  wallets: PersonalWallet[];
  serviceId: string;
  label: string;
  credential: string;
}) {
  const { wallet } = useSelectedWallet(wallets);
  if (!wallet) return null;

  const format = wallet.formats.includes("anoncreds")
    ? "anoncreds"
    : wallet.formats.includes("openid4vc-sdjwt")
      ? "openid4vc-sdjwt"
      : null;

  if (!format) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs leading-relaxed text-gray-500">
        This demo does not support {wallet.name}&apos;s credential formats yet
        - pick another wallet above.
      </div>
    );
  }

  return (
    <ServiceQr
      serviceId={serviceId}
      label={label}
      format={format}
      credential={credential}
      demoParams={wallet.demoParams}
    />
  );
}
