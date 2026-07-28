import type { Metadata } from "next";
import {
  Container,
  Section,
  SectionHeading,
  Placeholder,
  Breadcrumb,
} from "../components/ui";
import { ProofOfTrust } from "../components/ProofOfTrust";
import { LINKS } from "../lib/site";

export const metadata: Metadata = {
  title: "Verana Explained",
  description:
    "Verana, explained through one continuous story: ACME Corp creates itself in Verana, deploys verifiable services, gets certified, and builds its own trust ecosystem.",
};

// Structure per verana-spec/playground/verana-explained/spec.md.
// This page is the scaffold: each step section will grow into the full
// three-layer format (story · what you see · under the hood).
const STEPS: {
  n: number;
  title: string;
  summary: string;
  substeps: string[];
  pending?: boolean;
}[] = [
  {
    n: 1,
    title: "ACME Corp creates itself in Verana",
    summary:
      "ACME deploys a vs-agent as its Organization anchor (a DID is born), registers as a Corporation, passes KYB with an issuer of the Organization schema, receives its ECS-Organization credential, and self-issues its ECS-Service credential. ACME is now verified — its DID resolvable and TRUSTED by anyone.",
    substeps: [
      "1.1 Create the Organization anchor (vs-agent → DID)",
      "1.2 Become a corporation and get verified as an Organization (KYB → ECS-Organization)",
      "1.3 Self-issue the Service credential (ECS-Service)",
      "1.4 ACME is verified — the trust card",
    ],
  },
  {
    n: 2,
    title: "ACME deploys its services",
    summary:
      "One organization, many services: a customer-support chatbot, an employee badge issuer, and a credential login for its IAM — each its own vs-agent and DID, each holding an ECS-Service credential issued by the anchor. This is where you join in, with your own wallet.",
    substeps: [
      "2.1 Customer support chatbot — chat with it via the Hologram App",
      "2.2 Employee badge issuer — receive an ECS-Badge in your wallet (AnonCreds/DIDComm; Hologram first)",
      "2.3 Credential login — log in to ACME's IAM by presenting your badge",
    ],
  },
  {
    n: 3,
    title: "ACME gets certified (ISO 9001)",
    summary:
      "ACME joins the ISO Certification Ecosystem (demo). The certification body does not re-verify the company: the ECS-Org credential on ACME's DID is the identification. The ISO 9001 credential lands on the Organization DID — and surfaces on every ACME service's Proof-of-Trust.",
    substeps: [
      "Join the ecosystem, pick an accredited issuer",
      "Identify by presenting ECS-Org (reusable KYB)",
      "The enriched trust card, on every service at once",
    ],
  },
  {
    n: 4,
    title: "ACME creates its own ecosystem",
    summary:
      "ACME becomes a governance authority: the ACME Partner Ecosystem, with one Authorized Partner credential — issuance governed (only ACME), verification open (anyone). Zenith Repairs joins; Umbra Corp's fake partner claim fails with a red verdict. Brand impersonation fails structurally.",
    substeps: [
      "4.1 Design the partner program (EGF + schema, permission modes)",
      "4.2 Onboard a partner (Zenith Repairs — reusable KYB, issuer side)",
      "4.3 Anyone can verify a partner claim (you, with your wallet)",
    ],
  },
  {
    n: 5,
    title: "Discovery with the Trust Graph",
    summary:
      "Everything ACME published can be indexed: only verified trust results enter the Trust Graph, and anyone — people, search engines, AI agents — discovers services by what they prove, not what they claim.",
    substeps: [],
    pending: true,
  },
];

export default function Explained() {
  return (
    <>
      {/* Gradient header */}
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[{ label: "Playground", href: "/" }, { label: "Verana Explained" }]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Verana, explained by ACME Corp
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            One continuous story, live on testnet. Organization-side steps are
            watch-only (with source links — nothing is closed); end-user steps
            are hands-on with your own wallet.
          </p>
        </div>
      </header>

      {STEPS.map((s) => (
        <Section
          key={s.n}
          id={`step-${s.n}`}
          className={
            s.n % 2 === 0
              ? "border-t border-gray-200 bg-white"
              : "border-t border-gray-200"
          }
        >
          <Container>
            <SectionHeading
              number={s.n}
              title={
                s.pending ? (
                  <>
                    {s.title}{" "}
                    <span className="align-middle text-sm font-medium text-amber-600">
                      (pending)
                    </span>
                  </>
                ) : (
                  s.title
                )
              }
              subtitle={s.summary}
            />
            {s.substeps.length > 0 ? (
              <ul className="reveal-stagger grid max-w-3xl gap-2">
                {s.substeps.map((sub) => (
                  <li
                    key={sub}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm"
                  >
                    <span className="text-violet-500" aria-hidden>
                      ▸
                    </span>
                    {sub}
                  </li>
                ))}
              </ul>
            ) : null}
            {s.n === 1 ? (
              <div className="mt-6 max-w-3xl">
                <p className="mb-3 text-sm font-medium text-gray-700">
                  Live right now — the ACME anchor&apos;s trust card, resolved
                  against the public registry:
                </p>
                <ProofOfTrust serviceId="organization-vs" />
              </div>
            ) : null}
            <div className="mt-6 max-w-3xl">
              {s.pending ? (
                <Placeholder title="This step will be added later">
                  Summary above; the full step ships once Steps 1–4 are live.
                </Placeholder>
              ) : (
                <Placeholder title="Full interactive step in production">
                  The three-layer walkthrough (story · what you see · under the
                  hood) with live testnet artifacts is being built from its
                  spec.
                </Placeholder>
              )}
            </div>
          </Container>
        </Section>
      ))}

      <Section className="border-t border-gray-200">
        <Container>
          <p className="text-sm text-gray-500">
            The full story specification:{" "}
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
