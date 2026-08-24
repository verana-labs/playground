"use client";
import { withBase } from "../../lib/base-path";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  BadgeCheck,
  Building2,
  IdCard,
  Landmark,
  Lock,
  PiggyBank,
  RefreshCw,
  ShieldX,
} from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { useSelectedWallet } from "../vesta/DemoWalletFlow";
import { BOLIVIA_CAST } from "../../lib/bolivia-cast";

// Demos del capítulo 4: ventanas simuladas de los verificadores de Bolivia:
// el portal tributario de Impuestos Nacionales (demo) y la banca en línea de
// Banco Unión (demo). Dos modos por portal: iniciar sesión con la Cédula
// Digital (modo "ciudadano") o con la credencial de Representante Legal
// (modo "empresa"). La decisión la computa en vivo /api/bolivia-login/[id]
// a partir de la cadena del EMISOR de la credencial: SEGIP -> espacio
// personal, SEPREC -> espacio de la empresa, cualquier otro -> denegado.

type Claim = { name: string; value: string };

type LoginResult = {
  done: boolean;
  verified?: boolean;
  claims?: Claim[];
  decision?: "ciudadano" | "empresa" | "denegado";
  name?: string;
  company?: string;
  trustVerdict?: string | null;
  trustNote?: string | null;
};

export type BoliviaPortalId = "impuestos" | "banco-union";

const PORTALS: Record<
  BoliviaPortalId,
  {
    title: string;
    subtitle: string;
    host: string;
    citizenButton: string;
    companyButton: string;
    citizenWelcome: string;
    companyWelcome: (company?: string) => string;
    deniedCompany: string;
    deniedCitizen: string;
  }
> = {
  impuestos: {
    title: "Impuestos Nacionales (demo)",
    subtitle: "Oficina virtual: personas y empresas",
    host: BOLIVIA_CAST.impuestos.host,
    citizenButton: "Iniciar sesión con su Cédula Digital",
    companyButton: "Espacio empresa (Representante Legal)",
    citizenWelcome:
      "Su Cédula Digital fue emitida por el SEGIP (demo). Espacio tributario personal abierto: sin contraseña, sin registro previo.",
    companyWelcome: (company) =>
      `Su credencial de Representante Legal fue emitida por el SEPREC (demo)${
        company ? ` para ${company}` : ""
      }. Espacio tributario de la empresa abierto.`,
    deniedCompany:
      "Su credencial no fue emitida por el SEPREC (demo): no prueba representación legal en Bolivia.",
    deniedCitizen:
      "Su credencial no fue emitida por el SEGIP (demo): no es una Cédula Digital.",
  },
  "banco-union": {
    title: "Banco Unión (demo)",
    subtitle: "Banca en línea",
    host: BOLIVIA_CAST.bancoUnion.host,
    citizenButton: "Abrir una cuenta con su Cédula Digital",
    companyButton: "Acceso corporativo (Representante Legal)",
    citizenWelcome:
      "Identidad verificada contra el SEGIP (demo): su cuenta queda abierta. KYC en un escaneo: sin subir documentos, sin video-identificación.",
    companyWelcome: (company) =>
      `Representación legal verificada contra el SEPREC (demo)${
        company ? `: acceso corporativo a la cuenta de ${company} concedido` : ""
      }.`,
    deniedCompany:
      "Su credencial no fue emitida por el SEPREC (demo): acceso corporativo denegado.",
    deniedCitizen:
      "Su credencial no fue emitida por el SEGIP (demo): no es una Cédula Digital.",
  },
};

const claim = (claims: Claim[] | undefined, name: string) =>
  claims?.find((c) => c.name === name)?.value;

function DecisionBanner({
  result,
  mode,
  portal,
}: {
  result: LoginResult;
  mode: "ciudadano" | "empresa";
  portal: BoliviaPortalId;
}) {
  const copy = PORTALS[portal];
  if (result.decision === "ciudadano" || result.decision === "empresa") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="flex items-center gap-2 font-bold">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
          Bienvenido{result.name ? `, ${result.name}` : ""}!
        </p>
        <p className="mt-1 text-emerald-700/90">
          {result.decision === "ciudadano"
            ? copy.citizenWelcome
            : copy.companyWelcome(result.company)}
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
          : mode === "empresa"
            ? copy.deniedCompany
            : copy.deniedCitizen;
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
  const portrait = claim(claims, "portrait");
  const rows = claims.filter((c) => c.value && c.name !== "portrait");
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      {portrait?.startsWith("data:image/") ? (
        // eslint-disable-next-line @next/next/no-img-element -- la fotografía llega como data URI en la presentación
        <img
          src={portrait}
          alt="Fotografía de la cédula"
          className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 bg-white object-cover"
        />
      ) : null}
      <dl className="min-w-0 flex-1 space-y-1">
        {rows.map((c) => (
          <div key={c.name} className="flex items-baseline justify-between gap-4">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {c.name}
            </dt>
            <dd className="truncate font-mono text-xs text-gray-700">{c.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function BoliviaLoginDemo({
  wallets,
  portal,
}: {
  wallets: PersonalWallet[];
  portal: BoliviaPortalId;
}) {
  const { wallet } = useSelectedWallet(wallets);
  const copy = PORTALS[portal];
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<"ciudadano" | "empresa" | null>(null);
  const [mint, setMint] = useState<
    { url: string; id: string | null; rail: string } | null | undefined
  >(undefined);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<LoginResult | null>(null);

  const format = wallet?.formats.includes("anoncreds")
    ? "anoncreds"
    : "openid4vc-sdjwt";

  const start = useCallback((m: "ciudadano" | "empresa") => {
    setResult(null);
    setMint(undefined);
    setQrDataUrl(undefined);
    setAttempt((n) => n + 1);
    setMode(m);
  }, []);
  const reset = useCallback(() => {
    setResult(null);
    setMint(undefined);
    setQrDataUrl(undefined);
    setMode(null);
  }, []);

  // Una solicitud de presentación fresca por intento.
  useEffect(() => {
    if (!mode) return;
    let alive = true;
    fetch(
      withBase(`/api/bolivia-login?portal=${portal}&mode=${mode}&format=${encodeURIComponent(format)}`),
    )
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
  }, [mode, attempt, format, portal]);

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
    if (!mint?.id || !mode || settled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch(
          withBase(`/api/bolivia-login/${mint.id}?portal=${portal}&mode=${mode}&rail=${encodeURIComponent(mint.rail)}`),
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
  }, [mint, mode, settled, attempt, portal]);

  const BrandIcon = portal === "banco-union" ? PiggyBank : Landmark;

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
          <span className="truncate">{copy.host}</span>
        </span>
      </div>

      {/* Cuerpo del portal */}
      <div className="px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-sm text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <BrandIcon className="h-6 w-6" aria-hidden />
          </span>
          <h4 className="mt-3 text-lg font-bold text-gray-900">{copy.title}</h4>
          <p className="mt-1 text-sm text-gray-500">{copy.subtitle}</p>

          <div className="mt-6">
            {!mode ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => start("ciudadano")}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  <IdCard className="h-4 w-4" aria-hidden />
                  {copy.citizenButton}
                </button>
                <button
                  type="button"
                  onClick={() => start("empresa")}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-2.5 text-sm font-medium text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
                >
                  <Building2 className="h-4 w-4" aria-hidden />
                  {copy.companyButton}
                </button>
              </div>
            ) : result?.done ? (
              <div className="space-y-4 text-left">
                {result.claims?.length ? (
                  <PresentedCredential claims={result.claims} />
                ) : null}
                <DecisionBanner result={result} mode={mode} portal={portal} />
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
                  onClick={() => start(mode)}
                  className="mx-auto mt-2 flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden />
                  Reintentar
                </button>
              </div>
            ) : !qrDataUrl ? (
              <div className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-500">
                Preparando la solicitud de inicio de sesión…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-gray-100 bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- data URI generado */}
                  <img
                    src={qrDataUrl}
                    alt={`QR de inicio de sesión de ${copy.title}`}
                    className="h-full w-full"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Presente su{" "}
                  {mode === "empresa"
                    ? "credencial de Representante Legal"
                    : "Cédula Digital"}{" "}
                  con {wallet?.name ?? "su wallet"}.
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
