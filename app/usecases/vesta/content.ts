// The full "Verana Explained" story content - one single page, six sections.
// Source of truth: verana-spec → playground/verana-explained/spec.md (0.5).
// §1 is a marketing-style company article (no protocol vocabulary);
// §2 is the solution section (CTO quote + pillars + ecosystem choices); §3–§5 are the technical build with the
// progressive scene graph. Protocol facts target v3; reproduce recipes
// follow the current verana-frontend UX: ecosystem → credential schema →
// Participants tree → Join from the branch you want to join under.

import { ENDPOINTS, LINKS } from "../../lib/site";
import type { Stage } from "./scenes";

const app = ENDPOINTS.frontend;
const resolver = ENDPOINTS.resolver;

/** Generated brand assets (open item 8): web-optimized WebP in
 *  public/images/ (PNG originals kept alongside). Set a path to null to fall
 *  back to the SVG/initials placeholder. */
export const VESTA_ASSETS = {
  logo: "/images/logo.webp" as string | null,
  ceo: "/images/ceo.webp" as string | null,
  hero: "/images/factory.webp" as string | null,
  heroCaption: "Vesta's assembly line - forty years of machines built to be repaired, not replaced.",
  lineup: "/images/lineup.webp" as string | null,
  cto: "/images/cto.webp" as string | null,
  lineupCaption: "The Vesta range: washer, oven, dryer - three product lines, one promise.",
  fakeVan: "/images/fake-van3.webp" as string | null,
};

// --------------------------------- §1 · Meet Vesta Appliances (marketing)

export const COMPANY = {
  name: "Vesta Appliances",
  tagline: "Quality home appliances since 1985",
  meta: [
    "Geneva, Switzerland (HQ)",
    "~200 employees",
    "Sold in 40+ countries",
    "120 independent repair partners",
  ],
  productLine:
    "Vesta Appliances has made washing machines and ovens for forty years. Three product lines, one promise: machines that last, and get repaired, not replaced.",
  factoryText:
    "Every Vesta machine comes out of the company's own plant - forty years of engineering on one assembly line, designed from the first screw to be serviceable in a customer's kitchen.",
  certification: {
    img: "/images/ISO_9001-2015.svg",
    label: "ISO 9001 certified",
    sub: "since 2003",
  },
  ceoQuote: {
    text: "Our machines earn trust in people's homes every day. Yet online, we can't prove a support chat is really ours, and at the front door, we can't prove a technician is really one of our certified partners. That has to change.",
    name: "Elena Vasquez",
    role: "CEO, Vesta Appliances",
  },
  servicesIntro:
    "Beyond the machines, Vesta is online every day: customers ask for help, employees sign in, partners order parts and file warranty claims. Three services, all owned and operated by the company itself.",
  services: [
    {
      icon: "bot",
      name: "Agentic Support",
      desc: "Help with your machine: troubleshooting, warranty, spare parts.",
    },
    {
      icon: "badge",
      name: "Employee badges",
      desc: "Company IDs for Vesta's ~200 staff members.",
    },
    {
      icon: "key",
      name: "Staff & partner portal",
      desc: "Orders, manuals, and warranty claims for staff and repair partners.",
    },
  ],
  problemsOnline: [
    {
      icon: "phone",
      title: "Fake support lines",
      desc: "Customers googling “Vesta support” land on scammers; impostor accounts “help” with refunds, and harvest card numbers.",
    },
    {
      icon: "lock",
      title: "Password pain",
      desc: "Portal passwords are phished and reset endlessly. Partner staff rotate, so accounts must be created and deleted constantly; in practice, partners end up sharing one login across employees. Not secure.",
    },
    {
      icon: "files",
      title: "Paperwork, again and again",
      desc: "Every marketplace, bank, and certifier asks for the same company documents.",
    },
  ],
  onlineConsequence:
    "Refund scams run in Vesta's name, and the brand takes the blame for every scam it never saw.",
  problemsOnsite: [
    {
      icon: "van",
      title: "Fake “authorized” repairers",
      desc: "Vans Vesta has never heard of ring doorbells with a printed Vesta panel on the door. Customers get scammed in their own homes.",
    },
  ],
  onsiteConsequence:
    "Customers get scammed at their own front door, honest certified partners lose the work, and Vesta gets blamed either way.",
  rootCause:
    "Online or at the front door, Vesta's word looks exactly like the scammers' word. Nothing can be proven.",
};

/** §1 - the real-world certified repair network (business view: paper
 *  certification through training + audits; nothing of it provable online).
 *  Every partner carries the "Vesta Certified Repair Company" badge. */
export const REPAIR_NETWORK = {
  title: "The certified repair network",
  blurb:
    "120 independent repair companies, certified by Vesta through training, yearly audits, and a signed partner contract. Each carries the Vesta Certified Repair Company badge: when a certified technician rings your doorbell, Vesta's forty-year reputation rings with them.",
  badgeLabel: "Vesta Certified",
  badgeFullName: "Vesta Certified Repair Company",
  stats: ["120 partner companies", "40+ countries", "Yearly audits"],
  partners: [
    { name: "Zenith Repairs", city: "Geneva" },
    { name: "Alpine Fix", city: "Zürich" },
    { name: "Nordlicht Repair", city: "Hamburg" },
    { name: "Repair & Sons", city: "Manchester" },
    { name: "Casa Rápida", city: "Madrid" },
    { name: "Domus Service", city: "Milan" },
    { name: "Atelier Volt", city: "Lyon" },
    { name: "Bluewave Service", city: "Lisbon" },
  ],
  closing:
    "The badge is real: training, audits, contracts stand behind it. But it lives on van doors, letterheads, and PDF certificates: online, anyone can print one, and there is no way to tell a certified partner from an impostor.",
};

// --------------------------------- §2 · The solution: become verifiable

export const SOLUTION = {
  title: "The solution: become verifiable",
  ctoQuote: {
    text: "Today, verifiable credential open source software exists for user and cloud wallets, and there is Verana, a public trust infrastructure. We have everything we need to make Vesta and its partner network a network of verifiable organizations, providing verifiable services.",
    name: "Marc Keller",
    role: "CTO, Vesta Appliances",
  },
  needsTitle: "What Marc needs",
  needsIntro:
    "To make every organization and every service verifiable, Marc's list is short:",
  needs: [
    {
      section: 3,
      tag: "ECS-Organization",
      title: "Verifiable identities for organizations",
      desc: "Vesta and every repair partner must be able to prove who they are, checkable by anyone, without sending paperwork around.",
    },
    {
      section: 4,
      tag: "ECS-Service",
      title: "Verifiable identities for services",
      desc: "Every service must prove what it is and who operates it, before a customer types a word.",
    },
    {
      section: 4,
      tag: "ECS-Badge",
      title: "Credentials people can hold",
      desc: "Employees and technicians need badges in a wallet: to log in without passwords, and to prove themselves at a customer's door.",
    },
    {
      section: 3,
      tag: "ISO 9001",
      title: "Certifications as proof, not PDFs",
      desc: "The ISO 9001 certificate must travel with Vesta's identity, verifiable everywhere.",
    },
    {
      section: 5,
      tag: "Vesta Repair Network",
      title: "Vesta's own rules for its network",
      desc: "A way for Vesta, and only Vesta, to say who is an Authorized Repairer, and to revoke it.",
    },
  ],
  needsBridge:
    "All of this needs wallets to hold and check the proofs (they exist, open source, for people and for organizations) and one neutral, public place where every proof anchors. That place is Verana.",
  pillarsTitle: "Let's build on Verana",
  pillarsIntro:
    "Verana is a public infrastructure that generalizes the use of verifiable credentials, and provides out of the box:",
  ecosystemsTitle: "The ecosystems Vesta wants to join",
  ecosystemsIntro:
    "Vesta picks the two it needs, and discovers a gap only it can fill.",
};

export const PILLARS = [
  {
    name: "Trust Ecosystems",
    label: "Sovereign ecosystems",
    tone: "violet",
    body: "Build ecosystems that issue and verify any credential, with your own schemas, governance framework, participants, and business model, or join an existing one.",
    href: "https://verana.io/ecosystems",
  },
  {
    name: "Verifiable Trust",
    label: "Verifiable identity",
    tone: "blue",
    body: "Identify any service and the organization or person that controls it, and verify it before you connect. Verify first. Then connect.",
    href: "https://verana.io/identity",
  },
  {
    name: "The Trust Graph",
    label: "Discovery",
    tone: "emerald",
    body: "Discover services and ecosystems by the credentials they hold, ranked by trust, for people, search engines, and AI agents.",
    href: "https://verana.io/discovery",
  },
] as const;

export const FACTS =
  "Verana is public, decentralized infrastructure. Any ecosystem can self-create. Any organization can join the ecosystems it is interested in as a participant, or create its own. No gatekeeper: no single company decides who is trustworthy.";

// ------------------------- §3 · The ecosystems Vesta wants to join

export const ECOSYSTEM_CHOICES = [
  {
    icon: "landmark",
    tone: "violet",
    role: "HOLDER",
    name: "Verana ECS Ecosystem",
    label: "the identity card",
    about:
      "A trust ecosystem that governs the essential credential schemas. Its accredited issuers provide recognized KYB (Know-Your-Business) services: they verify an organization once, then issue it a certified ECS-Organization credential. Services carry ECS-Service credentials describing what they are and who operates them.",
    did: "did:webvh:QmPLACEHOLDER…:ecs-ecosystem.testnet.verana.network",
    veranaUrl: app, // TODO: deep link to the trust-registry page
    why: "one KYB with a recognized issuer, and Vesta's identity becomes provable everywhere: this is what turns the check green, and the foundation everything else builds on.",
  },
  {
    icon: "award",
    tone: "amber",
    role: "HOLDER",
    name: "ISO Certification Ecosystem",
    label: "(demo) · the certificate becomes proof",
    why: "Today Vesta's ISO 9001 certificate is a PDF nobody can verify. As a credential on Vesta's verified identity, it becomes proof that customers and partners see on every Vesta service.",
    did: "did:webvh:QmPLACEHOLDER…:iso-certification.testnet.verana.network",
    veranaUrl: app, // TODO: deep link to the trust-registry page
  },
] as const;

export const ECOSYSTEM_BUILD = {
  title: "The ecosystems Vesta wants to build",
  intro:
    "One need remains: no existing ecosystem can answer “who is an authorized Vesta repairer”. Only Vesta can. So Vesta will build its own:",
  card: {
    section: 5,
    role: "ECOSYSTEM",
    name: "Vesta Repair Network",
    label: "the Authorized Repairer credential",
    about:
      "Vesta's own trust ecosystem, with a single credential schema: Authorized Repairer. Issuance is governed (only Vesta issues) and verification is open (anyone checks, no permission needed). The paper Vesta Certified Repair Company badge from Section 1 becomes verifiable, revocable proof.",
    why: "brand protection as a structural property. Real partners turn green, impostors turn red, and a partner that goes rogue can be revoked.",
    did: "did:webvh:QmPLACEHOLDER…:repair-network.vesta.example (created in Section 5)",
    veranaUrl: app, // TODO: deep link once created
  },
};

// ----------------- §3–§5 · The technical build (scene graph sections)

export type SubStep = {
  id: string;
  stage: Stage;
  title: string;
  kind: "story" | "watch" | "hands-on";
  story: string;
  points?: string[];
  underHood?: string[];
  reproduce?: string[];
  links?: { label: string; href: string }[];
  liveService?: string;
  liveNote?: string;
  image?: { src: string; alt: string; caption?: string };
};

export type TechSection = {
  n: number;
  anchor: string;
  title: string;
  intro: string;
  outro?: string;
  substeps: SubStep[];
};

const CAST_NOTE =
  "The dedicated Vesta demo cast (separate vs-agent instances per participant) is being deployed; until then, the verana-demos anchor stands in on this live card.";

export const TECH_SECTIONS: TechSection[] = [
  {
    n: 3,
    anchor: "section-3",
    title: "Joining the ecosystems",
    intro:
      "The plan in action. The picture below is the world you just met - Vesta, its gray services, the impostors, a customer who can't tell. Watch it transform.",
    outro:
      "What Vesta now has: a digital identity with two proven credentials - who it is, and that it is certified. But its services are still gray.",
    substeps: [
      {
        id: "3.1",
        stage: "3.1",
        title: "Vesta gets its digital identity",
        kind: "watch",
        story:
          "Vesta deploys a vs-agent - a small cloud-wallet service - as its Organization anchor. A DID is born: the identifier everything else attaches to. It proves nothing yet; it is the empty identity card.",
        underHood: [
          "The vs-agent generates the DID (did:webvh recommended) and publishes its DID Document with a DIDComm endpoint at https://<host>/.well-known/did.json.",
          "The anchor will hold and present Vesta's credentials as Linked Verifiable Presentations.",
        ],
        reproduce: [
          "Deploy a vs-agent on a public domain (Docker image + compose examples in the vs-agent repo).",
          "Open https://<your-host>/.well-known/did.json - that document is your anchor's DID.",
          `Resolve it: ${resolver}/v1/trust/resolve?did=<your-did> → UNTRUSTED. That's the starting line.`,
        ],
        links: [
          { label: "vs-agent", href: "https://github.com/verana-labs/vs-agent" },
          { label: "verana-demos examples", href: LINKS.veranaDemos },
        ],
      },
      {
        id: "3.2",
        stage: "3.2",
        title: "Joining ECS: proving who they are - once",
        kind: "watch",
        story:
          "Vesta joins the Verana ECS Ecosystem on the Organization schema and passes Know-Your-Business once, over DIDComm, with an accredited issuer. The issuer verifies the company and issues the ECS-Organization credential to Vesta's DID. The anchor finally has a name that is proven, not claimed.",
        underHood: [
          "Joining creates a HOLDER permission on the Organization schema via Start Permission VP - the validator is the issuer you joined under.",
          "After KYB, the issuer confirms with Set Permission VP to Validated; the permission becomes ACTIVE in the public tree.",
          "The credential is issued over DIDComm and published by the vs-agent as a Linked VP (#vpr-schemas-org-vtc-vp).",
        ],
        reproduce: [
          `Create a testnet account, get VNA from the faucet, and open the Verana app: ${app}.`,
          "Discover & Join → ECS Ecosystem → Organization credential schema → Participants.",
          "In the permission tree, pick an active Issuer branch and click Join: you apply as Holder under that issuer, and it becomes your validator. Enter your anchor DID and submit.",
          "Complete the KYB exchange with the issuer's service over DIDComm; on validation, the ECS-Organization credential lands on your anchor.",
        ],
        links: [
          { label: "Verana app", href: app },
          { label: "Faucet", href: ENDPOINTS.faucet },
        ],
      },
      {
        id: "3.3",
        stage: "3.3",
        title: "Joining ISO Certification: no re-KYB",
        kind: "watch",
        story:
          "The shortcut that shows the model's power: the certification body never asks Vesta to prove who it is again. Vesta presents the ECS-Organization credential on its DID - the KYB from 4.2, reused - the body runs its certification checks, and issues ISO 9001 directly to Vesta's Organization DID.",
        underHood: [
          "HOLDER permission on the ISO 9001 schema, certification body as validator - same tree-join flow, different registry.",
          "Identification by ECS-Org presentation over DIDComm: reusable organizational identity - the ECS layer is the KYB other ecosystems build on.",
        ],
        reproduce: [
          `In ${app}: Discover & Join → ISO Certification Ecosystem (demo) → ISO 9001 schema → Participants → Join under the certification body.`,
          "Present ECS-Org over the DIDComm session when asked to identify; receive ISO 9001 on the anchor DID.",
        ],
      },
    ],
  },
  {
    n: 4,
    anchor: "section-4",
    title: "Making the services verifiable",
    intro:
      "Credentials on an identity are only half the story - now the services people actually touch turn verifiable, and you take part with your own wallet.",
    outro:
      "What Vesta now has: three verifiable services with badge login; the certification travels everywhere. Fake support and password phishing are dead; the paperwork problem is dying. One villain remains.",
    substeps: [
      {
        id: "3.1",
        stage: "4.1",
        title: "The anchor turns green",
        kind: "watch",
        story:
          "Vesta registers as an issuer of the ECS-Service schema and self-issues the Service credential on its anchor - valid because the same DID already presents the proven ECS-Organization. Resolve the DID now: TRUSTED. The trust card below is the exact card every integrated wallet shows.",
        underHood: [
          "ISSUER permission on ECS-Service per the schema's permission-management mode (tree join, or self-created if OPEN via Create Permission).",
          "Self-issue through the vs-agent Admin API and publish #vpr-schemas-service-vtc-vp. Self-issuance is valid because the same DID presents ECS-Org - every service traces to an accountable organization.",
        ],
        reproduce: [
          "In the app: ECS Ecosystem → Service credential schema → Participants → join the tree on the issuer side for your DID.",
          "Issue the ECS-Service credential to yourself via the vs-agent Admin API and link it (the verana-demos scripts wrap this).",
          `Re-resolve: ${resolver}/v1/trust/resolve?did=<your-did>&detail=full → TRUSTED, with both credentials and their permission chains.`,
        ],
        liveService: "organization-vs",
        liveNote: CAST_NOTE,
      },
      {
        id: "4.2",
        stage: "4.2",
        title: "Rolling it out: support, badges, login",
        kind: "hands-on",
        story:
          "Each real service becomes its own Verifiable Service - its own vs-agent and DID, with an ECS-Service credential issued by the anchor. The gray cards from Section 1 turn verified - and because the ISO 9001 credential lives on the Organization DID, it surfaces on every service's card at once. This is where you join the story:",
        points: [
          "Agentic Support - install the Hologram App, scan the QR, review the Proof-of-Trust (green check · Service · Operated by Vesta), then chat. The fake support line from Section 1 can't produce that card: it shows red.",
          "Employee badge - pick an integrated open-source wallet and receive an ECS-Badge (AnonCreds/DIDComm for now; Hologram first). Your wallet first verifies the issuer is trusted and authorized to issue ECS-Badge.",
          "Passwordless login - the portal requests your badge. Your wallet verifies the verifier is trusted and authorized to request it, then presents. No password ever existed.",
        ],
        underHood: [
          "Delegated pattern: each service DID presents an ECS-Service credential issued by the anchor; trust chains resolve through the anchor's ECS-Org.",
          "Vesta holds ISSUER and VERIFIER permissions on the ECS-Badge schema - visible in the public tree.",
          "Wallet rules from the user-wallet guideline: verify issuer authorization on offers (Q2) and verifier authorization on presentation requests (Q3); unauthorized → red verdict.",
        ],
        reproduce: [
          "Install the Hologram App and connect to the support chatbot from this playground; review the Proof-of-Trust, then chat.",
          "Open the badge issuer invitation with your wallet and accept the badge after the wallet's issuer check.",
          "Open the login demo, review the request (who asks, what for), present the badge - you're in.",
        ],
        links: [
          { label: "Hologram wallet page", href: "/user-wallets/hologram" },
          { label: "User-wallet guideline", href: LINKS.guidelineUserWallet },
        ],
      },
    ],
  },
  {
    n: 5,
    anchor: "section-5",
    title: "Vesta creates its own ecosystem",
    intro:
      "The roles reverse. Umbra Repairs is still ringing doorbells - and no existing ecosystem can say who a genuine Vesta repairer is. Only Vesta can. So Vesta becomes a governance authority.",
    outro:
      "What Vesta now has - the full circle: proven identity · verifiable services · portable certification · its own governed trust ecosystem. What Vesta consumed, Vesta now provides.",
    substeps: [
      {
        id: "5.1",
        stage: "5.1",
        title: "Why: the last problem standing",
        kind: "story",
        story:
          "Fake support died with the green check. Password phishing died with the badge. Paperwork is dying with reusable KYB. But Umbra Repairs is still out there, because “who is an authorized Vesta repairer” is a question only Vesta can answer. In Verana, any organization can create its own ecosystem - an organization that consumed trust can also produce it.",
      },
      {
        id: "5.2",
        stage: "5.2",
        title: "The Vesta Repair Network",
        kind: "watch",
        story:
          "Vesta publishes a one-page governance framework and creates its ecosystem with a single credential schema: Authorized Repairer. The design choice that matters: issuance is governed - only Vesta issues. Verification is open - anyone checks, no permission needed. Then Vesta onboards Zenith Repairs, itself a verifiable organization (it went through its own Sections 3–4 - the pattern replicates; that is the point): Vesta identifies Zenith by the ECS-Org credential on its DID and issues Authorized Repairer to Zenith's organization DID.",
        underHood: [
          "Create New Trust Registry (+ EGF document) → Create New Credential Schema (issuer mode ECOSYSTEM, verifier mode OPEN) → Create Root Permission. Three transactions, and Vesta is an ecosystem.",
          "Zenith joins the tree as HOLDER under Vesta's root; Vesta validates by verifying Zenith's ECS-Org presentation - reusable KYB, now from the issuer's seat.",
          "Extension: Zenith can in turn issue technician badges to its employees, so the technician at your door can prove they're from an authorized repairer.",
        ],
        reproduce: [
          `In ${app}: My Ecosystems → create a trust registry (name + governance-framework document).`,
          "Add the “Authorized Repairer” credential schema: issuance mode ECOSYSTEM, verification mode OPEN. Create the root permission.",
          "From Zenith's account: open the new ecosystem → Authorized Repairer schema → Participants → Join under Vesta's root.",
          "From Vesta's side: the application appears in Pending Tasks - verify Zenith's ECS-Org presentation, validate, issue.",
        ],
        links: [{ label: "Verana app", href: app }],
      },
      {
        id: "5.3",
        stage: "5.3",
        title: "Full circle - anyone can tell",
        kind: "hands-on",
        story:
          "The Section 1 picture returns, with verdicts. Resolve Zenith's service with your wallet: green - ECS-Org, ECS-Service, Authorized Repairer, chain verified to the Vesta Repair Network. Then Umbra Repairs, which still claims to be authorized: red - no credential Vesta ever issued exists for its DID, and the claim cannot be forged. Brand impersonation fails structurally. And if a partner goes rogue, Vesta revokes - re-resolution drops the credential from every card.",
        image: {
          src: "/images/zenith.webp",
          alt: "A Zenith Repairs technician at the door, showing a green trust check on their phone",
          caption: "The technician at your door, proving they're from an authorized repairer - trust before you open.",
        },
        underHood: [
          "Verification mode OPEN: any wallet checks a repairer claim without asking anyone's permission - only issuance is gated.",
          "Revocation: Revoke Permission + re-resolution removes the credential from every card and from future discovery results.",
        ],
        reproduce: [
          "Resolve Zenith's demo service with your wallet: Authorized Repairer appears with its chain to the Vesta Repair Network.",
          "Resolve Umbra's demo service: red verdict - the claim has no chain.",
        ],
      },
    ],
  },
];

// ----------------------------------- Closing teaser + navigation

export const CLOSING = {
  title: "Being found",
  pendingLabel: "coming later",
  body: "Everything Vesta published - the ECS credentials, the ISO 9001 certification, the Authorized Repairer credentials - is public, resolvable, and indexable. The Trust Graph turns that into discovery: only verified trust results are indexed, and people, search engines, and AI agents find services by what they prove, not what they claim: “ISO 9001-certified manufacturers”, “authorized Vesta repairers”. The full walkthrough ships later.",
};

/** The five sections, for home cards and in-page navigation. */
export const SECTIONS_NAV = [
  {
    n: 1,
    anchor: "section-1",
    title: "Meet Vesta Appliances",
    oneLiner:
      "A real business, real services, and impostors trading on its name. Nothing can be proven.",
  },
  {
    n: 2,
    anchor: "section-2",
    title: "The solution: become verifiable",
    oneLiner:
      "Make Vesta and its partner network a network of verifiable organizations: Verana's three pillars, and the ecosystems Vesta picks.",
  },
  {
    n: 3,
    anchor: "section-3",
    title: "Joining the ecosystems",
    oneLiner:
      "A DID is born; KYB once, then ECS-Organization; ISO 9001 with no re-KYB.",
  },
  {
    n: 4,
    anchor: "section-4",
    title: "Making the services verifiable",
    oneLiner:
      "The check turns green; Agentic Support, badges, passwordless login: hands-on with your wallet.",
  },
  {
    n: 5,
    anchor: "section-5",
    title: "Vesta creates its own ecosystem",
    oneLiner:
      "The Vesta Repair Network: only Vesta issues Authorized Repairer, anyone verifies. Zenith ✓, Umbra ✗.",
  },
] as const;
