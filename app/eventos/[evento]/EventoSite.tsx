"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  Clock,
  ExternalLink,
  Info,
  MapPin,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Ticket,
  User,
} from "lucide-react";
import { withBase } from "../../lib/base-path";
import type { PersonalWallet } from "../../lib/wallets";
import {
  AGENDA,
  EVENTO_SUBTITULO,
  EVENTO_TITULO,
  ORGANIZADOR,
  PATROCINADORES,
  TAQUILLA,
  type Evento,
  type Rol,
} from "../../lib/eventos";
import LiveTrustCard from "../../components/LiveTrustCard";
import { ArteEvento } from "../arte";
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
} from "../ui";

// One landing per stop of the tour, styled as the event's own site. The
// gate at the bottom is a live presentation request from the event's
// vs-agent (/api/eventos-login): the attendee presents the boleto to open
// the personal space, the sponsor its credential to open the sponsor space.
// The decision comes from /api/eventos-login/[id]: issued by Taquilla for
// THIS stop -> in; for another stop -> "otro evento"; anything else -> out.

type Claim = { name: string; value: string };

type LoginResult = {
  done: boolean;
  verified?: boolean;
  claims?: Claim[];
  decision?: "acceso" | "otro-evento" | "denegado";
  nombre?: string;
  organizacion?: string;
  lema?: string;
  paisCredencial?: string;
  trustVerdict?: string | null;
  trustNote?: string | null;
};

const taquillaHref = withBase("/eventos");

function Header({ evento }: { evento: Evento }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060f3a]/85 text-white backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <a href="#inicio" className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- cast logo */}
          <img
            src={withBase(`/images/eventos/cast/evento-${evento.slug}.svg`)}
            alt=""
            aria-hidden
            width={34}
            height={34}
            className="h-[34px] w-[34px] rounded-lg"
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold leading-tight sm:text-base">
              {EVENTO_TITULO}
            </span>
            <span className="block text-[11px] text-white/60">
              {evento.pais} · {evento.fechaTexto}
            </span>
          </span>
        </a>
        <ul className="ml-6 hidden items-center gap-6 text-sm text-white/70 lg:flex">
          <li>
            <a href="#agenda" className="transition hover:text-white">
              Agenda
            </a>
          </li>
          <li>
            <a href="#patrocinadores" className="transition hover:text-white">
              Patrocinadores
            </a>
          </li>
          <li>
            <a href="#acceso" className="transition hover:text-white">
              Acceso
            </a>
          </li>
        </ul>
        <a
          href="#acceso"
          className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-gray-950 transition hover:opacity-90"
          style={{ backgroundColor: evento.acento }}
        >
          <Ticket className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Entrar con mi boleto</span>
          <span className="sm:hidden">Entrar</span>
        </a>
      </nav>
    </header>
  );
}

function Hero({ evento }: { evento: Evento }) {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(135deg, #060f3a 0%, #0b1f5c 45%, #1e40af 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-0 h-[30rem] w-[30rem] rounded-full blur-3xl"
        style={{ backgroundColor: evento.acento, opacity: 0.22 }}
      />
      <ArteEvento
        arte={evento.arte}
        className="pointer-events-none absolute bottom-0 right-0 h-auto w-[62%] max-w-[560px] text-sky-200/35 sm:w-[48%] lg:w-[40%] lg:text-sky-200/55"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="reveal max-w-2xl">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: evento.acento }}
              aria-hidden
            />
            Gira Centroamérica 2026 · {evento.pais}
          </span>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {EVENTO_TITULO}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/80 sm:text-xl">
            {EVENTO_SUBTITULO}
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            {[
              { Icon: Calendar, t: evento.fechaTexto },
              { Icon: Clock, t: evento.horario },
              { Icon: MapPin, t: evento.ciudad },
            ].map((c) => (
              <span
                key={c.t}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/15"
              >
                <c.Icon className="h-4 w-4" aria-hidden style={{ color: evento.acento }} />
                {c.t}
              </span>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#acceso"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-gray-950 transition hover:opacity-90"
              style={{ backgroundColor: evento.acento }}
            >
              <User className="h-4 w-4" aria-hidden />
              Entrar como asistente
            </a>
            <a
              href="#acceso"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Entrar como patrocinador
            </a>
          </div>
          <a
            href={taquillaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm text-white/70 underline-offset-4 transition hover:text-white hover:underline"
          >
            ¿Aún no tienes boleto? Consíguelo en Taquilla
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Organiza
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element -- partner brand asset */}
              <img
                src={withBase("/images/eventos/intexus-white.png")}
                alt={ORGANIZADOR}
                className="mt-1.5 h-6 w-auto"
              />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                Patrocinan
              </div>
              <PatrocinadoresStrip blanco className="mt-1.5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** The gate: a live presentation request from this event's verifier for
 *  the chosen role, remounted (key) per attempt/wallet/role. */
function AccesoQr({
  evento,
  rol,
  wallet,
  onResult,
  onRetry,
}: {
  evento: Evento;
  rol: Rol;
  wallet: PersonalWallet;
  onResult: (r: LoginResult) => void;
  onRetry: () => void;
}) {
  const { mintResult, qr, result } = useMintedQr<LoginResult>({
    mint: async () => {
      const res = await fetch(
        withBase(
          `/api/eventos-login?evento=${evento.slug}&rol=${rol}&${walletQuery(wallet)}`,
        ),
      );
      if (!res.ok) return null;
      const body = (await res.json()) as {
        url?: string;
        id?: string | null;
        rail?: string;
      };
      if (!body?.url) return null;
      const m: MintResult = {
        url: body.url,
        id: body.id ?? null,
        rail: body.rail === "oid4vc" ? "oid4vc" : "didcomm",
      };
      return m;
    },
    poll: async (m) => {
      if (!m.id) return null;
      const res = await fetch(
        withBase(
          `/api/eventos-login/${encodeURIComponent(m.id)}?rail=${m.rail}&evento=${evento.slug}&rol=${rol}`,
        ),
      );
      if (!res.ok) return null;
      const body = (await res.json()) as LoginResult;
      return body?.done ? body : null;
    },
  });

  useEffect(() => {
    if (result) onResult(result);
    // onResult is a stable parent setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (mintResult === undefined) return <QrEstado estado="cargando" onRetry={onRetry} />;
  if (mintResult === null) return <QrEstado estado="no-disponible" onRetry={onRetry} />;
  return (
    <QrPanel
      qr={qr}
      url={mintResult.url}
      wallet={wallet}
      alt={`Código QR de acceso al evento de ${evento.pais}`}
      hint={
        rol === "asistente"
          ? "Presenta tu boleto de asistente para acceder a tu espacio personal y preparar tu asistencia al evento."
          : "Presenta tu credencial de patrocinador para acceder a tu espacio de patrocinador y preparar tu stand."
      }
    />
  );
}

function EspacioAsistente({ evento, result }: { evento: Evento; result: LoginResult }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 text-lg font-bold text-emerald-900">
          <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
          Te damos la bienvenida{result.nombre ? `, ${result.nombre}` : ""}
        </p>
        <p className="mt-1 text-sm text-emerald-800/80">
          Boleto verificado: emitido por {TAQUILLA.etiqueta} para el evento de {evento.pais}.
          Este es tu espacio personal.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CredencialPreview rol="asistente" evento={evento} nombre={result.nombre} />
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h4 className="font-bold text-gray-900">Prepara tu asistencia</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-gray-700">
            {[
              `Llega 15 minutos antes: el registro abre a las ${AGENDA[0].hora} a.m.`,
              "Trae tu wallet con el boleto: es tu acreditación en la puerta.",
              `Sede: ${evento.sede}.`,
              "Tu nombre aparecerá en tu credencial de acceso y en la lista de networking.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <a
            href="#agenda"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline"
          >
            Ver tu agenda del día
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}

function EspacioPatrocinador({ evento, result }: { evento: Evento; result: LoginResult }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="flex items-center gap-2 text-lg font-bold text-emerald-900">
          <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
          Bienvenidos{result.organizacion ? `, ${result.organizacion}` : ""}
        </p>
        <p className="mt-1 text-sm text-emerald-800/80">
          Credencial de patrocinador verificada para el evento de {evento.pais}. Este es
          el espacio de su organización.
        </p>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CredencialPreview
          rol="patrocinador"
          evento={evento}
          organizacion={result.organizacion}
          lema={result.lema}
        />
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h4 className="font-bold text-gray-900">Prepara su stand</h4>
          <ul className="mt-3 space-y-2.5 text-sm text-gray-700">
            {[
              "Stand confirmado en la zona de patrocinadores, junto al espacio de networking.",
              "Montaje: la víspera del evento (horario por confirmar con la organización).",
              "Envíe su logo en alta resolución y el material para el stand.",
              "Confirme las acreditaciones de su equipo: cada persona recibe su propio boleto.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
          <a
            href={taquillaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline"
          >
            Boletos para su equipo en Taquilla
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}

function Rechazo({ evento, result }: { evento: Evento; result: LoginResult }) {
  if (result.decision === "otro-evento") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
        <p className="flex items-center gap-2 font-bold">
          <Info className="h-5 w-5 shrink-0" aria-hidden />
          Este boleto es para otra ciudad de la gira
        </p>
        <p className="mt-1 text-sm text-amber-800/90">
          Presentaste un boleto válido de Taquilla para el evento de{" "}
          {result.paisCredencial ?? "otra ciudad"}. Para entrar aquí necesitas el boleto
          de {evento.pais}: consíguelo en Taquilla o presenta el correcto.
        </p>
      </div>
    );
  }
  const verdict = result.trustVerdict;
  const razon =
    verdict === "RESOLVER_UNAVAILABLE"
      ? "No pudimos alcanzar el resolver de confianza de la red para verificar tu credencial: inténtalo de nuevo en un momento."
      : verdict === "UNTRUSTED"
        ? "Tu credencial fue emitida por una organización que no es un servicio verificable de confianza."
        : verdict === "TRUSTED_NOT_AUTHORIZED"
          ? "Tu credencial fue emitida por una organización que no está autorizada a emitir boletos."
          : `Tu credencial no fue emitida por ${TAQUILLA.etiqueta}: no es un boleto válido para este evento.`;
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
      <p className="flex items-center gap-2 font-bold">
        <ShieldX className="h-5 w-5 shrink-0" aria-hidden />
        Acceso denegado
      </p>
      <p className="mt-1 text-sm text-red-700/90">{razon}</p>
      {result.trustNote ? (
        <p className="mt-1.5 text-xs text-red-500/80">{result.trustNote}</p>
      ) : null}
    </div>
  );
}

export default function EventoSite({
  evento,
  wallets,
}: {
  evento: Evento;
  wallets: PersonalWallet[];
}) {
  const [rol, setRol] = useState<Rol | null>(null);
  const [walletId, setWalletId] = useState<string | undefined>(wallets[0]?.id);
  const [intento, setIntento] = useState(0);
  const [result, setResult] = useState<LoginResult | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("wallet");
    if (id && wallets.some((w) => w.id === id)) setWalletId(id);
  }, [wallets]);

  const wallet = wallets.find((w) => w.id === walletId) ?? wallets[0];
  const elegirRol = (r: Rol) => {
    setRol(r);
    setResult(null);
    setIntento((n) => n + 1);
  };
  const reiniciar = () => {
    setResult(null);
    setIntento((n) => n + 1);
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-gray-900">
      <LangEs />
      <Header evento={evento} />
      <Hero evento={evento} />

      {/* Sobre el evento */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="reveal">
          <p
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: evento.acento }}
          >
            El evento
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Una mañana para ver el contenido empresarial de otra manera
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">{evento.descripcion}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Casos reales de gestión inteligente de contenidos y procesos con Alfresco.",
              "Biometría integrada a los procesos: identidad verificada sin fricción.",
              "IA aplicada a la captura, clasificación y automatización documental.",
              "Demostraciones en vivo en los stands de los patrocinadores.",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-gray-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden style={{ color: evento.acento }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Información práctica
          </h3>
          <dl className="mt-4 space-y-4 text-sm">
            {[
              { Icon: Calendar, k: "Fecha", v: evento.fechaTexto },
              { Icon: Clock, k: "Horario", v: evento.horario },
              { Icon: MapPin, k: "Sede", v: evento.sede },
              { Icon: Ticket, k: "Ingreso", v: `Con tu boleto verificable de ${TAQUILLA.etiqueta}, desde tu wallet` },
            ].map((r) => (
              <div key={r.k} className="flex items-start gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: evento.acentoSuave }}
                >
                  <r.Icon className="h-4 w-4 text-gray-700" aria-hidden />
                </span>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {r.k}
                  </dt>
                  <dd className="text-gray-800">{r.v}</dd>
                </div>
              </div>
            ))}
          </dl>
          <a
            href="#acceso"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-950 transition hover:opacity-90"
            style={{ backgroundColor: evento.acento }}
          >
            Entrar con mi boleto
            <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>

      {/* Agenda */}
      <section id="agenda" className="border-y border-gray-200/70 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="reveal">
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: evento.acento }}>
              Agenda
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {evento.dia} de {evento.mes}, {evento.horario}
            </h2>
          </div>
          <ol className="reveal-stagger mt-8 space-y-3">
            {AGENDA.map((a) => (
              <li
                key={a.hora}
                className="grid gap-2 rounded-2xl border border-gray-200 bg-[#fbfcff] p-5 sm:grid-cols-[88px_1fr_auto] sm:items-center sm:gap-6"
              >
                <div className="text-lg font-bold" style={{ color: evento.acento }}>
                  {a.hora}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{a.titulo}</div>
                  <div className="mt-0.5 text-sm text-gray-600">{a.detalle}</div>
                </div>
                {a.a_cargo ? (
                  <span className="justify-self-start rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 sm:justify-self-end">
                    {a.a_cargo}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Patrocinadores */}
      <section id="patrocinadores" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="reveal">
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: evento.acento }}>
            Patrocinadores y aliados
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Las marcas detrás de la gira
          </h2>
        </div>
        <div className="reveal-stagger mt-8 grid gap-5 md:grid-cols-3">
          {PATROCINADORES.map((p) => (
            <div
              key={p.id}
              className="flex flex-col items-start rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-12 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- partner brand asset */}
                <img
                  src={withBase(p.logo)}
                  alt={p.nombre}
                  style={{ height: Math.round(p.alto * 1.5) }}
                  className="w-auto object-contain"
                />
              </div>
              <div className="mt-4 text-lg font-bold">{p.nombre}</div>
              {p.lema ? <div className="text-sm text-gray-500">{p.lema}</div> : null}
              <span className="mt-4 rounded-full px-3 py-1 text-xs font-semibold text-gray-800" style={{ backgroundColor: evento.acentoSuave }}>
                {p.id === "intexus" ? "Organizador y patrocinador" : "Patrocinador"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Acceso con el boleto */}
      <section id="acceso" className="bg-gray-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="reveal max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: evento.acento }}>
              Acceso
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Tu espacio en el evento
            </h2>
            <p className="mt-3 text-base text-white/70">
              Presenta tu boleto desde tu wallet. El evento verifica en segundos que lo
              emitió {TAQUILLA.etiqueta} para {evento.pais} y abre tu espacio.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  rol: "asistente" as Rol,
                  Icon: User,
                  titulo: "Entrar como asistente",
                  detalle: "Con tu boleto de asistente: tu espacio personal y tu agenda.",
                },
                {
                  rol: "patrocinador" as Rol,
                  Icon: Building2,
                  titulo: "Entrar como patrocinador",
                  detalle: "Con la credencial de tu organización: el espacio de patrocinador y tu stand.",
                },
              ] as const
            ).map((o) => {
              const on = rol === o.rol;
              return (
                <button
                  key={o.rol}
                  type="button"
                  onClick={() => elegirRol(o.rol)}
                  aria-pressed={on}
                  className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition ${
                    on ? "border-transparent bg-white text-gray-900 shadow-xl" : "border-white/15 bg-white/5 hover:bg-white/10"
                  }`}
                  style={on ? { boxShadow: `0 0 0 2px ${evento.acento}` } : undefined}
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${on ? "" : "bg-white/10"}`}
                    style={on ? { backgroundColor: evento.acentoSuave } : undefined}
                  >
                    <o.Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-base font-bold">{o.titulo}</span>
                    <span className={`mt-1 block text-sm ${on ? "text-gray-600" : "text-white/60"}`}>
                      {o.detalle}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {rol && wallet ? (
            <div className="mt-6 rounded-3xl bg-white p-5 text-gray-900 shadow-2xl sm:p-7">
              {result?.done ? (
                <div className="space-y-5">
                  {result.decision === "acceso" ? (
                    rol === "asistente" ? (
                      <EspacioAsistente evento={evento} result={result} />
                    ) : (
                      <EspacioPatrocinador evento={evento} result={result} />
                    )
                  ) : (
                    <Rechazo evento={evento} result={result} />
                  )}
                  <button
                    type="button"
                    onClick={reiniciar}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-400"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    Presentar otra credencial
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <h3 className="font-bold">Tu wallet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      La misma wallet donde guardaste tu boleto. ¿Aún no lo tienes?{" "}
                      <a
                        href={taquillaHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-gray-900 underline-offset-4 hover:underline"
                      >
                        Consíguelo en Taquilla
                      </a>
                      .
                    </p>
                    <div className="mt-4">
                      <WalletPicker
                        wallets={wallets}
                        selectedId={wallet.id}
                        onSelect={(id) => {
                          setWalletId(id);
                          setResult(null);
                          setIntento((n) => n + 1);
                        }}
                        acento={evento.acento}
                      />
                    </div>
                  </div>
                  <div className="lg:w-72 lg:border-l lg:border-gray-200 lg:pl-8">
                    <h3 className="font-bold">
                      {rol === "asistente" ? "Presenta tu boleto" : "Presenta tu credencial"}
                    </h3>
                    <div className="mt-4">
                      <AccesoQr
                        key={`${rol}-${wallet.id}-${intento}`}
                        evento={evento}
                        rol={rol}
                        wallet={wallet}
                        onResult={setResult}
                        onRetry={() => setIntento((n) => n + 1)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* Sitio verificable */}
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="reveal">
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: evento.acento }}>
            Sitio verificable
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Tu wallet sabe que este evento existe
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            El servicio de este evento está registrado en la red Verana a nombre de{" "}
            {ORGANIZADOR}: cuando presentas tu boleto, tu wallet comprueba primero quién
            lo pide y te muestra el resultado. Esta tarjeta se resuelve en vivo contra la
            red de pruebas.
          </p>
          <p className="mt-3 flex items-start gap-2 text-sm text-gray-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            Ningún sitio que no esté registrado puede pedirte este boleto y hacerse pasar
            por el evento.
          </p>
        </div>
        <div className="reveal">
          <LiveTrustCard serviceId={evento.serviceId} />
        </div>
      </section>

      <footer className="border-t border-gray-200/70 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- partner brand asset */}
            <img src={withBase("/images/eventos/intexus.png")} alt={ORGANIZADOR} className="h-5 w-auto" />
            <span>
              {EVENTO_TITULO} · {evento.pais}
            </span>
          </div>
          <p>
            Organiza {ORGANIZADOR}. Boletos por {TAQUILLA.etiqueta}. Demostración sobre la red
            de pruebas de Verana.
          </p>
          <a
            href={withBase("/")}
            className="inline-flex items-center gap-1 text-gray-400 transition hover:text-gray-700"
          >
            Verana Playground
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>
      </footer>
    </div>
  );
}
