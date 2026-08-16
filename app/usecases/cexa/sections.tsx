import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Building2,
  Check,
  Ghost,
  Hourglass,
  Landmark,
  Network,
  Quote,
  Repeat,
  ShieldCheck,
  Stamp,
  Wallet,
  X,
} from "lucide-react";
import { Container, Section, SectionHeading, Chip } from "../../components/ui";
import { DidBadge } from "../../components/Did";
import { listPersonalWallets } from "../../lib/wallets";
import { CEXA_CAST, isPendingDid } from "../../lib/cexa-cast";
import { WalletChooser } from "../vesta/DemoWalletFlow";
import { SubHeading, SubStepBlock } from "../story-blocks";
import { CEXA_SCENES } from "./scenes";
import { MoneyFlowCard, TrustScorePanel } from "./money";
import {
  CEXA_ASSETS,
  CLOSING,
  DEMOS,
  FACTS,
  JOURNEY,
  MONEY,
  PILLARS,
  SOLUTION,
  WORLD,
} from "./content";

const NEED_SHORT = ["Verify", "Members", "Reuse", "Counterparty", "Defenses"];

const ACTOR_ICONS = { building: Building2, bank: Landmark, stamp: Stamp } as const;
const PROBLEM_ICONS = {
  wallet: Wallet,
  hourglass: Hourglass,
  repeat: Repeat,
  ghost: Ghost,
} as const;
const PILLAR_TONES = {
  violet: "border-violet-200 bg-violet-50/60 text-violet-700",
  blue: "border-blue-200 bg-blue-50/60 text-blue-700",
  emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
} as const;

function QuoteCard({
  quote,
  portrait,
}: {
  quote: { text: string; name: string; role: string };
  /** Generated portrait (CEXA_ASSETS); initials placeholder when null. */
  portrait?: string | null;
}) {
  return (
    <figure className="rounded-2xl border border-violet-100 bg-violet-50/50 p-6 sm:p-7">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <figcaption className="shrink-0 text-center">
          {portrait ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={portrait}
              alt={quote.name}
              className="mx-auto h-44 w-36 rounded-2xl object-cover object-top shadow-md"
            />
          ) : (
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700">
              {quote.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </span>
          )}
          <div className="mt-3 max-w-[11rem] text-sm font-semibold text-gray-900">
            {quote.name}
          </div>
          <div className="max-w-[11rem] text-xs text-gray-500">
            {quote.role}
          </div>
        </figcaption>
        <div>
          <Quote className="h-5 w-5 text-violet-400" aria-hidden />
          <blockquote className="mt-3 max-w-3xl text-[1.05rem] font-medium leading-relaxed text-gray-800">
            “{quote.text}”
          </blockquote>
        </div>
      </div>
    </figure>
  );
}

// ------------------------------------------------- §1 · Pay twice, wait twice

export function Section1() {
  return (
    <Section id="section-1">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap gap-2">
          {WORLD.meta.map((m) => (
            <span
              key={m}
              className="rounded-full border border-[#e4e2f0] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4c5065]"
            >
              {m}
            </span>
          ))}
        </div>
        <p className="mt-8 max-w-3xl text-[1.08rem] leading-relaxed text-gray-600">
          {WORLD.intro}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORLD.actors.map((a) => {
            const Icon = ACTOR_ICONS[a.icon as keyof typeof ACTOR_ICONS];
            return (
              <div
                key={a.name}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="mt-3 font-semibold text-gray-900">{a.name}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  {a.desc}
                </p>
              </div>
            );
          })}
        </div>

        <h3 className="mt-14 text-2xl font-bold text-gray-900">
          Five problems, one cause
        </h3>
        <div className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50/50 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm">
              <ArrowLeftRight className="h-5 w-5" aria-hidden />
            </span>
            <div className="text-lg font-bold text-gray-900">
              {WORLD.travelRule.title}
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            {WORLD.travelRule.desc}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {WORLD.travelRule.costs.map((c, ci) => (
              <div
                key={ci}
                className="rounded-xl border border-red-100 bg-white px-4 py-3 text-sm leading-relaxed text-gray-600"
              >
                <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-red-400">
                  Cost {ci + 1}
                </span>
                {c}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm font-semibold leading-relaxed text-red-800">
            {WORLD.travelRule.punchline}
          </p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {WORLD.problems.map((p) => {
            const Icon = PROBLEM_ICONS[p.icon as keyof typeof PROBLEM_ICONS];
            return (
              <div
                key={p.title}
                className="rounded-2xl border border-red-100 bg-red-50/40 p-5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="mt-3 font-semibold text-gray-900">{p.title}</div>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm font-medium text-amber-900">
          {WORLD.consequence}
        </p>

        <div className="mt-10 space-y-6">
          <QuoteCard quote={WORLD.ceoQuote} portrait={CEXA_ASSETS.lena} />
          <QuoteCard quote={WORLD.bankQuote} portrait={CEXA_ASSETS.elias} />
        </div>
      </Container>
    </Section>
  );
}

// -------------------------------------- §2 · The solution: a KYC that travels

export function Section2() {
  return (
    <Section id="section-2" className="border-t border-gray-200">
      <Container className="max-w-4xl">
        <SectionHeading
          number={2}
          title={SOLUTION.title}
          subtitle={SOLUTION.needsIntro}
        />
        <QuoteCard quote={SOLUTION.quote} portrait={CEXA_ASSETS.priya} />

        <h3 className="mt-12 text-2xl font-bold text-gray-900">
          {SOLUTION.needsTitle}
        </h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {SOLUTION.needs.map((n) => (
            <Link
              key={n.need}
              href={`/usecases/cexa/journey#need-${n.need}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-300"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-sm font-extrabold text-violet-700">
                  {n.need}
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
                  {n.tag}
                </span>
              </div>
              <div className="mt-3 font-semibold text-gray-900 group-hover:text-violet-700">
                {n.title}
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                {n.desc}
              </p>
            </Link>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
          {SOLUTION.needsBridge}
        </p>

        <h3 className="mt-14 text-2xl font-bold text-gray-900">
          {SOLUTION.pillarsTitle}
        </h3>
        <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
          {SOLUTION.pillarsIntro}
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <a
              key={p.name}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${PILLAR_TONES[p.tone]}`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wide opacity-80">
                {p.label}
              </div>
              <div className="mt-1 font-bold">{p.name}</div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {p.body}
              </p>
            </a>
          ))}
        </div>
        <p className="mt-4 text-sm text-gray-400">{FACTS}</p>

        <h3 className="mt-14 text-2xl font-bold text-gray-900">
          {SOLUTION.egfTitle}
        </h3>
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
            {SOLUTION.egf.intro}
          </p>
          <ol className="mt-4 space-y-3">
            {SOLUTION.egf.rules.map((r, ri) => (
              <li key={ri} className="flex gap-3 text-sm text-gray-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">
                  {ri + 1}
                </span>
                <span className="pt-0.5">{r}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-6 py-4 text-sm leading-relaxed text-emerald-900">
          {SOLUTION.egf.positioning}
        </p>
        <p className="mt-4 flex items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 px-6 py-4 text-sm font-medium leading-relaxed text-violet-900">
          <ArrowLeftRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {SOLUTION.travelRulePositioning}
        </p>

        <h3 className="mt-14 text-2xl font-bold text-gray-900">
          {SOLUTION.ecosystemTitle}
        </h3>
        <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
              <Network className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <div className="font-bold text-gray-900">
                {SOLUTION.ecosystem.name}
                <span className="ml-2 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-700">
                  {SOLUTION.ecosystem.role}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {SOLUTION.ecosystem.label} · operated by{" "}
                {SOLUTION.ecosystem.operator}
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">
            {SOLUTION.ecosystem.about}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            <span className="font-semibold text-gray-900">Why it matters: </span>
            {SOLUTION.ecosystem.why}
          </p>
          <DidBadge
            did={SOLUTION.ecosystem.did}
            className="mt-4 flex text-xs text-violet-700"
          />
        </div>
        <p className="mt-4 flex items-start gap-2.5 text-sm text-gray-400">
          <Landmark className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {SOLUTION.kybNote}
        </p>
      </Container>
    </Section>
  );
}

// ---------------------------------------- §3 · The Association's journey

export function Section3() {
  return (
    <Section id={JOURNEY.anchor} className="border-t border-gray-200">
      <Container wide>
        <SectionHeading
          number={JOURNEY.n}
          title={JOURNEY.title}
          subtitle={JOURNEY.intro}
        />
        {/* Checkpoint strip - the four needs as stations */}
        <div className="mb-14 flex max-w-2xl items-center">
          {JOURNEY.needs.map((need, i) => (
            <div key={need.id} className="contents">
              <a
                href={`#${need.id}`}
                className="group flex min-w-[76px] flex-col items-center gap-1.5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#e4e2f0] bg-white text-sm font-extrabold text-violet-700 shadow-sm transition-all group-hover:border-violet-400 group-hover:shadow-[0_8px_18px_rgb(109,40,217,0.25)]">
                  {need.n}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#8a8da1] group-hover:text-violet-700">
                  {NEED_SHORT[i]}
                </span>
              </a>
              {i < JOURNEY.needs.length - 1 ? (
                <span
                  aria-hidden
                  className="mt-[-18px] h-[2px] flex-1 bg-[repeating-linear-gradient(90deg,#d9d7ea_0_7px,transparent_7px_13px)]"
                />
              ) : null}
            </div>
          ))}
        </div>
        <div className="space-y-20">
          {JOURNEY.needs.map((need) => (
            <div key={need.id} id={need.id} className="scroll-mt-24">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6d28d9] to-[#8b5cf6] text-base font-bold text-white shadow-[0_8px_18px_rgb(109,40,217,0.35)]">
                  3.{need.n}
                </span>
                <h3 className="text-2xl font-bold text-gray-900">
                  {need.title}
                </h3>
              </div>
              <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
                {need.intro}
              </p>
              <div className="mt-8 space-y-14">
                {need.steps.map((sub) => (
                  <SubStepBlock key={sub.id} sub={sub} graph={CEXA_SCENES} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-12 rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-4 text-sm font-medium text-violet-900">
          {JOURNEY.outro}
        </p>
      </Container>
    </Section>
  );
}

// -------------------------------------------- §4 · The money: who pays whom

export function Section4() {
  return (
    <Section id={MONEY.anchor} className="border-t border-gray-200 bg-white">
      <Container className="max-w-4xl">
        <SectionHeading
          number={MONEY.n}
          title={MONEY.title}
          subtitle={MONEY.intro}
        />

        <h3 className="text-2xl font-bold text-gray-900">
          {MONEY.governs.title}
        </h3>
        <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
          {MONEY.governs.intro}
        </p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3.5 font-semibold">Parameter</th>
                <th className="px-5 py-3.5 font-semibold">Governed by</th>
              </tr>
            </thead>
            <tbody>
              {MONEY.governs.rows.map((r) => (
                <tr
                  key={r.param}
                  className="border-b border-gray-50 align-top last:border-0"
                >
                  <td className="px-5 py-3.5 font-semibold text-gray-900">
                    {r.param}
                  </td>
                  <td className="px-5 py-3.5 leading-relaxed text-gray-500">
                    {r.who}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-14 space-y-6">
          {MONEY.flows.map((flow) => (
            <MoneyFlowCard
              key={flow.id}
              flow={flow}
              simulatedChip={MONEY.simulatedChip}
            />
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <ArrowLeftRight className="h-5 w-5 text-violet-600" aria-hidden />
              {MONEY.counterparty.title}
            </h4>
            <Chip tone="verified">{MONEY.counterparty.chip}</Chip>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
            {MONEY.counterparty.desc}
          </p>
        </div>

        <h3 className="mt-14 text-2xl font-bold text-gray-900">
          {MONEY.unitEconomics.title}
        </h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {MONEY.unitEconomics.rows.map((r) => (
            <div
              key={r.who}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="text-sm font-bold text-gray-900">{r.who}</div>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {r.line}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <TrustScorePanel data={MONEY.trustScore} />
        </div>

      </Container>
    </Section>
  );
}

// ------------------------------------------------------- §5 · Run the demos

function DemoComing() {
  return (
    <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
      <Chip tone="pending">demo coming</Chip>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        The CEXA cast is being prepared for the Verana testnet - this demo goes
        live with it.
      </p>
    </div>
  );
}

export function Section5() {
  const wallets = listPersonalWallets();
  return (
    <>
      <Section id={DEMOS.anchor} className="border-t border-gray-200 bg-white">
        <Container className="max-w-4xl">
          <SectionHeading
            number={DEMOS.n}
            title={DEMOS.title}
            subtitle={DEMOS.intro}
          />

          <p className="mb-10 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {DEMOS.verifyRule}
          </p>

          <div>
            <SubHeading>{DEMOS.chooseWallet.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.chooseWallet.intro}
            </p>
            <Suspense>
              <WalletChooser wallets={wallets} />
            </Suspense>
          </div>

          {/* Demo 1 · Get the CryptoExchangeKYC credential */}
          <div id="demo-kyc" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.kyc.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.kyc.intro}
            </p>
            {/* Phase 2 replaces the placeholder with the live offer QR. */}
            {isPendingDid(CEXA_CAST.aurum.did) ? <DemoComing /> : null}
          </div>

          {/* Demo 2 · Sign in at Borealis */}
          <div id="demo-borealis" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.borealis.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.borealis.intro}
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <ul className="space-y-3">
                {DEMOS.borealis.outcomes.map((o) => (
                  <li key={o.rule} className="flex items-start gap-3 text-sm">
                    {o.tone === "emerald" ? (
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                        aria-hidden
                      />
                    ) : (
                      <X
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                        aria-hidden
                      />
                    )}
                    <span>
                      <span className="font-semibold text-gray-900">
                        {o.rule}:
                      </span>{" "}
                      <span className="text-gray-500">{o.result}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {isPendingDid(CEXA_CAST.borealis.did) ? <DemoComing /> : null}
          </div>

          {/* Demo 3 · The corridor: sign in at Novara Bank */}
          <div id="demo-novara" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.novara.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.novara.intro}
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <ul className="space-y-3">
                {DEMOS.novara.outcomes.map((o) => (
                  <li key={o.rule} className="flex items-start gap-3 text-sm">
                    {o.tone === "emerald" ? (
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                        aria-hidden
                      />
                    ) : (
                      <X
                        className="mt-0.5 h-4 w-4 shrink-0 text-red-400"
                        aria-hidden
                      />
                    )}
                    <span>
                      <span className="font-semibold text-gray-900">
                        {o.rule}:
                      </span>{" "}
                      <span className="text-gray-500">{o.result}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {isPendingDid(CEXA_CAST.novara.did) ? <DemoComing /> : null}
          </div>

          {/* Demo 4 · Verify a counterparty (Travel Rule) */}
          <div id="demo-counterparty" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.counterparty.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.counterparty.intro}
            </p>
            <p className="mx-auto mt-4 max-w-3xl rounded-2xl border border-violet-100 bg-violet-50/50 px-5 py-4 text-sm leading-relaxed text-violet-900">
              {DEMOS.counterparty.expect}
            </p>
            {isPendingDid(CEXA_CAST.novara.did) ? <DemoComing /> : null}
          </div>

          {/* Demo 5 · The refusal */}
          <div id="demo-darkpool" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.darkpool.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.darkpool.intro}
            </p>
            <p className="mx-auto mt-4 max-w-3xl rounded-2xl border border-red-100 bg-red-50/50 px-5 py-4 text-sm leading-relaxed text-red-800">
              {DEMOS.darkpool.expect}
            </p>
            {isPendingDid(CEXA_CAST.darkpool.did) ? <DemoComing /> : null}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-gray-200">
        <Container className="max-w-4xl">
          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-7">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">
                {CLOSING.title}
              </h3>
              <Chip tone="pending">{CLOSING.pendingLabel}</Chip>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
              {CLOSING.body}
            </p>
          </div>
        </Container>
      </Section>
    </>
  );
}
