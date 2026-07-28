import type { Metadata } from "next";
import {
  Container,
  Section,
  SectionHeading,
  Placeholder,
  Breadcrumb,
  Chip,
} from "../../components/ui";
import { ProofOfTrust } from "../../components/ProofOfTrust";
import { LINKS } from "../../lib/site";

export const metadata: Metadata = {
  title: "Vesta Appliances — a Verana use case",
  description:
    "One continuous story: Vesta Appliances, a real-feeling business with an impostor problem, becomes verifiable on Verana and ends up governing trust for its own repair network.",
};

// Structure per verana-spec/playground/verana-explained/spec.md (DRAFT 0.5):
// one single page, five sections with #section-N anchors, register-shifting
// from marketing article to technical build. This is the v1 scaffold; the full
// §1 article and the progressive scene graph ship at M5.
const SECTIONS: {
  n: number;
  title: string;
  chips: string[];
  summary: string;
  substeps: string[];
}[] = [
  {
    n: 1,
    title: "Meet Vesta Appliances",
    chips: ["story"],
    summary:
      "Quality home appliances since 1985 — ~200 employees, 40+ countries, 120 certified repair partners. Online: Agentic Support, employee badges, a partner portal. And a problem: fake support lines, password pain, endless re-verification paperwork, impostor repairers with printed panels on the van. Online or at the front door, Vesta's word looks exactly like the scammers' word. Nothing can be proven.",
    substeps: [
      "The certified repair network — real training and audits, but the badge is paper: anyone can print one",
      "The problems and what they cost: refund scams in Vesta's name, customers scammed at their own front door",
      "“That has to change.” — Elena Vasquez, CEO",
    ],
  },
  {
    n: 2,
    title: "The solution: become verifiable",
    chips: ["story"],
    summary:
      "CTO Marc Keller: the open-source wallets exist, and there is Verana, a public trust infrastructure — everything needed to make Vesta and its partner network a network of verifiable organizations. His checklist: verifiable identities for organizations and services, credentials people can hold, certifications as proof (not PDFs), and Vesta's own rules for its network.",
    substeps: [
      "Verana's three pillars: Trust Ecosystems · Verifiable Trust · the Trust Graph",
      "Vesta joins as HOLDER: the Verana ECS Ecosystem (the identity card) and the ISO Certification Ecosystem (demo)",
      "Vesta will build its own: the Vesta Repair Network (operates as ECOSYSTEM)",
    ],
  },
  {
    n: 3,
    title: "Joining the ecosystems",
    chips: ["watch"],
    summary:
      "Vesta deploys a vs-agent as its Organization anchor — a DID is born. It passes Know-Your-Business once with an accredited issuer and receives ECS-Organization. Then the shortcut that shows the model's power: the ISO certification body never re-verifies Vesta — it identifies Vesta by the ECS-Org credential and issues ISO 9001-style (demo) straight to the same DID.",
    substeps: [
      "3.1 Vesta gets its digital identity (vs-agent → did:webvh)",
      "3.2 Joining ECS: proving who they are — once (KYB → ECS-Organization)",
      "3.3 Joining ISO Certification: the certificate becomes proof, no re-KYB",
    ],
  },
  {
    n: 4,
    title: "Making the services verifiable",
    chips: ["watch", "hands-on"],
    summary:
      "The anchor self-issues ECS-Service and turns green: resolve it and the check is TRUSTED. Each real service — Agentic Support, the employee badge issuer, the portal login — becomes its own Verifiable Service. This is where you join in: receive an ECS-Badge in an integrated wallet, then log in to the portal by presenting it. No password ever existed.",
    substeps: [
      "4.1 The anchor turns green (self-issued ECS-Service, valid because ECS-Org is proven)",
      "4.2 Hands-on: Agentic Support via Hologram · your ECS-Badge · passwordless login",
      "The ISO 9001-style credential surfaces on every service's card at once",
    ],
  },
  {
    n: 5,
    title: "Vesta creates its own ecosystem",
    chips: ["story", "watch", "hands-on"],
    summary:
      "Umbra Repairs is still ringing doorbells — because “who is an authorized Vesta repairer” is a question only Vesta can answer. Vesta creates the Vesta Repair Network with one schema: Authorized Repairer — issuance governed (only Vesta issues), verification open (anyone checks). Zenith Repairs earns it; Umbra never can. Resolve both: Zenith green, Umbra red. Brand impersonation fails structurally.",
    substeps: [
      "5.1 The last problem standing — and why only Vesta can solve it",
      "5.2 The Vesta Repair Network: governance, one schema, Zenith onboarded by its ECS-Org",
      "5.3 Full circle: Zenith ✓ · Umbra ✗ · rogue partners revocable",
    ],
  },
];

export default function VestaUseCase() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Use Cases" },
              { label: "Vesta Appliances" },
            ]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Vesta Appliances: from impostors to proof
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            One continuous story, live on testnet. It starts as a company page —
            no protocol vocabulary — and becomes technical only as Vesta builds.
            Watch-steps link their source; hands-on steps use your own wallet.
          </p>
        </div>
      </header>

      {SECTIONS.map((s) => (
        <Section
          key={s.n}
          id={`section-${s.n}`}
          className={
            s.n % 2 === 0
              ? "border-t border-gray-200 bg-white"
              : "border-t border-gray-200"
          }
        >
          <Container>
            <div className="mb-2 flex gap-2">
              {s.chips.map((c) => (
                <Chip key={c} tone={c === "hands-on" ? "verified" : "default"}>
                  {c}
                </Chip>
              ))}
            </div>
            <SectionHeading number={s.n} title={s.title} subtitle={s.summary} />
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
            {s.n === 3 ? (
              <div className="mt-6 max-w-3xl">
                <p className="mb-3 text-sm font-medium text-gray-700">
                  Live right now — the demo anchor&apos;s trust card, resolved
                  against the public registry (the verana-demos anchor stands in
                  until the Vesta cast is deployed):
                </p>
                <ProofOfTrust serviceId="organization-vs" />
              </div>
            ) : null}
            <div className="mt-6 max-w-3xl">
              {s.n === 1 ? (
                <Placeholder title="The full marketing article is in production">
                  Brand header, product line, the certified-repair-network
                  diagram, the problems grid and the CEO&apos;s word — §1 ships
                  as a full company-page article, with no protocol vocabulary.
                </Placeholder>
              ) : (
                <Placeholder title="Progressive scene graph in production">
                  Sections 3–5 share one master diagram of Vesta&apos;s world
                  that transforms stage by stage — gray services turn verified,
                  the customer&apos;s ? resolves, impostors turn red.
                </Placeholder>
              )}
            </div>
          </Container>
        </Section>
      ))}

      <Section className="border-t border-gray-200 bg-white">
        <Container>
          <SectionHeading
            title="Being found"
            subtitle="Everything Vesta published is public, resolvable, indexable. The Trust Graph turns that into discovery: people, search engines and AI agents find services by what they prove — ISO 9001-style certified manufacturers, authorized Vesta repairers. Full walkthrough ships later."
          />
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
