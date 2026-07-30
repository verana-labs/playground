import Link from "next/link";
import {
  Check,
  ExternalLink,
  ShieldCheck,
  ScrollText,
  Fingerprint,
  Search,
  BadgeCheck,
  Building2,
  Landmark,
  Wallet,
} from "lucide-react";
import { Container, Section, SectionHeading } from "./components/ui";
import WalletTile, { AddYourWalletTile } from "./components/WalletTile";
import { ProofOfTrust } from "./components/ProofOfTrust";
import { userWallets, cloudWallets } from "./lib/integrations";
import { SECTIONS_NAV } from "./usecases/vesta/content";
import { LINKS, ENDPOINTS } from "./lib/site";

// The story sections (spec §3.2), deep-linking into /usecases/vesta anchors.

// The concept cards of section 1 (verana-demos ConceptCard idiom).
const CONCEPTS = [
  {
    icon: ScrollText,
    tone: "bg-violet-50 text-violet-700",
    title: "Ecosystems",
    description:
      "Define credential schemas, accredit who may issue and who may verify, and publish their governance on a public registry.",
  },
  {
    icon: Fingerprint,
    tone: "bg-blue-50 text-blue-700",
    title: "Verifiable services & agents",
    description:
      "Services and AI agents identified by a DID, backed by credentials that prove what they are and who operates them.",
  },
  {
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-700",
    title: "Verify first, then connect",
    description:
      "Trust is resolved against the public registry and shown as a Proof-of-Trust before the first interaction - offers and requests are accepted only from authorized issuers and verifiers.",
  },
  {
    icon: Search,
    tone: "bg-amber-50 text-amber-700",
    title: "Discovery",
    description:
      "Because trust is published, it becomes discoverable: find services by what they prove, not what they claim.",
  },
];

const CAN_DO = [
  { icon: Fingerprint, text: "Make your services and agents verifiable" },
  { icon: BadgeCheck, text: "Issue and verify credentials under an ecosystem's governance" },
  { icon: Landmark, text: "Build your own trust ecosystem" },
  { icon: Wallet, text: "Integrate your wallet" },
];

export default function Home() {
  const users = userWallets();
  const clouds = cloudWallets();
  const fidesUsecaseUrl = process.env.NEXT_PUBLIC_FIDES_USECASE_URL;

  return (
    <>
      {/* Hero - Aurora surface with the floating proof */}
      <header className="aurora border-b border-[#efeef6]">
        <span aria-hidden className="blob blob-violet -right-24 -top-44 h-[460px] w-[460px]" />
        <span aria-hidden className="blob blob-amber -left-36 top-1/3 h-[300px] w-[300px]" />
        <span aria-hidden className="blob blob-emerald -bottom-48 left-1/4 h-[360px] w-[360px]" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#e2d9fb] bg-[#f3efff] px-3.5 py-1.5 text-xs font-bold text-violet-700">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live on the Verana testnet - nothing simulated
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#0f1222] md:text-[3.4rem]">
              The trust layer you can{" "}
              <em className="text-gradient not-italic">actually try.</em>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#4c5065]">
              Follow one company&apos;s journey from impostor problem to
              provable trust, then run every demo with a real wallet. Free,
              open source, live.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/usecases/vesta"
                className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
              >
                Start the Vesta story
              </Link>
              <Link
                href="/integrate"
                className="inline-flex items-center gap-2 rounded-xl border border-[#d9d7ea] bg-white/70 px-6 py-3 font-semibold text-[#0f1222] backdrop-blur transition-colors hover:border-violet-300"
              >
                Add your wallet
              </Link>
            </div>
            <p className="mt-8 text-xs font-semibold tracking-wide text-[#8a8da1]">
              INTEGRATED WALLETS -{" "}
              <span className="text-[#42465a]">
                Hologram · Paradym · Procivis · Talao
              </span>{" "}
              + yours
            </p>
          </div>
          <div className="relative hidden min-h-[340px] lg:block">
            <div className="glass-panel float-slow absolute right-2 top-6 w-[330px] rotate-[1.6deg] rounded-2xl p-5">
              <code className="block break-all font-mono text-[10px] text-[#8a8da1]">
                did:webvh:QmPLACEHOLDER…:vesta-anchor.demos.testnet…
              </code>
              <div className="mt-3 flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-600">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>
                  <b className="block text-sm text-[#0f1222]">
                    Vesta Organization Trust Anchor
                  </b>
                  <span className="text-xs text-[#8a8da1]">
                    Service · ECS-Service · Verana ECS Ecosystem
                  </span>
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-black text-emerald-600">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>
                  <b className="block text-sm text-[#0f1222]">
                    Vesta Appliances SA, Geneva
                  </b>
                  <span className="text-xs text-[#8a8da1]">
                    Operated by · ECS-Organization · Helvetia Trust
                  </span>
                </span>
              </div>
              <span className="mt-4 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-extrabold tracking-wide text-white shadow-[0_10px_24px_rgb(13,146,104,0.35)]">
                TRUSTED
              </span>
            </div>
            <div className="glass-panel absolute left-1 top-14 -rotate-3 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-violet-700">
              ECS-Organization
            </div>
            <div className="glass-panel absolute bottom-8 left-8 rotate-2 rounded-2xl px-3.5 py-2.5 text-xs font-bold text-amber-700">
              ISO 9001 · NormaCert
            </div>
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

      {/* 1 · What is Verana */}
      <Section id="what-is-verana">
        <Container>
          <SectionHeading
            number={1}
            title="What is Verana?"
            subtitle="Open, public trust infrastructure - the trust layer of the verifiable internet"
          />
          <div className="reveal-stagger grid gap-4 sm:grid-cols-2">
            {CONCEPTS.map((c) => (
              <div
                key={c.title}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${c.tone}`}
                >
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1 font-semibold text-gray-900">{c.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  {c.description}
                </p>
              </div>
            ))}
          </div>
          <div className="reveal mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
              What you can do with it
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {CAN_DO.map((c) => (
                <div key={c.text} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <c.icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  {c.text}
                </div>
              ))}
            </div>
            <p className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 border-t border-gray-100 pt-4 text-center text-xs text-gray-500">
              <a className="hover:text-violet-700 hover:underline" href={LINKS.veranaIo} target="_blank" rel="noopener noreferrer">verana.io <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden /></a>
              <a className="hover:text-violet-700 hover:underline" href={LINKS.docs} target="_blank" rel="noopener noreferrer">docs.verana.io <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden /></a>
              <a className="hover:text-violet-700 hover:underline" href={LINKS.vtSpecV3} target="_blank" rel="noopener noreferrer">Verifiable Trust spec <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden /></a>
              <a className="hover:text-violet-700 hover:underline" href={LINKS.vprSpecV3} target="_blank" rel="noopener noreferrer">VPR spec <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden /></a>
              <a className="hover:text-violet-700 hover:underline" href={ENDPOINTS.frontend} target="_blank" rel="noopener noreferrer">app.testnet <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden /></a>
            </p>
          </div>
          <div className="reveal mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-gray-500">
              Live from the testnet
            </h3>
            <ProofOfTrust serviceId="issuer-web-vs" title="Live from the testnet" />
          </div>
        </Container>
      </Section>

      {/* 2 · Learn step by step */}
      <Section id="learn" className="border-t border-gray-200 bg-white">
        <Container>
          <SectionHeading
            number={2}
            title="Learn step by step"
            subtitle="Verana, explained by Vesta Appliances - one continuous story, from business problem to full circle, and you take part with your own wallet"
          />
          <div className="reveal-stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SECTIONS_NAV.map((s) => (
              <Link
                key={s.n}
                href={`/usecases/vesta#${s.anchor}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-5 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">
                  {s.oneLiner}
                </p>
                <span className="mt-3 text-sm font-medium text-violet-600 group-hover:underline">
                  Read the section →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* 3 · User wallets */}
      <Section id="user-wallets" className="border-t border-gray-200">
        <Container wide>
          <SectionHeading
            number={3}
            title="User wallets"
            subtitle="Every integrated open-source user wallet gets an identical playground page: receive a badge from Vesta, then log in with it"
          />
          <div className="reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((w) => (
              <WalletTile key={w.slug} w={w} />
            ))}
            <AddYourWalletTile />
          </div>
        </Container>
      </Section>

      {/* 4 · Cloud wallets */}
      <Section id="cloud-wallets" className="border-t border-gray-200 bg-white">
        <Container wide>
          <SectionHeading
            number={4}
            title="Cloud wallets"
            subtitle="Every integrated open-source cloud wallet gets an identical playground page: a hosted, Verana-verified demo service you can exercise end to end"
          />
          <div className="reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clouds.map((w) => (
              <WalletTile key={w.slug} w={w} />
            ))}
            <AddYourWalletTile />
          </div>
          <p className="reveal mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4 text-violet-600" />
            Cloud wallets host organizations&apos; verifiable services - like the
            Vesta demo cast behind this playground.
          </p>
        </Container>
      </Section>
    </>
  );
}
