import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Award,
  Bot,
  BadgeCheck,
  Building2,
  CircleCheck,
  CornerDownRight,
  Fingerprint,
  Landmark,
  Search,
  Store,
} from "lucide-react";
import { Container, Section, SectionHeading } from "./components/ui";
import { AddYourWalletTile } from "./components/WalletTile";
import WalletLogo from "./components/WalletLogo";
import { businessWallets, type Integration } from "./lib/integrations";
import { listPersonalWallets, type PersonalWallet } from "./lib/wallets";
import { CHAPTERS_NAV } from "./usecases/vesta/chapters";

// The story sections (spec §3.2), deep-linking into /usecases/vesta anchors.

// Section 1: question-first pillars - what you can do with Verana, asked the
// way a visitor would ask it. Kept intentionally light on prose.
const QUESTION_PILLARS = [
  {
    icon: Landmark,
    tone: "bg-violet-50 text-violet-700",
    mark: "text-violet-600",
    title: "Ecosystems",
    items: [
      "Create your ecosystem: credential schemas, governance framework.",
      "Accredit and onboard participants: issuers, verifiers, holders.",
      "Join existing ecosystem(s).",
    ],
    cta: { label: "Follow the Vesta story", href: "/usecases/vesta" },
  },
  {
    icon: Fingerprint,
    tone: "bg-blue-50 text-blue-700",
    mark: "text-blue-600",
    title: "Identity & accreditation",
    items: [
      "Identify the controller of any service.",
      "See the credentials a service presents.",
      "Verify the accreditations it holds.",
    ],
    cta: { label: "See a live Proof-of-Trust", href: "/personal-wallets" },
  },
];

// The discovery pillar, shown as ask-the-trust-graph question / answer pairs.
const DISCOVERY_QA = [
  {
    q: "Where is the Customer Support AI agent of telco company Red?",
    a: null, // rendered as the full result card below
  },
  {
    q: "Which e-commerce shops sell made-in-Italy sneakers in Paris?",
    a: { icon: Store, text: "3 verified shops found, each operated by an identified company" },
  },
  {
    q: "Which ecosystems issue an ISO 42001 credential?",
    a: { icon: Award, text: "2 ecosystems found, with 14 accredited issuers" },
  },
];

function PersonalWalletHomeTile({ w }: { w: PersonalWallet }) {
  return (
    <Link
      href={`/personal-wallets?wallet=${w.id}`}
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-300"
    >
      {w.icon ? (
        // eslint-disable-next-line @next/next/no-img-element -- pre-optimized small assets from wallets/
        <img src={w.icon} alt="" aria-hidden width={40} height={40}
          className="shrink-0 rounded-lg bg-white object-contain ring-1 ring-black/5" />
      ) : (
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 font-bold text-violet-700">
          {w.name.charAt(0)}
        </span>
      )}
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold text-gray-900">{w.name}</span>
          {w.recommended ? (
            <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
              Recommended
            </span>
          ) : null}
        </span>
        <span className="block truncate text-sm text-gray-500">{w.vendor}</span>
      </span>
    </Link>
  );
}

function BusinessWalletHomeTile({ w }: { w: Integration }) {
  return (
    <Link
      href="/business-wallets"
      className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-violet-300"
    >
      <WalletLogo w={w} size="tile" />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-gray-900">
          {w.name}
        </span>
        <span className="block truncate text-sm text-gray-500">
          {w.organization}
        </span>
      </span>
    </Link>
  );
}

export default function Home() {
  const users = listPersonalWallets();
  const clouds = businessWallets();
  const vsAgent = clouds.find((w) => w.slug === "vs-agent");
  const otherClouds = clouds.filter((w) => w.slug !== "vs-agent");
  const fidesUsecaseUrl = process.env.NEXT_PUBLIC_FIDES_USECASE_URL;

  return (
    <>
      {/* Hero - the verana-demos gradient */}
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-white/90">
            Live on the Verana testnet
          </p>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Try the open trust layer. Live.
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
            Follow a company&apos;s journey into the open trust layer, then try
            it yourself with a real wallet. Real registry entries, real trust
            resolution - nothing simulated.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#learn"
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-6 py-3 font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
            >
              Get started <ArrowDown className="h-4 w-4" />
            </a>
            <Link
              href="/integrate"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-violet-700 transition-colors hover:bg-violet-50"
            >
              Add your wallet
            </Link>
          </div>
        </div>
      </header>

      {fidesUsecaseUrl ? (
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <Container>
            <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-3 text-center text-sm text-gray-600">
              <span>
                This playground is the living evidence of the &ldquo;One
                trust layer, many wallets&rdquo; FIDES use case.
              </span>
              <a
                href={fidesUsecaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-violet-700 hover:underline"
              >
                Support it on FIDES
              </a>
            </p>
          </Container>
        </div>
      ) : null}

      {/* 1 · What can you do with Verana - question-first pillars */}
      <Section id="what-is-verana">
        <Container>
          <SectionHeading
            number={1}
            title="What can you do with Verana?"
            subtitle="Open, public trust infrastructure: ecosystems publish who may issue and verify, services prove who they are, and everything published becomes searchable."
          />
          <div className="reveal-stagger grid gap-4 md:grid-cols-2">
            {QUESTION_PILLARS.map((p) => (
              <div
                key={p.title}
                className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${p.tone}`}
                  >
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                </div>
                <ul className="flex-1 space-y-2.5">
                  {p.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3 text-[0.95rem] font-medium leading-snug text-gray-800"
                    >
                      <CircleCheck
                        className={`mt-0.5 h-4 w-4 shrink-0 ${p.mark}`}
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.cta.href}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:underline"
                >
                  {p.cta.label} <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            ))}
          </div>

          {/* Discovery: ask the trust graph */}
          <div className="reveal mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Discovery</h3>
                <p className="text-sm text-gray-500">
                  Ask the trust graph: find services by what they prove, not
                  what they claim.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {DISCOVERY_QA.map((qa) => (
                <div key={qa.q}>
                  <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3 text-[0.95rem] font-medium leading-snug text-gray-800">
                    <Search
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                      aria-hidden
                    />
                    {qa.q}
                  </div>
                  <div className="mt-2 flex items-start gap-2.5 pl-4 sm:pl-6">
                    <CornerDownRight
                      className="mt-1 h-4 w-4 shrink-0 text-gray-400"
                      aria-hidden
                    />
                    {qa.a ? (
                      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                        <qa.a.icon
                          className="h-4 w-4 shrink-0 text-emerald-600"
                          aria-hidden
                        />
                        {qa.a.text}
                      </p>
                    ) : (
                      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-2.5">
                        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <Bot className="h-4 w-4 text-emerald-600" aria-hidden />
                          Customer Support AI Agent
                        </span>
                        <span className="text-sm text-gray-600">
                          operated by Red Telco
                        </span>
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                          Verified
                        </span>
                        <code
                          className="min-w-0 truncate font-mono text-xs text-gray-500"
                          title="did:webvh:QmRd8fA3vX2kTq9wLmB5cN7sJp:support.red-telco.example"
                        >
                          did:webvh:QmRd8f...support.red-telco.example
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-gray-100 pt-3 text-xs text-gray-400">
              Illustrative preview: discovery queries are answered by the Verana
              trust graph, built from the credentials services publicly present.
            </p>
          </div>

        </Container>
      </Section>

      {/* 2 · Learn step by step - one card per use case */}
      <Section id="learn" className="border-t border-gray-200 bg-white">
        <Container>
          <SectionHeading
            number={2}
            title="Learn step by step"
            subtitle="Each use case is one continuous story, from business problem to full circle - follow it chapter by chapter and take part with your own wallet"
          />
          <div className="reveal-stagger grid gap-4 md:grid-cols-2">
            <Link
              href="/usecases/vesta"
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
            >
              <span className="relative block aspect-[16/9] overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP illustration from public/ */}
                <img
                  src="/images/factory.webp"
                  alt="The Vesta Appliances factory"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </span>
              <span className="flex flex-1 flex-col p-5">
                <span className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    Vesta Appliances
                  </h3>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    {CHAPTERS_NAV.length} chapters
                  </span>
                </span>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">
                  Verana, explained by an appliance maker: Vesta builds its
                  ecosystem, accredits its repair partners, issues employee
                  badges - and impostors get caught at the front door. Real
                  registry entries, live trust resolution.
                </p>
                <span className="mt-3 text-sm font-medium text-violet-600 group-hover:underline">
                  Follow the Vesta story →
                </span>
              </span>
            </Link>
          </div>
        </Container>
      </Section>

      {/* 3 · Personal wallets */}
      <Section id="personal-wallets" className="border-t border-gray-200">
        <Container wide>
          <SectionHeading
            number={3}
            title="Personal wallets"
            subtitle="One playground for every integrated open-source personal wallet: pick your wallet and run the six DemoCredential scenarios"
          />
          {/* items-start: these tiles are a single centered row, so letting the grid
              stretch them to the taller AddYourWalletTile floats their content mid-card. */}
          <div className="reveal-stagger grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((w) => (
              <PersonalWalletHomeTile key={w.id} w={w} />
            ))}
            <AddYourWalletTile />
          </div>
        </Container>
      </Section>

      {/* 4 · Business wallets */}
      <Section id="business-wallets" className="border-t border-gray-200 bg-white">
        <Container wide>
          <SectionHeading
            number={4}
            title="Business wallets"
            subtitle="Every integrated open-source business wallet gets an identical playground page: a hosted, Verana-verified demo service you can exercise end to end"
          />
          {vsAgent ? (
            <Link
              href="/business-wallets"
              className="reveal group mb-6 flex flex-col gap-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-6 shadow-sm transition-colors hover:border-violet-300 sm:flex-row sm:items-center"
            >
              <WalletLogo w={vsAgent} size="tile" />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {vsAgent.name}
                  </span>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                    Featured
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-gray-600">
                  The open source business wallet provided by the Verana
                  Foundation - it runs every verifiable service behind this
                  playground, including the whole Vesta demo cast.
                </span>
              </span>
            </Link>
          ) : null}
          <div className="reveal-stagger grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherClouds.map((w) => (
              <BusinessWalletHomeTile key={w.slug} w={w} />
            ))}
            <AddYourWalletTile />
          </div>
          <p className="reveal mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4 text-violet-600" />
            Business wallets host organizations&apos; verifiable services - like the
            Vesta demo cast behind this playground.
          </p>
        </Container>
      </Section>
    </>
  );
}
