import type { Metadata } from "next";
import { Container, Section, SectionHeading, Button, Breadcrumb } from "../components/ui";
import { LINKS } from "../lib/site";

export const metadata: Metadata = {
  title: "Add your wallet",
  description:
    "Integrate your open-source user or cloud wallet with Verana and get your own playground page: guidelines, integration.yaml, and the PR process.",
};

const YAML_EXAMPLE = `# integrations/<your-slug>/integration.yaml
name: Your Wallet
organization: Your Org
kind: user-wallet          # user-wallet | cloud-wallet
repo: https://github.com/your-org/your-wallet
license: Apache-2.0        # OSI-approved license required
track: bridge              # user: native | bridge · cloud: native | sidecar | bridge
scenarios: [iso-certification-loop]
demo_video: https://…
download: https://…        # mobile: direct APK · web/cloud: URL
contact: you@example.org`;

export default function Integrate() {
  return (
    <>
      <section className="hero-glow border-b border-rule">
        <Container className="py-14 sm:py-16">
          <Breadcrumb items={[{ label: "Playground", href: "/" }, { label: "Add your wallet" }]} />
          <h1 className="display mt-6 max-w-3xl text-4xl text-ink sm:text-5xl">
            Add your wallet
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Open source? Integrate Verana the same way every wallet does, pass
            one acceptance loop, and get your own playground page — identical to
            every other wallet&apos;s, with your name on it.
          </p>
        </Container>
      </section>

      <Section>
        <Container className="max-w-3xl space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <a href={LINKS.guidelineUserWallet} target="_blank" rel="noopener noreferrer" className="card group p-6 transition-colors hover:border-primary">
              <span className="eyebrow">Guideline</span>
              <h2 className="display mt-2 text-xl text-ink">User wallets</h2>
              <p className="mt-2 text-sm text-muted">
                Trust resolution (Q1/Q2/Q3), the uniform Proof-of-Trust
                presentation, tracks (native DIDComm / OID4VC bridge), and the
                acceptance test.
              </p>
              <span className="mt-3 inline-block text-sm text-accent group-hover:underline">
                Read it ↗
              </span>
            </a>
            <a href={LINKS.guidelineCloudWallet} target="_blank" rel="noopener noreferrer" className="card group p-6 transition-colors hover:border-primary">
              <span className="eyebrow">Guideline</span>
              <h2 className="display mt-2 text-xl text-ink">Cloud wallets</h2>
              <p className="mt-2 text-sm text-muted">
                Resolvable DIDs (did:web / did:webvh), ECS onboarding, domain
                credentials, authorized issue/verify, and the patterns (native /
                sidecar / bridge).
              </p>
              <span className="mt-3 inline-block text-sm text-accent group-hover:underline">
                Read it ↗
              </span>
            </a>
          </div>

          <div className="card p-6">
            <SectionHeading
              eyebrow="The process"
              title="Three steps to your page"
            />
            <ol className="mt-5 space-y-3 text-sm text-muted">
              <li>
                <strong className="text-ink">1 · Integrate</strong> — follow the
                guideline for your wallet kind (the resolver call, the
                Proof-of-Trust pattern, the authorization checks).
              </li>
              <li>
                <strong className="text-ink">2 · Record the acceptance loop</strong>{" "}
                — one uncut run of the ISO Certification loop, per the
                guideline&apos;s test section.
              </li>
              <li>
                <strong className="text-ink">3 · Open a PR</strong> — add your
                descriptor under <code className="font-mono">integrations/&lt;slug&gt;/</code>{" "}
                in{" "}
                <a className="text-accent underline" href={LINKS.repo} target="_blank" rel="noopener noreferrer">
                  verana-labs/playground
                </a>
                :
              </li>
            </ol>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-rule bg-surface-2 p-4 font-mono text-xs text-muted">
              {YAML_EXAMPLE}
            </pre>
            <p className="mt-4 text-sm text-muted">
              Requirements: OSI-approved license · the wallet is obtainable from
              its tile (mobile: direct APK; web/cloud: URL) · acceptance
              recording attached to the PR. Listed organizations may use the
              &ldquo;Runs on the Verana open trust layer&rdquo; badge.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button href={LINKS.repo} external>
              Open a PR ↗
            </Button>
            <Button href={LINKS.spec} variant="ghost" external>
              Full spec ↗
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
