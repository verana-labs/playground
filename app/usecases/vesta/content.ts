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
      need: 1,
      tag: "ECS-Organization",
      title: "Verifiable identities for organizations",
      desc: "Vesta and every repair partner must be able to prove who they are, checkable by anyone, without sending paperwork around.",
    },
    {
      need: 2,
      tag: "ECS-Service",
      title: "Verifiable identities for services",
      desc: "Every service must prove what it is and who operates it, before a customer types a word.",
    },
    {
      need: 3,
      tag: "ECS-Badge",
      title: "Credentials people can hold",
      desc: "Employees and technicians need badges in a wallet: to log in without passwords, and to prove themselves at a customer's door.",
    },
    {
      need: 4,
      tag: "ISO 9001",
      title: "Certifications as proof, not PDFs",
      desc: "The ISO 9001 certificate must travel with Vesta's identity, verifiable everywhere.",
    },
    {
      need: 5,
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
    need: 5,
    role: "ECOSYSTEM",
    name: "Vesta Repair Network",
    label: "the Authorized Repairer credential",
    about:
      "Vesta's own trust ecosystem, with a single credential schema: Authorized Repairer. Issuance is governed (only Vesta and its subsidiaries issue) and verification is open (anyone checks, no permission needed). The paper Vesta Certified Repair Company badge from Section 1 becomes verifiable, revocable proof.",
    why: "brand protection as a structural property. Real partners turn green, impostors turn red, and a partner that goes rogue can be revoked.",
    did: "did:webvh:QmPLACEHOLDER…:repair-network.vesta.example (created in Marc\u2019s journey)",
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
  /** Prominent mono display (e.g. the generated DID). */
  code?: { label: string; value: string; note?: string };
  /** Skip the scene diagram for this step (used when a step shares a stage). */
  noDiagram?: boolean;
};

export type JourneyNeed = {
  /** Anchor id (#need-N) - the §2 checklist chips deep-link here. */
  id: string;
  n: number;
  title: string;
  tag: string;
  intro: string;
  steps: SubStep[];
};

/** §3 · Marc's journey - one subsection per checklist need. */
export const JOURNEY: {
  n: number;
  anchor: string;
  title: string;
  intro: string;
  outro: string;
  needs: JourneyNeed[];
} = {
  n: 3,
  anchor: "section-3",
  title: "Marc's journey",
  intro:
    "One checklist, five builds. The picture below opens on the world you met in Section 1 - Vesta, its gray services, the impostors, a customer who can't tell - and each step transforms it. Watch Marc work, and take part with your own wallet.",
  outro:
    "Every box on Marc's list, checked: proven identity · verifiable services · badge login · portable certification · Vesta's own governed trust ecosystem. What Vesta consumed, Vesta now provides.",
  needs: [
    {
      id: "need-1",
      n: 1,
      title: "Vesta Organization identity",
      tag: "ECS-Organization",
      intro: "First things first: Vesta itself must become provable.",
      steps: [
        {
          id: "3.1",
          stage: "3.1",
          title: "Marc deploys Vesta's Business Wallet",
          kind: "watch",
          story:
            "Marc deploys a vs-agent, an open source Business Wallet natively integrated with the public Verana infrastructure. Upon deployment, a decentralized identifier (DID) is generated for Vesta: the identifier everything else attaches to. It proves nothing yet; it is the empty identity card.",
          code: {
            label: "The DID generated for Vesta",
            value:
              "did:webvh:QmPLACEHOLDER…:vesta-anchor.demos.testnet.verana.network",
            note: "Placeholder until the dedicated Vesta cast is deployed.",
          },
          underHood: [
            "The vs-agent generates the DID (did:webvh recommended) and publishes its DID Document with a DIDComm endpoint at https://<host>/.well-known/did.json.",
            "The Business Wallet will hold and present Vesta's credentials as Linked Verifiable Presentations.",
          ],
          reproduce: [
            "Deploy a vs-agent on a public domain (Docker image + compose examples in the vs-agent repo).",
            "Open https://<your-host>/.well-known/did.json - that document is your Business Wallet's DID.",
            `Resolve it: ${resolver}/v1/trust/resolve?did=<your-did> → UNTRUSTED. That's the starting line.`,
          ],
          links: [
            { label: "vs-agent home", href: "https://github.com/verana-labs/vs-agent" },
            { label: "verana-demos examples", href: LINKS.veranaDemos },
          ],
        },
        {
          id: "3.2",
          stage: "3.2",
          title: "KYB with an accredited issuer",
          kind: "watch",
          story:
            "Marc connects to the Verana ECS Ecosystem and chooses an accredited issuer to obtain an Organization credential for Vesta:",
          points: [
            "Marc chooses Helvetia Trust Services (demo), an accredited ECS-Org issuer.",
            "A Know-Your-Business (KYB) process runs between Vesta and Helvetia Trust Services, over DIDComm.",
            "KYB concludes and Vesta is verified: Vesta's Business Wallet receives its Organization credential.",
          ],
          underHood: [
            "Joining creates a HOLDER permission on the Organization schema via Start Permission VP - the validator is the issuer you joined under.",
            "After KYB, the issuer confirms with Set Permission VP to Validated; the permission becomes ACTIVE in the public tree.",
            "The credential is issued over DIDComm and published by the Business Wallet as a Linked VP (#vpr-schemas-org-vtc-vp).",
          ],
          reproduce: [
            `Create a testnet account, get VNA from the faucet, and open the Verana app: ${app}.`,
            "Discover & Join → ECS Ecosystem → Organization credential schema → Participants.",
            "In the permission tree, pick an active Issuer branch and click Join: you apply as Holder under that issuer, and it becomes your validator. Enter your Business Wallet's DID and submit.",
            "Complete the KYB exchange with the issuer's service over DIDComm; on validation, the ECS-Organization credential lands in your Business Wallet.",
          ],
          links: [
            { label: "Verana app", href: app },
            { label: "Faucet", href: ENDPOINTS.faucet },
          ],
        },
      ],
    },
    {
      id: "need-2",
      n: 2,
      title: "Service identity",
      tag: "ECS-Service",
      intro:
        "Every service in Verana has an accountable controller organization - and an identity of its own.",
      steps: [
        {
          id: "3.3",
          stage: "3.3",
          title: "The Service credential, self-issued",
          kind: "watch",
          story:
            "In Verana, any service must have a controller organization (in this case Vesta) and must present an ECS-Service credential for service identification, too. Vesta self-accredits as an issuer of the ECS-Service credential, and its Business Wallet then self-issues the Service credential - valid because the same DID already presents the proven ECS-Organization.",
          underHood: [
            "ISSUER permission on ECS-Service per the schema's permission-management mode (tree join, or self-created if OPEN via Create Permission).",
            "Self-issue through the vs-agent Admin API and publish #vpr-schemas-service-vtc-vp. Self-issuance is valid because the same DID presents ECS-Org - every service traces to an accountable organization.",
          ],
          reproduce: [
            "In the app: ECS Ecosystem → Service credential schema → Participants → join the tree on the issuer side for your DID.",
            "Issue the ECS-Service credential to yourself via the vs-agent Admin API and link it (the verana-demos scripts wrap this).",
          ],
        },
      ],
    },
    {
      id: "need-3",
      n: 3,
      title: "Vesta employee badges",
      tag: "ECS-Badge",
      intro:
        "Badges as verifiable credentials - for both physical access (office, factory) and Vesta's digital services.",
      steps: [
        {
          id: "3.4",
          stage: "3.4",
          title: "Vesta becomes an ECS-Badge issuer",
          kind: "watch",
          story:
            "Vesta wants to issue badges as verifiable credentials to its employees, for both physical access (office, factory) and access to Vesta's digital services. To do that, Vesta self-accredits as an issuer of the ECS-Badge credential - and can then issue an ECS-Badge to every employee, received in their Personal Wallet.",
          points: [
            "Self-accredit as an issuer of the ECS-Badge credential (a participant entry on the ECS-Badge schema).",
            "Issue ECS-Badge credentials to employees - each person holds their own, revocable, in their Personal Wallet.",
          ],
          underHood: [
            "Vesta creates its ISSUER permission on the ECS-Badge schema - visible as a participant in the public tree.",
            "Issuance runs over AnonCreds/DIDComm for now (Hologram first); the employee's Personal Wallet verifies the issuer is trusted and authorized to issue ECS-Badge (Q2) before accepting.",
          ],
          reproduce: [
            `See Vesta's participant entry on the ECS-Badge schema in the Verana app: ${app} (deep link comes with the Vesta cast).`,
            "Open the badge issuer invitation with your wallet and accept the badge after the wallet's issuer check.",
          ],
          links: [
            { label: "Verana app", href: app },
            { label: "Hologram wallet page", href: "/user-wallets/hologram" },
          ],
        },
        {
          id: "3.5",
          stage: "3.5",
          title: "A verifiable login service, accredited to verify badges",
          kind: "watch",
          story:
            "Vesta deploys a new Business Wallet for the login service, and issues it an ECS-Service credential - so the login service is verifiable in its own right (Vesta can do this: it is an accredited ECS-Service issuer). The service is accredited for ECS-Badge verification, and access is configured to only accept badges whose issuer is the DID of the Vesta Organization trust anchor. The same badge can also work at the door:",
          points: [
            "Portal login: the verifiable login service requests your badge; only ECS-Badge credentials issued by Vesta's trust anchor DID are accepted. No passwords, no shared logins.",
            "Physical access: Bluetooth, NFC, or QR-code access to the office or the factory using the ECS-Badge - provided the Personal Wallet used supports it.",
          ],
          underHood: [
            "Per the Verifiable Trust spec: the login service is verifiable and trusted because its ECS-Service credential was issued by a DID that presents an ECS-Org credential (the Vesta trust anchor) - the service inherits the ECS-Org from the parent service.",
            "The login service holds the VERIFIER permission on the ECS-Badge schema; its verifier-side policy pins the accepted issuer to the anchor DID.",
            "The Personal Wallet applies the mirror rule before presenting: verify the verifier is trusted and authorized to request ECS-Badge (Q3).",
          ],
          reproduce: [
            "Deploy a vs-agent for the login service; from the anchor, issue it an ECS-Service credential and link it.",
            "Join the ECS-Badge schema tree as VERIFIER for the login service's DID.",
            "Open the login demo, review the request (who asks, what for), present the badge - you're in.",
          ],
          links: [
            { label: "User-wallet guideline", href: LINKS.guidelineUserWallet },
          ],
        },
      ],
    },
    {
      id: "need-4",
      n: 4,
      title: "ISO 9001 credential",
      tag: "ISO 9001",
      intro:
        "Certified since 2003 - now the certificate becomes a verifiable credential on Vesta's identity.",
      steps: [
        {
          id: "3.6",
          stage: "3.6",
          title: "ISO 9001, without re-certifying",
          kind: "watch",
          story:
            "Vesta is certified ISO 9001 since 2003. Its certification body, NormaCert (demo), was recently accredited as an issuer of the ISO 9001 credential in the ISO Certification Ecosystem (demo). Good news for Vesta: now that the company holds its Organization credential, it applies to the ISO Certification Ecosystem as a holder of the ISO 9001 credential, selecting NormaCert as its issuer:",
          points: [
            "NormaCert's service immediately accepts the request: it identifies Vesta's DID and dereferences its Organization credential.",
            "Match - the company is in NormaCert's certification database. No paperwork, no identity re-checks.",
            "NormaCert immediately issues the ISO 9001 credential over DIDComm to Vesta's Organization DID, into its Business Wallet.",
          ],
          underHood: [
            "HOLDER permission on the ISO 9001 schema, NormaCert as validator - same tree-join flow, different registry.",
            "Identification by ECS-Org presentation over DIDComm: reusable organizational identity - the ECS layer is the KYB other ecosystems build on.",
          ],
          reproduce: [
            `In ${app}: Discover & Join → ISO Certification Ecosystem (demo) → ISO 9001 schema → Participants → Join under NormaCert (demo).`,
            "Present ECS-Org over the DIDComm session when asked to identify; receive ISO 9001 on the Organization DID.",
          ],
        },
      ],
    },
    {
      id: "need-5",
      n: 5,
      title: "Vesta's own rules for its network",
      tag: "Authorized Repairer",
      intro:
        "Fake support died with the green check. Password phishing died with the badge. Paperwork is dying with reusable KYB. But Umbra Repairs is still out there - and only Vesta can answer “who is an authorized Vesta repairer”. An organization that consumed trust can also produce it.",
      steps: [
        {
          id: "3.7",
          stage: "3.7",
          title: "The Vesta Repair Network",
          kind: "watch",
          story:
            "Vesta publishes a one-page governance framework and creates its ecosystem with a single credential schema: Authorized Repairer. The design choice that matters: issuance is governed - only Vesta and its subsidiaries issue - and verification is open: anyone checks, no permission needed. Vesta accredits two subsidiary issuers, Vesta Iberia and Vesta Nordics. Then Zenith Repairs joins, itself a verifiable organization (it walked the same journey: anchor, KYB, ECS-Service - the pattern replicates; that is the point): Vesta Iberia identifies Zenith by the ECS-Org credential on its DID and issues Authorized Repairer to Zenith's organization DID.",
          underHood: [
            "Create New Trust Registry (+ EGF document) → Create New Credential Schema (issuer mode ECOSYSTEM, verifier mode OPEN) → Create Root Permission. Three transactions, and Vesta is an ecosystem.",
            "Governed issuance does not mean a single issuer: Vesta can register several entities (for example its subsidiaries) as issuers of the Authorized Repairer schema by granting them ISSUER permissions under its root.",
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
          id: "3.8",
          stage: "3.8",
          title: "Authorized Repairer login - and at the front door",
          kind: "watch",
          story:
            "The Authorized Repairer credential now works everywhere trust is needed:",
          points: [
            "Zenith Repairs issues ECS-Badges to its employees - each technician holds one in their Personal Wallet.",
            "Zenith employees can now log in to the Vesta portal: when they present their ECS-Badge, Vesta knows the badge was issued by Zenith Repairs - and allows access, because Zenith Repairs presents an Authorized Repairer credential.",
            "At the door, the worker presents their badge to the customer; the customer scans it and sees the Vesta Authorized Repairer seal.",
          ],
          image: {
            src: "/images/zenith.webp",
            alt: "A Zenith Repairs technician at the door, showing a green trust check on their phone",
            caption: "The technician at your door, proving they're from an authorized repairer - trust before you open.",
          },
          underHood: [
            "Zenith self-accredits as an ECS-Badge issuer (the same move Vesta made in 3.3) and issues badges to its employees.",
            "The Vesta login service's verifier policy accepts ECS-Badge from Vesta's anchor DID (employees) or from any issuer DID presenting a valid Authorized Repairer credential (partner employees). Two rules cover the whole network.",
            "The customer's wallet resolves the badge issuer's DID: Zenith's chain shows ECS-Org, ECS-Service, and Authorized Repairer under the Vesta Repair Network - the seal.",
          ],
          reproduce: [
            "Get a badge from Zenith Repairs and try the Vesta portal login (see Run the demos below).",
            "Scan a technician's badge with your wallet: the issuer chain ends at the Vesta Repair Network seal.",
          ],
          links: [
            { label: "Run the demos", href: "/usecases/vesta#section-4" },
          ],
        },
      ],
    },
  ],
};


// --------------------------------- §4 · Run the demos (examples.md)

/** §4 · Run the demos - placeholders until the Vesta demo cast ships.
 *  Source: verana-spec → playground/verana-explained/examples.md. */
export const DEMOS = {
  n: 4,
  anchor: "section-4",
  title: "Run the demos",
  intro:
    "Download one of the integrated user wallets to run the demos - every wallet shows the same verdicts, the same way.",
  verifyRule:
    "Always verify the certified Organization name and data shown in the Proof-of-Trust card in your wallet before proceeding.",
  badge: {
    title: "Obtain an ECS-Badge",
    intro: "Request a badge and watch your wallet check the issuer first:",
    offers: [
      {
        org: "From Vesta",
        expect:
          "Green Proof-of-Trust: Vesta Appliances, certified organization, authorized ECS-Badge issuer. Accept the badge.",
        tone: "emerald",
      },
      {
        org: "From Zenith Repairs",
        expect:
          "Green Proof-of-Trust: Zenith Repairs, certified organization presenting its Authorized Repairer credential. Accept the badge.",
        tone: "emerald",
      },
      {
        org: "From an organization that is not an Authorized Repairer",
        expect:
          "Your wallet warns you: the issuer is not what it claims. Red verdict - do not accept.",
        tone: "red",
      },
    ],
  },
  login: {
    title: "Log in as a repair employee with your ECS-Badge",
    intro:
      "Try to log in to the Vesta portal with a badge. The portal decides from the badge's issuer chain:",
    outcomes: [
      {
        rule: "Your badge was issued by Vesta",
        result: "You are recognized: access granted as a Vesta employee.",
        tone: "emerald",
      },
      {
        rule: "Your badge was issued by an organization presenting an Authorized Repairer credential",
        result: "Access granted, as an Authorized Repairer employee.",
        tone: "emerald",
      },
      {
        rule: "Anything else",
        result: "Access denied.",
        tone: "red",
      },
    ],
  },
  directory: {
    title: "Search the directory of Authorized Repairers",
    intro:
      "Discovery by proof: query the public registry for organizations by the credentials they present.",
    queries: [
      "View all organizations that present an Authorized Repairer credential, and choose which company to contact for service.",
      "Narrow it down: organizations that present an Authorized Repairer credential AND an ISO 9001 credential.",
    ],
  },
};

// ----------------------------------- Closing teaser + navigation

export const CLOSING = {
  title: "Being found",
  pendingLabel: "coming later",
  body: "Everything Vesta published - the ECS credentials, the ISO 9001 certification, the Authorized Repairer credentials - is public, resolvable, and indexable. The Trust Graph turns that into discovery: only verified trust results are indexed, and people, search engines, and AI agents find services by what they prove, not what they claim: “ISO 9001-certified manufacturers”, “authorized Vesta repairers”. The full walkthrough ships later.",
};

/** The four sections, for home cards and in-page navigation. */
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
      "Marc's five needs, Verana's three pillars, and the ecosystems Vesta joins or builds.",
  },
  {
    n: 3,
    anchor: "section-3",
    title: "Marc's journey",
    oneLiner:
      "Five needs, five builds: identity, verifiable services, badges, certification as proof, and Vesta's own ecosystem. Zenith ✓, Umbra ✗.",
  },
  {
    n: 4,
    anchor: "section-4",
    title: "Run the demos",
    oneLiner:
      "Get a badge (from Vesta, from Zenith, or from an impostor), log in to the portal with it, and search the directory of Authorized Repairers.",
  },
] as const;
