// The master scene graph of the Vesta Appliances story - one fixed layout,
// revealed and transformed stage by stage. The technical diagram only starts
// at §3 (Marc's journey): stage "3.0" is the pre-populated business world
// (Vesta, its gray services, the customer with the "?", the red impostors) -
// it is the baseline and is never rendered as a page stage itself, so
// nothing pulses as "new" when §3 opens. Stages 3.1-3.8 walk the five needs
// of Marc's checklist; the §1 world returns verified with verdicts at 3.8.

export const STAGES = [
  "3.0",
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "3.5",
  "3.5b",
  "3.6",
  "3.7",
  "3.8",
] as const;

export type Stage = (typeof STAGES)[number];

export function stageIndex(s: Stage): number {
  return STAGES.indexOf(s);
}

export type Tone = "violet" | "blue" | "emerald" | "amber" | "red" | "gray";

type StageOverride<T> = Partial<Record<Stage, T>>;

export type SceneNode = {
  id: string;
  x: number;
  y: number;
  /** default 22; the protagonist uses 28 */
  r?: number;
  icon:
    | "building"
    | "landmark"
    | "stamp"
    | "bot"
    | "badge"
    | "key"
    | "wallet"
    | "award"
    | "network"
    | "wrench"
    | "ghost"
    | "user";
  tone: Tone;
  appears: Stage;
  until?: Stage;
  dashed?: boolean;
  label?: string;
  sub?: string;
  /** Placeholder DID shown on the trust card (dedicated Vesta cast pending). */
  did?: string;
  /** Service type line on the trust card's Service step. */
  serviceType?: string;
  /** Organization display name on the trust card's Operated-by step. */
  operator?: string;
  /** From this stage on, a green trusted check renders before the name. */
  verifiedAt?: Stage;
  /** Latest override ≤ current stage wins. */
  labelByStage?: StageOverride<{ label?: string; sub?: string }>;
  toneByStage?: StageOverride<Tone>;
};

export type SceneEdge = {
  id: string;
  from: string;
  to: string;
  appears: Stage;
  until?: Stage;
  label?: string;
  tone: Tone;
  dashed?: boolean;
  /** Bend the line: perpendicular offset of the control point. */
  curve?: number;
  /** Label position along the edge, 0..1 (default 0.5). */
  labelT?: number;
};

export type SceneBadge = {
  id: string;
  /** Anchor node id; offset from its center (dx 0 = centered). */
  node: string;
  dx: number;
  dy: number;
  text: string;
  tone: Tone;
  appears: Stage;
  until?: Stage;
};

export const NODES: SceneNode[] = [
  {
    id: "vesta",
    x: 300,
    y: 300,
    r: 28,
    icon: "building",
    tone: "gray",
    appears: "3.0",
    label: "Vesta Appliances",
    sub: "nothing provable online - yet",
    did: "did:webvh:QmPLACEHOLDER…:vesta-anchor.demos.testnet.verana.network",
    serviceType: "Organization anchor service",
    operator: "Vesta Appliances 🇨🇭 · Geneva, Switzerland",
    verifiedAt: "3.3",
    toneByStage: { "3.1": "blue" },
    labelByStage: {
      "3.1": { label: "Unverifiable Organization", sub: "did:webvh:…vesta" },
      "3.2": {
        label: "Vesta Appliances",
        sub: "Organization anchor · did:webvh:…vesta",
      },
    },
  },
  {
    id: "support",
    x: 120,
    y: 470,
    icon: "bot",
    tone: "gray",
    appears: "3.0",
    label: "Agentic Support",
    sub: "just a name on a screen",
  },
  {
    id: "badgeSvc",
    x: 300,
    y: 470,
    icon: "badge",
    tone: "gray",
    appears: "3.0",
    label: "Employee badges",
    sub: "password resets galore",
  },
  {
    id: "portal",
    x: 480,
    y: 470,
    icon: "key",
    tone: "gray",
    appears: "3.0",
    label: "Staff & partner portal",
    sub: "phished passwords",
    did: "did:webvh:QmPLACEHOLDER…:login.vesta.example",
    serviceType: "Credential login service",
    operator: "Vesta Appliances 🇨🇭 · Geneva, Switzerland",
    verifiedAt: "3.5b",
    toneByStage: { "3.5b": "blue" },
    labelByStage: { "3.5b": { sub: "credential login service" } },
  },
  {
    id: "customer",
    x: 700,
    y: 350,
    icon: "user",
    tone: "amber",
    appears: "3.0",
    label: "A customer",
    sub: "wants help with a washing machine",
  },
  {
    id: "fakeSupport",
    x: 540,
    y: 190,
    icon: "ghost",
    tone: "red",
    appears: "3.0",
    dashed: true,
    label: "Fake support line",
    sub: "claims: “Vesta support”",
  },
  {
    id: "umbra",
    x: 560,
    y: 330,
    icon: "wrench",
    tone: "red",
    appears: "3.0",
    dashed: true,
    label: "Umbra Repairs",
    sub: "claims: “Vesta-authorized”",
  },
  {
    id: "wallet",
    x: 700,
    y: 470,
    icon: "wallet",
    tone: "emerald",
    appears: "3.5",
    label: "Your wallet",
    sub: "checks before connecting",
  },
  {
    id: "techWallet",
    x: 660,
    y: 560,
    icon: "wallet",
    tone: "emerald",
    appears: "3.8",
    label: "Technician's wallet",
    sub: "Zenith employee",
  },
  {
    id: "ecs",
    x: 120,
    y: 90,
    icon: "landmark",
    tone: "violet",
    appears: "3.2",
    label: "Verana ECS Ecosystem",
    sub: "identity credentials - the green check",
    did: "did:webvh:QmPLACEHOLDER…:ecs-ecosystem.testnet.verana.network",
    serviceType: "Trust registry service",
    operator: "The ECS Ecosystem operator",
    verifiedAt: "3.2",
  },
  {
    id: "orgIssuer",
    x: 300,
    y: 90,
    icon: "stamp",
    tone: "blue",
    appears: "3.2",
    label: "Helvetia Trust Services",
    sub: "(demo) · accredited ECS-Org issuer",
    did: "did:webvh:QmPLACEHOLDER…:helvetia-trust.demos.testnet.verana.network",
    serviceType: "KYB issuance service",
    operator: "Helvetia Trust Services (demo)",
    verifiedAt: "3.2",
  },
  {
    id: "iso",
    x: 480,
    y: 90,
    icon: "award",
    tone: "violet",
    appears: "3.6",
    label: "ISO Certification Ecosystem",
    sub: "(demo) · accredited cert bodies",
    did: "did:webvh:QmPLACEHOLDER…:iso-certification.testnet.verana.network",
    serviceType: "Trust registry service",
    operator: "The ISO Certification Ecosystem operator (demo)",
    verifiedAt: "3.6",
  },
  {
    id: "normacert",
    x: 660,
    y: 90,
    icon: "stamp",
    tone: "blue",
    appears: "3.6",
    label: "NormaCert",
    sub: "(demo) · accredited ISO 9001 issuer",
    did: "did:webvh:QmPLACEHOLDER…:normacert.demos.testnet.verana.network",
    serviceType: "Certification issuance service",
    operator: "NormaCert (demo)",
    verifiedAt: "3.6",
  },
  {
    id: "subIberia",
    x: 850,
    y: 240,
    icon: "stamp",
    tone: "blue",
    appears: "3.7",
    label: "Vesta Iberia",
    sub: "(demo) · subsidiary issuer",
    did: "did:webvh:QmPLACEHOLDER…:vesta-iberia.demos.testnet.verana.network",
    serviceType: "Authorized Repairer issuance service",
    operator: "Vesta Iberia (demo) · subsidiary of Vesta Appliances",
    verifiedAt: "3.7",
  },
  {
    id: "subNordics",
    x: 700,
    y: 240,
    icon: "stamp",
    tone: "blue",
    appears: "3.7",
    label: "Vesta Nordics",
    sub: "(demo) · subsidiary issuer",
    did: "did:webvh:QmPLACEHOLDER…:vesta-nordics.demos.testnet.verana.network",
    serviceType: "Authorized Repairer issuance service",
    operator: "Vesta Nordics (demo) · subsidiary of Vesta Appliances",
    verifiedAt: "3.7",
  },
  {
    id: "vestaEco",
    x: 850,
    y: 90,
    icon: "network",
    tone: "violet",
    appears: "3.7",
    label: "Vesta Repair Network",
    sub: "issuance governed by Vesta · anyone verifies",
    did: "did:webvh:QmPLACEHOLDER…:repair-network.vesta.example",
    serviceType: "Trust registry service",
    operator: "Vesta Appliances 🇨🇭 · Geneva, Switzerland",
    verifiedAt: "3.7",
  },
  {
    id: "zenith",
    x: 850,
    y: 430,
    icon: "wrench",
    tone: "emerald",
    appears: "3.7",
    label: "Zenith Repairs (demo)",
    sub: "a verifiable org itself",
    did: "did:webvh:QmPLACEHOLDER…:zenith-anchor.demos.testnet.verana.network",
    serviceType: "Organization anchor service",
    operator: "Zenith Repairs (demo) · authorized partner",
    verifiedAt: "3.7",
  },
];

export const EDGES: SceneEdge[] = [
  // Baseline - the world of §1, pre-populated when the journey opens
  { id: "e-vesta-support", from: "vesta", to: "support", appears: "3.0", tone: "gray" },
  { id: "e-vesta-badgeSvc", from: "vesta", to: "badgeSvc", appears: "3.0", label: "runs its services", tone: "gray", labelT: 0.55 },
  { id: "e-vesta-portal", from: "vesta", to: "portal", appears: "3.0", until: "3.5b", tone: "gray" },
  { id: "e-vesta-portal-svc", from: "vesta", to: "portal", appears: "3.5b", label: "issues ECS-Service", tone: "emerald", labelT: 0.55 },
  { id: "e-customer-support", from: "customer", to: "support", appears: "3.0", label: "contacts support…", tone: "gray", dashed: true, curve: 40, labelT: 0.45 },
  { id: "e-customer-fake", from: "customer", to: "fakeSupport", appears: "3.0", label: "…or the fake one? can't tell", tone: "red", dashed: true, curve: -20, labelT: 0.5 },
  { id: "e-umbra-customer", from: "umbra", to: "customer", appears: "3.0", label: "rings the doorbell", tone: "red", dashed: true, curve: 30, labelT: 0.4 },
  // Need 1 - a verifiable identity for the organization
  { id: "e-ecs-orgIssuer", from: "ecs", to: "orgIssuer", appears: "3.2", label: "accredits", tone: "violet" },
  { id: "e-orgIssuer-vesta", from: "orgIssuer", to: "vesta", appears: "3.2", label: "issues ECS-Org", tone: "emerald", curve: -40, labelT: 0.4 },
  // Need 3 - credentials people can hold
  { id: "e-vesta-badge", from: "vesta", to: "wallet", appears: "3.5", label: "issues ECS-Badge to employees", tone: "emerald", curve: -55, labelT: 0.45 },
  { id: "e-wallet-portal", from: "wallet", to: "portal", appears: "3.5b", label: "presents badge → login", tone: "emerald", labelT: 0.5 },
  // Need 4 - certifications as proof
  { id: "e-iso-normacert", from: "iso", to: "normacert", appears: "3.6", label: "accredits", tone: "violet" },
  { id: "e-normacert-vesta", from: "normacert", to: "vesta", appears: "3.6", label: "issues ISO 9001 (demo)", tone: "emerald", curve: 40, labelT: 0.45 },
  // Need 5 - Vesta's own ecosystem
  { id: "e-vesta-eco", from: "vesta", to: "vestaEco", appears: "3.7", label: "creates & governs", tone: "violet", curve: -60, labelT: 0.5 },
  { id: "e-eco-subIberia", from: "vestaEco", to: "subIberia", appears: "3.7", label: "accredits", tone: "violet" },
  { id: "e-eco-subNordics", from: "vestaEco", to: "subNordics", appears: "3.7", label: "accredits", tone: "violet", labelT: 0.55 },
  { id: "e-subIberia-zenith", from: "subIberia", to: "zenith", appears: "3.7", label: "issues Authorized Repairer", tone: "emerald", labelT: 0.5 },
  { id: "e-zenith-techWallet", from: "zenith", to: "techWallet", appears: "3.8", label: "issues ECS-Badge", tone: "emerald", labelT: 0.5 },
  { id: "e-techWallet-portal", from: "techWallet", to: "portal", appears: "3.8", label: "presents badge → login", tone: "emerald", labelT: 0.5 },
  { id: "e-customer-scan", from: "customer", to: "techWallet", appears: "3.8", label: "scans: sees the Vesta seal", tone: "emerald", dashed: true, curve: -35, labelT: 0.45 },
  { id: "e-umbra-claim", from: "umbra", to: "vestaEco", appears: "3.8", label: "claims - no credential: red", tone: "red", dashed: true, curve: -45, labelT: 0.35 },
];

export const BADGES: SceneBadge[] = [
  // Baseline - the customer cannot tell; the gap only Vesta can fill
  { id: "b-question", node: "customer", dx: 34, dy: -24, text: "?", tone: "red", appears: "3.0", until: "3.8" },
  { id: "b-gap", node: "umbra", dx: 0, dy: -44, text: "authorized repairers? no proof exists", tone: "red", appears: "3.0", until: "3.7" },
  // Need 1 - the identity credential lands
  { id: "b-ecsorg", node: "vesta", dx: 44, dy: -26, text: "ECS-Org", tone: "blue", appears: "3.2" },
  // Need 2 - the check turns green, the services follow
  { id: "b-ecssvc", node: "vesta", dx: 44, dy: -6, text: "ECS-Service", tone: "violet", appears: "3.3" },
  { id: "b-trusted", node: "vesta", dx: 44, dy: 14, text: "✓ TRUSTED", tone: "emerald", appears: "3.3" },
  { id: "b-no-fake", node: "fakeSupport", dx: 34, dy: -24, text: "✗", tone: "red", appears: "3.8" },
  // Need 3 - badges in wallets
  { id: "b-badge-wallet", node: "wallet", dx: 0, dy: -40, text: "ECS-Badge", tone: "emerald", appears: "3.5" },
  // Need 4 - the certification lands and echoes on every service
  { id: "b-iso", node: "vesta", dx: 44, dy: 34, text: "ISO 9001 (demo)", tone: "amber", appears: "3.6" },
  // Need 5 - full circle
  { id: "b-authorized-zenith", node: "zenith", dx: 0, dy: -40, text: "Authorized Repairer", tone: "emerald", appears: "3.7" },
  { id: "b-badge-techWallet", node: "techWallet", dx: 0, dy: -40, text: "ECS-Badge", tone: "emerald", appears: "3.8" },
  { id: "b-ok-zenith", node: "zenith", dx: 34, dy: -24, text: "✓", tone: "emerald", appears: "3.8" },
  { id: "b-no-umbra", node: "umbra", dx: 34, dy: -24, text: "✗", tone: "red", appears: "3.8" },
];

/** A credential presented by a participant, as shown in the click-to-open
 *  detail panel (verana.io/ecosystems idiom). */
export type NodeCredential = {
  name: string;
  tone: Tone;
  issuedBy: string;
  ecosystem?: string;
  appears: Stage;
  until?: Stage;
  note?: string;
  /** Not presented by this DID: inherited from the parent service's DID
   *  (the ECS-Service issuer), per the Verifiable Trust spec. */
  inherited?: boolean;
};

/** Credentials presented by each participant (filtered by stage). */
export const CREDENTIALS: Record<string, NodeCredential[]> = {
  ecs: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "An accredited ECS-Org issuer",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.2",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: the ECS Ecosystem operator)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.2",
    },
  ],
  iso: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "An accredited ECS-Org issuer",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.6",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: the ISO Certification Ecosystem operator)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.6",
    },
  ],
  vestaEco: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
      note: "Vesta's own Organization credential - the network is operated by Vesta Appliances.",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Vesta Appliances)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
  ],
  vesta: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.2",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Vesta Appliances)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.3",
    },
    {
      name: "ISO 9001 (demo)",
      tone: "amber",
      issuedBy: "NormaCert (demo)",
      ecosystem: "ISO Certification Ecosystem (demo)",
      appears: "3.6",
    },
  ],
  orgIssuer: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "A peer accredited ECS-Org issuer",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.2",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Helvetia Trust Services)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.2",
    },
  ],
  zenith: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Zenith Repairs)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
    {
      name: "Authorized Repairer",
      tone: "emerald",
      issuedBy: "Vesta Iberia (demo, Vesta subsidiary)",
      ecosystem: "Vesta Repair Network",
      appears: "3.7",
    },
  ],
  portal: [
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Issued by Vesta Appliances (accredited ECS-Service issuer)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.5b",
    },
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.5b",
      inherited: true,
      note: "Inherited from the parent service: the ECS-Service issuer's DID (the Vesta trust anchor) presents this ECS-Org credential.",
    },
    {
      name: "ISO 9001 (demo)",
      tone: "amber",
      issuedBy: "NormaCert (demo)",
      ecosystem: "ISO Certification Ecosystem (demo)",
      appears: "3.6",
      inherited: true,
      note: "Inherited from the parent service: the credential lives on Vesta's Organization DID and surfaces on every Vesta service.",
    },
  ],
  subIberia: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Vesta Iberia)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
  ],
  subNordics: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: Vesta Nordics)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.7",
    },
  ],
  normacert: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "An accredited ECS-Org issuer",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.6",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Self-issued (controller: NormaCert)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.6",
    },
  ],
  techWallet: [
    {
      name: "ECS-Badge",
      tone: "emerald",
      issuedBy: "Zenith Repairs (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.8",
      note: "Held by a Zenith technician in their Personal Wallet. The issuer's chain carries the Authorized Repairer credential.",
    },
  ],
  wallet: [
    {
      name: "ECS-Badge",
      tone: "emerald",
      issuedBy: "Vesta Appliances (trust anchor DID)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.5",
      note: "Held by the employee in their Personal Wallet.",
    },
  ],
};

/** Accreditations (issuer/verifier permissions) shown on the trust card. */
export type Accreditation = {
  role: "ISSUER" | "VERIFIER";
  schema: string;
  context: string;
  appears: Stage;
};

export const ACCREDITATIONS: Record<string, Accreditation[]> = {
  subIberia: [
    {
      role: "ISSUER",
      schema: "Authorized Repairer",
      context: "Vesta Repair Network · subsidiary of Vesta Appliances",
      appears: "3.7",
    },
  ],
  subNordics: [
    {
      role: "ISSUER",
      schema: "Authorized Repairer",
      context: "Vesta Repair Network · subsidiary of Vesta Appliances",
      appears: "3.7",
    },
  ],
  normacert: [
    {
      role: "ISSUER",
      schema: "ISO 9001 (demo)",
      context: "ISO Certification Ecosystem (demo) · accredited",
      appears: "3.6",
    },
  ],
  portal: [
    {
      role: "VERIFIER",
      schema: "ECS-Badge",
      context: "Verana ECS Ecosystem · badge login",
      appears: "3.5b",
    },
  ],
  orgIssuer: [
    {
      role: "ISSUER",
      schema: "ECS-Organization",
      context: "Verana ECS Ecosystem · accredited",
      appears: "3.2",
    },
  ],
  vesta: [
    {
      role: "ISSUER",
      schema: "ECS-Service",
      context: "Verana ECS Ecosystem · self-accredited",
      appears: "3.3",
    },
    {
      role: "ISSUER",
      schema: "ECS-Badge",
      context: "Verana ECS Ecosystem · self-accredited",
      appears: "3.5",
    },
    {
      role: "ISSUER",
      schema: "Authorized Repairer",
      context: "Vesta Repair Network · ecosystem root",
      appears: "3.7",
    },
  ],
};

/** Panel text for participants with no presented credentials (or context). */
export const NODE_NOTES: Record<string, string> = {
  support:
    "No verifiable credentials presented yet - just a name on a screen.",
  badgeSvc:
    "No verifiable credentials presented yet - just a name on a screen.",
  portal:
    "No verifiable credentials presented yet - just a name on a screen.",
  fakeSupport:
    "Claims to be Vesta support - but presents no verifiable credential. Nothing can be proven: red verdict.",
  umbra:
    "Claims to be Vesta-authorized - but no Authorized Repairer credential exists for its DID: red verdict.",
  customer:
    "A person - holds credentials in a Personal Wallet rather than presenting service credentials.",
  techWallet:
    "A Zenith technician's Personal Wallet - it holds the badge shown at the portal and at the front door.",
  ecs: "A trust ecosystem (registry root) - and a verifiable service itself: it governs the essential credential schemas and accredits issuers.",
  iso: "A trust ecosystem (demo) - and a verifiable service itself: it governs the ISO 9001 credential schema; accredited certification bodies issue it.",
  vestaEco:
    "Vesta's own trust ecosystem - and a verifiable service itself: it governs the Authorized Repairer schema. Issuance governed, verification open.",
};

/** Per-stage view overrides: `only` restricts the render to the listed
 *  nodes (edges/badges follow), `viewBox` crops the canvas, `maxWidth`
 *  constrains the rendered size. Used for intimate moments like 3.1,
 *  where the newborn identity stands alone. */
export const STAGE_VIEW: Partial<
  Record<Stage, { only?: string[]; viewBox?: string; maxWidth?: string }>
> = {
  "3.1": { only: ["vesta"], viewBox: "140 240 320 140", maxWidth: "max-w-md" },
  "3.2": {
    only: ["vesta", "ecs", "orgIssuer"],
    viewBox: "20 30 460 350",
    maxWidth: "max-w-2xl",
  },
  "3.3": {
    only: ["vesta", "ecs", "orgIssuer"],
    viewBox: "20 30 460 350",
    maxWidth: "max-w-2xl",
  },
  "3.5": {
    only: ["vesta", "ecs", "orgIssuer"],
    viewBox: "20 30 460 350",
    maxWidth: "max-w-2xl",
  },
  "3.5b": {
    only: ["vesta", "ecs", "orgIssuer", "portal"],
    viewBox: "20 30 560 520",
    maxWidth: "max-w-2xl",
  },
  "3.6": {
    only: ["vesta", "ecs", "orgIssuer", "portal", "iso", "normacert"],
    viewBox: "20 30 780 520",
    maxWidth: "max-w-3xl",
  },
  "3.7": {
    only: [
      "vesta",
      "ecs",
      "orgIssuer",
      "portal",
      "iso",
      "normacert",
      "vestaEco",
      "subIberia",
      "subNordics",
      "zenith",
    ],
    viewBox: "20 30 950 520",
  },
  "3.8": {
    only: [
      "vestaEco",
      "subIberia",
      "zenith",
      "techWallet",
      "portal",
      "customer",
    ],
    viewBox: "380 25 590 635",
    maxWidth: "max-w-3xl",
  },
};

/** Stages whose meaning is a *change* to existing elements rather than a new
 *  element: the listed nodes pulse, and the note joins the caption. */
export const STAGE_CHANGES: Partial<
  Record<Stage, { nodes?: string[]; note?: string }>
> = {
  "3.1": { nodes: ["vesta"], note: "Vesta's DID is born" },
  "3.3": { nodes: ["vesta"], note: "the check turns green" },
  "3.7": { note: "Vesta becomes an ecosystem: its subsidiaries issue, anyone verifies" },
  "3.5": { nodes: ["vesta"], note: "new accreditation on Vesta - click it to see it" },
  "3.5b": { nodes: ["portal"], note: "a new verifiable login service - click it to see its accreditation" },
  "3.8": { note: "the Authorized Repairer credential at work: portal login, and the front door" },
};

/** Resolve a node's label/sub at a given stage (latest override ≤ stage). */
export function nodeLabelAt(
  node: SceneNode,
  stage: Stage,
): { label?: string; sub?: string } {
  let label = node.label;
  let sub = node.sub;
  if (node.labelByStage) {
    const idx = stageIndex(stage);
    for (const s of STAGES) {
      if (stageIndex(s) > idx) break;
      const o = node.labelByStage[s];
      if (o) {
        if ("label" in o) label = o.label;
        if ("sub" in o) sub = o.sub;
      }
    }
  }
  return { label, sub };
}

/** Resolve a node's tone at a given stage (latest override ≤ stage). */
export function nodeToneAt(node: SceneNode, stage: Stage): Tone {
  let tone = node.tone;
  if (node.toneByStage) {
    const idx = stageIndex(stage);
    for (const s of STAGES) {
      if (stageIndex(s) > idx) break;
      const o = node.toneByStage[s];
      if (o) tone = o;
    }
  }
  return tone;
}

/** Visibility window: appears ≤ stage < until. */
export function visibleAt(
  el: { appears: Stage; until?: Stage },
  stage: Stage,
): boolean {
  const idx = stageIndex(stage);
  if (stageIndex(el.appears) > idx) return false;
  if (el.until && stageIndex(el.until) <= idx) return false;
  return true;
}
