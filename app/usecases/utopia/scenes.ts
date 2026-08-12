// The master scene graph of the Republica of Utopia story - one fixed
// layout, revealed and transformed stage by stage. Stage "3.0" is the
// pre-populated civic world (the gray institutions, Aria with the "?", the
// red fake refund portal); stages 3.1-3.8 walk the five needs of the
// Minister's checklist. Rendering machinery is shared with the other use
// cases (app/components/scene-graph.ts / StoryDiagram.tsx).

import { UTOPIA_CAST } from "../../lib/utopia-cast";
import { VESTA_CAST } from "../../lib/vesta-cast";
import { shortDid } from "../../lib/did";
import type {
  Accreditation,
  NodeCredential,
  SceneBadge,
  SceneEdge,
  SceneGraph,
  SceneNode,
} from "../../components/scene-graph";

export const STAGES = [
  "3.0",
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "3.5",
  "3.6",
  "3.7",
  "3.8",
] as const;

export type Stage = (typeof STAGES)[number];

const NODES: SceneNode[] = [
  // ---- the Republic's institutions (baseline, gray)
  {
    id: "businessRegistry",
    x: 260,
    y: 300,
    r: 28,
    icon: "landmark",
    tone: "gray",
    appears: "3.0",
    label: "National Business Registry",
    sub: "PDF extracts anyone can edit",
    did: UTOPIA_CAST.businessRegistry.did,
    serviceType: "Company register service",
    operator: "National Business Registry (demo) · Republica of Utopia",
    verifiedAt: "3.1",
    toneByStage: { "3.1": "blue" },
    labelByStage: {
      "3.1": { sub: shortDid(UTOPIA_CAST.businessRegistry.did) },
    },
  },
  {
    id: "civilRegistry",
    x: 460,
    y: 300,
    icon: "id",
    tone: "gray",
    appears: "3.0",
    label: "National Civil Registry",
    sub: "paper ID cards, office queues",
    did: UTOPIA_CAST.civilRegistry.did,
    serviceType: "Civil registry service",
    operator: "National Civil Registry (demo) · Republica of Utopia",
    verifiedAt: "3.3",
    toneByStage: { "3.3": "blue" },
    labelByStage: {
      "3.3": { sub: "issues the Utopia Citizen ID" },
    },
  },
  {
    id: "taxBuro",
    x: 140,
    y: 470,
    icon: "key",
    tone: "gray",
    appears: "3.0",
    label: "Tax Buro",
    sub: "password logins, phished accounts",
    did: UTOPIA_CAST.taxBuro.did,
    serviceType: "Tax portal service",
    operator: "Tax Buro (demo) · Republica of Utopia",
    verifiedAt: "3.7",
    toneByStage: { "3.7": "blue" },
    labelByStage: { "3.7": { sub: "authorized Citizen ID verifier" } },
  },
  // ---- people
  {
    id: "aria",
    x: 820,
    y: 380,
    icon: "user",
    tone: "amber",
    appears: "3.0",
    person: true,
    label: "Aria Solano",
    sub: "a citizen - queues, passwords, paper",
    toneByStage: { "3.4": "emerald" },
    labelByStage: {
      "3.4": { sub: "her Citizen ID, in the wallet of her choice" },
    },
  },
  {
    id: "tomas",
    x: 700,
    y: 500,
    icon: "wallet",
    tone: "emerald",
    appears: "3.6",
    person: true,
    label: "Tomás Ferreira",
    sub: "managing director, Solaris Bakery (demo)",
  },
  // Three extra citizens appear only in 3.4, receiving their Citizen IDs.
  {
    id: "cit1",
    r: 15,
    x: 350,
    y: 460,
    icon: "user",
    tone: "emerald",
    appears: "3.4",
    until: "3.5",
    person: true,
    label: "Citizen",
  },
  {
    id: "cit2",
    r: 15,
    x: 470,
    y: 478,
    icon: "user",
    tone: "emerald",
    appears: "3.4",
    until: "3.5",
    person: true,
    label: "Citizen",
    sub: "IDs land in their Personal Wallets",
  },
  {
    id: "cit3",
    r: 15,
    x: 590,
    y: 460,
    icon: "user",
    tone: "emerald",
    appears: "3.4",
    until: "3.5",
    person: true,
    label: "Citizen",
  },
  // ---- the red world
  {
    id: "fakePortal",
    x: 680,
    y: 170,
    icon: "ghost",
    tone: "red",
    appears: "3.0",
    dashed: true,
    label: "Fake refund portal",
    sub: "claims: “official tax refunds”",
  },
  {
    id: "quickcash",
    x: 640,
    y: 330,
    icon: "building",
    tone: "blue",
    appears: "3.8",
    noteAlways: true,
    label: "QuickCash Loans (demo)",
    sub: "verifiable - but not an authorized verifier",
    did: UTOPIA_CAST.quickcash.did,
    serviceType: "Consumer lending service (demo)",
    operator: "QuickCash Loans (demo)",
    verifiedAt: "3.8",
  },
  // ---- the trust layer
  {
    id: "ecs",
    x: 120,
    y: 90,
    icon: "landmark",
    tone: "violet",
    appears: "3.1",
    noteAlways: true,
    label: "Verana ECS Ecosystem",
    sub: "identity credentials - the green check",
    did: VESTA_CAST.ecs.did,
    serviceType: "Trust registry service",
    operator: "The ECS Ecosystem operator",
    verifiedAt: "3.1",
  },
  {
    id: "helvetia",
    x: 290,
    y: 90,
    icon: "stamp",
    tone: "blue",
    appears: "3.1",
    label: "Helvetia Trust Services",
    sub: "(demo) · accredited ECS-Org issuer",
    did: VESTA_CAST.helvetia.did,
    serviceType: "KYB issuance service",
    operator: "Helvetia Trust Services (demo)",
    verifiedAt: "3.1",
  },
  {
    id: "citizenEco",
    x: 470,
    y: 90,
    icon: "network",
    tone: "violet",
    appears: "3.3",
    noteAlways: true,
    label: "Utopia Citizen ID",
    sub: "issuance governed · verification governed",
    did: UTOPIA_CAST.civilRegistry.did,
    serviceType: "Trust registry service",
    operator: "National Civil Registry (demo) · Republica of Utopia",
    verifiedAt: "3.3",
  },
  {
    id: "legalEco",
    x: 650,
    y: 90,
    icon: "network",
    tone: "violet",
    appears: "3.6",
    noteAlways: true,
    label: "Legal Representation",
    sub: "issuance governed · anyone verifies",
    did: UTOPIA_CAST.businessRegistry.did,
    serviceType: "Trust registry service",
    operator: "National Business Registry (demo) · Republica of Utopia",
    verifiedAt: "3.6",
  },
  {
    id: "meridianBank",
    x: 850,
    y: 240,
    icon: "bank",
    tone: "blue",
    appears: "3.5",
    label: "Meridian Bank (demo)",
    sub: "a verifiable bank",
    did: UTOPIA_CAST.meridianBank.did,
    serviceType: "Online banking service (demo)",
    operator: "Meridian Bank (demo) · Republica of Utopia",
    verifiedAt: "3.5",
  },
];

const EDGES: SceneEdge[] = [
  // Baseline - the civic world of §1
  { id: "e-br-tax", from: "businessRegistry", to: "taxBuro", appears: "3.0", label: "the Republic's institutions", tone: "gray", labelT: 0.55 },
  { id: "e-cr-aria", from: "civilRegistry", to: "aria", appears: "3.0", until: "3.4", label: "paper ID cards", tone: "gray", dashed: true, curve: 25, labelT: 0.45 },
  { id: "e-aria-tax", from: "aria", to: "taxBuro", appears: "3.0", until: "3.7", label: "passwords and queues", tone: "gray", dashed: true, curve: 45, labelT: 0.45 },
  { id: "e-aria-fake", from: "aria", to: "fakePortal", appears: "3.0", label: "…a refund? can't tell it's fake", tone: "red", dashed: true, curve: -25, labelT: 0.5 },
  // Need 1 - verifiable institutions
  { id: "e-helvetia-br", from: "helvetia", to: "businessRegistry", appears: "3.1", label: "issues ECS-Org", tone: "emerald", curve: -30, labelT: 0.45 },
  { id: "e-ecs-helvetia", from: "ecs", to: "helvetia", appears: "3.1", label: "accredits", tone: "violet" },
  { id: "e-ecs-br", from: "ecs", to: "businessRegistry", appears: "3.2", label: "accredits ECS-Org issuer", tone: "violet", curve: 25, labelT: 0.45 },
  // Need 2 - the Citizen ID
  { id: "e-br-cr", from: "businessRegistry", to: "civilRegistry", appears: "3.3", label: "issues ECS-Org", tone: "emerald", labelT: 0.5 },
  { id: "e-cr-eco", from: "civilRegistry", to: "citizenEco", appears: "3.3", label: "creates & governs", tone: "violet", labelT: 0.5 },
  { id: "e-cr-aria-id", from: "civilRegistry", to: "aria", appears: "3.4", label: "issues Citizen ID", tone: "emerald", curve: -45, labelT: 0.45 },
  { id: "e-cr-cit1", from: "civilRegistry", to: "cit1", appears: "3.4", until: "3.5", width: 0.7, tone: "emerald" },
  { id: "e-cr-cit2", from: "civilRegistry", to: "cit2", appears: "3.4", until: "3.5", width: 0.7, label: "issues Citizen ID", tone: "emerald", labelT: 0.6 },
  { id: "e-cr-cit3", from: "civilRegistry", to: "cit3", appears: "3.4", until: "3.5", width: 0.7, tone: "emerald" },
  // Need 3 - Business IDs
  { id: "e-br-bank", from: "businessRegistry", to: "meridianBank", appears: "3.5", label: "issues ECS-Org (KYB = a lookup)", tone: "emerald", curve: -70, labelT: 0.45 },
  // Need 4 - legal representation
  { id: "e-br-legal", from: "businessRegistry", to: "legalEco", appears: "3.6", label: "creates & governs", tone: "violet", curve: -45, labelT: 0.5 },
  { id: "e-br-tomas", from: "businessRegistry", to: "tomas", appears: "3.6", label: "issues Legal Representative", tone: "emerald", curve: 55, labelT: 0.45 },
  // Need 5 - passwordless, fail-closed authentication
  { id: "e-eco-tax", from: "citizenEco", to: "taxBuro", appears: "3.7", label: "authorizes VERIFIER", tone: "violet", curve: 40, labelT: 0.45 },
  { id: "e-eco-bank", from: "citizenEco", to: "meridianBank", appears: "3.7", label: "authorizes VERIFIER", tone: "violet", curve: -25, labelT: 0.5 },
  { id: "e-aria-tax-id", from: "aria", to: "taxBuro", appears: "3.7", label: "presents Citizen ID → signs in", tone: "emerald", curve: 45, labelT: 0.45 },
  { id: "e-aria-bank", from: "aria", to: "meridianBank", appears: "3.7", label: "presents Citizen ID → KYC in one scan", tone: "emerald", curve: 25, labelT: 0.5 },
  { id: "e-tomas-tax", from: "tomas", to: "taxBuro", appears: "3.7", label: "Legal Rep → company tax space", tone: "emerald", curve: 30, labelT: 0.5 },
  { id: "e-tomas-bank", from: "tomas", to: "meridianBank", appears: "3.7", label: "Legal Rep → corporate account", tone: "emerald", curve: -35, labelT: 0.5 },
  // The counter-example
  { id: "e-quickcash-aria", from: "quickcash", to: "aria", appears: "3.8", label: "asks for your Citizen ID: refused", tone: "red", dashed: true, curve: 25, labelT: 0.5 },
];

const BADGES: SceneBadge[] = [
  // Baseline - Aria cannot tell what is real
  { id: "b-question", node: "aria", dx: 34, dy: -24, text: "?", tone: "red", appears: "3.0", until: "3.7" },
  // Need 1 - the register becomes provable, then an issuer
  { id: "b-br-org", node: "businessRegistry", dx: 44, dy: -26, text: "ECS-Org", tone: "blue", appears: "3.1" },
  { id: "b-br-trusted", node: "businessRegistry", dx: 44, dy: -6, text: "✓ TRUSTED", tone: "emerald", appears: "3.1" },
  { id: "b-br-issuer", node: "businessRegistry", dx: 44, dy: 14, text: "ECS-Org ISSUER", tone: "violet", appears: "3.2" },
  // Need 2 - the ID lands
  { id: "b-cr-trusted", node: "civilRegistry", dx: 40, dy: -26, text: "✓ TRUSTED", tone: "emerald", appears: "3.3" },
  { id: "b-aria-id", node: "aria", dx: 0, dy: -40, text: "Citizen ID", tone: "emerald", appears: "3.4" },
  // Need 3 - the bank turns green
  { id: "b-bank-trusted", node: "meridianBank", dx: 0, dy: -40, text: "✓ TRUSTED", tone: "emerald", appears: "3.5" },
  // Need 4 - representation as proof
  { id: "b-tomas-rep", node: "tomas", dx: 0, dy: -40, text: "Legal Representative", tone: "emerald", appears: "3.6" },
  // Need 5 - relying parties registered; the refusals
  { id: "b-tax-verifier", node: "taxBuro", dx: 0, dy: -40, text: "VERIFIER · Citizen ID", tone: "violet", appears: "3.7" },
  { id: "b-bank-verifier", node: "meridianBank", dx: 0, dy: 40, text: "VERIFIER · Citizen ID", tone: "violet", appears: "3.7" },
  { id: "b-no-quickcash", node: "quickcash", dx: 34, dy: -24, text: "✗ not authorized", tone: "red", appears: "3.8" },
  { id: "b-no-fake", node: "fakePortal", dx: 34, dy: -24, text: "✗", tone: "red", appears: "3.8" },
];

const CREDENTIALS: Record<string, NodeCredential[]> = {
  ecs: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "An accredited ECS-Org issuer",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.1",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: the ECS Ecosystem operator)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.1",
    },
  ],
  helvetia: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "A peer accredited ECS-Org issuer",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.1",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Helvetia Trust Services)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.1",
    },
  ],
  businessRegistry: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.1",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: National Business Registry)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.1",
    },
  ],
  civilRegistry: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "National Business Registry (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.3",
      note: "The Republic dogfoods its own register: the state's institutions carry Business-Registry-issued Organization credentials.",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: National Civil Registry)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.3",
    },
  ],
  citizenEco: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "National Business Registry (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.3",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: National Civil Registry)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.3",
    },
  ],
  legalEco: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.6",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: National Business Registry)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.6",
    },
  ],
  taxBuro: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "National Business Registry (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Tax Buro)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
  ],
  meridianBank: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "National Business Registry (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.5",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Meridian Bank)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.5",
    },
  ],
  quickcash: [
    {
      name: "ECS-Organization",
      tone: "emerald",
      issuedBy: "National Business Registry (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.8",
      note: "QuickCash is a registered, verifiable company - identity is not the problem.",
    },
    {
      name: "ECS-Service",
      tone: "emerald",
      issuedBy: "Self-issued (controller: QuickCash Loans)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.8",
    },
  ],
  aria: [
    {
      name: "Utopia Citizen ID",
      tone: "emerald",
      issuedBy: "National Civil Registry (demo)",
      ecosystem: "Utopia Citizen ID",
      appears: "3.4",
      note: "Held by Aria in the Personal Wallet of her choice - any integrated wallet can be customized for Utopia.",
    },
  ],
  tomas: [
    {
      name: "Utopia Citizen ID",
      tone: "emerald",
      issuedBy: "National Civil Registry (demo)",
      ecosystem: "Utopia Citizen ID",
      appears: "3.6",
    },
    {
      name: "Legal Representative",
      tone: "emerald",
      issuedBy: "National Business Registry (demo)",
      ecosystem: "Legal Representation",
      appears: "3.6",
      note: "Binds Tomás to Solaris Bakery (demo): role, powers, validity - revocable the day it ends.",
    },
  ],
  cit1: [
    {
      name: "Utopia Citizen ID",
      tone: "emerald",
      issuedBy: "National Civil Registry (demo)",
      ecosystem: "Utopia Citizen ID",
      appears: "3.4",
      note: "Held by a citizen in their Personal Wallet.",
    },
  ],
  cit2: [
    {
      name: "Utopia Citizen ID",
      tone: "emerald",
      issuedBy: "National Civil Registry (demo)",
      ecosystem: "Utopia Citizen ID",
      appears: "3.4",
      note: "Held by a citizen in their Personal Wallet.",
    },
  ],
  cit3: [
    {
      name: "Utopia Citizen ID",
      tone: "emerald",
      issuedBy: "National Civil Registry (demo)",
      ecosystem: "Utopia Citizen ID",
      appears: "3.4",
      note: "Held by a citizen in their Personal Wallet.",
    },
  ],
};

const ACCREDITATIONS: Record<string, Accreditation[]> = {
  helvetia: [
    {
      role: "ISSUER",
      schema: "ECS-Organization",
      context: "Verana ECS Ecosystem · accredited",
      appears: "3.1",
    },
  ],
  businessRegistry: [
    {
      role: "ISSUER",
      schema: "ECS-Organization",
      context: "Verana ECS Ecosystem · the national register as issuer",
      appears: "3.2",
    },
    {
      role: "ISSUER",
      schema: "Legal Representative",
      context: "Legal Representation · ecosystem root",
      appears: "3.6",
    },
  ],
  civilRegistry: [
    {
      role: "ISSUER",
      schema: "Utopia Citizen ID",
      context: "Utopia Citizen ID · ecosystem root",
      appears: "3.3",
    },
  ],
  taxBuro: [
    {
      role: "VERIFIER",
      schema: "Utopia Citizen ID",
      context: "Utopia Citizen ID · registered relying party",
      appears: "3.7",
    },
  ],
  meridianBank: [
    {
      role: "VERIFIER",
      schema: "Utopia Citizen ID",
      context: "Utopia Citizen ID · registered relying party",
      appears: "3.7",
    },
  ],
};

const NODE_NOTES: Record<string, string> = {
  taxBuro:
    "No verifiable credentials presented yet - a portal with passwords, and no way to prove who is asking.",
  civilRegistry:
    "No verifiable credentials presented yet - paper ID cards and office queues.",
  businessRegistry:
    "No verifiable credentials presented yet - a register selling PDF extracts anyone can edit.",
  fakePortal:
    "Claims to pay official tax refunds - but presents no verifiable credential. Nothing can be proven: red verdict.",
  quickcash:
    "A verifiable organization - ECS-Organization and ECS-Service check out. But it holds no VERIFIER permission on the Utopia Citizen ID, and verification is governed: every compliant wallet refuses to share. Trust is not authorization.",
  aria: "A person - holds credentials in a Personal Wallet rather than presenting service credentials.",
  tomas:
    "Tomás' Personal Wallet - his Citizen ID plus the Legal Representative credential that binds him to Solaris Bakery (demo).",
  ecs: "The shared identity-card trust registry - and a verifiable service itself: it governs the essential credential schemas and accredits issuers, including Utopia's National Business Registry.",
  citizenEco:
    "The Republic's own trust ecosystem for the Citizen ID - and a verifiable service itself. Issuance governed (only the Civil Registry issues) AND verification governed (relying parties must register): the eIDAS 2 relying-party rule, on-chain.",
  legalEco:
    "The Republic's trust ecosystem for legal representation - and a verifiable service itself. Issuance governed (only the Business Registry issues), verification open: anyone may check who represents a company.",
};

export const UTOPIA_SCENES: SceneGraph = {
  stages: STAGES,
  title: "Utopia",
  defaultViewBox: "30 20 930 570",
  nodes: NODES,
  edges: EDGES,
  badges: BADGES,
  credentials: CREDENTIALS,
  accreditations: ACCREDITATIONS,
  nodeNotes: NODE_NOTES,
  stageView: {
    "3.1": {
      only: ["businessRegistry", "helvetia", "ecs"],
      viewBox: "20 30 460 350",
      maxWidth: "max-w-2xl",
    },
    "3.2": {
      only: ["businessRegistry", "helvetia", "ecs"],
      viewBox: "20 30 460 350",
      maxWidth: "max-w-2xl",
    },
    "3.3": {
      only: ["businessRegistry", "helvetia", "ecs", "civilRegistry", "citizenEco"],
      viewBox: "20 30 580 350",
      maxWidth: "max-w-2xl",
    },
    "3.4": {
      only: [
        "businessRegistry",
        "civilRegistry",
        "citizenEco",
        "aria",
        "cit1",
        "cit2",
        "cit3",
      ],
      viewBox: "120 30 800 520",
      maxWidth: "max-w-3xl",
    },
    "3.5": {
      only: ["businessRegistry", "civilRegistry", "citizenEco", "meridianBank"],
      viewBox: "150 30 780 350",
      maxWidth: "max-w-3xl",
    },
    "3.6": {
      only: ["businessRegistry", "civilRegistry", "legalEco", "tomas"],
      viewBox: "150 30 640 550",
      maxWidth: "max-w-3xl",
    },
    "3.7": {
      only: [
        "businessRegistry",
        "civilRegistry",
        "citizenEco",
        "legalEco",
        "taxBuro",
        "meridianBank",
        "aria",
        "tomas",
      ],
      viewBox: "30 30 930 550",
    },
    "3.8": {
      only: [
        "citizenEco",
        "taxBuro",
        "meridianBank",
        "aria",
        "tomas",
        "quickcash",
        "fakePortal",
      ],
      viewBox: "100 30 860 550",
    },
  },
  stageChanges: {
    "3.1": {
      nodes: ["businessRegistry"],
      note: "the Republic's first green check",
    },
    "3.2": {
      nodes: ["businessRegistry"],
      note: "the national register becomes an accredited ECS-Org issuer",
    },
    "3.3": {
      nodes: ["civilRegistry", "citizenEco"],
      note: "the Citizen ID ecosystem is born - issuance and verification both governed",
    },
    "3.4": {
      nodes: ["aria", "cit1", "cit2", "cit3"],
      note: "citizens receive their Citizen IDs, in the wallet of their choice",
    },
    "3.5": {
      nodes: ["meridianBank"],
      note: "your bank can finally prove it is your bank",
    },
    "3.6": {
      nodes: ["tomas"],
      note: "legal representation becomes a revocable credential",
    },
    "3.7": {
      note: "relying parties registered: passwordless sign-in at the Tax Buro and the bank",
    },
    "3.8": {
      note: "the fail-closed payoff: unauthorized verifiers are refused by every wallet",
    },
  },
  verifiedNote:
    "Both identity checks verified against the Verana public registry (story data - the Utopia cast is pending deployment).",
};
