// The full "Republica of Utopia" story content - four chapters.
// Source of truth: verana-spec → playground/utopia/spec.md (0.1).
// §1 is a civic article (no protocol vocabulary); §2 is the solution
// (Minister quote + pillars + ecosystem choices); §3 is the technical build
// with the progressive scene graph; §4 the demos. Protocol facts target v3;
// reproduce recipes follow the current verana-frontend UX.

import { ENDPOINTS, LINKS } from "../../lib/site";
import { UTOPIA_CAST } from "../../lib/utopia-cast";
import { VESTA_CAST } from "../../lib/vesta-cast";
import type { Stage } from "./scenes";
import type {
  JourneyNeed as GenericJourneyNeed,
  SubStep as GenericSubStep,
} from "../story-blocks";

const app = ENDPOINTS.frontend;
const resolver = ENDPOINTS.resolver;

export type SubStep = GenericSubStep<Stage>;
export type JourneyNeed = GenericJourneyNeed<Stage>;

/** Generated civic assets (spec open item 3): web-optimized WebP in
 *  public/images/utopia/. Set a path to null to fall back to the
 *  emblem/initials placeholder while the brand kit is generated. */
export const UTOPIA_ASSETS = {
  emblem: null as string | null, // /images/utopia/emblem.webp
  hero: null as string | null, // /images/utopia/hero.webp
  heroCaption:
    "The Republica of Utopia - a small democracy, and every one of its services about to become provable.",
  institutions: null as string | null, // /images/utopia/institutions.webp
  institutionsCaption:
    "The civic institutions of the Republic: the Civil Registry, the Business Registry, the Tax Buro.",
  pm: null as string | null, // /images/utopia/pm.webp
  minister: null as string | null, // /images/utopia/minister.webp
  phishing: null as string | null, // /images/utopia/phishing.webp
  bank: null as string | null, // /images/utopia/bank.webp
  bankCaption:
    "Meridian Bank (demo) - the most phished brand category, about to become provable.",
};

// ---------------------------- §1 · Meet the Republica of Utopia (civic)

export const REPUBLIC = {
  name: "Republica of Utopia",
  tagline: "A democracy, going digital",
  meta: [
    "Population ~4.8 million",
    "E-government since 2009",
    "3 national institutions",
    "~310,000 registered companies",
  ],
  intro:
    "Utopia is a small democracy that runs on trust: a Civil Registry that knows every citizen, a Business Registry that knows every company, and a Tax Buro everyone deals with once a year. The institutions work. Their digital front doors do not.",
  institutions: [
    {
      icon: "id",
      name: "National Civil Registry",
      desc: "Births, identities, ID cards - the source of truth about people.",
    },
    {
      icon: "landmark",
      name: "National Business Registry",
      desc: "Company registrations, directors, legal representation - the source of truth about businesses.",
    },
    {
      icon: "key",
      name: "Tax Buro",
      desc: "Personal and company taxes - the portal every citizen and company signs in to.",
    },
  ],
  servicesToday:
    "All three institutions are online. The tax portal uses passwords. The company register sells PDF extracts. The civil registry issues plastic cards and stamps paper. Every private service in the Republic - banks first - rebuilds identity checks on top, from scratch, every time.",
  problemsOnline: [
    {
      icon: "phone",
      title: "Refund scams in the Republic's name",
      desc: "Fake “tax refund” portals phish citizens every filing season. The real portal and the scam look identical - both are just websites.",
    },
    {
      icon: "lock",
      title: "Password pain, everywhere",
      desc: "Every government portal has its own login. Resets flood the help desks, credentials get shared, and a phished password IS an identity.",
    },
    {
      icon: "files",
      title: "PDF extracts anyone can edit",
      desc: "Companies prove their existence with register extracts - documents any teenager can forge. Every bank and notary re-checks everything, every time.",
    },
  ],
  onlineConsequence:
    "The Republic takes the blame for every scam that runs in its name - and pays for every identity check its documents cannot survive.",
  problemsOffline: [
    {
      icon: "stamp",
      title: "“Who may sign for this company?”",
      desc: "Legal representation is proven with notarized paper and faxes. It goes stale the day a director leaves - and nobody finds out.",
    },
    {
      icon: "queue",
      title: "Queues to prove what the state already knows",
      desc: "Citizens line up at counters to obtain certificates about facts sitting in the registries: identity, residence, company roles.",
    },
  ],
  offlineConsequence:
    "Banks re-run KYC on the same companies over and over, notaries certify the same facts, and citizens queue for proofs the Republic already holds.",
  rootCause:
    "Online, the Republic's word looks exactly like the scammers' word. Nothing can be proven.",
  pmQuote: {
    text: "Our registries are the source of truth for five million people - and online, we cannot prove a single fact they hold. Citizens are phished in our name, companies are impersonated with our own documents, and every bank rebuilds identity from scratch. That has to change.",
    name: "Ines Duarte",
    role: "Prime Minister, Republica of Utopia",
  },
};

// ---------------------------- §2 · The solution: a verifiable Republic

export const SOLUTION = {
  title: "The solution: a verifiable Republic",
  ministerQuote: {
    text: "Open source wallets exist - for citizens and for organizations. Verana is public trust infrastructure. We have everything we need to give every citizen a verifiable ID card, every company a verifiable Business ID, and every service a way to check both - without building a single silo.",
    name: "Milo Kovar",
    role: "Digital Minister, Republica of Utopia",
  },
  needsTitle: "What the Minister needs",
  needsIntro:
    "To make the Republic verifiable end to end, the Minister's list is short:",
  needs: [
    {
      need: 1,
      tag: "ECS-Organization",
      title: "Verifiable institutions",
      desc: "The Republic itself must be provable before it can vouch for anyone - and its Business Registry should be the one issuing Business IDs.",
    },
    {
      need: 2,
      tag: "Utopia Citizen ID",
      title: "A Citizen ID citizens actually hold",
      desc: "The national ID card as a verifiable credential in any compatible wallet - eIDAS 2 compatible.",
    },
    {
      need: 3,
      tag: "Business ID",
      title: "Verifiable Business IDs",
      desc: "Companies prove who they are with a credential issued by the register, not a PDF extract.",
    },
    {
      need: 4,
      tag: "Legal Representative",
      title: "Proof of legal representation",
      desc: "A personal credential binding a person to the company they may act for - revocable the day it ends.",
    },
    {
      need: 5,
      tag: "Q1 + Q2/Q3",
      title: "Passwordless, fail-closed authentication",
      desc: "Public entities and companies verify citizens - and only authorized verifiers ever see the data.",
    },
  ],
  needsBridge:
    "All of this needs wallets to hold and check the proofs (they exist, open source, for people and for organizations) and one neutral, public place where every proof anchors. That place is Verana.",
  pillarsTitle: "Let's build on Verana",
  pillarsIntro:
    "Verana is a public infrastructure that generalizes the use of verifiable credentials, and provides out of the box:",
  ecosystemsTitle: "The ecosystem Utopia wants to join",
  ecosystemsIntro:
    "For Business IDs, Utopia makes a deliberate choice: join the shared ecosystem rather than build a national silo.",
  buildTitle: "The ecosystems Utopia wants to build",
  buildIntro:
    "Two credentials only the Republic can govern - so the Republic governs them, with two purpose-built ecosystems:",
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
  "Verana is public, decentralized infrastructure. Any ecosystem can self-create. A state uses the same open infrastructure as everyone else - no gatekeeper, and nothing to operate alone.";

export const ECOSYSTEM_JOIN = {
  icon: "landmark",
  tone: "violet",
  roles: "HOLDER + ISSUER",
  name: "Verana ECS Ecosystem",
  label: "Business IDs as ECS-Organization credentials",
  about:
    "The shared identity-card trust registry: certified Organization credentials, recognized by every Verana-aware wallet and service. Utopia's National Business Registry becomes an accredited ECS-Organization issuer - and because the register IS the source of truth, KYB becomes a lookup, not paperwork.",
  did: VESTA_CAST.ecs.did,
  why: "Utopia could run Business IDs in a custom ecosystem - but joining the shared ECS ecosystem means a Utopian company's credential is recognized everywhere, not just in Utopia. Interop wins.",
};

export const ECOSYSTEMS_BUILD = [
  {
    icon: "id",
    tone: "blue",
    role: "ECOSYSTEM",
    operator: "National Civil Registry",
    name: "Utopia Citizen ID",
    label: "the national ID card, eIDAS 2 compatible",
    about:
      "One schema: the Utopia Citizen ID (names, birth date, personal identifier, portrait). Issuance governed - only the Civil Registry issues. Verification governed too: a service must register as a relying party before any wallet will share the ID. That is the eIDAS 2 relying-party rule, made structural.",
    why: "identity fraud dies when the ID is cryptographic, and over-collection dies when verifiers need permission to ask.",
    did: UTOPIA_CAST.civilRegistry.did,
  },
  {
    icon: "network",
    tone: "violet",
    role: "ECOSYSTEM",
    operator: "National Business Registry",
    name: "Legal Representation",
    label: "who may act for a company - as proof",
    about:
      "One schema: the Legal Representative credential (company, registry id, person, role, powers, validity). Issuance governed - only the Business Registry issues, after the applicant identifies with their Citizen ID. Verification open: checking who represents a company is the register's public function.",
    why: "the notarized-paper-and-fax problem becomes a scan - and a representative who leaves is revoked the same day.",
    did: UTOPIA_CAST.businessRegistry.did,
  },
] as const;

// ----------------- §3 · The Minister's journey (scene graph sections)

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
  title: "The Minister's journey",
  intro:
    "One checklist, five builds. The picture below opens on the civic world you met in Section 1 - the gray institutions, Aria with her passwords, the fake refund portal - and each step transforms it. Watch the Minister's team work, and take part with your own wallet.",
  outro:
    "Every box on the Minister's list, checked: verifiable institutions · a Citizen ID in every wallet · Business IDs from the register · legal representation as proof · passwordless, fail-closed authentication. The Republic consumed nothing it does not also provide.",
  needs: [
    {
      id: "need-1",
      n: 1,
      title: "Verifiable institutions",
      tag: "ECS-Organization",
      intro:
        "First things first: the Republic itself must become provable - starting with the institution that knows every company.",
      steps: [
        {
          id: "3.1",
          stage: "3.1",
          title: "The Business Registry becomes a Verifiable Service",
          kind: "watch",
          story:
            "The National Business Registry deploys a vs-agent, an open source Business Wallet natively integrated with the public Verana infrastructure. A DID is generated for the register; Helvetia Trust Services (demo), an accredited ECS-Organization issuer, runs the KYB - trivially, for a national institution - and issues the register's Organization credential. The register self-issues its Service credential: the Republic's first green check.",
          code: {
            label: "The DID of the National Business Registry",
            value: UTOPIA_CAST.businessRegistry.did,
            note: "Placeholder until the Utopia cast is deployed on the Verana testnet - the value will resolve live.",
          },
          underHood: [
            "The vs-agent generates the DID (did:webvh recommended) and publishes its DID Document with a DIDComm endpoint at https://<host>/.well-known/did.json.",
            "Helvetia's ECS-Org issuance and the self-issued ECS-Service follow the exact flow of the Vesta story (3.1/3.2) - the pattern replicates across sectors; that is the point.",
          ],
          reproduce: [
            "Deploy a vs-agent on a public domain (Docker image + compose examples in the vs-agent repo).",
            "Open https://<your-host>/.well-known/did.json - that document is your Business Wallet's DID.",
            `Resolve it: ${resolver}/v1/trust/resolve?did=<your-did> → UNTRUSTED. That's the starting line.`,
          ],
          links: [
            { label: "vs-agent home", href: "https://github.com/verana-labs/vs-agent" },
            { label: "The Vesta journey (same first steps)", href: "/usecases/vesta/journey" },
          ],
        },
        {
          id: "3.2",
          stage: "3.2",
          title: "The register becomes an accredited Business ID issuer",
          kind: "watch",
          story:
            "The Verana ECS Ecosystem accredits the National Business Registry as an ECS-Organization ISSUER. This is the keystone decision of the whole build: Business IDs are plain ECS-Organization credentials - issued by the institution that already IS the source of truth about Utopian companies. KYB stops being paperwork and becomes a lookup.",
          points: [
            "Utopia deliberately joins the shared ECS ecosystem instead of building a national silo: a Utopian company's Business ID is recognized by every Verana-aware wallet and service worldwide.",
            "From now on, the state's own register issues - and every issuance is anchored in the public registry, checkable by anyone.",
          ],
          underHood: [
            "An ISSUER permission on the ECS-Organization schema, granted in the ECS Ecosystem's permission tree - the same accreditation Helvetia holds.",
            "Governed issuance, public accountability: the register's permission entry, its trust deposit, and every issuance are on-chain.",
          ],
          reproduce: [
            "In the Verana app: Discover & Join → ECS Ecosystem → Organization credential schema → Participants - the accreditation tree is public.",
            "Trust-resolve any credential the register issues: the chain ends at the ECS Ecosystem root.",
          ],
          links: [
            { label: "Verana app", href: app },
            { label: "Verifiable Trust spec", href: LINKS.vtSpec },
          ],
        },
      ],
    },
    {
      id: "need-2",
      n: 2,
      title: "A Citizen ID citizens actually hold",
      tag: "Utopia Citizen ID",
      intro:
        "The national ID card becomes a verifiable credential - issued by the Civil Registry, held in any compatible wallet, eIDAS 2 compatible.",
      steps: [
        {
          id: "3.3",
          stage: "3.3",
          title: "The Citizen ID ecosystem - both directions governed",
          kind: "watch",
          story:
            "The Civil Registry becomes verifiable the Utopian way: its Organization credential is issued by the National Business Registry - the Republic dogfoods its own register. Then it creates the Utopia Citizen ID trust ecosystem with a single schema, and two governance decisions that define the whole story: issuance is governed (only the Civil Registry issues), and verification is governed too - a service must register as a relying party before any wallet will share a Citizen ID.",
          points: [
            "The schema carries eIDAS-2-PID-inspired claims: names, birth date, personal identifier, nationality, portrait.",
            "Governed verification is the eIDAS 2 relying-party registration, made structural: over-asking is not policed after the fact - it is impossible by default.",
          ],
          underHood: [
            "Create New Trust Registry (+ EGF document) → Create New Credential Schema (issuer mode ECOSYSTEM, verifier mode ECOSYSTEM) → Create Root Permission.",
            "birthDate is a dateint (YYYYMMDD), so AnonCreds predicate proofs (age over 18) work without revealing the date.",
            "The Citizen ID is a personal credential: AnonCreds/DIDComm and OpenID4VC SD-JWT rails, never published as a Linked VP.",
          ],
          reproduce: [
            "In the Verana app: My Ecosystems → create a trust registry (name + governance-framework document).",
            "Add the Citizen ID schema with issuance mode ECOSYSTEM and verification mode ECOSYSTEM. Create the root permission.",
          ],
          links: [
            { label: "Verana app", href: app },
            { label: "VPR spec", href: LINKS.vprSpec },
          ],
        },
        {
          id: "3.4",
          stage: "3.4",
          title: "Citizens receive their IDs - in the wallet of their choice",
          kind: "watch",
          story:
            "Aria walks into a registry office (or uses her existing eID) and receives her Utopia Citizen ID - straight into the Personal Wallet she already uses. Utopia does not build a wallet monopoly: any of the integrated open source wallets can be customized for the Republic, the way the EUDI reference app and its forks already are. The SD-JWT rail is the eIDAS-2-compatible one.",
          points: [
            "One credential, every wallet: Hologram over AnonCreds/DIDComm, the EUDI-reference fork and the other OpenID4VC wallets over SD-JWT.",
            "Selective disclosure by default: a service that needs your age never sees your birth date.",
          ],
          underHood: [
            "Issuance runs over the personal-credential rails (AnonCreds/DIDComm first, OID4VC SD-JWT alongside) - the ECS-Badge dual-rail precedent from the Vesta cast.",
            "How the citizen is identified at first issuance (counter visit, existing eID bootstrap) is Utopia's civic process - the credential mechanics are identical either way.",
          ],
          reproduce: [
            "Get your own (demo) Citizen ID in Run the demos: pick a wallet, reveal the Civil Registry offer, and watch the wallet check the issuer first.",
          ],
          links: [
            { label: "Get a Citizen ID (Run the demos)", href: "/usecases/utopia/demos#demo-citizen-id" },
            { label: "Personal wallets playground", href: "/personal-wallets" },
          ],
        },
      ],
    },
    {
      id: "need-3",
      n: 3,
      title: "Verifiable Business IDs",
      tag: "Business ID",
      intro:
        "The PDF extract dies: companies prove who they are with a credential issued by the register itself.",
      steps: [
        {
          id: "3.5",
          stage: "3.5",
          title: "Meridian Bank gets its Business ID - and turns green",
          kind: "watch",
          story:
            "Meridian Bank (demo) applies for its Business ID. The Business Registry looks itself up - the company exists, its directors are known - and issues the bank's ECS-Organization credential on the spot. The bank self-issues its Service credential and publishes its online-banking service under its DID. The anti-phishing payoff: your bank can finally prove it is your bank, before you type anything.",
          points: [
            "KYB in seconds: the issuer IS the source of truth, so there is nothing to collect.",
            "Every Utopian company follows the same path - Solaris Bakery included.",
            "Banks are the most-phished brand category: a provable bank is the single highest-value green check in the Republic.",
          ],
          underHood: [
            "ECS-Org issued by the Business Registry (accredited issuer) + self-issued ECS-Service, published as Linked VPs - the standard Verifiable Service pattern.",
            "Customers' wallets trust-resolve the bank's DID before any connection: Q1 on every session.",
          ],
          reproduce: [
            "Once the Utopia cast is live: resolve the bank's DID and see the Proof-of-Trust with the register-issued Organization credential.",
          ],
          links: [
            { label: "Business wallets", href: "/business-wallets" },
          ],
        },
      ],
    },
    {
      id: "need-4",
      n: 4,
      title: "Proof of legal representation",
      tag: "Legal Representative",
      intro:
        "“Who may sign for this company?” - answered by a credential, not a fax.",
      steps: [
        {
          id: "3.6",
          stage: "3.6",
          title: "Tomás proves he runs Solaris Bakery",
          kind: "watch",
          story:
            "The Business Registry creates its second trust ecosystem: Legal Representation. Tomás Ferreira, managing director of Solaris Bakery (demo), connects to the register's service and identifies with his Utopia Citizen ID - reusable identity, the moment the whole architecture pays off. The register matches him against the company record and issues his Legal Representative credential: company, registry id, role, powers, validity.",
          points: [
            "Issuance governed: only the Business Registry issues. Verification open: checking who represents a company is the register's public function - anyone may ask.",
            "The credential is revoked the day Tomás leaves the bakery - and every verifier knows within a scan.",
          ],
          underHood: [
            "Second trust registry + Legal Representative schema (issuer mode ECOSYSTEM, verifier mode OPEN) + root permission.",
            "Identification by Citizen ID presentation over the session: the ID layer is the KYC other ecosystems build on - exactly like the ECS layer in the Vesta story.",
          ],
          reproduce: [
            "Get the demo credential in Run the demos: the Business Registry offer mints Tomás' claims.",
          ],
          links: [
            { label: "Get a Legal Representative credential", href: "/usecases/utopia/demos#demo-legal-rep" },
          ],
        },
      ],
    },
    {
      id: "need-5",
      n: 5,
      title: "Passwordless, fail-closed authentication",
      tag: "Q1 + Q2/Q3",
      intro:
        "The credentials exist. Now the Republic - and its companies - authenticate people with them, and only authorized verifiers ever see the data.",
      steps: [
        {
          id: "3.7",
          stage: "3.7",
          title: "The Tax Buro and Meridian Bank register as relying parties",
          kind: "watch",
          story:
            "The Tax Buro becomes verifiable (Organization credential from the Business Registry, of course) and registers as a VERIFIER of the Utopia Citizen ID. Meridian Bank does the same. From that day: Aria signs in to her tax space by presenting her Citizen ID - no password. Tomás opens the bakery's tax space and its bank account with his Legal Representative credential. Opening a personal account at Meridian is KYC in one scan.",
          points: [
            "One credential, public and private sector: the same Citizen ID signs Aria in at the Tax Buro and opens her account at the bank.",
            "The wallet checks the verifier before sharing (Q3): who is asking, and are they authorized to ask for this?",
            "The portal decides from the issuer chain: Citizen ID from the Civil Registry, Legal Representative from the Business Registry. Two rules cover the whole Republic.",
          ],
          underHood: [
            "VERIFIER permissions on the Citizen ID schema, granted by the Civil Registry's ecosystem - the relying-party register, on-chain and public.",
            "Legal Representative verification is OPEN, so the Tax Buro and the bank check it with no extra permission - the register meant it to be checked.",
          ],
          reproduce: [
            "Run both demos below: the Tax Buro login and the Meridian Bank window - citizen path and company path each.",
          ],
          links: [
            { label: "Tax Buro login (Run the demos)", href: "/usecases/utopia/demos#demo-tax-login" },
            { label: "Meridian Bank (Run the demos)", href: "/usecases/utopia/demos#demo-bank" },
          ],
        },
        {
          id: "3.8",
          stage: "3.8",
          title: "The refusals: unauthorized verifiers and fake portals",
          kind: "watch",
          story:
            "QuickCash Loans (demo) is a perfectly verifiable Utopian company - registered, green check, real Business ID. It would love to see your Citizen ID before selling you a loan. But it never registered as a relying party, and Citizen ID verification is governed: every compliant wallet answers its presentation request with a refusal. Trust is not authorization. And the fake refund portal from chapter 1? It fails at Q1 - it cannot even prove who it is.",
          points: [
            "Trusted, but not authorized to request this credential: the wallet blocks the share, and Aria's data never leaves her phone.",
            "Fail-closed by construction: over-collection is not a policy promise, it is a protocol property.",
          ],
          underHood: [
            "QuickCash holds ECS-Org + ECS-Service (Q1 passes) but no VERIFIER permission on the Citizen ID schema (Q3 fails) - the exact mirror of Vesta's Umbra, on the verifier side.",
            "The wallet-side check is [PRT-3] of the Verifiable Trust spec: verify the verifier's authorization before presenting.",
          ],
          reproduce: [
            "Run the QuickCash demo below: reveal its very real presentation request, and watch your wallet refuse it.",
          ],
          links: [
            { label: "The over-asking verifier (Run the demos)", href: "/usecases/utopia/demos#demo-quickcash" },
            { label: "Verifiable Trust spec", href: LINKS.vtSpec },
          ],
        },
      ],
    },
  ],
};

// --------------------------------- §4 · Run the demos

export const DEMOS = {
  n: 4,
  anchor: "section-4",
  title: "Run the demos",
  intro:
    "Download one of the integrated personal wallets to run the demos - every wallet shows the same verdicts, the same way. Any of them can be customized for Utopia.",
  verifyRule:
    "Always verify the certified Organization name and data shown in the Proof-of-Trust card in your wallet before proceeding.",
  chooseWallet: {
    title: "Choose a wallet",
    intro:
      "Pick one of the integrated personal wallets and install it - the demo QR codes below are minted for your wallet. The SD-JWT rail is the eIDAS-2-compatible one.",
  },
  citizenId: {
    title: "Get your Utopia Citizen ID",
    intro:
      "Request your (demo) Citizen ID from the National Civil Registry and watch your wallet check the issuer first:",
    offer: {
      org: "From the National Civil Registry",
      serviceId: "civil-registry",
      credential: "utopia-citizen-id",
      expect:
        "Green Proof-of-Trust: a certified institution, authorized to issue the Utopia Citizen ID. Accept it - you'll use it in the sign-in demos below.",
      tone: "emerald" as const,
    },
  },
  legalRep: {
    title: "Get a Proof of Legal Representation",
    intro:
      "Receive Tomás Ferreira's Legal Representative credential for Solaris Bakery (demo). In the real flow the applicant first identifies with their Citizen ID; the demo mints directly:",
    offer: {
      org: "From the National Business Registry",
      serviceId: "business-registry",
      credential: "utopia-legal-rep",
      expect:
        "Green Proof-of-Trust: the register itself, authorized to issue Legal Representative credentials. Accept it to unlock the company paths below.",
      tone: "emerald" as const,
    },
  },
  taxLogin: {
    title: "Sign in to the Tax Buro",
    intro:
      "The Republic's tax portal, passwordless. The portal decides from your credential's issuer chain:",
    outcomes: [
      {
        rule: "Your Citizen ID was issued by the National Civil Registry",
        result: "Personal tax space opened - welcome, citizen.",
        tone: "emerald" as const,
      },
      {
        rule: "Your Legal Representative credential was issued by the National Business Registry",
        result: "Company tax space opened, with the company's name.",
        tone: "emerald" as const,
      },
      {
        rule: "Anything else",
        result: "Access denied.",
        tone: "red" as const,
      },
    ],
  },
  bank: {
    title: "Open an account at Meridian Bank",
    intro:
      "The private-sector payoff: KYC in one scan, and corporate access on the same Legal Representative credential that works at the Tax Buro:",
    outcomes: [
      {
        rule: "Present your Citizen ID",
        result: "Identity verified against the Civil Registry - account opened. No document uploads, no video-ident.",
        tone: "emerald" as const,
      },
      {
        rule: "Present your Legal Representative credential",
        result: "Corporate access to the company account, with the company's name.",
        tone: "emerald" as const,
      },
      {
        rule: "Anything else",
        result: "Access denied.",
        tone: "red" as const,
      },
    ],
  },
  quickcash: {
    title: "The over-asking verifier",
    intro:
      "QuickCash Loans (demo) is a genuinely verifiable company - and it asks for your full Citizen ID. It holds no verifier permission, and Citizen ID verification is governed: your wallet must refuse.",
    serviceId: "quickcash",
    credential: "utopia-citizen-id",
    expect:
      "Your wallet trust-resolves QuickCash (green - it IS a real company), finds no VERIFIER authorization for the Citizen ID, and blocks the share. Your data never leaves.",
  },
  directory: {
    title: "Search the Directory of Utopia",
    intro:
      "Discovery by proof: query the public registry for the Republic's services by the credentials they present.",
    queries: [
      "All verified Utopian businesses - every company holding a Business ID issued by the National Business Registry.",
      "All services accepting the Utopia Citizen ID - the public register of authorized relying parties.",
      "Who legally represents company X - the register's public function, as a query.",
    ],
  },
};

// ----------------------------------- Closing teaser

export const CLOSING = {
  title: "Being found in Utopia",
  pendingLabel: "coming later",
  body: "Everything the Republic and its companies published - the Business IDs, the relying-party registrations, the service credentials - is public, resolvable, and indexable. The Trust Graph turns that into a national service directory nobody has to maintain by hand: citizens, search engines, and AI agents find Utopian services by what they prove, not what they claim. The full walkthrough ships when discovery is queryable.",
};
