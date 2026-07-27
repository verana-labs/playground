import Link from "next/link";
import {
  ArrowDown,
  ShieldCheck,
  ScrollText,
  Fingerprint,
  Search,
  BadgeCheck,
  Building2,
  Landmark,
  Wallet,
} from "lucide-react";
import { Container, Section, SectionHeading, Chip } from "./components/ui";
import WalletTile, { AddYourWalletTile } from "./components/WalletTile";
import { ProofOfTrust } from "./components/ProofOfTrust";
import { userWallets, cloudWallets } from "./lib/integrations";
import { LINKS, ENDPOINTS } from "./lib/site";

// The five Verana Explained step cards (spec §3.2), linking into /explained.
const STEPS: {
  n: number;
  title: string;
  oneLiner: string;
  pending?: boolean;
}[] = [
  {
    n: 1,
    title: "ACME Corp creates itself in Verana",
    oneLiner:
      "Deploy an Organization anchor, get verified (KYB → ECS-Organization), self-issue ECS-Service: a resolvable, trusted DID.",
  },
  {
    n: 2,
    title: "ACME deploys its services",
    oneLiner:
      "Support chatbot, employee badge issuer, credential login — each its own DID, provably ACME's.",
  },
  {
    n: 3,
    title: "ACME gets certified (ISO 9001)",
    oneLiner:
      "No re-KYB: the ECS-Org credential is the identification; the certification travels everywhere ACME acts.",
  },
  {
    n: 4,
    title: "ACME creates its own ecosystem",
    oneLiner:
      "The ACME Partner Ecosystem: governed issuance, open verification — brand impersonation fails structurally.",
  },
  {
    n: 5,
    title: "Discovery with the Trust Graph",
    oneLiner: "Find services by what they prove, not what they claim.",
    pending: true,
  },
];

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
      "Trust is resolved against the public registry and shown as a Proof-of-Trust before the first interaction — offers and requests are accepted only from authorized issuers and verifiers.",
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

  return (
    <>
      {/* Hero — the verana-demos gradient */}
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-20">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-white/70">
            Live on the Verana testnet
          </p>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">
            Try the open trust layer. Live.
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white/80">
            Follow a company&apos;s journey into the open trust layer, then try
            it yourself with a real wallet. Real registry entries, real trust
            resolution — nothing simulated.
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

      {/* 1 · What is Verana */}
      <Section id="what-is-verana">
        <Container>
          <SectionHeading
            number={1}
            title="What is Verana?"
            subtitle="Open, public trust infrastructure — the trust layer of the verifiable internet"
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
              <a className="hover:text-violet-700 hover:underline" href={LINKS.veranaIo} target="_blank" rel="noopener noreferrer">verana.io ↗</a>
              <a className="hover:text-violet-700 hover:underline" href={LINKS.docs} target="_blank" rel="noopener noreferrer">docs.verana.io ↗</a>
              <a className="hover:text-violet-700 hover:underline" href={LINKS.vtSpecV3} target="_blank" rel="noopener noreferrer">Verifiable Trust spec ↗</a>
              <a className="hover:text-violet-700 hover:underline" href={LINKS.vprSpecV3} target="_blank" rel="noopener noreferrer">VPR spec ↗</a>
              <a className="hover:text-violet-700 hover:underline" href={ENDPOINTS.frontend} target="_blank" rel="noopener noreferrer">app.testnet ↗</a>
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
            subtitle="Verana, explained by ACME Corp — one continuous story, and you take part with your own wallet"
          />
          <div className="reveal-stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <Link
                key={s.n}
                href={`/explained#step-${s.n}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-5 transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                    {s.n}
                  </span>
                  {s.pending ? <Chip tone="pending">pending</Chip> : null}
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-500">
                  {s.oneLiner}
                </p>
                <span className="mt-3 text-sm font-medium text-violet-600 group-hover:underline">
                  Read the step →
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
            subtitle="Every integrated open-source user wallet gets an identical playground page: receive a badge from ACME, then log in with it"
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
            Cloud wallets host organizations&apos; verifiable services — like the
            ACME demo cast behind this playground.
          </p>
        </Container>
      </Section>
    </>
  );
}
