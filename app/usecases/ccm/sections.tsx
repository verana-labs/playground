import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock,
  Coins,
  FileText,
  IdCard,
  KeyRound,
  Landmark,
  PiggyBank,
  Repeat,
  Search,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import { Chip, Container, Section } from "../../components/ui";
import LiveTrustCard from "../../components/LiveTrustCard";
import { listPersonalWallets } from "../../lib/wallets";
import { CCM_CAST, isCcmPendingDid } from "../../lib/ccm-cast";
import { WalletChooser } from "../vesta/DemoWalletFlow";
import CcmLoginDemo from "./CcmLoginDemo";
import CcmPortalDemo from "./CcmPortalDemo";
import { SubHeading, SubStepBlock, type StoryLabels } from "../story-blocks";
import { CCM_SCENES } from "./scenes";
import { CAMARA, CCM_ASSETS, CLOSING, DEMOS, JOURNEY, SOLUTION } from "./content";

// Renderizado de los cuatro capítulos del caso CCM. Instituciones reales
// con sus logos oficiales, siempre "(demo)" cuando actúan en la maqueta;
// ninguna persona con nombre. Página no listada (sin nav, sin sitemap,
// noindex): el enlace se comparte directamente con la cámara.

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
  explore: "Ver también el caso Bolivia",
};
export const EXPLORE_HREF = "/usecases/bolivia";

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
  clock: Clock,
  repeat: Repeat,
  files: FileText,
  key: KeyRound,
  stamp: Stamp,
};

const BUSINESS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bank: PiggyBank,
  user: IdCard,
  landmark: Landmark,
};

// ---------------------------------------------------------------- Capítulo 1

export function Section1() {
  return (
    <>
      <Section>
        <Container className="max-w-5xl">
          <div className="flex flex-wrap items-center gap-4">
            <Logo src={CCM_ASSETS.ccm} alt="Logo de la Cámara de Comercio de Medellín" tall />
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0f1222] sm:text-3xl">
                {CAMARA.name}
              </h2>
              <p className="text-lg text-gray-500">{CAMARA.tagline}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {CAMARA.meta.map((m) => (
              <span
                key={m}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {m}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-600">
            {CAMARA.intro}
          </p>
        </Container>
      </Section>

      {/* El certificado de hoy */}
      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>{CAMARA.certTitle}</SubHeading>
          <p className="mt-3 max-w-3xl text-gray-600">{CAMARA.cert.what}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAMARA.cert.facts.map((f) => (
              <div key={f.k} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                  {f.k}
                </p>
                <p className="mt-0.5 text-sm font-medium text-gray-800">{f.v}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Los problemas */}
      <Section className="border-t border-gray-200">
        <Container className="max-w-5xl">
          <SubHeading>{CAMARA.problemsTitle}</SubHeading>
          <div className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAMARA.problems.map((p) => {
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
          <p className="mt-8 max-w-3xl text-gray-600">{CAMARA.consequence}</p>
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/60 p-6">
            <p className="text-lg font-semibold text-red-700">{CAMARA.rootCause}</p>
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
                  href={`/usecases/ccm/construccion#need-${n.need}`}
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

      {/* Despliegue objetivo vs maqueta */}
      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>{SOLUTION.deployment.title}</SubHeading>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Chip>{SOLUTION.deployment.target.label}</Chip>
                {/* Logo vertical (ícono sobre el nombre): necesita más alto que los horizontales */}
                <span className="flex h-16 items-center rounded-lg bg-white px-3 ring-1 ring-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo oficial pre-optimizado en public/ */}
                  <img
                    src={CCM_ASSETS.confecamaras}
                    alt="Logo de Confecámaras"
                    className="max-h-14 w-auto object-contain"
                  />
                </span>
              </div>
              <ul className="mt-4 flex-1 space-y-3">
                {SOLUTION.deployment.target.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <Chip tone="verified">{SOLUTION.deployment.demo.label}</Chip>
                <span className="flex h-12 items-center rounded-lg bg-white px-3 ring-1 ring-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- logo oficial pre-optimizado en public/ */}
                  <img
                    src={CCM_ASSETS.ccm}
                    alt="Logo de la CCM"
                    className="max-h-8 w-auto object-contain"
                  />
                </span>
              </div>
              <ul className="mt-4 flex-1 space-y-3">
                {SOLUTION.deployment.demo.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-gray-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* El modelo de negocio */}
      <Section className="border-t border-gray-200">
        <Container className="max-w-5xl">
          <SubHeading>{SOLUTION.businessTitle}</SubHeading>
          <p className="mt-3 max-w-3xl text-gray-600">{SOLUTION.businessIntro}</p>
          <div className="reveal-stagger mt-8 grid gap-4 md:grid-cols-3">
            {SOLUTION.business.map((b) => {
              const Icon = BUSINESS_ICONS[b.icon] ?? Landmark;
              return (
                <div
                  key={b.who}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-3 font-bold text-gray-900">{b.who}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{b.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900">
              <Repeat className="h-4 w-4 text-violet-600" aria-hidden />
              {SOLUTION.expiryTitle}
            </h3>
            <div className="mt-4 space-y-3">
              {SOLUTION.expiry.map((p) => (
                <p key={p} className="text-sm leading-relaxed text-gray-600">
                  {p}
                </p>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900">
              <Coins className="h-4 w-4 text-violet-600" aria-hidden />
              {SOLUTION.feesTitle}
            </h3>
            <div className="mt-4 divide-y divide-gray-100">
              {SOLUTION.fees.map((f) => (
                <div
                  key={f.concept}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-2.5"
                >
                  <p className="text-sm text-gray-700">{f.concept}</p>
                  <p className="text-sm font-semibold text-gray-900">{f.amount}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-gray-500">{SOLUTION.feesNote}</p>
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
                  <SubStepBlock key={s.id} sub={s} graph={CCM_SCENES} labels={LABELS_ES} />
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

function DemoProximamente() {
  return (
    <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-5 text-center">
      <Chip tone="pending">demo próximamente</Chip>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        Este servicio de la maqueta CCM aún no está desplegado en la testnet:
        la demo se activa sola cuando su agente esté en línea.
      </p>
    </div>
  );
}

export function Section4() {
  const wallets = listPersonalWallets();
  return (
    <>
      <Section>
        <Container className="max-w-4xl">
          <p className="max-w-3xl text-lg leading-relaxed text-gray-600">{DEMOS.intro}</p>

          <p className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {DEMOS.verifyRule}
          </p>

          {/* Elegir wallet */}
          <div className="mt-12">
            <SubHeading>{DEMOS.chooseWallet.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.chooseWallet.intro}
            </p>
            <Suspense>
              <WalletChooser wallets={wallets} />
            </Suspense>
          </div>

          {/* Demo 1 · El portal CCM */}
          <div id="demo-portal" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.portal.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.portal.intro}
            </p>
            {isCcmPendingDid(CCM_CAST.camara.did) ? (
              <DemoProximamente />
            ) : (
              <div className="mx-auto mt-6 max-w-xl space-y-3">
                <Suspense>
                  <CcmPortalDemo
                    wallets={wallets}
                    serviceId={DEMOS.portal.serviceId}
                    credential={DEMOS.portal.credential}
                  />
                </Suspense>
                <LiveTrustCard serviceId={DEMOS.portal.serviceId} />
              </div>
            )}
          </div>

          {/* Demo 2 · Bancolombia */}
          <div id="demo-banco" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.banco.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.banco.intro}
            </p>
            {isCcmPendingDid(CCM_CAST.bancolombia.did) ? (
              <DemoProximamente />
            ) : (
              <div className="mx-auto mt-6 max-w-xl space-y-3">
                <Suspense>
                  <CcmLoginDemo wallets={wallets} />
                </Suspense>
                <LiveTrustCard serviceId="bancolombia" />
              </div>
            )}
          </div>

          {/* Revocación: cómo funciona y qué falta */}
          <div id="demo-revocacion" className="mt-14 scroll-mt-24">
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-gray-900">{DEMOS.revocation.title}</h3>
                <Chip tone="pending">aún no en la maqueta</Chip>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {DEMOS.revocation.body}
              </p>
            </div>
          </div>

          {/* El caso Bolivia como segunda referencia */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <p className="max-w-2xl text-sm leading-relaxed text-gray-600">
              {DEMOS.boliviaNote}
            </p>
            <Link
              href={DEMOS.boliviaHref}
              className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
            >
              {DEMOS.boliviaTitle}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
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
