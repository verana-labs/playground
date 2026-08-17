// The BHI (Better Hiring Institute) "Verifiable Hiring" use case, in four
// chapters - full content in UK English. Source of truth: verana-spec →
// playground/submission/oid-bhi.md (draft v4, provided by Orchestrating
// Identity). Two rules inherited from the Bolivia/CCM stories: (1) REAL
// organisations (BHI, Orchestrating Identity) appear as themselves; every
// other participant is fictional and labeled (demo); (2) the candidate is
// the story's only named person, per the source wireframes.
//
// Vocabulary: this copy deliberately uses Verana v5 terms (Ecosystem,
// Participant, onboarding modes), as the source does. The older use cases
// on this site use v3 terms (Trust Registry, Permission); aligning them is
// a separate, site-wide decision.
//
// ---------------------------------------------------------------------
// PENDING - information we are waiting on before publication (tracked in
// the source's build notes; to be confirmed with Orchestrating Identity):
//
//  1. [QUOTE] Keith Rosser (Chair, BHI Advisory Board) - chapter 1 quote
//     not yet approved. A placeholder card renders instead; the approved
//     text drops into INSTITUTE.quote.text below.
//  2. [QUOTE] David Rennie (ARTP Digital Identity lead and Chief Trust
//     Officer, Orchestrating Identity) - chapter 2 quote not yet
//     approved. Same treatment: SOLUTION.quote.text.
//  3. [SCOPE] Orchestrating Identity's exact DVS certification scope is
//     to be confirmed in writing; copy says "certified under the UK DVS
//     trust framework" without enumerating roles until then.
//  4. [AGREEMENT] Nothing referencing the Orchestrating Identity-Verana
//     relationship may be published before the agreement is signed. The
//     whole use case is therefore unlisted + noindex for now.
//  5. [CAST] The deployment inventory (which participants get live
//     vs-agents, hosts, demo claim sets) has not been provided; chapter 4
//     demos render as "coming soon" until the cast ships.
// ---------------------------------------------------------------------

import type { Stage } from "./scenes";
import type {
  JourneyNeed as GenericJourneyNeed,
  SubStep as GenericSubStep,
} from "../story-blocks";

export type SubStep = GenericSubStep<Stage>;
export type JourneyNeed = GenericJourneyNeed<Stage>;

/** Brand assets (public/images/bhi/) - none provided yet; every entry is
 *  null so the sections fall back to initials/icon placeholders.
 *  PENDING: BHI and OID logos + any wireframe imagery await sign-off. */
export const BHI_ASSETS = {
  bhi: null as string | null,
  oid: null as string | null,
};

// ---------------------------- §1 · Meet the Recruitment Trust Network

export const INSTITUTE = {
  name: "Better Hiring Institute",
  tagline: "Faster, fairer, safer hiring across the UK",
  meta: [
    "A brand of the Modern Work Foundation CIC (104403)",
    "~15,000 employer members",
    "ARTP: the Association of RecTech Providers, 36+ UK members",
    "Works with the Home Office, DBS, DSIT, Disclosure Scotland and the ICO",
  ],
  intro:
    "BHI convenes both sides of the hiring market: the employers who buy hiring technology and, through ARTP, the providers who build it. That is the position from which a sector-wide trust network can credibly be governed: by the body that already sets the standard, rather than by any one vendor within it.",
  artpNote:
    "ARTP workstreams: Standards · Right to Work · Criminal Background Checks · Digital Identity · Digital Wallets and Credentials.",

  journeyTitle: "The hiring journey today",
  journeyIntro:
    "A candidate applies for a job. Between “I’d like to apply” and “you start on Monday” sit four to eight weeks of a single repeated task: proving things.",

  castTitle: "The cast",
  cast: [
    { name: "Meridian Technologies (demo)", role: "Employer, hiring a Senior Software Engineer, London, £70-85k", status: "demo" },
    { name: "JobSearch (demo)", role: "Job board, jobsearch.example.co.uk", status: "demo" },
    { name: "Alex Chen (demo)", role: "Candidate: 5 years' experience, BSc Computer Science", status: "demo" },
    { name: "Halcyon Talent (demo)", role: "Agency running fake job ads to harvest identity documents", status: "antagonist" },
    { name: "Northgate Screening (demo)", role: "Screening provider, not certified", status: "demo" },
    { name: "Orchestrating Identity", role: "Certified Orchestration Service Provider; onboards organisations onto the network", status: "real" },
    { name: "Trustworthy Verification Services (demo)", role: "A second certified DVS provider, acting as an alternative grantor", status: "demo" },
    { name: "Caledonian University (demo)", role: "Awarding body: issues the degree credential", status: "demo" },
    { name: "Northbank Identity (demo)", role: "Certified DVS provider: issues right-to-work and employment-history credentials", status: "demo" },
    { name: "Cirrus Certification (demo)", role: "Cloud certification body: issues the professional certification", status: "demo" },
    { name: "HMRC", role: "Data source for employment history, accessed under the Data (Use and Access) Act 2025 information gateway. Not an issuer.", status: "real" },
  ] as { name: string; role: string; status: "real" | "demo" | "antagonist" }[],

  carriesTitle: "What the candidate carries",
  carriesIntro:
    "Alex has four things worth proving, and no way to prove any of them without sending copies of documents to strangers:",
  carries: [
    "BSc Computer Science, First Class Honours, 2017",
    "Employment history: 5 years, 3 employers",
    "Right to Work (UK): British citizen",
    "Professional cloud certification, 2024",
  ],
  carriesNote:
    "Today each exists as a PDF, a scan, or a database record behind someone else's login. Alex emails the same four artefacts to every employer, and every employer verifies them from scratch.",

  problemsTitle: "The problems, and what they cost",
  problemGroups: [
    {
      who: "For the candidate",
      items: [
        {
          icon: "repeat",
          title: "The same paperwork, every time",
          desc: "Every application asks for the same certificates, the same payslips, the same passport scan. Nothing carries over.",
        },
        {
          icon: "files",
          title: "Data everywhere",
          desc: "A passport scan sits in the inbox of every employer, agency and screening provider the candidate has ever spoken to. The candidate has no idea who still holds it.",
        },
        {
          icon: "clock",
          title: "Weeks of dead time",
          desc: "Offers are made conditional, then stall while references and checks grind through email.",
        },
      ],
    },
    {
      who: "For the employer",
      items: [
        {
          icon: "ghost",
          title: "CV fraud",
          desc: "Qualifications and employment dates are asserted, not proven. Detection happens late, or never.",
        },
        {
          icon: "coins",
          title: "Verification cost",
          desc: "Every hire funds a fresh round of reference chasing and certificate checking: the same facts, verified again.",
        },
        {
          icon: "stamp",
          title: "Manual right to work",
          desc: "Document inspection is slow, inconsistent, and carries statutory-excuse risk when it goes wrong.",
        },
      ],
    },
    {
      who: "For the market",
      items: [
        {
          icon: "ghost",
          title: "Fake job ads and fake recruiters",
          desc: "A recruitment scam and a real application look identical: both are a form on a website asking for your passport.",
        },
        {
          icon: "search",
          title: "Uncertified providers",
          desc: "The DVS register exists, but it is a web page a human checks at procurement time, not something a system checks at transaction time. An employer has no machine-checkable way to confirm a provider is certified for what it claims.",
        },
      ],
    },
  ],
  rootCause:
    "A real job ad and a scam job ad look exactly the same. A real degree and a claimed degree look exactly the same. On both sides of the hire, nothing can be proven.",

  // PENDING [QUOTE 1]: text awaits Keith Rosser's approval. Until then the
  // section renders a placeholder card with attribution only. (The source
  // suggests the substance: hiring is the last major life transaction still
  // run on emailed PDFs; the technology to fix it now exists; the sector
  // needs one shared trust layer rather than thirty-six incompatible ones.
  // We deliberately do NOT render unapproved words as a quote.)
  quote: {
    text: null as string | null,
    author: "Keith Rosser",
    title: "Chair of the BHI Advisory Board",
    pendingNote: "Quote pending approval: awaiting sign-off from BHI.",
  },
};

// ---------------------------- §2 · The solution: become verifiable

export const SOLUTION = {
  // PENDING [QUOTE 2]: text awaits David Rennie's approval; placeholder
  // card renders meanwhile. (Suggested substance in the source: open-source
  // personal and business wallets now exist; public trust infrastructure
  // now exists; the UK now has a statutory framework for digital
  // verification services. What has been missing is a way to connect them
  // for hiring.)
  quote: {
    text: null as string | null,
    author: "David Rennie",
    title:
      "ARTP Digital Identity lead and Chief Trust Officer, Orchestrating Identity",
    pendingNote:
      "Quote pending approval: awaiting sign-off from Orchestrating Identity.",
  },

  needsTitle: "What BHI needs",
  needs: [
    {
      need: 1,
      tag: "ECS-Organization",
      title: "Verifiable identities for organisations",
      desc: "Employers, job boards, agencies and screening providers must be able to prove who they are, checkable by anyone, without sending company documents around.",
      href: "/usecases/bhi/journey#need-1",
    },
    {
      need: 2,
      tag: "ECS-Service",
      title: "Verifiable identities for services",
      desc: "A careers portal, an ATS, or a credential-request endpoint must prove what it is and who operates it, before a candidate shares a single document.",
      href: "/usecases/bhi/journey#need-2",
    },
    {
      need: 3,
      tag: "personal wallet",
      title: "Credentials people can hold",
      desc: "Candidates need their proofs in their own wallet, disclosed selectively, reusable across every application. These are issued by others (universities, government, certified DVS providers, professional bodies), not by BHI.",
      href: "/usecases/bhi/journey#need-4",
    },
    {
      need: 4,
      tag: "DVS as credential",
      title: "Existing certifications as proof, not PDFs",
      desc: "DVS certification, DBS Responsible Organisation status and ARTP membership already exist. They should travel with an organisation's identity and be checkable at the moment a request arrives, not at the next procurement cycle.",
      href: "/usecases/bhi/journey#need-3",
    },
    {
      need: 5,
      tag: "the Recruitment Trust Network",
      title: "The sector's own rules for the hiring side",
      desc: "A way for BHI to say who is a recognised RecTech provider and who is a verified employer, and to revoke it.",
      href: "/usecases/bhi/journey#need-1",
    },
  ],

  layersTitle: "Where this runs",
  layersIntro:
    "Two layers, and they should never be conflated. The first is statutory; the second is infrastructure.",
  layers: [
    {
      label: "The rules: the UK DVS trust framework",
      desc: "Published by OfDIA under the Data (Use and Access) Act 2025. It defines the roles a digital verification service can be certified against, and the DVS register records who holds that certification. It is the eligibility criterion for participating in this network as an issuer or verifier of identity-derived credentials. BHI does not grant it and cannot.",
    },
    {
      label: "The infrastructure: Verana",
      desc: "Public, permissionless trust infrastructure on which ecosystems publish their governance frameworks, credential schemas and participant registries, so that a claim like “this organisation is certified” becomes something a wallet can resolve in the moment, rather than something a human looks up afterwards. Anyone may create an ecosystem or join one.",
    },
  ],
  pillars: [
    {
      title: "Sovereign ecosystems: Trust Ecosystems",
      desc: "Build an ecosystem with your own schemas, governance framework, participants and business model, or join an existing one.",
    },
    {
      title: "Verifiable identity: Verifiable Trust",
      desc: "Identify any service and the organisation controlling it, and verify it before you connect. Verify first. Then connect.",
    },
    {
      title: "Discovery: the Trust Graph",
      desc: "Find services and ecosystems by the credentials they hold, ranked by trust, for people, search engines and AI agents.",
    },
  ],

  whoDecidesTitle: "Who decides what",
  whoDecides: [
    "OfDIA sets and administers DVS certification.",
    "BHI governs the Recruitment Trust Network and decides what a Verified Employer is.",
    "Orchestrating Identity, as a certified Orchestration Service Provider, onboards organisations, confirms DVS register status, and is accredited by the Verana Council as a qualified issuer of ECS-Organization credentials.",
    "Verana is public infrastructure with no gatekeeper: any organisation can join an ecosystem, and any group can create one.",
  ],
  whoDecidesPunch:
    "Four parties. No single one both writes the rules and controls the door.",

  joinsTitle: "The ecosystems BHI joins",
  joins: [
    {
      name: "Verana ECS Ecosystem",
      role: "BHI and every participating organisation join as HOLDER",
      desc: "The identity card: the ecosystem that governs the essential credential schemas. An accredited issuer runs Know-Your-Business once, then issues an ECS-Organization credential; services carry ECS-Service credentials describing what they are and who operates them. One KYB, and an organisation's identity is provable everywhere. This is what turns the check green, and the foundation everything else builds on.",
    },
    {
      name: "DVS-Aligned Provider Ecosystem (demo)",
      role: "certified providers join as HOLDERS · operated by Orchestrating Identity",
      desc: "Today, DVS certification is an entry on a register that a machine cannot check mid-transaction. Carried as a credential on an organisation's verified identity, it becomes something a candidate's wallet evaluates at the moment a request arrives. Eligibility is DVS register status and nothing else: this ecosystem mirrors OfDIA's register, does not constitute it, and is neither operated by nor endorsed by OfDIA. If a provider leaves the register, its Participant entry is revoked. Its governance framework provides for other certified OSPs to be admitted as grantors.",
    },
  ],

  buildsTitle: "The ecosystem BHI builds",
  buildsIntro:
    "One need remains. No existing ecosystem can answer “is this a legitimate employer, and is this a recognised provider in UK hiring?” Only the sector can. So BHI builds its own, and builds it narrowly, on purpose.",
  rtn: {
    name: "The Recruitment Trust Network",
    role: "BHI operates as ECOSYSTEM",
    schemas: [
      {
        schema: "Recognised RecTech Provider",
        issuance: "ECOSYSTEM (BHI)",
        verification: "OPEN",
        heldBy: "Member providers",
      },
      {
        schema: "Verified Employer",
        issuance: "GRANTOR (certified DVS providers)",
        verification: "OPEN",
        heldBy: "Employers",
      },
    ],
    note: "That is the whole registry. Two schemas, both about organisations. BHI governs who may participate in hiring: not what a degree is, not who is entitled to work. Those credentials belong to the ecosystems that already own them. The Recruitment Trust Network consumes them and sets the terms on which its own participants may ask for them.",
  },

  rulesTitle: "Who may ask, and who may hold",
  rulesIntro: "Two rules follow, and they run in opposite directions on purpose.",
  rules: [
    {
      title: "Asking is restricted",
      desc: "A candidate's right-to-work status is not something any passing website may request. Within the Recruitment Trust Network, only participants holding a Recognised RecTech Provider or Verified Employer credential may request identity-derived credentials, and the wallet enforces this before anything is presented. This is a data-protection decision recorded in the governance framework.",
    },
    {
      title: "Holding is not",
      desc: "Any individual may hold a wallet and receive credentials under the rules of whichever scheme issues them. Candidates get no entry in any public registry: the registry records organisations and their Participant entries, not people and their attributes. Nothing about an individual is written to a public ledger.",
    },
  ],

  designTitle: "The design decision that keeps this defensible",
  design: [
    "BHI accredits who may ask, not who may issue. A job board holding a Recognised RecTech Provider credential is what qualifies it to request a candidate's right-to-work status, but the credential itself is issued by a certified DVS provider under the Home Office's rules, and BHI has no hand in it.",
    "This keeps the build small, keeps BHI inside its actual authority, and avoids the sector body appearing to arbitrate government-derived attributes.",
  ],
  why: "Why BHI builds it: sector integrity as a structural property. Real employers and recognised providers turn green, fake job ads and unrecognised providers turn red, and a member that goes rogue can be revoked. What the sector consumed, the sector now provides.",
};

// ---------------------------- §3 · The journey (six builds)

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
  title: "The journey",
  intro:
    "Six builds: BHI's identity and its ecosystem, the employer, the job board, the candidate's wallet, the application itself, and what happens to the impostors. Each step follows the playground template: narrative, trust-graph diagram, Reproduce it, Under the hood.",
  outro:
    "Six builds, and the wireframe's line stands: your credentials remain in your wallet. The employer receives a cryptographically signed proof, not a document set. There is nothing to store and nothing to leak.",
  needs: [
    {
      id: "need-1",
      n: 1,
      title: "BHI's identity, and its ecosystem",
      tag: "anchor + Recruitment Trust Network",
      intro: "Before governing trust for a sector, BHI proves itself.",
      steps: [
        {
          id: "s-3-1",
          stage: "3.1",
          title: "BHI becomes verifiable and creates the Recruitment Trust Network",
          kind: "watch",
          story:
            "BHI deploys its Business Wallet: a vs-agent on a BHI domain. A DID is generated, the identifier everything else attaches to. It proves nothing yet; it is the empty identity card. BHI then joins the Verana ECS Ecosystem and completes a Know-Your-Business exchange over DIDComm with Orchestrating Identity. Because Orchestrating Identity is a provider certified under the UK DVS trust framework, the Verana Council has accredited it as a qualified ISSUER of the ECS-Organization credential: it does not merely run the onboarding, it verifies the organisation, confirms DVS register status, and issues the credential itself. Finally BHI publishes its governance framework (the sector standard the Standards workstream is already producing, rendered as an Ecosystem Governance Framework) and creates its registry with the two schemas from Chapter 2.",
          points: [
            "DVS certification is the accreditation criterion: any provider certified under the UK DVS trust framework can be accredited by the Verana Council the same way and issue ECS-Organization credentials. The route is not the point, the credential is; build 3 shows a participant taking a different one.",
            "New in this step: BHI's DID is born, the check turns green, and the Recruitment Trust Network exists.",
          ],
          reproduce: [
            "Deploy a vs-agent on a public domain (Docker image and compose examples in the vs-agent repository).",
            "Open https://<your-host>/.well-known/did.json - that document is your Business Wallet's DID.",
            "Resolve it: https://resolver.testnet.verana.network/v1/trust/resolve?did=<your-did> returns UNTRUSTED. That is the starting line.",
            "In the Verana app: Discover & Join → ECS Ecosystem → Organization schema → Participants → join under an active issuer branch. Complete the KYB exchange over DIDComm.",
            "My Ecosystems → create an ecosystem (name plus governance-framework document) → add credential schemas → create root Participant entries.",
          ],
          underHood: [
            "The vs-agent generates the DID (did:webvh recommended) and publishes its DID Document with a DIDComm endpoint.",
            "Orchestrating Identity holds an ISSUER Participant entry on the ECS-Organization schema, granted under the ECS Ecosystem governed by the Verana Council; its UK DVS certification is the accreditation criterion. Joining creates a HOLDER Participant entry on the same schema; the validating issuer sets it to VALIDATED and it becomes ACTIVE in the public tree.",
            "Ecosystem creation is three transactions: Create New Ecosystem (with the EGF document) → Create New Credential Schema → Create Root Participant.",
          ],
        },
      ],
    },
    {
      id: "need-2",
      n: 2,
      title: "Meridian Technologies becomes a verifiable employer",
      tag: "ECS-Org + ECS-Service + Verified Employer",
      intro:
        "The employer walks the same path BHI just walked, then joins the sector's network.",
      steps: [
        {
          id: "s-3-2",
          stage: "3.2",
          title: "Anchor, KYB, service identity, and the Verified Employer credential",
          kind: "watch",
          story:
            "Meridian Technologies (demo) deploys its anchor, completes KYB, and receives its ECS-Organization credential. It then self-accredits as an ECS-Service issuer and issues an ECS-Service credential to its careers and ATS service. Finally it applies to the Recruitment Trust Network as a holder of Verified Employer: the validating provider identifies Meridian by the ECS-Organization credential already on its DID. Reusable KYB, no fresh paperwork. That is what stands behind the “Apply with Verifiable Credentials” flag on the listing: not a marketing claim, a resolvable credential chain.",
          reproduce: [
            "Repeat build 1, steps 1-4, for the employer's Business Wallet.",
            "ECS Ecosystem → Service schema → Participants → join on the issuer side; self-issue the ECS-Service credential via the vs-agent Admin API and link it.",
            "Recruitment Trust Network → Verified Employer schema → Participants → Join. Present ECS-Organization when asked to identify.",
          ],
          underHood: [
            "Self-issuance of ECS-Service is valid because the same DID already presents a proven ECS-Organization: every service traces back to an accountable organisation.",
            "Meridian joins as HOLDER under a grantor branch; validation is an ECS-Organization presentation check, not a document review.",
          ],
        },
      ],
    },
    {
      id: "need-3",
      n: 3,
      title: "JobSearch becomes a recognised verifier, and picks its own provider",
      tag: "VERIFIER + two grantors",
      intro:
        "The job board is the party that actually asks the candidate for credentials. This build also shows the network is open.",
      steps: [
        {
          id: "s-3-3",
          stage: "3.3",
          title: "Verifier entries under a second grantor",
          kind: "watch",
          story:
            "JobSearch (demo) needs two things: its own verifiable identity (ECS-Organization plus ECS-Service), and a VERIFIER Participant entry on each candidate credential schema it intends to request. As an ARTP member it also holds a Recognised RecTech Provider credential. And here is the step that shows the network is open: JobSearch does not use Orchestrating Identity. It already has a commercial relationship with Trustworthy Verification Services (demo), another certified DVS provider. So Trustworthy Verification Services is established as a verifier grantor in the network, and JobSearch is onboarded by them instead. Same schemas, same rules, same verdict in the candidate's wallet: nothing about the trust the candidate sees depends on which provider did the onboarding.",
          points: [
            "When the candidate scans the QR code, the wallet does not see “a website”. It sees a DID presenting ECS-Service, controlled by an organisation presenting ECS-Organization and Recognised RecTech Provider, holding verifier entries for exactly the credentials it is asking for.",
            "Its verifier policy accepts qualification credentials from issuers accredited on the Qualification schema, right-to-work credentials from certified DVS issuers, and employment-reference credentials from accredited issuers.",
          ],
          reproduce: [
            "Deploy a vs-agent for the credential-request service; issue it an ECS-Service credential from the organisation anchor and link it.",
            "Join each candidate credential schema tree as VERIFIER for that service's DID, under whichever grantor you have chosen.",
            "Generate a DIDComm out-of-band invitation as a QR code; the wallet resolves the inviting DID before showing the request.",
          ],
          underHood: [
            "The QR code carries a DIDComm out-of-band invitation, not a URL to a form. Nothing is submitted to a web endpoint.",
            "The Personal Wallet applies the mirror rule before presenting: verify the verifier is trusted, and authorised to request these schemas.",
            "This is the step that kills the fake job ad. See build 6.",
          ],
        },
      ],
    },
    {
      id: "need-4",
      n: 4,
      title: "The candidate's wallet",
      tag: "four issuers, four ecosystems",
      intro:
        "Alex's four credentials arrive from four different issuers, in four different ecosystems, over DIDComm, and sit in one wallet.",
      steps: [
        {
          id: "s-3-4",
          stage: "3.4",
          title: "Four credentials, none of them issued by BHI",
          kind: "watch",
          story:
            "The BSc comes from Caledonian University (demo). The employment history and the right-to-work credential come from Northbank Identity (demo), a certified DVS provider. The professional certification comes from Cirrus Certification (demo). Every one of these is issued by somebody else: BHI issues none of them, and that is the point. The Recruitment Trust Network governs the hiring side and consumes the rest. Each credential is issued to Alex's DID, held by Alex, revocable by its issuer, and, critically, not held by any employer.",
          points: [
            "Where the employment credential actually comes from: this is the one credential in the demonstration with a real statutory route behind it. The Data (Use and Access) Act 2025 created an information gateway through which a certified DVS provider can request data from HMRC on behalf of a citizen. HMRC already holds the payroll history that establishes where someone has worked and when.",
            "So the issuer is the DVS provider, and HMRC is the data source. That distinction matters: HMRC has not agreed to become a credential issuer and is not being represented as one. What the demonstration shows is a credential built on a data route that already exists in law, which is why this part of the model requires a request to HMRC rather than a change to it.",
          ],
          underHood: [
            "Issuance runs over DIDComm; the Personal Wallet verifies the issuer is trusted and authorised to issue that schema before accepting.",
            "Revocation is issuer-side and visible at verification time: a suspended certification or a withdrawn right-to-work status shows up on the next presentation, not at the next audit.",
          ],
        },
      ],
    },
    {
      id: "need-5",
      n: 5,
      title: "The application",
      tag: "9:41 to 9:44",
      intro:
        "The wireframe flow, end to end: search, scan, review, select, approve, submit.",
      steps: [
        {
          id: "s-3-5",
          stage: "3.5",
          title: "From search to submitted, in one sitting",
          kind: "watch",
          story:
            "The board filters listings to employers presenting a Verified Employer credential, and the job detail page declares up front which credentials will be requested: the four schemas the verifier holds VERIFIER entries for. Alex scans the QR: a DIDComm out-of-band invitation, and the wallet resolves the requesting DID. Then the step the wireframes did not have: the Proof-of-Trust card. Who is asking, what credentials they present, who certified them, shown before anything is shared. Alex selects credentials (selective disclosure: per credential, and per attribute), unlocks the wallet, and the presentation travels over DIDComm. The verifier checks signature, revocation status, and the issuer's registry entry. Confirmed: 4 of 4 verified, reference number, and the activity log is the audit trail.",
          points: [
            "Elapsed time in the wireframe: 9:41 to 9:44. Elapsed time today: two to six weeks.",
          ],
          underHood: [
            "Verification is three checks per credential: the signature is valid, the credential is not revoked, and the issuer holds an active ISSUER Participant entry on that schema in the registry. The third check is the one with no equivalent today.",
            "The employer receives a cryptographically signed proof, not a document set. There is nothing to store and nothing to leak.",
          ],
        },
      ],
    },
    {
      id: "need-6",
      n: 6,
      title: "The impostors",
      tag: "refusals, with proof",
      intro:
        "Three failures, each failing at a different link of the chain.",
      steps: [
        {
          id: "s-3-6",
          stage: "3.6",
          title: "The fake job ad, the uncertified provider, the forged degree",
          kind: "watch",
          story:
            "Halcyon Talent (demo) can build a convincing careers site, copy Meridian's branding, and put up a QR code. What it cannot do is present a Verified Employer credential, because only the Recruitment Trust Network issues one and it never recognised Halcyon. The candidate's wallet refuses before any data moves: the scam fails at the point where scams currently succeed, the moment of asking. Worth stating plainly: Halcyon may itself be a perfectly verifiable organisation, with valid ECS-Organization and ECS-Service credentials, like Umbra Repairs in the Vesta story. Verifiable is not the same as authorised. Legitimate organisation, wrong network.",
          points: [
            "Northgate Screening (demo) holds ECS-Organization but not Recognised RecTech Provider, and is not on the DVS register. An employer evaluating providers can establish this in one resolution instead of one procurement cycle.",
            "The forged degree: a credential claiming a First Class BSc, signed by a DID with no ISSUER Participant entry on the Qualification schema. It verifies as a signature and fails as a credential. That distinction is the whole point.",
          ],
        },
      ],
    },
  ],
};

// ---------------------------- §4 · Run the demos

export const DEMOS = {
  intro:
    "Get your credentials, apply for a job, and watch a fake employer fail. Everything below will run live against the Verana testnet, one vs-agent per participant, once the BHI cast is deployed.",
  verifyRule:
    "Always verify the certified organisation name and data shown in the Proof-of-Trust card in your wallet before proceeding.",
  chooseWallet: {
    title: "Choose a wallet",
    intro:
      "Pick any of the integrated personal wallets: every one reaches the same verdict by the same route. The demo QR codes are minted for the wallet you choose.",
  },
  demos: [
    {
      id: "demo-credentials",
      title: "Demo 1 · Receive your credentials",
      desc: "Request the four demo credentials and watch your wallet check each issuer's accreditation before offering to accept.",
    },
    {
      id: "demo-apply",
      title: "Demo 2 · Apply to Meridian Technologies (demo)",
      desc: "The full flow: scan, review the requester, select, approve, submit. Note what you are shown before you are asked to share anything.",
    },
    {
      id: "demo-halcyon",
      title: "Demo 3 · Apply to Halcyon Talent (demo)",
      desc: "Same flow, same-looking site. Watch the wallet stop you: a red Proof-of-Trust card.",
    },
    {
      id: "demo-revoked",
      title: "Demo 4 · Present a revoked credential",
      desc: "Verification fails at the registry check, not at the signature check.",
    },
    {
      id: "demo-directory",
      title: "Demo 5 · Search the directory",
      desc: "Query the registry for organisations presenting a Verified Employer credential; narrow to those also presenting Recognised RecTech Provider. Discovery by proof, not by claim. (Trust Graph: coming later, per the Vesta pattern.)",
    },
  ],
  freeNote:
    "Participation in the demonstrator is free. It runs on the Verana testnet, and no party charges a fee for joining, issuing or verifying within it.",
  // PENDING [CAST]: all five demos render as "coming soon" until the BHI
  // cast (bhi-cast.ts) is deployed and its DIDs replace the placeholders.
  pendingNote:
    "This service of the BHI cast is not yet deployed on the testnet: the demo activates automatically once its agent is online.",
};

export const CLOSING = {
  title: "What the sector consumed, the sector now provides",
  body: "BHI governs who may participate in hiring, not what a degree is, not who is entitled to work. OfDIA keeps certification, issuers keep their schemas, candidates keep their credentials. The Recruitment Trust Network adds the one missing piece: a machine-checkable answer, at the moment of asking, to “is this a legitimate employer, and is this a recognised provider in UK hiring?”",
  cta: "Explore the Vesta use case",
  ctaHref: "/usecases/vesta",
};
