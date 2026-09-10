"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  Clock,
  CreditCard,
  ExternalLink,
  Lock,
  MapPin,
  QrCode,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { withBase } from "../lib/base-path";
import type { PersonalWallet } from "../lib/wallets";
import {
  AGENDA,
  EVENTO_SUBTITULO,
  EVENTO_TITULO,
  EVENTOS,
  EVENTOS_ORDEN,
  ORGANIZADOR,
  PATROCINADORES,
  TAQUILLA,
  type Evento,
  type EventoSlug,
  type Rol,
} from "../lib/eventos";
import LiveTrustCard from "../components/LiveTrustCard";
import { ArteEvento } from "./arte";
import { VeranaBadge } from "./VeranaBadge";
import {
  CredencialPreview,
  LangEs,
  PatrocinadoresStrip,
  QrEstado,
  QrPanel,
  useMintedQr,
  WalletPicker,
  walletQuery,
  type MintResult,
} from "./ui";

// Taquilla (demo): the fictional ticket broker of the events demo. A
// real-looking Spanish ticketing site whose checkout ends in a credential
// offer: pick the stop of the tour, register as attendee or sponsor, type
// the name that goes on the boleto, pay (simulated), pick the wallet, scan.
// The boleto is a live testnet credential minted by the Taquilla vs-agent
// via /api/demo; the event landings verify it.

type Paso = 1 | 2 | 3 | 4 | 5;
type Entrega = "entregado" | "rechazado";

const PASOS: { n: Paso; label: string }[] = [
  { n: 1, label: "Evento" },
  { n: 2, label: "Perfil" },
  { n: 3, label: "Datos" },
  { n: 4, label: "Pago" },
  { n: 5, label: "Boleto" },
];

const ACENTO = "#7c3aed";

const eventoHref = (slug: EventoSlug) => withBase(`/eventos/${slug}`);

function Marca({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- cast logo */}
      <img
        src={withBase("/images/eventos/cast/taquilla.svg")}
        alt=""
        aria-hidden
        width={32}
        height={32}
        className="h-8 w-8 rounded-lg"
      />
      <span className="text-lg font-bold tracking-tight">
        {TAQUILLA.nombre}
        <span className="ml-1.5 align-middle rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          demo
        </span>
      </span>
    </span>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a href="#inicio" className="text-gray-900">
          <Marca />
        </a>
        <ul className="ml-6 hidden items-center gap-6 text-sm text-gray-600 md:flex">
          <li>
            <a href="#eventos" className="transition hover:text-gray-900">
              Eventos
            </a>
          </li>
          <li>
            <a href="#como-funciona" className="transition hover:text-gray-900">
              Cómo funciona
            </a>
          </li>
          <li>
            <a href="#confianza" className="transition hover:text-gray-900">
              Confianza
            </a>
          </li>
        </ul>
        <a
          href="#registro"
          className="ml-auto inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: ACENTO }}
        >
          <Ticket className="h-4 w-4" aria-hidden />
          Comprar boleto
        </a>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden bg-gray-950 text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" aria-hidden />
            Boletería verificable · Gira Centroamérica 2026
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Tu boleto vive
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-amber-200 bg-clip-text text-transparent">
              en tu wallet.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
            Regístrate, paga y recibe tu entrada como credencial verificable.
            Sin PDF, sin capturas de pantalla, sin filas en la puerta: el
            evento verifica tu boleto en un escaneo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#registro"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-violet-50"
            >
              <Ticket className="h-4 w-4" aria-hidden />
              Comprar mi boleto
            </a>
            <a
              href="#eventos"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Ver los eventos
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/60">
            <span>Organiza {ORGANIZADOR} · Patrocinan</span>
            <PatrocinadoresStrip blanco escala={0.85} className="opacity-80" />
          </div>
        </div>
        <div className="reveal relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute inset-x-6 top-8 rotate-[4deg]">
            <CredencialPreview
              rol="patrocinador"
              evento={EVENTOS.guatemala}
              organizacion="B-TECH"
              lema="We make it easy"
              className="opacity-90"
            />
          </div>
          <div className="relative -rotate-[3deg]">
            <CredencialPreview
              rol="asistente"
              evento={EVENTOS.guatemala}
              nombre="Alejandro Torres"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TarjetaEvento({
  evento,
  onRegistrar,
}: {
  evento: Evento;
  onRegistrar: () => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <div
        className="relative h-44 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #060f3a 0%, #0b1f5c 50%, #1d4ed8 100%)",
        }}
      >
        <ArteEvento
          arte={evento.arte}
          className="absolute -right-2 bottom-0 h-[92%] w-auto text-sky-200/70 transition group-hover:scale-105"
        />
        <div className="absolute left-5 top-5 rounded-2xl bg-white/12 px-3 py-2 text-center backdrop-blur-sm ring-1 ring-white/20">
          <div className="text-3xl font-bold leading-none">{evento.dia}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
            {evento.mes}
          </div>
        </div>
        <div className="absolute bottom-4 left-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
            {EVENTO_TITULO}
          </div>
          <div className="text-2xl font-bold">{evento.pais}</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-sm leading-relaxed text-gray-600">{evento.descripcion}</p>
        <dl className="mt-4 space-y-1.5 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-400" aria-hidden />
            <dd>{evento.ciudad}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" aria-hidden />
            <dd>{evento.fechaTexto}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" aria-hidden />
            <dd>{evento.horario}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onRegistrar}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: ACENTO }}
          >
            <Ticket className="h-4 w-4" aria-hidden />
            Registrarme
          </button>
          <a
            href={eventoHref(evento.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Ya tengo boleto
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}

function Stepper({ paso }: { paso: Paso }) {
  return (
    <ol className="flex items-center gap-1 overflow-x-auto text-xs sm:gap-2">
      {PASOS.map((p, i) => {
        const done = p.n < paso;
        const on = p.n === paso;
        return (
          <li key={p.n} className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                on
                  ? "text-white"
                  : done
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-400"
              }`}
              style={on ? { backgroundColor: ACENTO } : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : p.n}
            </span>
            <span
              className={`font-medium ${
                on ? "text-gray-900" : done ? "text-emerald-700" : "text-gray-400"
              }`}
            >
              {p.label}
            </span>
            {i < PASOS.length - 1 ? (
              <span className="mx-1 h-px w-4 bg-gray-200 sm:w-8" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/** The single-use boleto offer, minted by Taquilla for the chosen wallet
 *  with the broker form in the query; remounted (key) per attempt/wallet. */
function BoletoQr({
  wallet,
  rol,
  evento,
  nombre,
  organizacion,
  lema,
  onSettled,
  onRetry,
}: {
  wallet: PersonalWallet;
  rol: Rol;
  evento: Evento;
  nombre: string;
  organizacion: string;
  lema: string;
  onSettled: (e: Entrega) => void;
  onRetry: () => void;
}) {
  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set(
      "credential",
      rol === "asistente" ? "eventos-asistente" : "eventos-patrocinador",
    );
    p.set("evento", evento.slug);
    if (rol === "asistente") p.set("nombre", nombre);
    else {
      p.set("organizacion", organizacion);
      p.set("lema", lema);
    }
    return `${walletQuery(wallet)}&${p.toString()}`;
  }, [wallet, rol, evento.slug, nombre, organizacion, lema]);

  const { mintResult, qr, result } = useMintedQr<Entrega>({
    mint: async () => {
      const res = await fetch(
        withBase(`/api/demo/${TAQUILLA.serviceId}?${query}`),
      );
      if (!res.ok) return null;
      const body = (await res.json()) as {
        kind?: string;
        url?: string | null;
        fallback?: boolean;
        credentialExchangeId?: string | null;
        issuanceSessionId?: string | null;
      };
      // A plain connection invitation (admin API unreachable) is not an
      // offer: the visitor would connect and receive nothing.
      if (
        !body?.url ||
        body.kind === "unsupported" ||
        body.kind === "invitation" ||
        body.fallback
      )
        return null;
      const m: MintResult = {
        url: body.url,
        id: body.credentialExchangeId ?? body.issuanceSessionId ?? null,
        rail: body.kind?.startsWith("oid4vc") ? "oid4vc" : "didcomm",
      };
      return m;
    },
    poll: async (m) => {
      if (!m.id) return null;
      const res = await fetch(
        withBase(
          `/api/demo/${TAQUILLA.serviceId}/credential/${encodeURIComponent(m.id)}?rail=${m.rail}`,
        ),
      );
      if (!res.ok) return null;
      const body = (await res.json()) as { done?: boolean; declined?: boolean };
      if (body.done) return "entregado";
      if (body.declined) return "rechazado";
      return null;
    },
  });

  useEffect(() => {
    if (result) onSettled(result);
    // onSettled is a stable parent setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (mintResult === undefined) return <QrEstado estado="cargando" onRetry={onRetry} />;
  if (mintResult === null) return <QrEstado estado="no-disponible" onRetry={onRetry} />;
  return (
    <QrPanel
      qr={qr}
      url={mintResult.url}
      wallet={wallet}
      alt="Código QR de tu boleto"
      hint={`Escanea con ${wallet.name}: tu wallet verifica que Taquilla es un emisor de confianza y guarda tu boleto.`}
    />
  );
}

export default function TaquillaSite({ wallets }: { wallets: PersonalWallet[] }) {
  const [eventoSlug, setEventoSlug] = useState<EventoSlug | null>(null);
  const [rol, setRol] = useState<Rol | null>(null);
  const [nombre, setNombre] = useState("");
  const [organizacion, setOrganizacion] = useState("");
  const [lema, setLema] = useState("");
  const [paso, setPaso] = useState<Paso>(1);
  const [pagando, setPagando] = useState(false);
  const [walletId, setWalletId] = useState<string | undefined>(wallets[0]?.id);
  const [intento, setIntento] = useState(0);
  const [entrega, setEntrega] = useState<Entrega | null>(null);

  // Deep link a wallet (?wallet=<id>), the playground's own convention.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("wallet");
    if (id && wallets.some((w) => w.id === id)) setWalletId(id);
  }, [wallets]);

  const evento = eventoSlug ? EVENTOS[eventoSlug] : null;
  const wallet = wallets.find((w) => w.id === walletId) ?? wallets[0];
  const previewEvento = evento ?? EVENTOS[EVENTOS_ORDEN[0]];
  const previewRol: Rol = rol ?? "asistente";

  const elegirEvento = (slug: EventoSlug) => {
    setEventoSlug(slug);
    setRol(null);
    setPaso(1);
    setEntrega(null);
    document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" });
  };
  const datosListos =
    rol === "asistente"
      ? nombre.trim().length >= 2
      : organizacion.trim().length >= 2;
  const pagar = () => {
    setPagando(true);
    window.setTimeout(() => {
      setPagando(false);
      setPaso(5);
    }, 1400);
  };
  const reiniciar = () => {
    setEventoSlug(null);
    setRol(null);
    setNombre("");
    setOrganizacion("");
    setLema("");
    setPaso(1);
    setEntrega(null);
    setIntento(0);
  };
  const precio = rol === "patrocinador" ? "USD 1.500,00" : "USD 25,00";

  return (
    <div className="min-h-screen bg-[#f7f6fb] text-gray-900">
      <LangEs />
      <Header />
      <Hero />

      {/* Próximos eventos */}
      <section id="eventos" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="reveal flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              Próximos eventos
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Una gira, tres ciudades. Elige la tuya.
            </h2>
          </div>
          <p className="max-w-md text-sm text-gray-500">
            {EVENTO_TITULO}: {EVENTO_SUBTITULO}. Organiza {ORGANIZADOR}.
          </p>
        </div>
        <div className="reveal-stagger mt-8 grid gap-6 md:grid-cols-3">
          {EVENTOS_ORDEN.map((slug) => (
            <TarjetaEvento
              key={slug}
              evento={EVENTOS[slug]}
              onRegistrar={() => elegirEvento(slug)}
            />
          ))}
        </div>
      </section>

      {/* Registro */}
      <section id="registro" className="border-y border-gray-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="reveal">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              Registro
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Consigue tu boleto en cinco pasos
            </h2>
          </div>
          {/* minmax(0, …) tracks: the boleto preview's max-content (its
              untruncated subtitle) must never widen the column past the page */}
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="min-w-0 rounded-3xl border border-gray-200 bg-[#fbfaff] p-5 shadow-sm sm:p-7">
              <Stepper paso={paso} />

              {/* Paso 1: el evento */}
              {paso === 1 ? (
                <div className="mt-6">
                  <h3 className="text-lg font-bold">¿A qué evento vas?</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {EVENTOS_ORDEN.map((slug) => {
                      const e = EVENTOS[slug];
                      const on = slug === eventoSlug;
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => {
                            setEventoSlug(slug);
                            setEntrega(null);
                          }}
                          aria-pressed={on}
                          className={`relative overflow-hidden rounded-2xl border p-4 text-left transition ${
                            on
                              ? "border-transparent bg-white shadow-md"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          style={on ? { boxShadow: `0 0 0 2px ${ACENTO}` } : undefined}
                        >
                          <ArteEvento
                            arte={e.arte}
                            className="absolute -right-4 bottom-0 h-16 w-auto text-violet-200"
                          />
                          <div className="relative">
                            <div className="text-lg font-bold">{e.pais}</div>
                            <div className="text-xs text-gray-500">{e.fechaTexto}</div>
                            <div className="text-xs text-gray-500">{e.horario}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {evento ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <a
                        href={eventoHref(evento.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                          <BadgeCheck className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            ¿Ya tienes tu boleto?
                          </span>
                          <span className="block text-xs text-gray-500">
                            Ir a la página del evento de {evento.pais}
                          </span>
                        </span>
                        <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                      </a>
                      <button
                        type="button"
                        onClick={() => setPaso(2)}
                        className="flex items-center gap-3 rounded-2xl p-4 text-left text-white transition hover:opacity-90"
                        style={{ backgroundColor: ACENTO }}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                          <Ticket className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            Registrarme ahora
                          </span>
                          <span className="block text-xs text-white/80">
                            Asistente o patrocinador, en un minuto
                          </span>
                        </span>
                        <ArrowRight className="ml-auto h-4 w-4 shrink-0" aria-hidden />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-gray-500">
                      Elige una ciudad para continuar.
                    </p>
                  )}
                </div>
              ) : null}

              {/* Paso 2: el perfil */}
              {paso === 2 && evento ? (
                <div className="mt-6">
                  <h3 className="text-lg font-bold">¿Cómo participas?</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        {
                          rol: "asistente" as Rol,
                          Icon: User,
                          titulo: "Asistente",
                          detalle:
                            "Tu boleto personal: acceso al evento y a tu espacio personal en la página del evento.",
                        },
                        {
                          rol: "patrocinador" as Rol,
                          Icon: Building2,
                          titulo: "Patrocinador",
                          detalle:
                            "La credencial de tu organización: acceso al espacio de patrocinador y a la coordinación de tu stand.",
                        },
                      ] as const
                    ).map((o) => {
                      const on = rol === o.rol;
                      return (
                        <button
                          key={o.rol}
                          type="button"
                          onClick={() => setRol(o.rol)}
                          aria-pressed={on}
                          className={`rounded-2xl border p-5 text-left transition ${
                            on
                              ? "border-transparent bg-white shadow-md"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                          style={on ? { boxShadow: `0 0 0 2px ${ACENTO}` } : undefined}
                        >
                          <span
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                              o.rol === "patrocinador"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-violet-50 text-violet-700"
                            }`}
                          >
                            <o.Icon className="h-5 w-5" aria-hidden />
                          </span>
                          <span className="mt-3 block text-base font-bold">{o.titulo}</span>
                          <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                            {o.detalle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!rol}
                      onClick={() => setPaso(3)}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:opacity-40"
                      style={{ backgroundColor: ACENTO }}
                    >
                      Continuar
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaso(1)}
                      className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Paso 3: los datos */}
              {paso === 3 && evento && rol ? (
                <div className="mt-6">
                  <h3 className="text-lg font-bold">
                    {rol === "asistente"
                      ? "¿Cómo quieres aparecer en tu boleto?"
                      : "¿Qué organización patrocina?"}
                  </h3>
                  {rol === "asistente" ? (
                    <label className="mt-4 block">
                      <span className="text-sm font-medium text-gray-700">Tu nombre</span>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        maxLength={40}
                        autoComplete="name"
                        placeholder="Nombre y apellido"
                        className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                      />
                      <span className="mt-1.5 block text-xs text-gray-500">
                        Así aparecerá en tu boleto y en tu credencial de acceso.
                      </span>
                    </label>
                  ) : (
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {PATROCINADORES.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setOrganizacion(p.nombre);
                              setLema(p.lema);
                            }}
                            className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-violet-300 hover:text-violet-700"
                          >
                            {p.nombre}
                          </button>
                        ))}
                      </div>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">Organización</span>
                        <input
                          type="text"
                          value={organizacion}
                          onChange={(e) => setOrganizacion(e.target.value)}
                          maxLength={60}
                          autoComplete="organization"
                          placeholder="Nombre de la organización"
                          className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm font-medium text-gray-700">
                          Lema <span className="font-normal text-gray-400">(opcional)</span>
                        </span>
                        <input
                          type="text"
                          value={lema}
                          onChange={(e) => setLema(e.target.value)}
                          maxLength={80}
                          placeholder="Una frase corta que acompañe su marca"
                          className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                        />
                      </label>
                    </div>
                  )}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={!datosListos}
                      onClick={() => setPaso(4)}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:opacity-40"
                      style={{ backgroundColor: ACENTO }}
                    >
                      Ir al pago
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaso(2)}
                      className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Paso 4: el pago (simulado) */}
              {paso === 4 && evento && rol ? (
                <div className="mt-6">
                  <h3 className="text-lg font-bold">Pago</h3>
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-4 text-sm">
                      <div>
                        <div className="font-semibold">
                          {rol === "asistente" ? "Boleto de asistente" : "Paquete de patrocinador"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {EVENTO_TITULO} · {evento.pais} · {evento.fechaTexto}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rol === "asistente" ? nombre : organizacion}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{precio}</div>
                        <div className="text-[11px] text-gray-400">IVA incluido</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                    Pago simulado: es una demostración, no se realiza ningún cobro y no
                    necesitas introducir una tarjeta real.
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_100px]">
                    <label className="block">
                      <span className="text-xs font-medium text-gray-600">Número de tarjeta</span>
                      <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
                        <CreditCard className="h-4 w-4" aria-hidden />
                        4242 4242 4242 4242
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-600">Vence</span>
                      <div className="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
                        12/28
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-gray-600">CVC</span>
                      <div className="mt-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
                        123
                      </div>
                    </label>
                  </div>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      disabled={pagando}
                      onClick={pagar}
                      className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition enabled:hover:opacity-90 disabled:opacity-60"
                      style={{ backgroundColor: ACENTO }}
                    >
                      {pagando ? (
                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Lock className="h-4 w-4" aria-hidden />
                      )}
                      {pagando ? "Procesando…" : `Pagar ${precio}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaso(3)}
                      className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
                    >
                      Volver
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Paso 5: el boleto en tu wallet */}
              {paso === 5 && evento && rol && wallet ? (
                <div className="mt-6">
                  {entrega === "entregado" ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white pot-verified">
                        <Check className="h-7 w-7" aria-hidden />
                      </span>
                      <h3 className="mt-4 text-xl font-bold text-emerald-900">
                        ¡Tu boleto está en tu wallet!
                      </h3>
                      <p className="mx-auto mt-2 max-w-sm text-sm text-emerald-800/80">
                        Preséntalo en la página del evento para entrar a tu espacio
                        {rol === "asistente" ? " personal" : " de patrocinador"} y, el día
                        del evento, en el registro.
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <a
                          href={eventoHref(evento.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Ir a la página del evento
                          <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                        <button
                          type="button"
                          onClick={reiniciar}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
                        >
                          <RefreshCw className="h-4 w-4" aria-hidden />
                          Registrar otro boleto
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
                        Pago confirmado. Ahora recibe tu boleto en la wallet de tu elección.
                      </div>
                      <h3 className="mt-6 flex items-center gap-2 text-lg font-bold">
                        <Wallet className="h-5 w-5 text-violet-600" aria-hidden />
                        1. Elige e instala tu wallet
                      </h3>
                      <div className="mt-3">
                        <WalletPicker
                          wallets={wallets}
                          selectedId={wallet.id}
                          onSelect={(id) => {
                            setWalletId(id);
                            setEntrega(null);
                          }}
                          acento={ACENTO}
                        />
                      </div>
                      <h3 className="mt-6 flex items-center gap-2 text-lg font-bold">
                        <QrCode className="h-5 w-5 text-violet-600" aria-hidden />
                        2. Escanea y guarda tu boleto
                      </h3>
                      <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-5">
                        {entrega === "rechazado" ? (
                          <div className="text-center">
                            <XCircle className="mx-auto h-8 w-8 text-gray-400" aria-hidden />
                            <p className="mt-2 text-sm font-semibold text-gray-700">
                              Rechazaste la oferta en tu wallet.
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Cada código QR es de un solo uso: genera uno nuevo para volver a intentarlo.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setEntrega(null);
                                setIntento((n) => n + 1);
                              }}
                              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-400"
                            >
                              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                              Generar un nuevo QR
                            </button>
                          </div>
                        ) : (
                          <BoletoQr
                            key={`${wallet.id}-${intento}`}
                            wallet={wallet}
                            rol={rol}
                            evento={evento}
                            nombre={nombre}
                            organizacion={organizacion}
                            lema={lema}
                            onSettled={setEntrega}
                            onRetry={() => setIntento((n) => n + 1)}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* Vista previa en vivo */}
            <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Vista previa de tu boleto
              </p>
              <CredencialPreview
                rol={previewRol}
                evento={previewEvento}
                nombre={nombre}
                organizacion={organizacion}
                lema={lema}
              />
              <p className="mt-4 text-xs leading-relaxed text-gray-500">
                Tu boleto es una credencial verificable emitida por {TAQUILLA.etiqueta}. Tu
                wallet comprueba, antes de aceptarla, que Taquilla es un emisor de confianza
                registrado en la red Verana; el evento comprueba lo mismo al verificarla.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="reveal">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Cómo funciona
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Un boleto que nadie puede falsificar
          </h2>
        </div>
        <div className="reveal-stagger mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              Icon: Ticket,
              titulo: "Regístrate y paga",
              detalle:
                "Elige tu evento, dinos cómo quieres aparecer en el boleto y paga. En esta demostración el pago es simulado.",
            },
            {
              Icon: Wallet,
              titulo: "Recibe tu boleto en tu wallet",
              detalle:
                "Escanea el código QR con la wallet que prefieras. Antes de guardar el boleto, tu wallet verifica que Taquilla es un emisor de confianza.",
            },
            {
              Icon: ScanLine,
              titulo: "Preséntalo en el evento",
              detalle:
                "En la página del evento y en la puerta, presentas tu boleto desde tu wallet. El evento lo verifica en segundos: sin listas, sin capturas de pantalla.",
            },
          ].map((s, i) => (
            <div
              key={s.titulo}
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <s.Icon className="h-6 w-6" aria-hidden />
              </span>
              <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Paso {i + 1}
              </div>
              <h3 className="mt-1 text-lg font-bold">{s.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.detalle}</p>
            </div>
          ))}
        </div>
        <div className="reveal mt-8 rounded-3xl bg-gray-950 p-6 text-white sm:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="text-xl font-bold">La agenda, en las tres ciudades</h3>
              <p className="mt-1 text-sm text-white/70">
                {EVENTO_SUBTITULO}. Misma agenda, {AGENDA.length} bloques, de {AGENDA[0].hora} a
                11:00 a.m.
              </p>
            </div>
            <PatrocinadoresStrip blanco escala={0.9} className="opacity-90" />
          </div>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {AGENDA.map((a) => (
              <li key={a.hora} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="text-xs font-semibold text-violet-300">{a.hora}</div>
                <div className="mt-1 text-sm font-semibold leading-snug">{a.titulo}</div>
                {a.a_cargo ? (
                  <div className="mt-2 text-[11px] text-white/60">{a.a_cargo}</div>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Confianza */}
      <section id="confianza" className="border-t border-gray-200/70 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="reveal">
            <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
              Confianza
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Un sitio verificable, no solo un candado
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Taquilla es un servicio verificable en la red Verana: su identidad, la
              organización que lo opera y su permiso para emitir boletos están
              registrados públicamente y cualquier wallet los comprueba antes de aceptar
              una credencial. Esta tarjeta se resuelve en vivo contra la red de pruebas.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-gray-700">
              {[
                "Emisor registrado: solo Taquilla puede emitir estos boletos.",
                "Verificadores registrados: cada evento se identifica ante tu wallet.",
                "Nada que reenviar: el boleto solo se presenta desde tu wallet.",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="reveal">
            <LiveTrustCard serviceId={TAQUILLA.serviceId} />
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200/70 bg-[#f7f6fb]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Marca className="text-gray-700" />
            <p className="max-w-md text-xs leading-relaxed text-gray-500">
              {TAQUILLA.etiqueta}: boletería verificable sobre la red de pruebas de
              Verana. Organiza los eventos: {ORGANIZADOR}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <VeranaBadge />
            <a
              href={withBase("/")}
              className="inline-flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-700"
            >
              Verana Playground
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
