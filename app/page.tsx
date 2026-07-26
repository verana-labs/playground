import Link from "next/link";
import { Container, Section, SectionHeading, Button, Chip } from "./components/ui";
import WalletTile, { AddYourWalletTile } from "./components/WalletTile";
import { userWallets, cloudWallets } from "./lib/integrations";
import { LINKS, ENDPOINTS, SITE_TAGLINE } from "./lib/site";

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

// What-you-can-do row (spec §3.1).
const CAN_DO = [
  "Make your services and agents verifiable",
  "Issue and verify credentials under an ecosystem's governance",
  "Build your own trust ecosystem",
  "Integrate your wallet",
];

export default function Home() {
  const users = userWallets();
  const clouds = cloudWallets();

  return (
    <>
      {/* Hero */}
      <section className="hero-glow border-b border-rule">
        <Container className="py-20 sm:py-28">
          <p className="eyebrow reveal">[ LIVE ON THE VERANA TESTNET ]</p>
          <h1 className="display reveal mt-5 max-w-3xl text-4xl text-ink sm:text-6xl">
            {SITE_TAGLINE}
          </h1>
          <p className="reveal mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Follow a company&apos;s journey into the open trust layer, then try
            it yourself with a real wallet. Real registry entries, real trust
            resolution — nothing simulated.
          </p>
          <div className="reveal mt-8 flex flex-wrap gap-3">
            <Button href="/explained">Start the tour</Button>
            <Button href="/integrate" variant="ghost">
              Add your wallet
            </Button>
          </div>
        </Container>
      </section>

      {/* 3.1 What is Verana */}
      <Section id="what-is-verana">
        <Container>
          <SectionHeading
            eyebrow="01 · What is Verana"
            title="Open, public trust infrastructure"
            intro="The trust layer of the verifiable internet."
          />
          <div className="reveal mt-6 max-w-3xl space-y-4 text-muted">
            <p>
              On Verana, <strong className="text-ink">ecosystems</strong> define
              credential schemas, accredit who may{" "}
              <strong className="text-ink">issue</strong> and who may{" "}
              <strong className="text-ink">verify</strong>, and publish their
              governance on a public registry.{" "}
              <strong className="text-ink">Services and AI agents</strong>{" "}
              become verifiable: identified by a DID, backed by credentials that
              prove <em>what they are</em> and <em>who operates them</em>.
            </p>
            <p>
              Anyone — a person&apos;s wallet, another service —{" "}
              <strong className="text-ink">verifies first, then connects</strong>:
              trust is resolved against the public registry and shown as a{" "}
              <strong className="text-ink">Proof-of-Trust</strong> before the
              first interaction. Credential offers and presentation requests are
              accepted only from <strong className="text-ink">authorized</strong>{" "}
              issuers and verifiers. And because trust is published, it becomes{" "}
              <strong className="text-ink">discoverable</strong>: find services
              by what they prove, not what they claim.
            </p>
          </div>
          <div className="reveal-stagger mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CAN_DO.map((c) => (
              <div key={c} className="card p-4 text-sm text-muted">
                <span className="text-success-ink" aria-hidden>
                  ✓
                </span>{" "}
                {c}
              </div>
            ))}
          </div>
          <p className="reveal mt-6 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted">
            <a className="hover:text-accent" href={LINKS.veranaIo} target="_blank" rel="noopener noreferrer">verana.io ↗</a>
            <a className="hover:text-accent" href={LINKS.docs} target="_blank" rel="noopener noreferrer">docs.verana.io ↗</a>
            <a className="hover:text-accent" href={LINKS.vtSpecV3} target="_blank" rel="noopener noreferrer">Verifiable Trust spec ↗</a>
            <a className="hover:text-accent" href={LINKS.vprSpecV3} target="_blank" rel="noopener noreferrer">VPR spec ↗</a>
            <a className="hover:text-accent" href={ENDPOINTS.frontend} target="_blank" rel="noopener noreferrer">app.testnet.verana.network ↗</a>
          </p>
        </Container>
      </Section>

      {/* 3.2 Learn step by step */}
      <Section id="learn" className="border-t border-rule bg-surface">
        <Container>
          <SectionHeading
            eyebrow="02 · Learn step by step"
            title="Verana, explained by ACME Corp"
            intro="One continuous story: a fictional corporation creates itself in Verana — and you take part with your own wallet."
          />
          <div className="reveal-stagger mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((s) => (
              <Link
                key={s.n}
                href={`/explained#step-${s.n}`}
                className="card group flex flex-col p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-center justify-between">
                  <span className="eyebrow">Step {s.n}</span>
                  {s.pending ? <Chip tone="pending">pending</Chip> : null}
                </div>
                <h3 className="display mt-3 text-xl text-ink">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{s.oneLiner}</p>
                <span className="mt-4 text-sm text-accent group-hover:underline">
                  Read the step →
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </Section>

      {/* 3.3 User wallets */}
      <Section id="user-wallets" className="border-t border-rule">
        <Container>
          <SectionHeading
            eyebrow="03 · User wallets"
            title="Try it with a real wallet"
            intro="Every integrated open-source user wallet gets an identical playground page: receive a badge from ACME, then log in with it."
          />
          <div className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {users.map((w) => (
              <WalletTile key={w.slug} w={w} />
            ))}
            <AddYourWalletTile />
          </div>
        </Container>
      </Section>

      {/* 3.4 Cloud wallets */}
      <Section id="cloud-wallets" className="border-t border-rule bg-surface">
        <Container>
          <SectionHeading
            eyebrow="04 · Cloud wallets"
            title="Host verifiable services"
            intro="Every integrated open-source cloud wallet gets an identical playground page: a hosted, Verana-verified demo service you can exercise end to end."
          />
          <div className="reveal-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clouds.map((w) => (
              <WalletTile key={w.slug} w={w} />
            ))}
            <AddYourWalletTile />
          </div>
        </Container>
      </Section>
    </>
  );
}
