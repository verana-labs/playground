"use client";

import type { PersonalWallet } from "../../lib/wallets";
import { ServiceQr } from "../../components/ServiceQr";
import { useSelectedWallet } from "../vesta/DemoWalletFlow";

// La solicitud de presentación del prestamista (simulado): el QR es muy
// real; el rechazo ocurre en la wallet, por el permiso VERIFIER ausente.

export default function BoliviaRequestQr({
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
        Esta demo aún no soporta los formatos de credencial de {wallet.name}:
        elija otra wallet arriba.
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
