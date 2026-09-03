import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Clock,
  Coins,
  FileText,
  Gauge,
  Ghost,
  Landmark,
  ListChecks,
  Layers,
  Network,
  Repeat,
  Scale,
  Search,
  ShieldCheck,
  Stamp,
} from "lucide-react";
import { Chip, Container, Section } from "../../components/ui";
import { listPersonalWallets } from "../../lib/wallets";
import { WalletChooser } from "../vesta/DemoWalletFlow";
import LiveTrustCard from "../../components/LiveTrustCard";
import VerandiaOffers from "../verandia/VerandiaOffers";
import VerandiaRequestQr from "../verandia/VerandiaRequestQr";
import { SubHeading, SubStepBlock } from "../story-blocks";
import { BHI_SCENES } from "./scenes";
import { CLOSING, DEMOS, INSTITUTE, JOURNEY, SCHEMAS, SOLUTION } from "./content";

// Rendering of the four chapters of the BHI Verifiable Hiring use case.
// Real organisations (BHI, Orchestrating Identity) appear as themselves;
// every other participant is fictional and labeled (demo). Unlisted page
// (no nav, no sitemap, noindex): the link is shared directly with
// Orchestrating Identity and BHI - see chapters.ts for the publication
// gate (PENDING: the OID-Verana agreement).

export const FOOTER_LABELS = {
  continue: "Continue:",
  explore: "Explore the Vesta use case",
};
export const EXPLORE_HREF = "/usecases/vesta";

const PROBLEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  repeat: Repeat,
  files: FileText,
  ghost: Ghost,
  coins: Coins,
  stamp: Stamp,
  search: Search,
  gauge: Gauge,
};

/** Quote card. While a quote awaits final sign-off (PENDING [QUOTE] in
 *  content.ts), an "awaiting final approval" chip renders alongside it;
 *  with no text at all, only attribution + a pending chip renders. */
function QuoteCard({
  quote,
}: {
  quote: {
    text: string | null;
    author: string;
    title: string;
    awaitingApproval?: boolean;
    pendingNote: string;
  };
}) {
  if (quote.text) {
    return (
      <figure className="rounded-2xl border border-violet-100 bg-violet-50/50 p-6">
        <blockquote className="text-lg font-medium leading-relaxed text-gray-800">
          “{quote.text}”
        </blockquote>
        <figcaption className="mt-4 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <span>
            <span className="font-semibold text-gray-700">{quote.author}</span>
            {" · "}
            {quote.title}
          </span>
          {quote.awaitingApproval ? (
            <Chip tone="pending">awaiting final approval</Chip>
          ) : null}
        </figcaption>
      </figure>
    );
  }
  return (
    <figure className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="pending">quote pending approval</Chip>
      </div>
      <figcaption className="mt-3 text-sm text-gray-600">
        <span className="font-semibold text-gray-800">{quote.author}</span>
        {" · "}
        {quote.title}
      </figcaption>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        {quote.pendingNote}
      </p>
    </figure>
  );
}

function CastStatusChip({ status }: { status: "real" | "demo" | "antagonist" }) {
  if (status === "real") return <Chip tone="verified">real</Chip>;
  if (status === "antagonist")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
        antagonist
      </span>
    );
  return <Chip>fictional (demo)</Chip>;
}

// ---------------------------------------------------------------- Chapter 1

export function Section1() {
  return (
    <>
      <Section>
        <Container className="max-w-5xl">
          <div className="flex flex-wrap items-center gap-4">
            {/* PENDING: BHI logo not provided yet (BHI_ASSETS.bhi is null);
                icon placeholder until the brand kit lands. */}
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <Landmark className="h-8 w-8" aria-hidden />
            </span>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0f1222] sm:text-3xl">
                {INSTITUTE.name}
              </h2>
              <p className="text-lg text-gray-500">{INSTITUTE.tagline}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {INSTITUTE.meta.map((m) => (
              <span
                key={m}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {m}
              </span>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-gray-600">
            {INSTITUTE.intro}
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-gray-600">
            {INSTITUTE.introJobsAware}
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-500">{INSTITUTE.artpNote}</p>
        </Container>
      </Section>

      {/* The hiring journey today + the cast */}
      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>{INSTITUTE.journeyTitle}</SubHeading>
          <p className="mt-3 max-w-3xl text-gray-600">{INSTITUTE.journeyIntro}</p>

          <h4 className="mt-10 text-sm font-bold uppercase tracking-wide text-gray-900">
            {INSTITUTE.castTitle}
          </h4>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {INSTITUTE.cast.map((c) => (
              <div
                key={c.name}
                className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600">
                    {c.role}
                  </p>
                </div>
                <CastStatusChip status={c.status} />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* What the candidate carries */}
      <Section className="border-t border-gray-200">
        <Container className="max-w-5xl">
          <SubHeading>{INSTITUTE.carriesTitle}</SubHeading>
          <p className="mt-3 max-w-3xl text-gray-600">{INSTITUTE.carriesIntro}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {INSTITUTE.carries.map((c) => (
              <div
                key={c}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <FileText className="h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                <p className="text-sm font-medium text-gray-800">{c}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-gray-600">{INSTITUTE.carriesNote}</p>
        </Container>
      </Section>

      {/* The problems */}
      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>{INSTITUTE.problemsTitle}</SubHeading>
          <div className="mt-8 space-y-10">
            {INSTITUTE.problemGroups.map((g) => (
              <div key={g.who}>
                <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
                  {g.who}
                </h4>
                <div className="reveal-stagger mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((p) => {
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
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          {p.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-2xl border border-red-100 bg-red-50/60 p-6">
            <p className="text-lg font-semibold text-red-700">{INSTITUTE.rootCause}</p>
          </div>
        </Container>
      </Section>

      {/* The word of the Institute */}
      <Section className="border-t border-gray-200">
        <Container className="max-w-4xl">
          <SubHeading>The word of the Institute</SubHeading>
          <div className="mt-6">
            <QuoteCard quote={INSTITUTE.quote} />
          </div>
        </Container>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------- Chapter 2

export function Section2() {
  return (
    <>
      <Section>
        <Container className="max-w-5xl">
          <QuoteCard quote={SOLUTION.quote} />

          <div className="mt-12">
            <SubHeading>{SOLUTION.needsTitle}</SubHeading>
            <div className="mt-6 space-y-3">
              {SOLUTION.needs.map((n) => (
                <Link
                  key={n.need}
                  href={n.href}
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

      {/* Where this runs: the two layers */}
      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>{SOLUTION.layersTitle}</SubHeading>
          <p className="mt-3 max-w-3xl text-gray-600">{SOLUTION.layersIntro}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {SOLUTION.layers.map((l, i) => (
              <div
                key={l.label}
                className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  i === 1 ? "border-violet-200" : "border-gray-200"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    i === 1
                      ? "bg-violet-50 text-violet-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {i === 1 ? (
                    <Network className="h-5 w-5" aria-hidden />
                  ) : (
                    <Scale className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <h3 className="mt-3 font-bold text-gray-900">{l.label}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                  {l.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="reveal-stagger mt-8 grid gap-4 md:grid-cols-3">
            {SOLUTION.pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <Layers className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-3 font-bold text-gray-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Who decides what */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900">
              <Scale className="h-4 w-4 text-violet-600" aria-hidden />
              {SOLUTION.whoDecidesTitle}
            </h3>
            <ul className="mt-4 space-y-3">
              {SOLUTION.whoDecides.map((w) => (
                <li
                  key={w}
                  className="flex items-start gap-2 text-sm leading-relaxed text-gray-600"
                >
                  <ShieldCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-violet-500"
                    aria-hidden
                  />
                  {w}
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-gray-100 pt-4 font-semibold text-gray-800">
              {SOLUTION.whoDecidesPunch}
            </p>
          </div>
        </Container>
      </Section>

      {/* The ecosystems BHI joins */}
      <Section className="border-t border-gray-200">
        <Container className="max-w-5xl">
          <SubHeading>{SOLUTION.joinsTitle}</SubHeading>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {SOLUTION.joins.map((e) => (
              <div
                key={e.name}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                    <Network className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="font-bold text-gray-900">{e.name}</h3>
                </div>
                <div className="mt-3">
                  <Chip>{e.role}</Chip>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                  {e.desc}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* The ecosystem BHI builds */}
      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <SubHeading>{SOLUTION.buildsTitle}</SubHeading>
          <p className="mt-3 max-w-3xl text-gray-600">{SOLUTION.buildsIntro}</p>

          <div className="mt-8 rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <Network className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-lg font-bold text-gray-900">{SOLUTION.rtn.name}</h3>
              <Chip tone="verified">{SOLUTION.rtn.role}</Chip>
            </div>
            {/* v5 vocabulary: onboarding modes per schema (ECOSYSTEM /
                GRANTOR / OPEN), Participant entries. */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    <th className="py-2 pr-4">Credential schema</th>
                    <th className="py-2 pr-4">Issuance</th>
                    <th className="py-2 pr-4">Verification</th>
                    <th className="py-2">Held by</th>
                  </tr>
                </thead>
                <tbody>
                  {SOLUTION.rtn.schemas.map((s) => (
                    <tr key={s.schema} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-semibold text-gray-900">
                        {s.schema}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{s.issuance}</td>
                      <td className="py-3 pr-4 text-gray-600">{s.verification}</td>
                      <td className="py-3 text-gray-600">{s.heldBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              {SOLUTION.rtn.note}
            </p>
          </div>

          {/* Who may ask, and who may hold */}
          <div className="mt-10">
            <SubHeading>{SOLUTION.rulesTitle}</SubHeading>
            <p className="mt-3 max-w-3xl text-gray-600">{SOLUTION.rulesIntro}</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {SOLUTION.rules.map((r) => (
                <div
                  key={r.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="font-bold text-gray-900">{r.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 max-w-3xl text-gray-600">{SOLUTION.why}</p>
        </Container>
      </Section>
    </>
  );
}

// ---------------------------------------------------------------- Chapter 3

/** Draft claim sets of the candidate credentials (partner proposal,
 *  2026-08-19), rendered under journey build 4 for review. DRAFT until
 *  the schemas are created on the testnet - see SCHEMAS in content.ts. */
function SchemaDrafts() {
  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-2">
        <ListChecks className="h-4 w-4 text-violet-600" aria-hidden />
        <h4 className="text-sm font-bold uppercase tracking-wide text-gray-900">
          {SCHEMAS.title}
        </h4>
        <Chip tone="pending">draft, for review</Chip>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
        {SCHEMAS.intro}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {SCHEMAS.items.map((sc) => (
          <div
            key={sc.name}
            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="font-bold text-gray-900">{sc.name}</p>
            <p className="mt-0.5 text-xs text-gray-500">Issued by {sc.issuer}</p>
            <ul className="mt-3 flex-1 space-y-1.5">
              {sc.claims.map((cl) => (
                <li
                  key={cl.k}
                  className="flex items-baseline gap-2 text-sm text-gray-700"
                >
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 translate-y-[-1px] rounded-full bg-violet-400"
                  />
                  {cl.k}
                  {cl.optional ? (
                    <span className="rounded bg-gray-100 px-1.5 py-px text-[10px] font-semibold text-gray-500">
                      optional
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {sc.note ? (
              <p className="mt-3 border-t border-gray-100 pt-2.5 text-xs leading-relaxed text-gray-500">
                {sc.note}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-4 max-w-3xl text-xs leading-relaxed text-gray-500">
        {SCHEMAS.modelNote}
      </p>
    </div>
  );
}

export function Section3() {
  return (
    <Section>
      <Container className="max-w-5xl">
        <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
          {JOURNEY.intro}
        </p>
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
                  <SubStepBlock key={s.id} sub={s} graph={BHI_SCENES} />
                ))}
                {need.id === "need-4" ? <SchemaDrafts /> : null}
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

// ---------------------------------------------------------------- Chapter 4

/** Demos 4 and 5 (revocation, directory) are follow-ups; the rest of the
 *  chapter runs live against the deployed BHI cast (bhi-cast.ts). */
function DemoComingSoon() {
  return (
    <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-5 text-center">
      <Chip tone="pending">demo coming soon</Chip>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">
        {DEMOS.pendingNote}
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
          <p className="max-w-3xl text-lg leading-relaxed text-gray-600">
            {DEMOS.intro}
          </p>

          <p className="mt-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {DEMOS.verifyRule}
          </p>

          {/* Choose a wallet - the chooser stays vendor-neutral by design
              (source build notes: no wallet brand replaces the removed
              BHI-branded wireframe wallet). */}
          <div className="mt-12">
            <SubHeading>{DEMOS.chooseWallet.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.chooseWallet.intro}
            </p>
            <Suspense>
              <WalletChooser wallets={wallets} />
            </Suspense>
          </div>

          {/* Demo 1 · Receive your credentials - live offers from the three
              accredited issuers of the cast. */}
          <div id={DEMOS.receive.id} className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.receive.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.receive.intro}
            </p>
            <Suspense>
              <VerandiaOffers wallets={wallets} offers={DEMOS.receive.offers} />
            </Suspense>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <LiveTrustCard serviceId="northbank" />
              <LiveTrustCard serviceId="caledonian" />
              <LiveTrustCard serviceId="cirrus" />
            </div>
          </div>

          {/* Demo 2 · Apply to Meridian - live presentation requests, one per
              credential (same card component: the verifier role of the
              service makes each QR a request, not an offer). */}
          <div id={DEMOS.apply.id} className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.apply.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.apply.intro}
            </p>
            <Suspense>
              <VerandiaOffers wallets={wallets} offers={DEMOS.apply.requests} />
            </Suspense>
            <div className="mx-auto mt-6 max-w-md">
              <LiveTrustCard serviceId="meridian-tech" />
            </div>
          </div>

          {/* Demo 3 · Halcyon - a verifiable organisation with no Verified
              Employer and no verifier permission: the refusal is the lesson. */}
          <div id={DEMOS.halcyon.id} className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.halcyon.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.halcyon.intro}
            </p>
            <div className="mt-6 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-gray-900">{DEMOS.halcyon.org}</h3>
                <Chip tone="verified">TRUSTED</Chip>
                <Chip>no Verified Employer credential</Chip>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-red-600">
                {DEMOS.halcyon.expect}
              </p>
              <div className="mt-4 space-y-3">
                <Suspense>
                  <VerandiaRequestQr
                    wallets={wallets}
                    serviceId={DEMOS.halcyon.serviceId}
                    label={DEMOS.halcyon.org}
                    credential={DEMOS.halcyon.credential}
                  />
                </Suspense>
                <LiveTrustCard serviceId={DEMOS.halcyon.serviceId} />
              </div>
            </div>
          </div>

          {DEMOS.comingSoon.map((d) => (
            <div key={d.id} id={d.id} className="mt-14 scroll-mt-24">
              <SubHeading>{d.title}</SubHeading>
              <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
                {d.desc}
              </p>
              <DemoComingSoon />
            </div>
          ))}

          <p className="mt-12 rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-600">
            {DEMOS.freeNote}
          </p>
        </Container>
      </Section>

      <Section className="border-t border-gray-200 bg-gray-50">
        <Container className="max-w-5xl">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Building2 className="h-5 w-5 text-violet-600" aria-hidden />
              <h2 className="text-lg font-bold text-gray-900">{CLOSING.title}</h2>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
              {CLOSING.body}
            </p>
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
