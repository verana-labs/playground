"use client";
import { withBase } from "../../lib/base-path";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  BadgeCheck,
  Building2,
  Clock,
  IdCard,
  Lock,
  PiggyBank,
  RefreshCw,
  ShieldX,
} from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { useSelectedWallet } from "../vesta/DemoWalletFlow";
import { CCM_CAST } from "../../lib/ccm-cast";

// Demo 2 del capítulo 4: la ventanilla simulada de Bancolombia (demo). El
// KYC personal ya ocurrió, presencial, con la cédula física; aquí el banco
// solicita la credencial de Representación Legal y decide en vivo
// (/api/ccm-login/[id]) sobre la cadena del EMISOR: CCM (demo) y vigente
// -> acceso corporativo; CCM pero expirada -> pedir renovación; cualquier
// otro emisor -> denegado.

type Claim = { name: string; value: string };

type LoginResult = {
  done: boolean;
  verified?: boolean;
  claims?: Claim[];
  decision?: "empresa" | "expirada" | "denegado";
  name?: string;
  company?: string;
  trustVerdict?: string | null;
  trustNote?: string | null;
};

const claim = (claims: Claim[] | undefined, name: string) =>
  claims?.find((c) => c.name === name)?.value;

function DecisionBanner({ result }: { result: LoginResult }) {
  if (result.decision === "empresa") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="flex items-center gap-2 font-bold">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
          Bienvenido{result.name ? `, ${result.name}` : ""}!
        </p>
        <p className="mt-1 text-emerald-700/90">
          Representación legal verificada contra la CCM (demo)
          {result.company
            ? `: acceso corporativo a la cuenta de ${result.company} concedido`
            : ""}
          . El cotejo de identidad ya ocurrió en ventanilla, con su cédula
          física.
        </p>
      </div>
    );
  }
  if (result.decision === "expirada") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <p className="flex items-center gap-2 font-bold">
          <Clock className="h-4 w-4 shrink-0" aria-hidden />
          Credencial expirada
        </p>
        <p className="mt-1 text-amber-700/90">
          Su credencial fue emitida por la CCM (demo) pero su vigencia venció.
          El banco solicita la credencial actualizada: renuévela en el portal
          de la cámara y preséntela de nuevo.
        </p>
      </div>
    );
  }
  // Distinguir "la credencial no pudo confiarse" (falla transitoria del
  // resolver, emisor no confiable o no autorizado) de la regla del emisor.
  const verdict = result.trustVerdict;
  const reason =
    verdict === "RESOLVER_UNAVAILABLE"
      ? "El servicio no pudo alcanzar el resolver de confianza para verificar su credencial: intente de nuevo en un momento."
      : verdict === "UNTRUSTED"
        ? "Su credencial fue emitida por una organización que no es un servicio verificable confiable."
        : verdict === "TRUSTED_NOT_AUTHORIZED"
          ? "Su credencial fue emitida por una organización que no está autorizada a emitirla."
          : "Su credencial no fue emitida por la CCM (demo): no prueba representación legal ante esta cámara.";
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="flex items-center gap-2 font-bold">
        <ShieldX className="h-4 w-4 shrink-0" aria-hidden />
        Acceso denegado
      </p>
      <p className="mt-1 text-red-600/90">{reason}</p>
      {result.trustNote ? (
        <p className="mt-1.5 text-xs text-red-500/80">{result.trustNote}</p>
      ) : null}
    </div>
  );
}

function PresentedCredential({ claims }: { claims: Claim[] }) {
  const rows = claims.filter((c) => c.value);
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <dl className="min-w-0 space-y-1">
        {rows.map((c) => (
          <div key={c.name} className="flex items-baseline justify-between gap-4">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {c.name}
            </dt>
            <dd className="truncate font-mono text-xs text-gray-700">{c.value}</dd>
          </div>
        ))}
      </dl>
      {claim(claims, "representativeId") ? (
        <p className="mt-3 flex items-start gap-1.5 border-t border-gray-200 pt-2 text-[11px] leading-relaxed text-gray-500">
          <IdCard className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          El empleado coteja este nombre y esta cédula con el documento físico
          presentado en ventanilla.
        </p>
      ) : null}
    </div>
  );
}

export default function CcmLoginDemo({ wallets }: { wallets: PersonalWallet[] }) {
  const { wallet } = useSelectedWallet(wallets);
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState(false);
  const [mint, setMint] = useState<
    { url: string; id: string | null; rail: string } | null | undefined
  >(undefined);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<LoginResult | null>(null);

  const format = wallet?.formats.includes("anoncreds")
    ? "anoncreds"
    : "openid4vc-sdjwt";

  const start = useCallback(() => {
    setResult(null);
    setMint(undefined);
    setQrDataUrl(undefined);
    setAttempt((n) => n + 1);
    setActive(true);
  }, []);
  const reset = useCallback(() => {
    setResult(null);
    setMint(undefined);
    setQrDataUrl(undefined);
    setActive(false);
  }, []);

  // Una solicitud de presentación fresca por intento.
  useEffect(() => {
    if (!active) return;
    let alive = true;
    fetch(withBase(`/api/ccm-login?format=${encodeURIComponent(format)}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!alive) return;
        setMint(body?.url ? body : null);
      })
      .catch(() => {
        if (alive) setMint(null);
      });
    return () => {
      alive = false;
    };
  }, [active, attempt, format]);

  useEffect(() => {
    if (!mint?.url) return;
    let alive = true;
    QRCode.toDataURL(mint.url, { width: 180, margin: 1 })
      .then((url) => {
        if (alive) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mint]);

  // Sondear la decisión una vez montada la solicitud.
  const settled = !!result?.done;
  useEffect(() => {
    if (!mint?.id || !active || settled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch(
          withBase(`/api/ccm-login/${mint.id}?rail=${encodeURIComponent(mint.rail)}`),
        );
        if (res.ok) {
          const body = (await res.json()) as LoginResult;
          if (!alive) return;
          if (body?.done) {
            setResult(body);
            return;
          }
        }
      } catch {
        // transitorio - seguir sondeando
      }
      if (alive) timer = setTimeout(poll, 3000);
    };
    poll();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [mint, active, settled, attempt]);

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
          <span className="truncate">{CCM_CAST.bancolombia.host}</span>
        </span>
      </div>

      {/* Cuerpo de la ventanilla */}
      <div className="px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-sm text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <PiggyBank className="h-6 w-6" aria-hidden />
          </span>
          <h4 className="mt-3 text-lg font-bold text-gray-900">
            Bancolombia (demo)
          </h4>
          <p className="mt-1 text-sm text-gray-500">
            Apertura de cuenta empresarial · ventanilla
          </p>
          <p className="mx-auto mt-3 flex items-center justify-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
            <IdCard className="h-3.5 w-3.5 shrink-0" aria-hidden />
            KYC presencial completado con la cédula física
          </p>

          <div className="mt-6">
            {!active ? (
              <button
                type="button"
                onClick={start}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
              >
                <Building2 className="h-4 w-4" aria-hidden />
                Verificar la credencial de Representación Legal
              </button>
            ) : result?.done ? (
              <div className="space-y-4 text-left">
                {result.claims?.length ? (
                  <PresentedCredential claims={result.claims} />
                ) : null}
                <DecisionBanner result={result} />
                <button
                  type="button"
                  onClick={reset}
                  className="mx-auto flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Empezar de nuevo: probar otra credencial
                </button>
              </div>
            ) : mint === null ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
                <p className="text-xs text-gray-500">
                  El servicio no está disponible en este momento.
                </p>
                <button
                  type="button"
                  onClick={start}
                  className="mx-auto mt-2 flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden />
                  Reintentar
                </button>
              </div>
            ) : !qrDataUrl ? (
              <div className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-500">
                Preparando la solicitud de verificación…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-gray-100 bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URI generado */}
                  <img
                    src={qrDataUrl}
                    alt="QR de verificación de Bancolombia (demo)"
                    className="h-full w-full"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Presente su credencial de Representación Legal con{" "}
                  {wallet?.name ?? "su wallet"}.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mx-auto flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  Volver
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
