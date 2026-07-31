import Link from "next/link";
import { Suspense } from "react";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Bot,
  Files,
  Hand,
  KeyRound,
  Landmark,
  LockKeyhole,
  ExternalLink,
  Check,
  X,
  Network,
  PhoneOff,
  Search,
  ShieldCheck,
  Quote,
  Terminal,
  Truck,
  Wrench,
} from "lucide-react";
import { Container, Section, SectionHeading, Chip } from "../../components/ui";
import ServiceTrustCard from "../../components/ServiceTrustCard";
import { DidBadge } from "../../components/Did";
import { listPersonalWallets } from "../../lib/wallets";
import DemoWalletFlow, { type BadgeOffer } from "./DemoWalletFlow";
import StoryDiagram from "../../components/StoryDiagram";
import {
  CLOSING,
  COMPANY,
  DEMOS,
  ECOSYSTEM_BUILD,
  ECOSYSTEM_CHOICES,
  FACTS,
  PILLARS,
  REPAIR_NETWORK,
  SOLUTION,
  JOURNEY,
  VESTA_ASSETS,
  type SubStep,
} from "./content";
import { LINKS } from "../../lib/site";

const NEED_SHORT = ["Identity", "Services", "Badges", "ISO 9001", "Network"];


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

function VestaLogo({ className = "h-[84px] w-[84px]" }: { className?: string }) {
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

/** §1 - the real-world repair network: Vesta at the hub, certified partner
 *  companies around it, each carrying the amber "Vesta Certified" paper
 *  badge. Business visual - no DIDs, no protocol. */
function RepairNetworkDiagram() {
  const cx = 380;
  const cy = 210;
  const Rx = 270;
  const Ry = 140;
  const n = REPAIR_NETWORK.partners.length;
  const badgeText = `✓ ${REPAIR_NETWORK.badgeLabel}`;
  const badgeW = badgeText.length * 5.8 + 16;
  return (
    <div>
      <svg
        viewBox="40 28 680 412"
        role="img"
        aria-label="The Vesta certified repair network: Vesta at the center, certified partner companies around it"
        className="h-auto w-full"
      >
        {REPAIR_NETWORK.partners.map((p, i) => {
          const a = (i / n) * 2 * Math.PI - Math.PI / 2;
          const x = cx + Rx * Math.cos(a);
          const y = cy + Ry * Math.sin(a);
          const dx = x - cx;
          const dy = y - cy;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          return (
            <g key={p.name}>
              <line
                x1={cx + ux * 62}
                y1={cy + uy * 62}
                x2={x - ux * 32}
                y2={y - uy * 32}
                stroke="#d1d5db"
                strokeWidth={1.5}
              />
              <circle cx={x} cy={y} r={31} fill="#eff6ff" opacity={0.7} />
              <circle cx={x} cy={y} r={24} fill="#ffffff" stroke="#2563eb" strokeWidth={1.7} />
              <g transform={`translate(${x - 10}, ${y - 10})`} style={{ color: "#2563eb" }}>
                <Wrench width={20} height={20} strokeWidth={1.8} />
              </g>
              <text x={x} y={y + 43} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#111827">
                {p.name}
              </text>
              <text x={x} y={y + 57} textAnchor="middle" fontSize={10.5} fill="#6b7280">
                {p.city}
              </text>
              <g>
                <rect
                  x={x - badgeW / 2}
                  y={y + 63}
                  width={badgeW}
                  height={17}
                  rx={8.5}
                  fill="#ecfdf5"
                  stroke="#059669"
                  strokeOpacity={0.5}
                />
                <text x={x} y={y + 75} textAnchor="middle" fontSize={9} fontWeight={600} fill="#047857">
                  {badgeText}
                </text>
              </g>
            </g>
          );
        })}
        {/* Hub - Vesta */}
        <circle cx={cx} cy={cy} r={56} fill="#f5f3ff" opacity={0.8} />
        <circle cx={cx} cy={cy} r={48} fill="#ffffff" stroke="#7c3aed" strokeWidth={2} />
        {VESTA_ASSETS.logo ? (
          <image
            href={VESTA_ASSETS.logo}
            x={cx - 29}
            y={cy - 29}
            width={58}
            height={58}
          />
        ) : null}
        <rect x={cx - 78} y={cy + 58} width={156} height={32} fill="#ffffff" />
        <text x={cx} y={cy + 70} textAnchor="middle" fontSize={13} fontWeight={700} fill="#111827">
          {COMPANY.name}
        </text>
        <text x={cx} y={cy + 84} textAnchor="middle" fontSize={10} fill="#6b7280">
          trains · audits · certifies
        </text>
      </svg>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[1.65rem] font-extrabold tracking-tight text-[#0f1222]">
      {children}
    </h3>
  );
}

function KindChip({ kind }: { kind: SubStep["kind"] }) {
  if (kind === "hands-on")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <Hand className="h-3 w-3" /> hands-on - you do it
      </span>
    );
  if (kind === "watch") return null;
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
          <h4 className="text-xl font-bold text-gray-900">{sub.title}</h4>
          <KindChip kind={sub.kind} />
        </div>
        <p className="mt-4 max-w-3xl text-gray-600">{sub.story}</p>
        {sub.points?.length ? (
          <ul className="mt-4 max-w-3xl space-y-2.5">
            {sub.points.map((p, pi) => (
              <li
                key={pi}
                className="flex gap-3 text-[15px] leading-relaxed text-gray-600"
              >
                <span
                  aria-hidden
                  className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500"
                />
                {p}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {sub.code ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {sub.code.label}
          </div>
          {sub.code.value.startsWith("did:") ? (
            <DidBadge
              did={sub.code.value}
              className="mt-2 flex text-sm text-violet-700"
            />
          ) : (
            <code className="mt-2 block break-all font-mono text-sm text-violet-700">
              {sub.code.value}
            </code>
          )}
          {sub.code.note ? (
            <p className="mt-2 text-xs text-gray-400">{sub.code.note}</p>
          ) : null}
        </div>
      ) : null}

      {sub.noDiagram ? null : <StoryDiagram stage={sub.stage} />}

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
                    {l.label} <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden />
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

// --------------------------------------------- the page

export function Section1() {
  return (
    <>
      {/* §1 · Meet Vesta Appliances - marketing article, no protocol */}
      <Section id="section-1">
        <Container className="max-w-4xl">
          {/* Brand header */}
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
            <div className="flex flex-wrap items-center gap-5">
              <VestaLogo />
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                  {COMPANY.name}
                </h2>
                <p className="text-gray-500">{COMPANY.tagline}</p>
              </div>
              <div className="ml-auto flex flex-col items-center gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={COMPANY.certification.img}
                  alt="ISO 9001:2015 certification seal"
                  className="h-16 w-auto"
                />
                <span className="text-xs font-semibold text-gray-700">
                  {COMPANY.certification.label}
                </span>
                <span className="text-[11px] text-gray-400">
                  {COMPANY.certification.sub}
                </span>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {COMPANY.meta.map((m) => (
                <Chip key={m}>{m}</Chip>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <SectionHeading number={1} title="The Company" />
          </div>

          {/* The product line */}
          <div>
            <SubHeading>The product line</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {COMPANY.productLine}
            </p>
            {VESTA_ASSETS.lineup ? (
              <figure className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={VESTA_ASSETS.lineup}
                  alt="The Vesta product range: washing machine, oven, dryer"
                  className="photo-frame w-full object-cover"
                />
                <figcaption className="mt-2 text-center text-xs text-gray-400">
                  {VESTA_ASSETS.lineupCaption}
                </figcaption>
              </figure>
            ) : null}
          </div>

          {/* The factory */}
          <div className="mt-12">
            <SubHeading>The factory</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {COMPANY.factoryText}
            </p>
            {VESTA_ASSETS.hero ? (
              <figure className="mt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={VESTA_ASSETS.hero}
                  alt="The Vesta Appliances assembly line"
                  className="photo-frame w-full object-cover"
                />
                <figcaption className="mt-2 text-center text-xs text-gray-400">
                  {VESTA_ASSETS.heroCaption}
                </figcaption>
              </figure>
            ) : null}
          </div>

          {/* The certified repair network */}
          <div className="mt-12">
            <SubHeading>{REPAIR_NETWORK.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-500">
              {REPAIR_NETWORK.blurb}
            </p>
            <div className="mt-6">
              <RepairNetworkDiagram />
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {REPAIR_NETWORK.stats.map((st) => (
                <Chip key={st}>{st}</Chip>
              ))}
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <Check className="h-3 w-3" aria-hidden /> {REPAIR_NETWORK.badgeFullName} badge
              </span>
            </div>
            <p className="mt-5 max-w-3xl text-sm italic leading-relaxed text-gray-500">
              {REPAIR_NETWORK.closing}
            </p>
          </div>

          {/* Online services */}
          <div className="mt-12">
            <SubHeading>Online services</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {COMPANY.servicesIntro}
            </p>
            <div className="mt-6 flex flex-col items-center">
              <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
                <VestaLogo className="h-12 w-12" />
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
                {COMPANY.services.map((sv) => {
                  const Icon =
                    SERVICE_ICONS[sv.icon as keyof typeof SERVICE_ICONS];
                  return (
                    <div
                      key={sv.name}
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
                        {sv.name}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{sv.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* The problems, and what they cost the brand */}
          <div className="mt-12">
            <SubHeading>The problems, and what they cost the brand</SubHeading>

            <p className="mt-6 text-sm font-bold uppercase tracking-wider text-red-500">
              Online
            </p>
            <div className="reveal-stagger mt-3 grid gap-4 sm:grid-cols-3">
              {COMPANY.problemsOnline.map((pb) => {
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
              {COMPANY.onlineConsequence}
            </p>

            <p className="mt-8 text-sm font-bold uppercase tracking-wider text-red-500">
              On-site
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {VESTA_ASSETS.fakeVan ? (
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={VESTA_ASSETS.fakeVan}
                    alt="An impostor van with a printed Vesta panel on its door"
                    className="h-full w-full rounded-2xl object-cover"
                  />
                </figure>
              ) : null}
              <div className="flex flex-col justify-center gap-3">
                {COMPANY.problemsOnsite.map((pb) => {
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
                  {COMPANY.onsiteConsequence}
                </p>
              </div>
            </div>

            <p className="mt-8 rounded-2xl bg-gray-900 px-6 py-8 text-center text-lg font-semibold text-white">
              {COMPANY.rootCause}
            </p>
          </div>

          {/* The word of the CEO */}
          <div className="mt-12">
            <SubHeading>The word of the CEO</SubHeading>
            <figure className="mt-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <figcaption className="shrink-0 text-center">
                  {VESTA_ASSETS.ceo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={VESTA_ASSETS.ceo}
                      alt={COMPANY.ceoQuote.name}
                      className="mx-auto h-48 w-40 rounded-2xl object-cover object-top shadow-md"
                    />
                  ) : (
                    <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-violet-100 text-2xl font-bold text-violet-700">
                      {COMPANY.ceoQuote.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  )}
                  <div className="mt-3 text-sm font-semibold text-gray-900">
                    {COMPANY.ceoQuote.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {COMPANY.ceoQuote.role}
                  </div>
                </figcaption>
                <div>
                  <Quote className="h-6 w-6 text-violet-400" aria-hidden />
                  <blockquote className="mt-3 text-xl font-medium leading-relaxed text-gray-800">
                    “{COMPANY.ceoQuote.text}”
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
      {/* §2 · The solution: pillars + the ecosystems Vesta wants to join */}
      <Section id="section-2" className="border-t border-gray-200 bg-white">
        <Container className="max-w-4xl">
          <SectionHeading number={2} title={SOLUTION.title} />

          {/* The CTO's line */}
          <figure className="mb-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <figcaption className="shrink-0 text-center">
                {VESTA_ASSETS.cto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={VESTA_ASSETS.cto}
                    alt={SOLUTION.ctoQuote.name}
                    className="mx-auto h-40 w-32 rounded-2xl object-cover object-top shadow-md"
                  />
                ) : (
                  <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700">
                    {SOLUTION.ctoQuote.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")}
                  </span>
                )}
                <div className="mt-3 text-sm font-semibold text-gray-900">
                  {SOLUTION.ctoQuote.name}
                </div>
                <div className="text-sm text-gray-500">
                  {SOLUTION.ctoQuote.role}
                </div>
              </figcaption>
              <div>
                <Quote className="h-6 w-6 text-violet-400" aria-hidden />
                <blockquote className="mt-3 text-xl font-medium leading-relaxed text-gray-800">
                  “{SOLUTION.ctoQuote.text}”
                </blockquote>
              </div>
            </div>
          </figure>

          {/* What Marc needs: the mission checklist */}
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
                        href={`/usecases/vesta/journey#need-${n.need}`}
                        className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                      >
                        → Marc&apos;s journey · {n.tag}
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

          {/* The ecosystems Vesta wants to join */}
          <div className="mt-14">
            <SubHeading>{SOLUTION.ecosystemsTitle}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {SOLUTION.ecosystemsIntro}
            </p>
            <div className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2">
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
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${chipTone}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        <BadgeCheck className="h-3 w-3" /> Vesta joins as{" "}
                        {e.role}
                      </span>
                    </div>
                    <div className="mt-3 text-lg font-bold text-gray-900">
                      {e.name}
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                      {e.label}
                    </div>
                    {"about" in e && e.about ? (
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        {e.about}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      <span className="font-semibold text-gray-800">
                        Why Vesta joins:
                      </span>{" "}
                      {e.why}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                      <DidBadge
                        did={e.did}
                        className="min-w-0 flex-1 text-[11px] text-gray-400"
                      />
                      <a
                        href={e.veranaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                      >
                        Open in Verana <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* The ecosystems Vesta wants to build */}
          <div className="mt-14">
            <SubHeading>{ECOSYSTEM_BUILD.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {ECOSYSTEM_BUILD.intro}
            </p>
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Network className="h-5 w-5" />
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  <Landmark className="h-3 w-3" /> Vesta operates as{" "}
                  {ECOSYSTEM_BUILD.card.role}
                </span>
              </div>
              <div className="mt-3 text-lg font-bold text-gray-900">
                {ECOSYSTEM_BUILD.card.name}
              </div>
              <div className="text-sm font-medium text-gray-400">
                {ECOSYSTEM_BUILD.card.label}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {ECOSYSTEM_BUILD.card.about}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                <span className="font-semibold text-gray-800">
                  Why Vesta builds it:
                </span>{" "}
                {ECOSYSTEM_BUILD.card.why}
              </p>
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-3">
                <DidBadge
                  did={ECOSYSTEM_BUILD.card.did}
                  className="flex text-[11px] text-gray-400"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`/usecases/vesta/journey#need-${ECOSYSTEM_BUILD.card.need}`}
                    className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    → Marc&apos;s journey · Vesta creates its own ecosystem
                  </a>
                  <a
                    href={ECOSYSTEM_BUILD.card.veranaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    Open in Verana <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden />
                  </a>
                </div>
              </div>
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
      {/* §3 · Marc's journey - one subsection per checklist need */}
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
                    <SubStepBlock key={sub.id} sub={sub} />
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

export function Section4() {
  return (
    <>
      {/* §4 · Run the demos - placeholders until the Vesta cast ships */}
      <Section id={DEMOS.anchor} className="border-t border-gray-200 bg-white">
        <Container className="max-w-4xl">
          <SectionHeading number={DEMOS.n} title={DEMOS.title} subtitle={DEMOS.intro} />

          <p className="mb-10 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-medium text-amber-800">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            {DEMOS.verifyRule}
          </p>

          {/* Demo 1 · Obtain an ECS-Badge - pick a wallet, install it, scan */}
          <div>
            <SubHeading>{DEMOS.badge.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.badge.intro}
            </p>
            <Suspense>
              <DemoWalletFlow
                wallets={listPersonalWallets()}
                offers={DEMOS.badge.offers as unknown as BadgeOffer[]}
              />
            </Suspense>
          </div>

          {/* Demo 2 · Log in with the badge */}
          <div className="mt-14">
            <SubHeading>{DEMOS.login.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.login.intro}
            </p>
            <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <ul className="space-y-3">
                {DEMOS.login.outcomes.map((o) => (
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
              <div className="mt-5 flex items-center justify-between gap-2 border-t border-gray-100 pt-4">
                <span className="flex items-center gap-2 text-sm text-gray-400">
                  <KeyRound className="h-4 w-4" aria-hidden /> Vesta portal
                  login demo
                </span>
                <Chip tone="pending">demo coming</Chip>
              </div>
            </div>
          </div>

          {/* Demo 3 · Directory search */}
          <div className="mt-14">
            <SubHeading>{DEMOS.directory.title}</SubHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {DEMOS.directory.intro}
            </p>
            <div className="reveal-stagger mx-auto mt-6 grid max-w-3xl gap-4 sm:grid-cols-2">
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
              href={`${LINKS.spec}/verana-explained/spec.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              verana-spec / playground / verana-explained <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden />
            </a>
          </p>
        </Container>
      </Section>
    </>
  );
}
