import type { Metadata } from "next";
import { Container, Section, Button, Breadcrumb } from "../components/ui";
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
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb onDark items={[{ label: "Playground", href: "/" }, { label: "Add your wallet" }]} />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Add your wallet
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Open source? Integrate Verana the same way every wallet does, pass
            one acceptance loop, and get your own playground page - identical to
            every other wallet&apos;s, with your name on it.
          </p>
        </div>
      </header>

      <Section>
        <Container className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <a href={LINKS.guidelineUserWallet} target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Guideline</span>
              <h2 className="mt-2 text-xl font-bold text-gray-900">User wallets</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Trust resolution (Q1/Q2/Q3), the uniform Proof-of-Trust
                presentation, tracks (native DIDComm / OID4VC bridge), and the
                acceptance test.
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-violet-600 group-hover:underline">
                Read it ↗
              </span>
            </a>
            <a href={LINKS.guidelineCloudWallet} target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Guideline</span>
              <h2 className="mt-2 text-xl font-bold text-gray-900">Cloud wallets</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Resolvable DIDs (did:web / did:webvh), ECS onboarding, domain
                credentials, authorized issue/verify, and the patterns (native /
                sidecar / bridge).
              </p>
              <span className="mt-3 inline-block text-sm font-medium text-violet-600 group-hover:underline">
                Read it ↗
              </span>
            </a>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Three steps to your page</h2>
            <ol className="mt-5 space-y-3 text-sm text-gray-600">
              <li>
                <strong className="text-gray-900">1 · Integrate</strong> - follow the
                guideline for your wallet kind (the resolver call, the
                Proof-of-Trust pattern, the authorization checks).
              </li>
              <li>
                <strong className="text-gray-900">2 · Record the acceptance loop</strong>{" "}
                - one uncut run of the ISO Certification loop, per the
                guideline&apos;s test section.
              </li>
              <li>
                <strong className="text-gray-900">3 · Open a PR</strong> - add your
                descriptor under <code>integrations/&lt;slug&gt;/</code>{" "}
                in{" "}
                <a className="text-violet-600 underline" href={LINKS.repo} target="_blank" rel="noopener noreferrer">
                  verana-labs/playground
                </a>
                :
              </li>
            </ol>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-gray-900 p-4 font-mono text-xs leading-relaxed text-gray-100">
              {YAML_EXAMPLE}
            </pre>
            <p className="mt-4 text-sm text-gray-500">
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
