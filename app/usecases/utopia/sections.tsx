import { Suspense } from "react";
import {
  BadgeCheck,
  Check,
  ExternalLink,
  Files,
  IdCard,
  KeyRound,
  Landmark,
  LockKeyhole,
  Network,
  PhoneOff,
  Quote,
  Search,
  ShieldCheck,
  Stamp,
  Users,
  X,
} from "lucide-react";
import { Container, Section, SectionHeading, Chip } from "../../components/ui";
import { DidBadge } from "../../components/Did";
import LiveTrustCard from "../../components/LiveTrustCard";
import { listPersonalWallets } from "../../lib/wallets";
import { isPendingDid, UTOPIA_CAST } from "../../lib/utopia-cast";
import { LINKS } from "../../lib/site";
import { WalletChooser } from "../vesta/DemoWalletFlow";
import { SubHeading, SubStepBlock } from "../story-blocks";
import { UTOPIA_SCENES } from "./scenes";
import UtopiaOffers from "./UtopiaOffers";
import UtopiaLoginDemo from "./UtopiaLoginDemo";
import UtopiaRequestQr from "./UtopiaRequestQr";
import {
  CLOSING,
  DEMOS,
  ECOSYSTEM_JOIN,
  ECOSYSTEMS_BUILD,
  FACTS,
  JOURNEY,
  PILLARS,
  REPUBLIC,
  SOLUTION,
  UTOPIA_ASSETS,
} from "./content";

const NEED_SHORT = ["Institutions", "Citizen ID", "Business IDs", "Legal Rep", "Auth"];

const INSTITUTION_ICONS = { id: IdCard, landmark: Landmark, key: KeyRound } as const;
const PROBLEM_ICONS = {
  phone: PhoneOff,
  lock: LockKeyhole,
  files: Files,
  stamp: Stamp,
  queue: Users,
} as const;
const PILLAR_TONES = {
  violet: "border-violet-200 bg-violet-50/60 text-violet-700",
  blue: "border-blue-200 bg-blue-50/60 text-blue-700",
  emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
} as const;

export function UtopiaEmblem({ className = "h-[84px] w-[84px]" }: { className?: string }) {
  if (UTOPIA_ASSETS.emblem) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={UTOPIA_ASSETS.emblem}
        alt="Coat of arms of the Republica of Utopia"
        className={`${className} rounded-2xl object-contain`}
      />
    );
  }
  // Placeholder emblem until the civic brand kit lands (spec open item 3):
  // a shield with the Utopia star on a deep-blue gradient.
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-label="Coat of arms of the Republica of Utopia"
    >
      <defs>
        <linearGradient id="ulg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#ulg)" />
      <path
        d="M32 10 L48 16 V32 C48 44 41 51 32 55 C23 51 16 44 16 32 V16 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M32 22 L34.6 28.4 L41.5 28.9 L36.2 33.3 L37.9 40 L32 36.3 L26.1 40 L27.8 33.3 L22.5 28.9 L29.4 28.4 Z"
        fill="#fbbf24"
      />
    </svg>
  );
}

// --------------------------------------------- the page

export function Section1() {
  return (
    <>
      {/* §1 · Meet the Republica of Utopia - civic article, no protocol */}
      <Section id="section-1">
        <Container className="max-w-4xl">
          {/* State header */}
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex flex-wrap items-center gap-5">
              <UtopiaEmblem />
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  {REPUBLIC.name}
                </h2>
                <p className="text-gray-500">{REPUBLIC.tagline}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {REPUBLIC.meta.map((m) => (
                <Chip key={m}>{m}</Chip>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <SectionHeading number={1} title="The Republic" />
          </div>

          <p className="max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
            {REPUBLIC.intro}
          </p>
          {UTOPIA_ASSETS.hero ? (
            <figure className="mt-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={UTOPIA_ASSETS.hero}
                alt="The Republica of Utopia"
                className="photo-frame w-full object-cover"
              />
              <figcaption className="mt-2 text-center text-xs text-gray-400">
                {UTOPIA_ASSETS.heroCaption}
              </figcaption>
            </figure>
          ) : null}

          {/* The institutions */}
          <div className="mt-12">
            <SubHeading>The institutions</SubHeading>
            <div className="mt-6 flex flex-col items-center">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
                <UtopiaEmblem className="h-12 w-12" />
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {REPUBLIC.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    owns &amp; operates all three
                  </div>
                </div>
              </div>
              <div aria-hidden className="h-6 w-px bg-gray-300" />
              <div
                aria-hidden
                className="hidden h-px w-2/3 bg-gray-300 sm:block"
              />
              <div className="mt-[-1px] grid w-full gap-4 sm:grid-cols-3 sm:gap-6 sm:pt-6">
                {REPUBLIC.institutions.map((inst) => {
                  const Icon =
                    INSTITUTION_ICONS[inst.icon as keyof typeof INSTITUTION_ICONS];
                  return (
                    <div
                      key={inst.name}
                      className="relative rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm"
                    >
                      <span
                        aria-hidden
                        className="absolute -top-6 left-1/2 hidden h-6 w-px -translate-x-1/2 bg-gray-300 sm:block"
                      />
                      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="mt-3 font-semibold text-gray-900">
                        {inst.name}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{inst.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {UTOPIA_ASSETS.institutions ? (
              <figure className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={UTOPIA_ASSETS.institutions}
                  alt="The civic institutions of Utopia"
                  className="photo-frame w-full object-cover"
                />
                <figcaption className="mt-2 text-center text-xs text-gray-400">
                  {UTOPIA_ASSETS.institutionsCaption}
                </figcaption>
              </figure>
            ) : null}
            <p className="mt-6 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {REPUBLIC.servicesToday}
            </p>
          </div>

          {/* The problems, and what they cost the Republic */}
          <div className="mt-12">
            <SubHeading>The problems, and what they cost the Republic</SubHeading>

            <p className="mt-6 text-sm font-bold uppercase tracking-wider text-red-500">
              Online
            </p>
            <div className="reveal-stagger mt-3 grid gap-4 sm:grid-cols-3">
              {REPUBLIC.problemsOnline.map((pb) => {
                const Icon =
                  PROBLEM_ICONS[pb.icon as keyof typeof PROBLEM_ICONS];
                return (
                  <div
                    key={pb.title}
                    className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mt-3 font-semibold text-gray-900">
                      {pb.title}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{pb.desc}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm italic text-gray-500">
              {REPUBLIC.onlineConsequence}
            </p>

            <p className="mt-8 text-sm font-bold uppercase tracking-wider text-red-500">
              At the counter and at the bank
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {UTOPIA_ASSETS.phishing ? (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={UTOPIA_ASSETS.phishing}
                    alt="A phishing message impersonating the Tax Buro"
                    className="h-full w-full rounded-2xl object-cover"
                  />
                </figure>
              ) : null}
              <div
                className={`flex flex-col justify-center gap-3 ${
                  UTOPIA_ASSETS.phishing ? "" : "sm:col-span-2"
                }`}
              >
                {REPUBLIC.problemsOffline.map((pb) => {
                  const Icon =
                    PROBLEM_ICONS[pb.icon as keyof typeof PROBLEM_ICONS];
                  return (
                    <div
                      key={pb.title}
                      className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="mt-3 font-semibold text-gray-900">
                        {pb.title}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{pb.desc}</p>
                    </div>
                  );
                })}
                <p className="text-sm italic text-gray-500">
                  {REPUBLIC.offlineConsequence}
                </p>
              </div>
            </div>

            <p className="mt-8 rounded-2xl bg-gray-900 px-6 py-8 text-center text-lg font-semibold text-white">
              {REPUBLIC.rootCause}
            </p>
          </div>

          {/* The word of the Prime Minister */}
          <div className="mt-12">
            <SubHeading>The word of the Prime Minister</SubHeading>
            <figure className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <figcaption className="shrink-0 text-center">
                  {UTOPIA_ASSETS.pm ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={UTOPIA_ASSETS.pm}
                      alt={REPUBLIC.pmQuote.name}
                      className="mx-auto h-48 w-40 rounded-2xl object-cover object-top shadow-md"
                    />
                  ) : (
                    <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                      {REPUBLIC.pmQuote.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  )}
                  <div className="mt-3 text-sm font-semibold text-gray-900">
                    {REPUBLIC.pmQuote.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {REPUBLIC.pmQuote.role}
                  </div>
                </figcaption>
                <div>
                  <Quote className="h-6 w-6 text-violet-400" aria-hidden />
                  <blockquote className="mt-3 text-xl font-medium leading-relaxed text-gray-800">
                    “{REPUBLIC.pmQuote.text}”
                  </blockquote>
                </div>
              </div>
            </figure>
          </div>
        </Container>
      </Section>
    </>
  );
}

export function Section2() {
  return (
    <>
      {/* §2 · The solution: pillars + the ecosystems Utopia joins or builds */}
      <Section id="section-2" className="border-t border-gray-200 bg-white">
        <Container className="max-w-4xl">
          <SectionHeading number={2} title={SOLUTION.title} />

          {/* The Minister's line */}
          <figure className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <figcaption className="shrink-0 text-center">
                {UTOPIA_ASSETS.minister ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={UTOPIA_ASSETS.minister}
                    alt={SOLUTION.ministerQuote.name}
                    className="mx-auto h-40 w-32 rounded-2xl object-cover object-top shadow-md"
                  />
                ) : (
                  <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
                    {SOLUTION.ministerQuote.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                )}
                <div className="mt-3 text-sm font-semibold text-gray-900">
                  {SOLUTION.ministerQuote.name}
                </div>
                <div className="text-sm text-gray-500">
                  {SOLUTION.ministerQuote.role}
                </div>
              </figcaption>
              <div>
                <Quote className="h-6 w-6 text-violet-400" aria-hidden />
                <blockquote className="mt-3 text-xl font-medium leading-relaxed text-gray-800">
                  “{SOLUTION.ministerQuote.text}”
                </blockquote>
              </div>
            </div>
          </figure>

          {/* What the Minister needs: the mission checklist */}
          <div className="mb-14">
            <SubHeading>{SOLUTION.needsTitle}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {SOLUTION.needsIntro}
            </p>
            <ul className="reveal-stagger mx-auto mt-6 grid max-w-3xl gap-3">
              {SOLUTION.needs.map((n) => (
                <li
                  key={n.title}
                  className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 h-6 w-6 shrink-0 rounded-md border-2 border-gray-300"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900">
                        {n.title}
                      </span>
                      <a
                        href={`/usecases/utopia/journey#need-${n.need}`}
                        className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                      >
                        → The journey · {n.tag}
                      </a>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{n.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="reveal mx-auto mt-6 max-w-3xl rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-5 text-center text-base font-medium text-violet-900">
              {SOLUTION.needsBridge}
            </p>
          </div>

          {/* What is Verana? */}
          <div>
            <SubHeading>{SOLUTION.pillarsTitle}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {SOLUTION.pillarsIntro}
            </p>
            <div className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-3">
              {PILLARS.map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group rounded-2xl border p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${PILLAR_TONES[p.tone]}`}
                >
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                    {p.label}
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {p.name}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {p.body}
                  </p>
                </a>
              ))}
            </div>
            <p className="reveal mt-6 rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-5 text-center text-base font-medium text-violet-900">
              {FACTS}
            </p>
          </div>

          {/* The ecosystem Utopia wants to join */}
          <div className="mt-14">
            <SubHeading>{SOLUTION.ecosystemsTitle}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {SOLUTION.ecosystemsIntro}
            </p>
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Landmark className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <BadgeCheck className="h-3 w-3" /> Utopia joins as{" "}
                  {ECOSYSTEM_JOIN.roles}
                </span>
              </div>
              <div className="mt-3 text-lg font-bold text-gray-900">
                {ECOSYSTEM_JOIN.name}
              </div>
              <div className="text-sm font-medium text-gray-400">
                {ECOSYSTEM_JOIN.label}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {ECOSYSTEM_JOIN.about}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-800">
                  Why join, not build:
                </span>{" "}
                {ECOSYSTEM_JOIN.why}
              </p>
              <div className="mt-4 border-t border-gray-100 pt-3">
                <DidBadge
                  did={ECOSYSTEM_JOIN.did}
                  className="flex text-[11px] text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* The ecosystems Utopia wants to build */}
          <div className="mt-14">
            <SubHeading>{SOLUTION.buildTitle}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {SOLUTION.buildIntro}
            </p>
            <div className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2">
              {ECOSYSTEMS_BUILD.map((e) => {
                const Icon = e.icon === "id" ? IdCard : Network;
                const chipTone =
                  e.tone === "blue"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-violet-50 text-violet-700";
                return (
                  <div
                    key={e.name}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${chipTone}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        <Landmark className="h-3 w-3" /> {e.operator} as{" "}
                        {e.role}
                      </span>
                    </div>
                    <div className="mt-3 text-lg font-bold text-gray-900">
                      {e.name}
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                      {e.label}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {e.about}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      <span className="font-semibold text-gray-800">
                        Why it matters:
                      </span>{" "}
                      {e.why}
                    </p>
                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <DidBadge
                        did={e.did}
                        className="flex text-[11px] text-gray-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

export function Section3() {
  return (
    <>
      {/* §3 · The Minister's journey - one subsection per checklist need */}
      <Section id={JOURNEY.anchor} className="border-t border-gray-200">
        <Container className="max-w-4xl">
          <SectionHeading
            number={JOURNEY.n}
            title={JOURNEY.title}
            subtitle={JOURNEY.intro}
          />
          {/* Checkpoint strip - the five needs as stations */}
          <div className="mb-14 flex max-w-3xl items-center">
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
                    <SubStepBlock key={sub.id} sub={sub} graph={UTOPIA_SCENES} />
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
    </>
  );
}

function DemoComing() {
  return (
    <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-5 py-6 text-center">
      <Chip tone="pending">demo coming</Chip>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        The Utopia cast is being deployed on the Verana testnet - this demo
        goes live with it.
      </p>
    </div>
  );
}

export function Section4() {
  const wallets = listPersonalWallets();
  return (
    <>
      {/* §4 · Run the demos - placeholders until the Utopia cast ships */}
      <Section id={DEMOS.anchor} className="border-t border-gray-200 bg-white">
        <Container className="max-w-4xl">
          <SectionHeading number={DEMOS.n} title={DEMOS.title} subtitle={DEMOS.intro} />

          <p className="mb-10 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {DEMOS.verifyRule}
          </p>

          {/* Choose a wallet - picker + install, mirrors /personal-wallets */}
          <div>
            <SubHeading>{DEMOS.chooseWallet.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.chooseWallet.intro}
            </p>
            <Suspense>
              <WalletChooser wallets={wallets} />
            </Suspense>
          </div>

          {/* Demo 1 · Get your Utopia Citizen ID */}
          <div id="demo-citizen-id" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.citizenId.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.citizenId.intro}
            </p>
            {isPendingDid(UTOPIA_CAST.civilRegistry.did) ? (
              <DemoComing />
            ) : (
              <Suspense>
                <UtopiaOffers wallets={wallets} offers={[DEMOS.citizenId.offer]} />
              </Suspense>
            )}
          </div>

          {/* Demo 2 · Get a Proof of Legal Representation */}
          <div id="demo-legal-rep" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.legalRep.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.legalRep.intro}
            </p>
            {isPendingDid(UTOPIA_CAST.businessRegistry.did) ? (
              <DemoComing />
            ) : (
              <Suspense>
                <UtopiaOffers wallets={wallets} offers={[DEMOS.legalRep.offer]} />
              </Suspense>
            )}
          </div>

          {/* Demo 3 · Sign in to the Tax Buro */}
          <div id="demo-tax-login" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.taxLogin.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.taxLogin.intro}
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <ul className="space-y-3">
                {DEMOS.taxLogin.outcomes.map((o) => (
                  <li key={o.rule} className="flex items-start gap-3 text-sm">
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        o.tone === "red"
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {o.tone === "red" ? (
                        <X className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </span>
                    <span>
                      <span className="font-semibold text-gray-900">
                        {o.rule}:
                      </span>{" "}
                      <span className="text-gray-600">{o.result}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {isPendingDid(UTOPIA_CAST.taxBuro.did) ? (
              <DemoComing />
            ) : (
              <div className="mx-auto mt-6 max-w-xl">
                <Suspense>
                  <UtopiaLoginDemo wallets={wallets} portal="tax-buro" />
                </Suspense>
              </div>
            )}
          </div>

          {/* Demo 4 · Open an account at Meridian Bank */}
          <div id="demo-bank" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.bank.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.bank.intro}
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <ul className="space-y-3">
                {DEMOS.bank.outcomes.map((o) => (
                  <li key={o.rule} className="flex items-start gap-3 text-sm">
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        o.tone === "red"
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {o.tone === "red" ? (
                        <X className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </span>
                    <span>
                      <span className="font-semibold text-gray-900">
                        {o.rule}:
                      </span>{" "}
                      <span className="text-gray-600">{o.result}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {UTOPIA_ASSETS.bank ? (
              <figure className="mx-auto mt-6 max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={UTOPIA_ASSETS.bank}
                  alt="Meridian Bank (demo)"
                  className="w-full rounded-2xl border border-gray-200 object-cover shadow-sm"
                />
                <figcaption className="mt-2 text-center text-xs text-gray-400">
                  {UTOPIA_ASSETS.bankCaption}
                </figcaption>
              </figure>
            ) : null}
            {isPendingDid(UTOPIA_CAST.meridianBank.did) ? (
              <DemoComing />
            ) : (
              <div className="mx-auto mt-6 max-w-xl">
                <Suspense>
                  <UtopiaLoginDemo wallets={wallets} portal="meridian-bank" />
                </Suspense>
              </div>
            )}
          </div>

          {/* Demo 5 · The over-asking verifier */}
          <div id="demo-quickcash" className="mt-14 scroll-mt-24">
            <SubHeading>{DEMOS.quickcash.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.quickcash.intro}
            </p>
            <div className="mt-6 rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-gray-900">
                  QuickCash Loans (demo)
                </h3>
                <Chip tone="verified">TRUSTED</Chip>
                <Chip>not authorized for the Citizen ID</Chip>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-red-600">
                {DEMOS.quickcash.expect}
              </p>
              {isPendingDid(UTOPIA_CAST.quickcash.did) ? (
                <DemoComing />
              ) : (
                <div className="mt-4 space-y-3">
                  <Suspense>
                    <UtopiaRequestQr
                      wallets={wallets}
                      serviceId={DEMOS.quickcash.serviceId}
                      label="QuickCash Loans (demo)"
                      credential={DEMOS.quickcash.credential}
                    />
                  </Suspense>
                  <LiveTrustCard serviceId={DEMOS.quickcash.serviceId} />
                </div>
              )}
            </div>
          </div>

          {/* Demo 6 · Directory of Utopia */}
          <div className="mt-14">
            <SubHeading>{DEMOS.directory.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.directory.intro}
            </p>
            <div className="reveal-stagger mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-3">
              {DEMOS.directory.queries.map((q) => (
                <div
                  key={q}
                  className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                    <Search className="h-5 w-5" aria-hidden />
                  </span>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                    {q}
                  </p>
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <Chip tone="pending">demo coming</Chip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Closing teaser */}
      <Section className="border-t border-gray-200">
        <Container className="max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">
                {CLOSING.title}
              </h2>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                {CLOSING.pendingLabel}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
              {CLOSING.body}
            </p>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Full story specification:{" "}
            <a
              className="text-violet-600 underline hover:text-violet-700"
              href={`${LINKS.spec}/utopia/spec.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              verana-spec / playground / utopia <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden />
            </a>
          </p>
        </Container>
      </Section>
    </>
  );
}
