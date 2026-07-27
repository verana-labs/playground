// The full "Verana Explained" story content — one page per step, one
// diagram stage + reproduce recipe per sub-step.
// Source of truth: verana-spec → playground/verana-explained/spec.md.
// Protocol facts target v3 (spec-v3.md); the reproduce recipes follow the
// current verana-frontend UX: ecosystem → credential schema → participants
// tree → Join from the branch you want to join under.

import { ENDPOINTS, LINKS } from "../lib/site";
import type { Stage } from "./scenes";

export type SubStep = {
  id: string;
  stage: Stage;
  title: string;
  /** watch = organization-side, follow along with source links.
   *  hands-on = you do it, with your own wallet. */
  kind: "watch" | "hands-on";
  story: string;
  underHood: string[];
  reproduce: string[];
  links?: { label: string; href: string }[];
  /** Render the live trust card for this demo service after the recipe. */
  liveService?: string;
};

export type StepPage = {
  n: number;
  slug: string;
  title: string;
  intro: string;
  pending?: boolean;
  substeps: SubStep[];
};

const app = ENDPOINTS.frontend;
const resolver = ENDPOINTS.resolver;

export const STEP_PAGES: StepPage[] = [
  {
    n: 1,
    slug: "step-1",
    title: "ACME Corp creates itself in Verana",
    intro:
      "A company becomes verifiable in four moves: deploy an anchor (a DID is born), pass KYB once to get the ECS-Organization credential, self-issue the ECS-Service credential, and turn green. Watch it happen — every artifact is live on testnet, and every move is reproducible.",
    substeps: [
      {
        id: "1.1",
        stage: "1.1",
        title: "Create the Organization anchor",
        kind: "watch",
        story:
          "ACME deploys a vs-agent — a small cloud wallet service — as its Organization anchor. At this point ACME is nothing but a DID: no name anyone can trust, no credentials, no services. Just an identifier that resolves to a DID Document.",
        underHood: [
          "The vs-agent publishes a DID Document (did:webvh) with a DIDComm service endpoint at https://<host>/.well-known/did.json.",
          "Nothing is on the Verana registry yet — resolving this DID through the trust resolver returns UNTRUSTED: it exists, but proves nothing.",
        ],
        reproduce: [
          "Deploy a vs-agent on a public domain (Docker image + compose examples in the vs-agent repo; the verana-demos organization-vs service is a working template).",
          "Open https://<your-host>/.well-known/did.json — that document is your anchor's DID.",
          `Query the trust resolver: ${resolver}/v1/trust/resolve?did=<your-did> — status UNTRUSTED. That's the starting line.`,
        ],
        links: [
          { label: "vs-agent", href: "https://github.com/2060-io/vs-agent" },
          { label: "verana-demos · organization-vs", href: LINKS.veranaDemos },
        ],
      },
      {
        id: "1.2",
        stage: "1.2",
        title: "Get verified as an Organization (KYB → ECS-Organization)",
        kind: "watch",
        story:
          "ACME joins the ECS Ecosystem — the root trust registry that governs the Essential Credential Schemas. An accredited issuer runs Know-Your-Business once, over DIDComm, then issues the ECS-Organization credential to ACME's DID. The anchor finally has a name that is proven, not claimed.",
        underHood: [
          "Joining creates a HOLDER permission on the Organization schema via Start Permission VP — the validator is the issuer you joined under.",
          "After KYB, the issuer confirms with Set Permission VP to Validated; the permission becomes ACTIVE and part of the public permission tree.",
          "The credential is issued over DIDComm and published by the vs-agent as a Linked Verifiable Presentation in the DID Document — that's what any wallet verifies later.",
        ],
        reproduce: [
          `Create a testnet account and get VNA from the faucet, then open the Verana app: ${app}.`,
          "Go to Discover & Join → open the ECS Ecosystem → open the Organization credential schema → open Participants.",
          "In the permission tree, pick an active Issuer branch and click Join: you apply as Holder under that issuer, and it becomes your validator. Enter your anchor DID and submit.",
          "Complete the KYB exchange with the issuer's service over DIDComm (in the demo, the organization-vs issuer plays this role).",
          "When the issuer validates, the ECS-Organization credential is issued to your anchor; the vs-agent links it as a Linked VP automatically.",
        ],
        links: [
          { label: "Verana app", href: app },
          { label: "Faucet", href: ENDPOINTS.faucet },
        ],
      },
      {
        id: "1.3",
        stage: "1.3",
        title: "Self-issue the Service credential (ECS-Service)",
        kind: "watch",
        story:
          "A verifiable service must also describe itself: name, type, description, logo. ACME self-issues the ECS-Service credential on the same DID — valid because the same DID already presents a proven ECS-Organization.",
        underHood: [
          "ACME needs an issuance permission on the ECS-Service schema; depending on the schema's permission-management mode this is granted through the tree (validation) or self-created (OPEN mode, Create Permission).",
          "Self-issuance is legitimate under the Verifiable Trust spec precisely because the service DID also presents its ECS-Org credential — identity and description are bound to one DID.",
        ],
        reproduce: [
          "In the app, open the ECS Ecosystem → Service credential schema → Participants, and join the tree on the issuer side for your DID.",
          "Issue the ECS-Service credential to yourself through the vs-agent Admin API and link it (the verana-demos scripts wrap this: discover the schema, issue, publish as Linked VP).",
        ],
        links: [
          { label: "verana-demos scripts", href: LINKS.veranaDemos },
          { label: "Verifiable Trust spec (v3)", href: LINKS.vtSpecV3 },
        ],
      },
      {
        id: "1.4",
        stage: "1.4",
        title: "ACME is verified — the trust card",
        kind: "watch",
        story:
          "Resolve ACME's DID now and everything changes: TRUSTED, with the ECS-Organization and ECS-Service credentials verified back to the ECS Ecosystem. This exact card — resolved live below — is what every integrated wallet must show, the same way, everywhere.",
        underHood: [
          "The trust resolver walks each Linked VP: credential signature → issuer DID → issuer's permission in the registry → up the tree to the ecosystem root.",
          "One resolvable DID + proven Organization + proven Service = a Verifiable Service. That's the whole formula.",
        ],
        reproduce: [
          `Query ${resolver}/v1/trust/resolve?did=<your-did>&detail=full and read the credential list and permission chains.`,
          "Or just look at the live card below — it is the ACME anchor (organization-vs), resolved on page load.",
        ],
        liveService: "organization-vs",
      },
    ],
  },
  {
    n: 2,
    slug: "step-2",
    title: "ACME deploys its services",
    intro:
      "One organization, many services: a support chatbot, an employee badge issuer, and a credential login — each its own vs-agent and DID, each carrying an ECS-Service credential issued by the anchor. This is where the story becomes hands-on: you join it with your own wallet.",
    substeps: [
      {
        id: "2.1",
        stage: "2.1",
        title: "Customer support chatbot — chat with it",
        kind: "hands-on",
        story:
          "ACME launches a support chatbot as a separate verifiable service. Before you type a single word, your wallet resolves the chatbot's DID and shows the Proof-of-Trust: this service is ACME's, and ACME is real.",
        underHood: [
          "The chatbot has its own DID; its ECS-Service credential is issued by the anchor (delegated issuance), so its trust chain passes through ACME's ECS-Organization.",
          "The DIDComm connection is established only after your wallet has resolved and displayed the trust result — trust before contact.",
        ],
        reproduce: [
          "Install the Hologram Messaging app (links on the Hologram wallet page).",
          "Scan the chatbot invitation QR from this playground and review the Proof-of-Trust card: green check, Service block, Operated-by ACME block.",
          "Chat. You are talking to a verifiable service over DIDComm.",
        ],
        links: [{ label: "Hologram wallet page", href: "/user-wallets/hologram" }],
      },
      {
        id: "2.2",
        stage: "2.2",
        title: "Employee badge — receive an ECS-Badge in your wallet",
        kind: "hands-on",
        story:
          "ACME's badge issuer offers you an ACME badge credential. Before accepting, your wallet checks the offer against the registry: is this issuer actually permitted to issue ECS-Badge? Only then does the credential land in your wallet.",
        underHood: [
          "The badge issuer holds an ISSUER permission on the ECS-Badge schema in the ECS Ecosystem — visible in the public permission tree.",
          "The wallet-side rule (guideline UW-POT): on any credential offer, verify the issuer's authorization for that schema before accepting. Untrusted or unauthorized → warn and stop.",
          "Format today: AnonCreds over DIDComm, Hologram first. OpenID4VC follows when available.",
        ],
        reproduce: [
          "From this playground, open the badge issuer invitation with your wallet.",
          "Watch the wallet verify the issuer (trust resolution + issuance permission) and accept the ACME badge.",
          "Find the badge in your credentials list — you now hold a credential in the ACME story.",
        ],
      },
      {
        id: "2.3",
        stage: "2.3",
        title: "Credential login — present your badge",
        kind: "hands-on",
        story:
          "ACME's IAM asks you to prove you hold an ACME badge. Your wallet runs the mirror check — is this verifier permitted to request ECS-Badge? — shows you exactly who is asking and why, and only then presents. No password ever existed.",
        underHood: [
          "The login service holds a VERIFIER permission on the ECS-Badge schema; the wallet verifies it before presenting (guideline rule for presentation requests).",
          "Presentation happens over DIDComm; the service session is established from the verified presentation.",
        ],
        reproduce: [
          "Open the login demo from this playground with your wallet.",
          "Review the request screen: verifier identity (trusted), requested credential (your ACME badge).",
          "Present, and you are logged in — credential-based, phishing-resistant.",
        ],
      },
    ],
  },
  {
    n: 3,
    slug: "step-3",
    title: "ACME gets certified (ISO 9001)",
    intro:
      "Trust compounds. ACME joins a second ecosystem — the ISO Certification Ecosystem (demo) — and receives an ISO 9001 credential on its Organization DID. Nobody re-verifies the company: the ECS-Organization credential is the identification. And the certification instantly surfaces on every ACME service.",
    substeps: [
      {
        id: "3.1",
        stage: "3.1",
        title: "Join the certification ecosystem",
        kind: "watch",
        story:
          "The ISO Certification Ecosystem (a demo, not the real ISO) governs an ISO 9001 credential schema with accredited certification bodies as issuers. ACME applies to CertBody B through the same join-the-tree flow it used in Step 1 — the pattern never changes.",
        underHood: [
          "Same v3 machinery, different registry: HOLDER permission on the ISO 9001 schema, validator = the certification body, Start Permission VP → validation → ACTIVE.",
        ],
        reproduce: [
          `In ${app}, go to Discover & Join → ISO Certification Ecosystem (demo) → ISO 9001 schema → Participants.`,
          "In the permission tree, click Join under the accredited certification body.",
        ],
      },
      {
        id: "3.2",
        stage: "3.2",
        title: "Identify with ECS-Org — no re-KYB",
        kind: "watch",
        story:
          "CertBody B does not ask ACME for registry extracts or notarized documents. ACME presents the ECS-Organization credential already bound to its DID — KYB done once in Step 1, reused everywhere. The audit happens (that's the certification's job); the identification doesn't.",
        underHood: [
          "The certification body's service requests an ECS-Org presentation over DIDComm and trust-resolves it — the same verification any wallet does.",
          "The ISO 9001 credential is issued to the Organization DID and linked as another Linked VP on the same anchor.",
        ],
        reproduce: [
          "Connect the anchor vs-agent to the certification body's service and present ECS-Org on request.",
          "Receive the ISO 9001 (demo) credential on the anchor DID; the vs-agent links it automatically.",
        ],
      },
      {
        id: "3.3",
        stage: "3.3",
        title: "One credential, visible everywhere",
        kind: "hands-on",
        story:
          "Resolve any ACME service now — the chatbot, the badge issuer, the login — and the Proof-of-Trust shows three verified credentials: ECS-Organization, ECS-Service, and ISO 9001. One issuance on the organization DID enriched every service card at once.",
        underHood: [
          "Wallets show every presented credential with its own trust chain (guideline: the 'Other credentials' block) — the ISO 9001 chain goes back to the ISO Certification Ecosystem, independent of the ECS chains.",
        ],
        reproduce: [
          "Reconnect to the Step 2 chatbot with your wallet and open the Proof-of-Trust: the ISO 9001 credential is now on the card.",
          `Or resolve the anchor with detail=full: ${resolver}/v1/trust/resolve?did=<acme-did>&detail=full.`,
        ],
        liveService: "organization-vs",
      },
    ],
  },
  {
    n: 4,
    slug: "step-4",
    title: "ACME creates its own ecosystem",
    intro:
      "The roles reverse: ACME becomes a governance authority. It creates the ACME Partner Ecosystem with one credential — Authorized Partner — where issuance is governed (only ACME issues) and verification is open (anyone checks). Real partners turn green; impersonators fail structurally.",
    substeps: [
      {
        id: "4.1",
        stage: "4.1",
        title: "Design the partner program",
        kind: "watch",
        story:
          "ACME writes a one-page governance framework, creates its own trust registry, and defines the Authorized Partner schema. The critical design choice is the pair of permission modes: issuance ECOSYSTEM (only ACME), verification OPEN (anyone).",
        underHood: [
          "Create New Trust Registry (with the EGF document) → Create New Credential Schema (issuer mode ECOSYSTEM, verifier mode OPEN) → Create Root Permission. Three transactions, and ACME is an ecosystem.",
        ],
        reproduce: [
          `In ${app}, go to My Ecosystems → create a trust registry: name, governance-framework document.`,
          "Add a credential schema (e.g. 'Authorized Partner') with issuance mode ECOSYSTEM and verification mode OPEN.",
          "Create the root permission — your account now controls issuance.",
        ],
      },
      {
        id: "4.2",
        stage: "4.2",
        title: "Onboard a partner — Zenith Repairs",
        kind: "watch",
        story:
          "Zenith Repairs — itself a verifiable organization since it went through its own Step 1 — applies in ACME's tree. ACME identifies Zenith by its ECS-Org credential (reusable KYB again, now from the issuer's seat) and issues the Authorized Partner credential.",
        underHood: [
          "Zenith joins as HOLDER under ACME's root permission in the tree; ACME validates and issues. The permission tree of the ACME ecosystem now has its first branch.",
        ],
        reproduce: [
          "From Zenith's account: open the ACME Partner Ecosystem → Authorized Partner schema → Participants → Join under ACME's root.",
          "From ACME's side: the application appears in Pending Tasks; verify Zenith's ECS-Org presentation, validate, issue.",
        ],
      },
      {
        id: "4.3",
        stage: "4.3",
        title: "Anyone can verify — and Umbra fails",
        kind: "hands-on",
        story:
          "Zenith presents its partner credential: green, chain ending at the ACME Partner Ecosystem. Umbra Corp claims loudly to be an ACME partner — but it holds no credential ACME ever issued, so every wallet shows red. Brand protection as a structural property, not a legal chase.",
        underHood: [
          "Verification mode OPEN means no permission is needed to check a partner claim — any wallet, anywhere.",
          "Umbra cannot forge the chain: no Authorized Partner credential signed under ACME's root permission exists for its DID. The trust resolver returns UNTRUSTED for the claim.",
        ],
        reproduce: [
          "Resolve Zenith's demo service with your wallet: Authorized Partner appears with its chain to the ACME ecosystem.",
          "Resolve Umbra's demo service: red verdict — the claim has no chain.",
        ],
      },
    ],
  },
  {
    n: 5,
    slug: "step-5",
    title: "Discovery with the Trust Graph",
    intro:
      "Everything ACME published — the anchor, the services, the credentials, the ecosystem — is public, resolvable, and indexable. The Trust Graph turns that into discovery: crawlers iterate the DID Directory, trust-resolve every service, and index only what verifies. People, search engines, and AI agents then find services by what they prove, not what they claim. This step ships later — the summary is the preview.",
    pending: true,
    substeps: [],
  },
];

export function getStepPage(slug: string): StepPage | undefined {
  return STEP_PAGES.find((s) => s.slug === slug);
}
