"use client";

import { useState } from "react";
import { BadgeCheck, Landmark, Lock, QrCode } from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { ServiceQr } from "../../components/ServiceQr";
import { useSelectedWallet } from "../vesta/DemoWalletFlow";
import { CCM_CAST } from "../../lib/ccm-cast";

// Demo 1 del capítulo 4: la ventana simulada del portal de servicios
// virtuales de la CCM (demo). El visitante encarna al representante legal
// YA autenticado en el acceso de su empresa (así ocurre en el flujo real:
// el portal conoce al usuario antes de emitir); el portal presenta el QR
// del emisor y la wallet recibe la credencial de Representación Legal.

export default function CcmPortalDemo({
  wallets,
  serviceId,
  credential,
}: {
  wallets: PersonalWallet[];
  serviceId: string;
  credential: string;
}) {
  const { wallet } = useSelectedWallet(wallets);
  const [revealed, setRevealed] = useState(false);
  if (!wallet) return null;

  const format = wallet.formats.includes("anoncreds")
    ? "anoncreds"
    : wallet.formats.includes("openid4vc-sdjwt")
      ? "openid4vc-sdjwt"
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
      {/* Marco del navegador */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        </span>
        <span className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs text-gray-500 ring-1 ring-gray-200">
          <Lock className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
          <span className="truncate">{CCM_CAST.camara.host}</span>
        </span>
      </div>

      {/* Cuerpo del portal */}
      <div className="px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-sm text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <Landmark className="h-6 w-6" aria-hidden />
          </span>
          <h4 className="mt-3 text-lg font-bold text-gray-900">
            Servicios virtuales · CCM (demo)
          </h4>
          {/* La sesión ya existe: el flujo real emite dentro del portal */}
          <p className="mx-auto mt-3 flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Sesión: representante legal de Comercializadora Antioquia S.A.S.
            (demo)
          </p>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-left">
            <div className="font-semibold text-gray-900">
              Credencial de Representación Legal
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Empresa, NIT, matrícula, su nombre, su cédula, calidad y
              vigencia. Tarifa de emisión: como el certificado de hoy (en la
              demo, sin cobro).
            </p>
            <div className="mt-4 border-t border-gray-200 pt-4">
              {!format ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-3 text-xs leading-relaxed text-gray-500">
                  Esta demo aún no soporta los formatos de credencial de{" "}
                  {wallet.name}: elija otra wallet arriba.
                </div>
              ) : revealed ? (
                <ServiceQr
                  serviceId={serviceId}
                  label="Cámara de Comercio de Medellín (demo)"
                  format={format}
                  credential={credential}
                  demoParams={wallet.demoParams}
                  bare
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-6 text-gray-400 transition-colors hover:border-violet-300 hover:text-violet-600"
                >
                  <QrCode className="h-10 w-10" aria-hidden />
                  <span className="text-xs font-medium">
                    Obtener la credencial: revelar el código QR
                  </span>
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Su wallet verifica al emisor ANTES de aceptar: solo la CCM (demo),
            con su check verde, puede emitir esta credencial.
          </p>
        </div>
      </div>
    </div>
  );
}
