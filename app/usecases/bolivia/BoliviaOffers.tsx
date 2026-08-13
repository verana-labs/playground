"use client";

import { useState } from "react";
import { QrCode } from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { ServiceQr } from "../../components/ServiceQr";
import { Chip } from "../../components/ui";
import { useSelectedWallet } from "../vesta/DemoWalletFlow";

// Tarjetas de oferta del capítulo 4 de Bolivia: ofertas de credencial en
// vivo (Cédula Digital, Representante Legal) reveladas al hacer clic,
// emitidas en el riel que hable la wallet elegida: AnonCreds/DIDComm para
// Hologram, OpenID4VC SD-JWT (el riel compatible con eIDAS 2) en el resto.
// Comparte el parámetro ?wallet= con el WalletChooser.

export type BoliviaOffer = {
  org: string;
  serviceId: string;
  /** Selector de credencial de /api/demo, p. ej. "bolivia-cedula". */
  credential: string;
  expect: string;
  tone: "emerald" | "red";
};

export default function BoliviaOffers({
  wallets,
  offers,
}: {
  wallets: PersonalWallet[];
  offers: BoliviaOffer[];
}) {
  const { wallet } = useSelectedWallet(wallets);
  // Un QR a la vez: revelar una oferta oculta las demás.
  const [activeOffer, setActiveOffer] = useState<string | null>(null);
  if (!wallet) return null;

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
                  Esta demo aún no soporta los formatos de credencial de{" "}
                  {wallet.name}: elija otra wallet arriba.
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
                    Haga clic para revelar el código QR
                  </span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Cada QR lo emite en vivo el servicio emisor al revelarlo: una oferta de
        credencial de un solo uso para su wallet.
      </p>
      {!format ? null : (
        <Chip tone="verified">
          Funciona con {wallet.name}:{" "}
          {format === "anoncreds"
            ? "AnonCreds/DIDComm"
            : "OpenID4VC SD-JWT (riel eIDAS 2)"}
        </Chip>
      )}
    </div>
  );
}
