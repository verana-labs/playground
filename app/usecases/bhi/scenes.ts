// The progressive scene graph of the BHI Verifiable Hiring story
// (chapter 3): Better Hiring Institute, the two certified DVS grantors,
// the employer, the job board, the candidate and the impostors, revealed
// and transformed stage by stage. Real organisations (BHI, Orchestrating
// Identity) appear as themselves; everyone else is fictional and labeled
// (demo). No DIDs: trust cards carry story data until the cast is
// deployed (chapter 4 hosts the live cards, pending the cast).
//
// The 3.3 stage is the one the source calls out as mattering most: two
// grantor branches side by side, the visual form of the openness
// argument (the network does not depend on Orchestrating Identity).

import type {
  SceneGraph,
  SceneNode,
  SceneEdge,
  SceneBadge,
} from "../../components/scene-graph";

export const STAGES = [
  "3.0",
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "3.5",
  "3.6",
] as const;

export type Stage = (typeof STAGES)[number];

const NODES: SceneNode[] = [
  // ---- the protagonist
  {
    id: "bhi",
    x: 330,
    y: 450,
    r: 28,
    icon: "landmark",
    tone: "gray",
    appears: "3.0",
    label: "Better Hiring Institute",
    sub: "convenes the UK hiring market; standards on paper",
    operator: "Modern Work Foundation CIC (Better Hiring Institute)",
    serviceType: "Sector body: standards and governance",
    verifiedAt: "3.1",
    toneByStage: { "3.1": "violet" },
    labelByStage: {
      "3.1": { sub: "governs the Recruitment Trust Network" },
    },
  },
  // ---- the market, today
  {
    id: "meridian",
    x: 760,
    y: 330,
    icon: "building",
    tone: "gray",
    appears: "3.0",
    label: "Meridian Technologies (demo)",
    sub: "hiring on emailed PDFs",
    operator: "Meridian Technologies Ltd (demo)",
    serviceType: "Careers portal and ATS",
    verifiedAt: "3.2",
    toneByStage: { "3.2": "emerald" },
    labelByStage: {
      "3.2": { sub: "Verified Employer in the network" },
    },
  },
  {
    id: "jobsearch",
    x: 1060,
    y: 330,
    icon: "building",
    tone: "gray",
    appears: "3.0",
    label: "JobSearch (demo)",
    sub: "a form on a website asking for your passport",
    operator: "JobSearch Ltd (demo)",
    serviceType: "Job board and credential-request service",
    verifiedAt: "3.3",
    toneByStage: { "3.3": "blue" },
    labelByStage: {
      "3.3": { sub: "recognised verifier: asks only what it may" },
    },
  },
  {
    id: "alex",
    x: 950,
    y: 560,
    icon: "user",
    tone: "amber",
    appears: "3.0",
    person: true,
    label: "Alex Chen (demo)",
    sub: "four proofs, no way to prove them",
    toneByStage: { "3.4": "emerald" },
    labelByStage: {
      "3.4": { sub: "four credentials, one wallet" },
    },
  },
  // ---- the red world
  {
    id: "halcyon",
    x: 600,
    y: 620,
    icon: "ghost",
    tone: "red",
    appears: "3.0",
    dashed: true,
    noteAlways: true,
    label: "Halcyon Talent (demo)",
    sub: "fake job ads harvest identity documents",
    operator: "Halcyon Talent (demo)",
    serviceType: "Careers site (copied branding)",
    labelByStage: {
      "3.6": { sub: "legitimate organisation, wrong network" },
    },
  },
  {
    id: "northgate",
    x: 150,
    y: 620,
    icon: "building",
    tone: "gray",
    appears: "3.0",
    dashed: true,
    noteAlways: true,
    label: "Northgate Screening (demo)",
    sub: "screening provider, not certified",
  },
  // ---- the trust layer
  {
    id: "ecs",
    x: 170,
    y: 70,
    icon: "network",
    tone: "violet",
    appears: "3.1",
    noteAlways: true,
    label: "Verana ECS Ecosystem",
    sub: "organisation and service credentials",
  },
  {
    id: "dvsEco",
    x: 520,
    y: 70,
    icon: "network",
    tone: "emerald",
    appears: "3.1",
    noteAlways: true,
    label: "DVS-Aligned Provider Ecosystem (demo)",
    sub: "mirrors the OfDIA register; operated by OID",
  },
  {
    id: "rtn",
    x: 880,
    y: 70,
    icon: "network",
    tone: "blue",
    appears: "3.1",
    noteAlways: true,
    label: "Recruitment Trust Network",
    sub: "two schemas, both about organisations",
    verifiedAt: "3.1",
  },
  // ---- the two certified grantors (the openness argument)
  {
    id: "oid",
    x: 170,
    y: 260,
    icon: "stamp",
    tone: "emerald",
    appears: "3.1",
    label: "Orchestrating Identity",
    sub: "certified Orchestration Service Provider",
    operator: "Orchestrating Identity",
    serviceType: "Onboarding and orchestration service",
    verifiedAt: "3.1",
  },
  {
    id: "tvs",
    x: 520,
    y: 260,
    icon: "stamp",
    tone: "emerald",
    appears: "3.3",
    label: "Trustworthy Verification Services (demo)",
    sub: "a second certified DVS grantor",
    operator: "Trustworthy Verification Services Ltd (demo)",
    serviceType: "DVS onboarding service",
    verifiedAt: "3.3",
  },
  // ---- the candidate's issuers (build 4)
  {
    id: "caledonian",
    x: 650,
    y: 740,
    icon: "award",
    tone: "emerald",
    appears: "3.4",
    label: "Caledonian University (demo)",
    sub: "awarding body: the degree credential",
    verifiedAt: "3.4",
  },
  {
    id: "northbank",
    x: 950,
    y: 790,
    icon: "id",
    tone: "emerald",
    appears: "3.4",
    label: "Northbank Identity (demo)",
    sub: "certified DVS issuer",
    verifiedAt: "3.4",
  },
  {
    id: "cirrus",
    x: 1200,
    y: 700,
    icon: "badge",
    tone: "emerald",
    appears: "3.4",
    label: "Cirrus Certification (demo)",
    sub: "professional cloud certification",
    verifiedAt: "3.4",
  },
  {
    id: "hmrc",
    x: 650,
    y: 890,
    icon: "bank",
    tone: "gray",
    appears: "3.4",
    dashed: true,
    noteAlways: true,
    label: "HMRC",
    sub: "data source, not an issuer",
  },
];

const EDGES: SceneEdge[] = [
  // 3.0 - the world of today
  { id: "e-bhi-market", from: "bhi", to: "meridian", appears: "3.0", until: "3.1", label: "standards on paper", tone: "gray", dashed: true, curve: -25, labelT: 0.5 },
  { id: "e-alex-jobsearch-today", from: "alex", to: "jobsearch", appears: "3.0", until: "3.5", label: "the same PDFs, every application", tone: "gray", dashed: true, curve: 25, labelT: 0.5 },
  { id: "e-jobsearch-meridian-today", from: "jobsearch", to: "meridian", appears: "3.0", until: "3.5", label: "asserted CVs, verified from scratch", tone: "gray", dashed: true, curve: -25, labelT: 0.5 },
  { id: "e-alex-halcyon", from: "alex", to: "halcyon", appears: "3.0", until: "3.6", label: "passport scan into a scammer's inbox", tone: "red", dashed: true, curve: 20, labelT: 0.5 },
  // 3.1 - BHI's identity + its ecosystem
  { id: "e-ecs-oid", from: "ecs", to: "oid", appears: "3.1", label: "accredited ECS-Org issuer", tone: "violet", labelT: 0.5 },
  { id: "e-dvseco-oid", from: "dvsEco", to: "oid", appears: "3.1", label: "certified provider (grantor)", tone: "emerald", curve: 20, labelT: 0.55 },
  { id: "e-oid-bhi", from: "oid", to: "bhi", appears: "3.1", label: "KYB + DVS register check: ECS-Org", tone: "emerald", curve: -20, labelT: 0.5 },
  { id: "e-bhi-rtn", from: "bhi", to: "rtn", appears: "3.1", label: "creates and governs (EGF published)", tone: "blue", curve: -20, labelT: 0.78 },
  // 3.2 - the verifiable employer
  { id: "e-oid-meridian", from: "oid", to: "meridian", appears: "3.2", label: "KYB: ECS-Org (reusable)", tone: "emerald", curve: -45, labelT: 0.45 },
  { id: "e-rtn-meridian", from: "rtn", to: "meridian", appears: "3.2", label: "Verified Employer, via a certified grantor", tone: "blue", labelT: 0.5 },
  // 3.3 - the recognised verifier, under the SECOND grantor
  { id: "e-dvseco-tvs", from: "dvsEco", to: "tvs", appears: "3.3", label: "certified provider (grantor)", tone: "emerald", curve: -20, labelT: 0.55 },
  { id: "e-tvs-jobsearch", from: "tvs", to: "jobsearch", appears: "3.3", label: "KYB + verifier onboarding", tone: "emerald", curve: -60, labelT: 0.45 },
  { id: "e-rtn-jobsearch", from: "rtn", to: "jobsearch", appears: "3.3", label: "Recognised RecTech Provider + VERIFIER entries", tone: "blue", curve: -15, labelT: 0.5 },
  // 3.4 - the candidate's wallet
  { id: "e-caledonian-alex", from: "caledonian", to: "alex", appears: "3.4", label: "degree, over DIDComm", tone: "emerald", curve: 15, labelT: 0.5 },
  { id: "e-northbank-alex", from: "northbank", to: "alex", appears: "3.4", label: "right to work + employment history", tone: "emerald", curve: 20, labelT: 0.55 },
  { id: "e-cirrus-alex", from: "cirrus", to: "alex", appears: "3.4", label: "professional certification", tone: "emerald", curve: -15, labelT: 0.5 },
  { id: "e-hmrc-northbank", from: "hmrc", to: "northbank", appears: "3.4", label: "payroll data (DUAA 2025 gateway)", tone: "gray", dashed: true, width: 0.7, curve: -30, labelT: 0.28 },
  // 3.5 - the application
  { id: "e-alex-jobsearch-vp", from: "alex", to: "jobsearch", appears: "3.5", label: "selective disclosure, over DIDComm", tone: "emerald", curve: 25, labelT: 0.5 },
  { id: "e-jobsearch-meridian-vp", from: "jobsearch", to: "meridian", appears: "3.5", label: "verified presentation: 4 of 4", tone: "emerald", curve: -25, labelT: 0.5 },
  // 3.6 - the impostors
  { id: "e-alex-halcyon-refused", from: "alex", to: "halcyon", appears: "3.6", label: "wallet refuses: no Verified Employer", tone: "red", dashed: true, curve: 20, labelT: 0.5 },
];

const BADGES: SceneBadge[] = [
  { id: "b-question", node: "meridian", dx: 44, dy: -24, text: "?", tone: "red", appears: "3.0", until: "3.2" },
  { id: "b-rtn-schemas", node: "rtn", dx: 0, dy: -40, text: "2 schemas", tone: "blue", appears: "3.1" },
  { id: "b-ve", node: "meridian", dx: 0, dy: -40, text: "Verified Employer", tone: "emerald", appears: "3.2" },
  { id: "b-rrp", node: "jobsearch", dx: 0, dy: -40, text: "Recognised RecTech Provider", tone: "emerald", appears: "3.3" },
  { id: "b-verifier", node: "jobsearch", dx: 52, dy: -18, text: "VERIFIER", tone: "blue", appears: "3.3" },
  { id: "b-4of4", node: "alex", dx: 0, dy: -40, text: "4 of 4 verified", tone: "emerald", appears: "3.5" },
  { id: "b-halcyon-refused", node: "halcyon", dx: 0, dy: -40, text: "wrong network", tone: "red", appears: "3.6" },
  { id: "b-northgate", node: "northgate", dx: 0, dy: -40, text: "not recognised", tone: "red", appears: "3.6" },
];

export const BHI_SCENES: SceneGraph = {
  stages: STAGES,
  title: "Verifiable Hiring: the Recruitment Trust Network",
  defaultViewBox: "0 20 1320 940",
  nodes: NODES,
  edges: EDGES,
  badges: BADGES,
  credentials: {
    bhi: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "issued by Orchestrating Identity (KYB + DVS register check)",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.1",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "self-issued (ECS pattern)",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.1",
      },
    ],
    oid: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "issued by an accredited ECS issuer",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.1",
      },
      {
        name: "DVS-Aligned Provider",
        tone: "emerald",
        issuedBy: "eligibility: DVS register status, nothing else",
        ecosystem: "DVS-Aligned Provider Ecosystem (demo)",
        appears: "3.1",
      },
    ],
    tvs: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "issued by an accredited ECS issuer",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.3",
      },
      {
        name: "DVS-Aligned Provider",
        tone: "emerald",
        issuedBy: "eligibility: DVS register status, nothing else",
        ecosystem: "DVS-Aligned Provider Ecosystem (demo)",
        appears: "3.3",
      },
    ],
    meridian: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "issued by Orchestrating Identity (reusable KYB)",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.2",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "self-issued (ECS pattern)",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.2",
      },
      {
        name: "Verified Employer",
        tone: "violet",
        issuedBy: "issued by a certified DVS grantor",
        ecosystem: "Recruitment Trust Network",
        appears: "3.2",
      },
    ],
    jobsearch: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "issued by Trustworthy Verification Services (demo)",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.3",
        note: "Onboarded by the SECOND grantor: nothing the candidate sees depends on which certified provider did the onboarding.",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "self-issued (ECS pattern)",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.3",
      },
      {
        name: "Recognised RecTech Provider",
        tone: "violet",
        issuedBy: "issued by BHI (ECOSYSTEM onboarding mode)",
        ecosystem: "Recruitment Trust Network",
        appears: "3.3",
      },
    ],
    alex: [
      {
        name: "BSc Computer Science, First Class",
        tone: "violet",
        issuedBy: "issued by Caledonian University (demo)",
        ecosystem: "Qualification (external)",
        appears: "3.4",
      },
      {
        name: "Employment history: 3 employers, 5 years",
        tone: "blue",
        issuedBy: "issued by Northbank Identity (demo), from HMRC payroll records",
        ecosystem: "Employment Reference (external)",
        appears: "3.4",
        note: "The issuer is the DVS provider; HMRC is the data source under the DUAA 2025 information gateway. HMRC is not an issuer.",
      },
      {
        name: "Right to Work (UK)",
        tone: "emerald",
        issuedBy: "issued by Northbank Identity (demo)",
        ecosystem: "Right to Work (external)",
        appears: "3.4",
      },
      {
        name: "Professional cloud certification",
        tone: "amber",
        issuedBy: "issued by Cirrus Certification (demo)",
        ecosystem: "Professional Certification (external)",
        appears: "3.4",
      },
    ],
    halcyon: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "issued by a certified DVS provider",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.6",
        note: "Verifiable is not the same as authorised: Halcyon holds no Verified Employer credential, so the wallet refuses its requests.",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "self-issued (ECS pattern)",
        ecosystem: "Verana ECS Ecosystem",
        appears: "3.6",
      },
    ],
  },
  accreditations: {
    bhi: [
      {
        role: "ISSUER",
        schema: "Recognised RecTech Provider",
        context: "Recruitment Trust Network (ECOSYSTEM mode)",
        appears: "3.1",
      },
    ],
    oid: [
      {
        role: "ISSUER",
        schema: "ECS-Organization",
        context: "Verana ECS Ecosystem",
        appears: "3.1",
      },
      {
        role: "ISSUER",
        schema: "Verified Employer",
        context: "Recruitment Trust Network (GRANTOR mode)",
        appears: "3.2",
      },
    ],
    tvs: [
      {
        role: "ISSUER",
        schema: "ECS-Organization",
        context: "Verana ECS Ecosystem",
        appears: "3.3",
      },
    ],
    jobsearch: [
      {
        role: "VERIFIER",
        schema: "Qualification",
        context: "Qualification ecosystem (external)",
        appears: "3.3",
      },
      {
        role: "VERIFIER",
        schema: "Right to Work",
        context: "Right to Work ecosystem (external)",
        appears: "3.3",
      },
      {
        role: "VERIFIER",
        schema: "Employment Reference",
        context: "Employment Reference ecosystem (external)",
        appears: "3.3",
      },
    ],
    caledonian: [
      {
        role: "ISSUER",
        schema: "Qualification",
        context: "Qualification ecosystem (external)",
        appears: "3.4",
      },
    ],
    northbank: [
      {
        role: "ISSUER",
        schema: "Right to Work · Employment Reference",
        context: "certified DVS issuer",
        appears: "3.4",
      },
    ],
    cirrus: [
      {
        role: "ISSUER",
        schema: "Professional Certification",
        context: "Professional Certification ecosystem (external)",
        appears: "3.4",
      },
    ],
  },
  nodeNotes: {
    ecs: "Verana's shared ecosystem of organisation and service credentials: one KYB, and an organisation's identity is provable everywhere.",
    dvsEco:
      "Operated by Orchestrating Identity. Mirrors OfDIA's DVS register (it does not constitute it, and is neither operated by nor endorsed by OfDIA): eligibility is register status and nothing else, and a provider that leaves the register has its Participant entry revoked. Its governance framework admits other certified OSPs as grantors.",
    rtn: "BHI's own ecosystem, built narrowly on purpose: Recognised RecTech Provider (issued by BHI) and Verified Employer (issued by certified DVS grantors). Both verification-OPEN. BHI accredits who may ask, not who may issue.",
    hmrc: "The Data (Use and Access) Act 2025 information gateway lets a certified DVS provider request payroll data from HMRC on behalf of a citizen. HMRC is the data source; the DVS provider is the issuer. HMRC has not agreed to become a credential issuer and is not represented as one.",
    alex: "The candidate: four credentials from four issuers in four ecosystems, held in one wallet, disclosed selectively. No entry in any public registry: nothing about an individual is written to a public ledger.",
    northgate:
      "Holds ECS-Organization, but not Recognised RecTech Provider, and is not on the DVS register. An employer can establish this in one resolution instead of one procurement cycle.",
    halcyon:
      "The antagonist: fake job ads that harvest identity documents. It can copy branding and put up a QR code; it cannot present a Verified Employer credential, because the network never recognised it.",
  },
  stageView: {
    "3.1": {
      only: ["ecs", "dvsEco", "oid", "bhi", "rtn"],
      viewBox: "0 20 1060 560",
    },
    "3.2": {
      only: ["oid", "bhi", "rtn", "meridian", "dvsEco"],
      viewBox: "0 20 1060 560",
    },
    // The money shot: two grantor branches side by side.
    "3.3": {
      only: ["dvsEco", "oid", "tvs", "rtn", "bhi", "jobsearch"],
      viewBox: "0 20 1250 560",
    },
    "3.4": {
      only: ["alex", "caledonian", "northbank", "cirrus", "hmrc"],
      viewBox: "500 470 820 500",
    },
    "3.5": {
      only: ["alex", "jobsearch", "meridian", "rtn"],
      viewBox: "580 20 700 660",
    },
    "3.6": {
      only: ["alex", "halcyon", "northgate", "meridian", "rtn", "jobsearch"],
      viewBox: "0 20 1250 700",
    },
  },
  stageChanges: {
    "3.1": {
      nodes: ["bhi", "rtn"],
      note: "BHI's first green check, and the Recruitment Trust Network exists",
    },
    "3.2": {
      nodes: ["meridian"],
      note: "the employer turns green: Verified Employer behind the listing flag",
    },
    "3.3": {
      nodes: ["jobsearch", "tvs"],
      note: "a second certified grantor: same schemas, same rules, same verdict",
    },
    "3.4": {
      nodes: ["alex"],
      note: "four credentials from four issuers, none of them issued by BHI",
    },
    "3.5": {
      nodes: ["alex", "meridian"],
      note: "9:41 to 9:44: a verified presentation instead of a document set",
    },
    "3.6": {
      nodes: ["halcyon", "northgate"],
      note: "the scam fails at the moment of asking",
    },
  },
  verifiedNote:
    "Illustrative data until the BHI cast is deployed on the testnet: the live trust cards arrive with chapter 4.",
};
