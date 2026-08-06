import type { Metadata } from "next";
import { Container, Section, Breadcrumb } from "../components/ui";
import { LINKS, ENDPOINTS, ECS_ECOSYSTEM_DID } from "../lib/site";
import { DidBadge } from "../components/Did";

export const metadata: Metadata = {
  title: "About",
  description:
    "What is real and what is demo on the Verana Playground, who operates it, and where everything links.",
};

export default function About() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14">
          <Breadcrumb onDark items={[{ label: "Playground", href: "/" }, { label: "About" }]} />
          <h1 className="mt-6 text-4xl font-bold md:text-5xl">About this playground</h1>
        </div>
      </header>
      <Section>
        <Container className="prose-body">
          <h2>What is real</h2>
          <p>
            Everything runs against the public <strong>Verana testnet</strong>:
            registry entries, DIDs, credentials, and trust resolutions are real
            protocol operations, reproducible by anyone through the{" "}
            <a href={`${ENDPOINTS.resolver}/docs`} target="_blank" rel="noopener noreferrer">
              public resolver
            </a>{" "}
            and the{" "}
            <a href={ENDPOINTS.frontend} target="_blank" rel="noopener noreferrer">
              network frontend
            </a>
            . Nothing is simulated; live data is shown real or not at all.
          </p>
          <h2>What is demo</h2>
          <p>
            All featured entities - Vesta Appliances, the ISO Certification
            Ecosystem, CertBody issuers, Umbra Repairs, Zenith Repairs - are{" "}
            <strong>fictional</strong> and labeled <em>(demo)</em>. Credentials
            referring to ISO standards are &ldquo;ISO 9001-<em>style</em>{" "}
            (demo)&rdquo; and imply no real certification. The trusted ECS
            ecosystem anchor used by this site is{" "}
            <DidBadge did={ECS_ECOSYSTEM_DID} className="text-xs" />.
          </p>
          <h2>Protocol version</h2>
          <p>
            The playground targets Verifiable Trust / VPR <strong>v3</strong> - 
            what runs on testnet today (
            <a href={LINKS.vtSpec} target="_blank" rel="noopener noreferrer">VT spec</a>,{" "}
            <a href={LINKS.vprSpecV3} target="_blank" rel="noopener noreferrer">VPR spec v3</a>
            ). Badge flows run over AnonCreds/DIDComm for now; OpenID4VC follows.
          </p>
          <h2>Who operates it</h2>
          <p>
            The playground is operated by the <strong>Verana Foundation</strong>{" "}
            (in formation, stewarded by 2060 OÜ). The site and every demo
            service are open source:{" "}
            <a href={LINKS.repo} target="_blank" rel="noopener noreferrer">
              verana-labs/playground
            </a>{" "}
            (this site),{" "}
            <a href={LINKS.veranaDemos} target="_blank" rel="noopener noreferrer">
              verana-labs/verana-demos
            </a>{" "}
            (the demo services), and the{" "}
            <a href={LINKS.spec} target="_blank" rel="noopener noreferrer">
              specification
            </a>{" "}
            it is built from.
          </p>
          <h2>License</h2>
          <p>Site content CC BY-SA 4.0 · code Apache-2.0.</p>
        </Container>
      </Section>
    </>
  );
}
