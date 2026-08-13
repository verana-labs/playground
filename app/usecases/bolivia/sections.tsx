import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock,
  FileText,
  IdCard,
  Landmark,
  Lock,
  Network,
  Phone,
  Scale,
  Search,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import { Chip, Container, Section } from "../../components/ui";
import { SubHeading, SubStepBlock, type StoryLabels } from "../story-blocks";
import { BOLIVIA_SCENES } from "./scenes";
import { BOLIVIA_ASSETS, CLOSING, DEMOS, ESTADO, JOURNEY, SOLUTION } from "./content";

// Renderizado de los cuatro capítulos del caso Bolivia. Instituciones
// reales con sus logos oficiales, siempre "(demo)" cuando actúan en la
// maqueta; ninguna persona con nombre. Página no listada (sin nav, sin
// sitemap, noindex): el enlace se comparte directamente.

/** Cadenas de la interfaz compartida, en español. */
export const LABELS_ES: StoryLabels = {
  story: "historia",
  handsOn: "hazlo usted",
  reproduce: "Reprodúzcalo",
  underHood: "Bajo el capó",
  diagramHint: "Toque un participante para ver las credenciales que presenta.",
  newInStep: "Nuevo en este paso:",
};

export const FOOTER_LABELS_ES = {
  continue: "Continuar:",
  explore: "Ver la demo en vivo (caso Verandia)",
};
export const EXPLORE_HREF = "/usecases/verandia/demos";

/** Emblema generado: escudo sobre la tricolor. Sin marca estatal real -
 *  es el emblema del caso de uso, no un símbolo oficial. */
export function BoliviaEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Emblema del caso Bolivia">
      <defs>
        <linearGradient id="blg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c8102e" />
          <stop offset="50%" stopColor="#f4c500" />
          <stop offset="100%" stopColor="#007a33" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="14" fill="url(#blg)" />
      <path
        d="M32 14l13 5v12c0 8.6-5.5 14.9-13 19-7.5-4.1-13-10.4-13-19V19l13-5z"
        fill="rgba(255,255,255,0.92)"
      />
      <path
        d="M32 19l9 3.5V31c0 6-3.8 10.5-9 13.5-5.2-3-9-7.5-9-13.5v-8.5l9-3.5z"
        fill="none"
        stroke="#1d4ed8"
        strokeWidth="2"
      />
      <circle cx="32" cy="30" r="4.5" fill="#1d4ed8" />
      <path d="M32 36v6" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Logo({ src, alt, tall }: { src: string; alt: string; tall?: boolean }) {
  return (
    <span className="flex h-20 items-center justify-center rounded-xl bg-white px-4 ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element -- logos oficiales pre-optimizados en public/ */}
      <img
        src={src}
        alt={alt}
        className={`${tall ? "max-h-16" : "max-h-12"} w-auto max-w-full object-contain`}
      />
    </span>
  );
}

const PROBLEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  phone: Phone,
  lock: Lock,
  files: FileText,
  stamp: Stamp,
  queue: Clock,
};

// ---------------------------------------------------------------- Capítulo 1

export function Section1() {
  return (
    <>
      <Section>
        <Container className="max-w-5xl">
          <div className="flex flex-wrap items-center gap-3">
            <BoliviaEmblem className="h-[72px] w-[72px] shrink-0" />
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0f1222] sm:text-3xl">
                {ESTADO.name}
              </h2>
              <p className="text-lg text-gray-500">{ESTADO.tagline}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {ESTADO.meta.map((m) => (
              <span
                key={m}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {m}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-600">
            {ESTADO.intro}
          </p>
        </Container>
      </Section>

      {/* Las instituciones - fuentes de verdad, con sus logos reales */}
      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>Las instituciones: las fuentes de verdad</SubHeading>
          <div className="reveal-stagger mt-8 grid gap-4 md:grid-cols-3">
            {ESTADO.institutions.map((i) => (
              <div
                key={i.id}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <Logo src={i.logo} alt={`Logo de ${i.name}`} />
                <h3 className="mt-4 text-lg font-bold text-gray-900">{i.name}</h3>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {i.full}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                  {i.desc}
                </p>
                <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
                  Tuición: {i.tuicion}
                </p>
              </div>
            ))}
          </div>

          {/* AGETIC - la capa transversal, no un registro */}
          <div className="mt-4 flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <span className="flex h-20 shrink-0 items-center justify-center rounded-xl bg-white px-4 ring-1 ring-black/5 sm:w-56">
              {/* eslint-disable-next-line @next/next/no-img-element -- logo oficial pre-optimizado en public/ */}
              <img
                src={ESTADO.agetic.logo}
                alt="Logo de AGETIC"
                className="max-h-14 w-auto max-w-full object-contain"
              />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{ESTADO.agetic.name}</h3>
                <Chip>capa transversal, no un registro</Chip>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                {ESTADO.agetic.full}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {ESTADO.agetic.desc}
              </p>
              <p className="mt-2 text-xs text-gray-400">Tuición: {ESTADO.agetic.tuicion}</p>
            </div>
          </div>

          {/* SERECI - el matiz institucional */}
          <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white/60 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Stamp className="h-4 w-4 text-gray-400" aria-hidden />
              <h3 className="text-sm font-bold text-gray-700">{ESTADO.sereci.name}</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">{ESTADO.sereci.desc}</p>
          </div>

          {/* Marco normativo */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900">
              <Scale className="h-4 w-4 text-violet-600" aria-hidden />
              {ESTADO.normativa.title}
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ESTADO.normativa.items.map((n) => (
                <div key={n.norm} className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{n.norm}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{n.what}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">{ESTADO.normativa.note}</p>
          </div>
        </Container>
      </Section>

      {/* Los problemas */}
      <Section className="border-t border-gray-200">
        <Container className="max-w-5xl">
          <SubHeading>{ESTADO.problemsTitle}</SubHeading>
          <div className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ESTADO.problems.map((p) => {
              const Icon = PROBLEM_ICONS[p.icon] ?? FileText;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-bold text-gray-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{p.desc}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-8 max-w-3xl text-gray-600">{ESTADO.consequence}</p>
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 p-6">
            <p className="text-lg font-semibold text-red-700">{ESTADO.rootCause}</p>
          </div>
        </Container>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------- Capítulo 2

export function Section2() {
  return (
    <>
      <Section>
        <Container className="max-w-5xl">
          <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
            {SOLUTION.intro}
          </p>

          <div className="mt-12">
            <SubHeading>{SOLUTION.needsTitle}</SubHeading>
            <p className="mt-3 text-gray-600">{SOLUTION.needsIntro}</p>
            <div className="mt-6 space-y-3">
              {SOLUTION.needs.map((n) => (
                <Link
                  key={n.need}
                  href={`/usecases/bolivia/construccion#need-${n.need}`}
                  className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-300"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-bold text-violet-700">
                    {n.need}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-gray-900">{n.title}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {n.tag}
                      </span>
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-gray-600">
                      {n.desc}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-violet-600"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>{SOLUTION.pillarsTitle}</SubHeading>
          <p className="mt-3 max-w-3xl text-gray-600">{SOLUTION.pillarsIntro}</p>
          <div className="reveal-stagger mt-8 grid gap-4 md:grid-cols-3">
            {SOLUTION.pillars.map((p) => {
              const Icon =
                p.icon === "landmark" ? Landmark : p.icon === "badge" ? ShieldCheck : Network;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-bold text-gray-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{p.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Los ecosistemas */}
          <div className="mt-12">
            <SubHeading>Un ecosistema al que unirse, dos que crear</SubHeading>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Network className="h-5 w-5 text-violet-600" aria-hidden />
                  <h3 className="text-lg font-bold text-gray-900">
                    {SOLUTION.ecosystemJoin.name}
                  </h3>
                  <Chip tone="verified">unirse</Chip>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                    {SOLUTION.ecosystemJoin.label}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {SOLUTION.ecosystemJoin.about}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  <span className="font-semibold text-gray-700">¿Por qué? </span>
                  {SOLUTION.ecosystemJoin.why}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {SOLUTION.ecosystemsBuild.map((e) => {
                  const Icon = e.icon === "id" ? IdCard : Network;
                  return (
                    <div
                      key={e.name}
                      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="flex h-12 items-center rounded-lg bg-white px-3 ring-1 ring-black/5">
                          {/* eslint-disable-next-line @next/next/no-img-element -- logo oficial pre-optimizado en public/ */}
                          <img
                            src={e.logo}
                            alt={`Logo de ${e.operator}`}
                            className="max-h-8 w-auto object-contain"
                          />
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{e.name}</h3>
                        <Chip>crear</Chip>
                      </div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        {e.label} · gobernado por {e.operator}
                      </p>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                        {e.about}
                      </p>
                      <p className="mt-3 border-t border-gray-100 pt-3 text-sm leading-relaxed text-gray-500">
                        <span className="font-semibold text-gray-700">¿Por qué? </span>
                        {e.why}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-gray-500">
              {SOLUTION.bridge}
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------- Capítulo 3

export function Section3() {
  return (
    <Section>
      <Container className="max-w-5xl">
        <p className="max-w-3xl text-lg leading-relaxed text-gray-600">{JOURNEY.intro}</p>
        <div className="mt-12 space-y-16">
          {JOURNEY.needs.map((need) => (
            <div key={need.id} id={need.id} className="scroll-mt-24">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                  {need.n}
                </span>
                <SubHeading>{need.title}</SubHeading>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {need.tag}
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-gray-600">{need.intro}</p>
              <div className="mt-8 space-y-14 border-l-2 border-violet-100 pl-6 sm:pl-8">
                {need.steps.map((s) => (
                  <SubStepBlock key={s.id} sub={s} graph={BOLIVIA_SCENES} labels={LABELS_ES} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-14 max-w-3xl border-t border-gray-100 pt-8 text-gray-600">
          {JOURNEY.outro}
        </p>
      </Container>
    </Section>
  );
}

// ---------------------------------------------------------------- Capítulo 4

export function Section4() {
  return (
    <>
      <Section>
        <Container className="max-w-5xl">
          <p className="max-w-3xl text-lg leading-relaxed text-gray-600">{DEMOS.intro}</p>

          <div className="mt-10">
            <SubHeading>{DEMOS.liveTitle}</SubHeading>
            <div className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2">
              {DEMOS.liveItems.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-300"
                >
                  <span className="text-sm font-semibold text-gray-900">{d.label}</span>
                  <ArrowRight
                    className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-violet-600"
                    aria-hidden
                  />
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">{DEMOS.liveNote}</p>
          </div>

          <div className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">{DEMOS.maquetaTitle}</h3>
              <Chip tone="pending">bajo demanda</Chip>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
              {DEMOS.maqueta}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {[
                { src: BOLIVIA_ASSETS.segip, alt: "SEGIP" },
                { src: BOLIVIA_ASSETS.seprec, alt: "SEPREC" },
                { src: BOLIVIA_ASSETS.sin, alt: "Impuestos Nacionales" },
                { src: BOLIVIA_ASSETS.bancoUnion, alt: "Banco Unión" },
              ].map((l) => (
                <span
                  key={l.alt}
                  className="flex h-12 items-center rounded-lg bg-white px-3 ring-1 ring-black/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- logos oficiales pre-optimizados en public/ */}
                  <img src={l.src} alt={`Logo de ${l.alt} (demo)`} className="max-h-8 w-auto object-contain" />
                </span>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>{DEMOS.directoryTitle}</SubHeading>
          <p className="mt-3 max-w-3xl text-gray-600">{DEMOS.directory}</p>
          <div className="reveal-stagger mx-auto mt-6 grid gap-4 sm:grid-cols-3">
            {DEMOS.directoryQueries.map((q) => (
              <div
                key={q}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <Search className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{q}</p>
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <Chip tone="pending">próximamente</Chip>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Building2 className="h-5 w-5 text-violet-600" aria-hidden />
              <h2 className="text-lg font-bold text-gray-900">{CLOSING.title}</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">{CLOSING.body}</p>
            <Link
              href={CLOSING.ctaHref}
              className="btn-gradient mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              {CLOSING.cta}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Container>
      </Section>
    </>
  );
}
