import type { Metadata } from "next";
import { Container, Section, SectionHeading, Chip, Placeholder, Breadcrumb } from "../components/ui";
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
      <section className="hero-glow border-b border-rule">
        <Container className="py-14 sm:py-16">
          <Breadcrumb items={[{ label: "Playground", href: "/" }, { label: "Verana Explained" }]} />
          <h1 className="display mt-6 max-w-3xl text-4xl text-ink sm:text-5xl">
            Verana, explained by ACME Corp
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            One continuous story, live on testnet. Organization-side steps are
            watch-only (with source links — nothing is closed); end-user steps
            are hands-on with your own wallet.
          </p>
        </Container>
      </section>

      {STEPS.map((s) => (
        <Section key={s.n} id={`step-${s.n}`} className={s.n % 2 === 0 ? "border-t border-rule bg-surface" : "border-t border-rule"}>
          <Container>
            <SectionHeading
              eyebrow={`Step ${s.n}${s.pending ? " · pending" : ""}`}
              title={s.title}
              intro={s.summary}
            />
            {s.substeps.length > 0 ? (
              <ul className="reveal-stagger mt-6 grid max-w-3xl gap-2">
                {s.substeps.map((sub) => (
                  <li key={sub} className="card flex items-center gap-3 px-4 py-3 text-sm text-muted">
                    <span className="font-mono text-xs text-accent" aria-hidden>
                      ▸
                    </span>
                    {sub}
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-6 max-w-3xl">
              {s.pending ? (
                <Placeholder title="This step will be added later">
                  Summary above; the full step ships once Steps 1–4 are live.
                </Placeholder>
              ) : (
                <Placeholder title="Full interactive step in production">
                  The three-layer walkthrough (story · what you see · under the
                  hood) with live testnet artifacts is being built from{" "}
                  <a
                    className="text-accent underline"
                    href={`${LINKS.spec}/verana-explained/spec.md`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    its spec
                  </a>
                  .
                </Placeholder>
              )}
            </div>
          </Container>
        </Section>
      ))}

      <Section className="border-t border-rule">
        <Container className="flex flex-wrap items-center gap-3">
          <Chip>the full story spec</Chip>
          <a
            className="text-sm text-accent hover:underline"
            href={`${LINKS.spec}/verana-explained/spec.md`}
            target="_blank"
            rel="noopener noreferrer"
          >
            verana-spec / playground / verana-explained ↗
          </a>
        </Container>
      </Section>
    </>
  );
}
