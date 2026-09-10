"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  Calendar,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Smartphone,
} from "lucide-react";
import { withBase } from "../lib/base-path";
import type { PersonalWallet } from "../lib/wallets";
import {
  EVENTO_SUBTITULO,
  EVENTO_TITULO,
  PATROCINADORES,
  type Evento,
  type Rol,
} from "../lib/eventos";
import { ArteEvento } from "./arte";

// Shared pieces of the events demo: the Taquilla broker and the three event
// landings are Spanish, real-looking sites that share the boleto artwork,
// the wallet picker (every integrated personal wallet, not one) and the
// mint-a-QR-then-poll loop of the playground demos.

/** Both sites are Spanish while the root layout declares English. */
export function LangEs() {
  useEffect(() => {
    const html = document.documentElement;
    const previous = html.lang;
    html.lang = "es";
    return () => {
      html.lang = previous;
    };
  }, []);
  return null;
}

export type Formato = "anoncreds" | "openid4vc-sdjwt";

/** The rail a wallet speaks, AnonCreds first (Hologram's native rail). */
export const walletFormat = (w: PersonalWallet): Formato =>
  w.formats.includes("anoncreds") ? "anoncreds" : "openid4vc-sdjwt";

/** The mint query this wallet needs: its rail plus its own knobs
 *  (`query=pe`, `signer=x5c`, see personal-wallets.yaml). */
export const walletQuery = (w: PersonalWallet): string =>
  `format=${encodeURIComponent(walletFormat(w))}${
    w.demoParams ? `&${w.demoParams}` : ""
  }`;

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
      className="flex shrink-0 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-600"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {w.name.charAt(0)}
    </span>
  );
}

/** Wallet picker + install panel: every integrated personal wallet, with
 *  the same download options as the /personal-wallets page, in Spanish. */
export function WalletPicker({
  wallets,
  selectedId,
  onSelect,
  acento = "#7c3aed",
}: {
  wallets: PersonalWallet[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  acento?: string;
}) {
  const wallet = wallets.find((w) => w.id === selectedId) ?? wallets[0];
  if (!wallet) return null;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {wallets.map((w) => {
          const on = w.id === wallet.id;
          return (
            <button
              key={w.id}
              type="button"
              onClick={() => onSelect(w.id)}
              aria-pressed={on}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                on
                  ? "border-transparent bg-white shadow-md"
                  : "border-gray-200 bg-white/70 hover:bg-white"
              }`}
              style={on ? { boxShadow: `0 0 0 2px ${acento}` } : undefined}
            >
              <WalletIcon w={w} size={34} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900">
                  {w.name}
                </span>
                <span className="block truncate text-[11px] text-gray-500">
                  {w.vendor}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <WalletIcon w={wallet} size={44} />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-gray-900">{wallet.name}</div>
            <div className="text-xs text-gray-500">{wallet.vendor}</div>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
            {walletFormat(wallet) === "anoncreds"
              ? "AnonCreds / DIDComm"
              : "OpenID4VC SD-JWT"}
          </span>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">
          {wallet.verana_builtin
            ? `${wallet.name} es compatible con Verana de fábrica: instala la versión estándar desde los enlaces de abajo.`
            : `Descarga la versión de ${wallet.name} integrada con Verana (compilación para la red de pruebas). Las versiones de tienda pueden no incluir la integración.`}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a
            href={wallet.download}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: acento }}
          >
            <Download className="h-4 w-4" aria-hidden />
            {wallet.verana_builtin ? "Obtener la wallet" : "Descargar el APK"}
          </a>
          {wallet.playstore ? (
            <a
              href={wallet.playstore}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              Google Play
            </a>
          ) : null}
          {wallet.appstore ? (
            <a
              href={wallet.appstore}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              App Store
            </a>
          ) : null}
          {wallet.web ? (
            <a
              href={wallet.web}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Abrir la wallet web
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** The three sponsor marks in a row; white variants for dark surfaces. */
export function PatrocinadoresStrip({
  blanco = false,
  escala = 1,
  className = "",
}: {
  blanco?: boolean;
  escala?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-6 gap-y-3 ${className}`}>
      {PATROCINADORES.map((p) => (
        // eslint-disable-next-line @next/next/no-img-element -- partner brand assets, sized by height
        <img
          key={p.id}
          src={withBase(blanco ? p.logoBlanco : p.logo)}
          alt={p.nombre}
          style={{ height: Math.round(p.alto * escala) }}
          className="w-auto object-contain"
        />
      ))}
    </div>
  );
}

/** The boleto as the mockup draws it: dark card, role tab, the holder, the
 *  event block and the sponsors, with the stop's own skyline. Green for a
 *  sponsor credential. */
export function CredencialPreview({
  rol,
  evento,
  nombre,
  organizacion,
  lema,
  className = "",
}: {
  rol: Rol;
  evento: Evento;
  nombre?: string;
  organizacion?: string;
  lema?: string;
  className?: string;
}) {
  const patrocinador = rol === "patrocinador";
  const fondo = patrocinador
    ? "linear-gradient(135deg, #052e16 0%, #14532d 50%, #4d7c0f 100%)"
    : "linear-gradient(135deg, #060f3a 0%, #0b1f5c 48%, #1d4ed8 100%)";
  const titular = patrocinador
    ? organizacion || "Tu organización"
    : nombre || "Tu nombre";
  return (
    <div
      className={`relative min-h-[236px] w-full overflow-hidden rounded-2xl text-white shadow-2xl ring-1 ring-white/10 ${className}`}
      style={{ background: fondo }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 88% 12%, rgba(255,255,255,0.16), transparent 42%)",
        }}
      />
      <ArteEvento
        arte={evento.arte}
        className={`absolute -right-3 bottom-0 h-[78%] w-auto ${
          patrocinador ? "text-lime-200/55" : "text-sky-200/65"
        }`}
      />
      <div
        className={`absolute right-0 top-0 rounded-bl-2xl px-4 py-1.5 text-[10px] font-bold tracking-[0.22em] ${
          patrocinador ? "bg-lime-300 text-emerald-950" : "bg-white/15 text-white"
        }`}
      >
        {patrocinador ? "PATROCINADOR" : "ASISTENTE"}
      </div>
      <div className="relative flex min-h-[236px] flex-col p-5 sm:p-6">
        <div className="max-w-[72%] truncate text-[22px] font-bold leading-tight sm:text-2xl">
          {titular}
        </div>
        <div className="mt-0.5 text-xs text-white/70">
          {patrocinador ? lema || "Patrocinador del evento" : "Asistente"}
        </div>
        <div className="mt-3 max-w-[66%] text-[11px] leading-snug text-white/85">
          <span className="font-semibold">{EVENTO_TITULO}</span>
          <br />
          {EVENTO_SUBTITULO}
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-4 text-[11px] text-white/85">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden />
            {evento.pais}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden />
            {evento.fechaTexto}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden />
            {evento.horario}
          </span>
        </div>
        <PatrocinadoresStrip blanco escala={0.72} className="mt-3 opacity-90" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mint a QR, poll until the wallet answers
// ---------------------------------------------------------------------------

export type MintResult = {
  url: string;
  id: string | null;
  rail: "didcomm" | "oid4vc";
};

/** The playground demo loop, generic: mint one single-use action, draw its
 *  QR, poll its status every 3s until the wallet answered. The caller
 *  remounts (a `key`) to mint again; `mint` and `poll` are read through refs
 *  so their closures may change freely. */
export function useMintedQr<T>({
  mint,
  poll,
}: {
  mint: () => Promise<MintResult | null>;
  poll: (m: MintResult) => Promise<T | null>;
}) {
  // undefined = minting, null = unavailable
  const [mintResult, setMintResult] = useState<MintResult | null | undefined>(
    undefined,
  );
  const [qr, setQr] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<T | null>(null);
  const mintRef = useRef(mint);
  mintRef.current = mint;
  const pollRef = useRef(poll);
  pollRef.current = poll;

  useEffect(() => {
    let alive = true;
    mintRef
      .current()
      .then((m) => {
        if (alive) setMintResult(m);
      })
      .catch(() => {
        if (alive) setMintResult(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!mintResult?.url) return;
    let alive = true;
    QRCode.toDataURL(mintResult.url, { width: 220, margin: 1 })
      .then((dataUrl) => {
        if (alive) setQr(dataUrl);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mintResult]);

  const settled = result !== null;
  useEffect(() => {
    if (!mintResult?.id || settled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = async () => {
      try {
        const r = await pollRef.current(mintResult);
        if (!alive) return;
        if (r !== null) {
          setResult(r);
          return;
        }
      } catch {
        // transient - keep polling
      }
      if (alive) timer = setTimeout(tick, 3000);
    };
    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [mintResult, settled]);

  return { mintResult, qr, result };
}

/** The QR itself plus the two ways to use it without a second device: the
 *  deep link for a phone-side visitor and, for the browser wallets, the
 *  hosted-wallet link that carries the same query. */
export function QrPanel({
  qr,
  url,
  wallet,
  alt,
  hint,
}: {
  qr?: string;
  url: string;
  wallet: PersonalWallet;
  alt: string;
  hint: string;
}) {
  const queryStart = url.indexOf("?");
  const hosted =
    wallet.hosted && queryStart >= 0
      ? `${wallet.hosted.replace(/\/$/, "")}/?${url.slice(queryStart + 1)}`
      : null;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-52 w-52 items-center justify-center rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element -- generated data: URI
          <img src={qr} alt={alt} className="h-full w-full" />
        ) : (
          <div className="h-full w-full animate-pulse rounded-xl bg-gray-100" />
        )}
      </div>
      <p className="max-w-xs text-center text-xs leading-relaxed text-gray-500">
        {hint}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <a
          href={url}
          className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-400"
        >
          <Smartphone className="h-3.5 w-3.5" aria-hidden />
          ¿Estás en tu teléfono? Abrir en la wallet
        </a>
        {hosted ? (
          <a
            href={hosted}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Abrir en {wallet.name}
          </a>
        ) : null}
      </div>
    </div>
  );
}

/** Loading / unavailable states shared by both QR flows. */
export function QrEstado({
  estado,
  onRetry,
}: {
  estado: "cargando" | "no-disponible";
  onRetry: () => void;
}) {
  if (estado === "cargando") {
    return (
      <div className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-center text-xs text-gray-500">
        Preparando tu código QR…
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 text-center">
      <p className="text-xs text-gray-600">
        El servicio no está disponible en este momento.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-medium text-gray-700 transition hover:border-gray-400"
      >
        Reintentar
      </button>
    </div>
  );
}
