import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Bot,
  Eye,
  Files,
  Hand,
  KeyRound,
  Landmark,
  LockKeyhole,
  PhoneOff,
  Quote,
  Terminal,
  Truck,
} from "lucide-react";
import { Container, Section, SectionHeading, Breadcrumb, Chip } from "../components/ui";
import ServiceTrustCard from "../components/ServiceTrustCard";
import StoryDiagram from "../components/StoryDiagram";
import {
  CLOSING,
  COMPANY,
  ECOSYSTEM_CHOICES,
  ECOSYSTEM_GAP,
  FACTS,
  PILLARS,
  SECTIONS_NAV,
  TECH_SECTIONS,
  VESTA_ASSETS,
  type SubStep,
} from "./content";
import { LINKS } from "../lib/site";

export const metadata: Metadata = {
  title: "Verana Explained",
  description:
    "Verana, explained through one continuous story: Vesta Appliances — a real business with an impostor problem — joins Verana, makes its services verifiable, and ends up governing trust for its own repair network.",
};

// ————————————————————————————————————————————— shared bits

const SERVICE_ICONS = { bot: Bot, badge: BadgeCheck, key: KeyRound } as const;
const PROBLEM_ICONS = {
  phone: PhoneOff,
  van: Truck,
  lock: LockKeyhole,
  files: Files,
} as const;
const PILLAR_TONES = {
  violet: "border-violet-200 bg-violet-50/60 text-violet-700",
  blue: "border-blue-200 bg-blue-50/60 text-blue-700",
  emerald: "border-emerald-200 bg-emerald-50/60 text-emerald-700",
} as const;

function VestaLogo({ className = "h-14 w-14" }: { className?: string }) {
  if (VESTA_ASSETS.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={VESTA_ASSETS.logo}
        alt="Vesta Appliances logo"
        className={`${className} rounded-2xl object-contain`}
      />
    );
  }
  // Placeholder mark until the brand kit lands (spec open item 8):
  // hearth-flame "V" on a warm gradient.
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="Vesta Appliances logo">
      <defs>
        <linearGradient id="vlg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#vlg)" />
      <path
        d="M18 18 L32 46 L46 18"
        fill="none"
        stroke="#ffffff"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="20" r="3.4" fill="#fbbf24" />
    </svg>
  );
}

function KindChip({ kind }: { kind: SubStep["kind"] }) {
  if (kind === "hands-on")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <Hand className="h-3 w-3" /> hands-on — you do it
      </span>
    );
  if (kind === "watch")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
        <Eye className="h-3 w-3" /> watch — Vesta does it
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
      <BookOpen className="h-3 w-3" /> story
    </span>
  );
}

function SubStepBlock({ sub }: { sub: SubStep }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
            {sub.id}
          </span>
          <h3 className="text-xl font-bold text-gray-900">{sub.title}</h3>
          <KindChip kind={sub.kind} />
        </div>
        <p className="mt-4 max-w-3xl text-gray-600">{sub.story}</p>
        {sub.points?.length ? (
          <ul className="reveal-stagger mt-4 grid max-w-3xl gap-2">
            {sub.points.map((p, pi) => (
              <li
                key={pi}
                className="flex gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm"
              >
                <span className="text-violet-500" aria-hidden>
                  ▸
                </span>
                {p}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <StoryDiagram stage={sub.stage} />

      {sub.image ? (
        <figure className="mx-auto max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sub.image.src}
            alt={sub.image.alt}
            className="w-full rounded-2xl border border-gray-200 object-cover shadow-sm"
          />
          {sub.image.caption ? (
            <figcaption className="mt-2 text-center text-xs text-gray-400">
              {sub.image.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {sub.reproduce?.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900">
            <Terminal className="h-4 w-4 text-violet-600" /> Reproduce it
          </h4>
          <ol className="mt-4 space-y-3">
            {sub.reproduce.map((r, ri) => (
              <li key={ri} className="flex gap-3 text-sm text-gray-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">
                  {ri + 1}
                </span>
                <span className="pt-0.5">{r}</span>
              </li>
            ))}
          </ol>
          {sub.links?.length ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              {sub.links.map((l) =>
                l.href.startsWith("/") ? (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    {l.label} ↗
                  </a>
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {sub.underHood?.length ? (
        <details className="group rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4">
          <summary className="cursor-pointer select-none text-sm font-semibold text-gray-700 hover:text-violet-700">
            Under the hood
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {sub.underHood.map((u, ui) => (
              <li key={ui} className="flex gap-2">
                <span className="text-violet-500" aria-hidden>
                  ▸
                </span>
                {u}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {sub.liveService ? (
        <div>
          <p className="mb-3 text-sm font-medium text-gray-700">
            Live right now, resolved against the public registry:
          </p>
          <ServiceTrustCard serviceId={sub.liveService} />
          {sub.liveNote ? (
            <p className="mt-2 text-xs text-gray-400">{sub.liveNote}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ————————————————————————————————————————————— the page

export default function Explained() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[{ label: "Playground", href: "/" }, { label: "Verana Explained" }]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Verana, explained by Vesta Appliances
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            One continuous story on a single page — starting from the business,
            not the technology. Meet a company everyone recognizes, watch it
            join Verana, and take part yourself with a real wallet.
          </p>
          <nav className="mt-8 flex flex-wrap gap-2">
            {SECTIONS_NAV.map((s) => (
              <a
                key={s.anchor}
                href={`#${s.anchor}`}
                className="rounded-full bg-white/15 px-3.5 py-1.5 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
              >
                {s.n} · {s.title}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* §1 · Meet Vesta Appliances — marketing article, no protocol */}
      <Section id="section-1">
        <Container className="max-w-4xl">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
            {/* Brand header */}
            <div className="flex flex-wrap items-center gap-5">
              <VestaLogo />
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  {COMPANY.name}
                </h2>
                <p className="text-gray-500">{COMPANY.tagline}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {COMPANY.meta.map((m) => (
                <Chip key={m}>{m}</Chip>
              ))}
            </div>
            {/* Article, with the product lineup and factory figures interleaved */}
            <div className="mt-6 max-w-3xl space-y-4 text-[1.05rem] leading-relaxed text-gray-600">
              <p>{COMPANY.article[0]}</p>
              {VESTA_ASSETS.lineup ? (
                <figure className="!my-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={VESTA_ASSETS.lineup}
                    alt="The Vesta product range: washing machine, oven, dryer"
                    className="w-full rounded-2xl object-cover"
                  />
                  <figcaption className="mt-2 text-center text-xs text-gray-400">
                    {VESTA_ASSETS.lineupCaption}
                  </figcaption>
                </figure>
              ) : null}
              <p>{COMPANY.article[1]}</p>
            </div>
            {VESTA_ASSETS.hero ? (
              <figure className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={VESTA_ASSETS.hero}
                  alt="The Vesta Appliances assembly line"
                  className="w-full rounded-2xl object-cover"
                />
                <figcaption className="mt-2 text-center text-xs text-gray-400">
                  {VESTA_ASSETS.heroCaption}
                </figcaption>
              </figure>
            ) : null}
            {/* CEO quote */}
            <figure className="mt-8 rounded-2xl bg-gray-50 p-6">
              <Quote className="h-5 w-5 text-violet-400" aria-hidden />
              <blockquote className="mt-2 text-lg font-medium leading-relaxed text-gray-800">
                “{COMPANY.ceoQuote.text}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                {VESTA_ASSETS.ceo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={VESTA_ASSETS.ceo}
                    alt={COMPANY.ceoQuote.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                    {COMPANY.ceoQuote.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                )}
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">
                    {COMPANY.ceoQuote.name}
                  </div>
                  <div className="text-gray-500">{COMPANY.ceoQuote.role}</div>
                </div>
              </figcaption>
            </figure>
          </div>

          {/* The services — business ownership diagram */}
          <div className="mt-10">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
              What Vesta runs online
            </h3>
            <div className="mt-6 flex flex-col items-center">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
                <VestaLogo className="h-8 w-8" />
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    {COMPANY.name}
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
                {COMPANY.services.map((s) => {
                  const Icon =
                    SERVICE_ICONS[s.icon as keyof typeof SERVICE_ICONS];
                  return (
                    <div
                      key={s.name}
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
                        {s.name}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{s.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* The problems */}
          <div className="mt-12">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
              …and the problems it can&apos;t solve alone
            </h3>
            <div className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2">
              {COMPANY.problems.map((p) => {
                const Icon =
                  PROBLEM_ICONS[p.icon as keyof typeof PROBLEM_ICONS];
                return (
                  <div
                    key={p.title}
                    className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mt-3 font-semibold text-gray-900">
                      {p.title}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{p.desc}</p>
                  </div>
                );
              })}
            </div>
            <div className="relative mt-6 overflow-hidden rounded-2xl bg-gray-900">
              {VESTA_ASSETS.fakeVan ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={VESTA_ASSETS.fakeVan}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover opacity-50"
                />
              ) : null}
              <p className="relative px-6 py-12 text-center text-lg font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
                {COMPANY.rootCause}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* §2 · Why Verana — the three pillars */}
      <Section id="section-2" className="border-t border-gray-200 bg-white">
        <Container className="max-w-4xl">
          <SectionHeading
            number={2}
            title="Why Verana"
            subtitle="The three pillars of the open trust layer — as on verana.io"
          />
          <div className="reveal-stagger grid gap-4 sm:grid-cols-3">
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
        </Container>
      </Section>

      {/* §3 · The ecosystems Vesta wants to join */}
      <Section id="section-3" className="border-t border-gray-200">
        <Container className="max-w-4xl">
          <SectionHeading
            number={3}
            title="The ecosystems Vesta wants to join"
            subtitle="Vesta picks the two it needs — and discovers a gap only it can fill"
          />
          <div className="reveal-stagger grid gap-4 sm:grid-cols-2">
            {ECOSYSTEM_CHOICES.map((e) => {
              const Icon = e.icon === "landmark" ? Landmark : Award;
              const chipTone =
                e.tone === "violet"
                  ? "bg-violet-50 text-violet-700"
                  : "bg-amber-50 text-amber-700";
              return (
                <div
                  key={e.name}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${chipTone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="mt-3 text-lg font-bold text-gray-900">
                    {e.name}
                  </div>
                  <div className="text-sm font-medium text-gray-400">
                    {e.label}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    <span className="font-semibold text-gray-800">
                      Why Vesta joins:
                    </span>{" "}
                    {e.why}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="reveal mt-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/40 px-6 py-4 text-center text-sm font-medium text-red-700">
            {ECOSYSTEM_GAP}
          </p>
        </Container>
      </Section>

      {/* §4–§6 · The technical build */}
      {TECH_SECTIONS.map((sec, i) => (
        <Section
          key={sec.anchor}
          id={sec.anchor}
          className={
            i % 2 === 0
              ? "border-t border-gray-200 bg-white"
              : "border-t border-gray-200"
          }
        >
          <Container className="max-w-4xl">
            <SectionHeading number={sec.n} title={sec.title} subtitle={sec.intro} />
            <div className="space-y-14">
              {sec.substeps.map((sub) => (
                <SubStepBlock key={sub.id} sub={sub} />
              ))}
            </div>
            {sec.outro ? (
              <p className="mt-10 rounded-2xl border border-violet-100 bg-violet-50/60 px-6 py-4 text-sm font-medium text-violet-900">
                {sec.outro}
              </p>
            ) : null}
          </Container>
        </Section>
      ))}

      {/* Closing teaser */}
      <Section className="border-t border-gray-200 bg-white">
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
              href={`${LINKS.spec}/verana-explained/spec.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              verana-spec / playground / verana-explained ↗
            </a>
          </p>
        </Container>
      </Section>
    </>
  );
}
