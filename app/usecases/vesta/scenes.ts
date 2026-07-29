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
    toneByStage: { "3.1": "blue" },
    labelByStage: {
      "3.1": { sub: "a DID is born · did:webvh:…vesta" },
      "3.2": { sub: "Organization anchor · did:webvh:…vesta" },
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
    labelByStage: { "3.5": { sub: "badge login configured" } },
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
    x: 850,
    y: 240,
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
    id: "ecs",
    x: 120,
    y: 90,
    icon: "landmark",
    tone: "violet",
    appears: "3.2",
    label: "Verana ECS Ecosystem",
    sub: "identity credentials - the green check",
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
  },
];

export const EDGES: SceneEdge[] = [
  // Baseline - the world of §1, pre-populated when the journey opens
  { id: "e-vesta-support", from: "vesta", to: "support", appears: "3.0", tone: "gray" },
  { id: "e-vesta-badgeSvc", from: "vesta", to: "badgeSvc", appears: "3.0", label: "runs its services", tone: "gray", labelT: 0.55 },
  { id: "e-vesta-portal", from: "vesta", to: "portal", appears: "3.0", tone: "gray" },
  { id: "e-customer-support", from: "customer", to: "support", appears: "3.0", label: "contacts support…", tone: "gray", dashed: true, curve: 40, labelT: 0.45 },
  { id: "e-customer-fake", from: "customer", to: "fakeSupport", appears: "3.0", label: "…or the fake one? can't tell", tone: "red", dashed: true, curve: -20, labelT: 0.5 },
  { id: "e-umbra-customer", from: "umbra", to: "customer", appears: "3.0", label: "rings the doorbell", tone: "red", dashed: true, labelT: 0.5 },
  // Need 1 - a verifiable identity for the organization
  { id: "e-ecs-orgIssuer", from: "ecs", to: "orgIssuer", appears: "3.2", label: "accredits", tone: "violet" },
  { id: "e-vesta-kyb", from: "vesta", to: "orgIssuer", appears: "3.2", label: "KYB over DIDComm - once", tone: "gray", dashed: true, curve: -40, labelT: 0.45 },
  { id: "e-orgIssuer-vesta", from: "orgIssuer", to: "vesta", appears: "3.2", label: "issues ECS-Org", tone: "emerald", curve: 40, labelT: 0.6 },
  // Need 3 - credentials people can hold
  { id: "e-vesta-badge", from: "vesta", to: "wallet", appears: "3.5", label: "issues ECS-Badge to employees", tone: "emerald", curve: -55, labelT: 0.45 },
  { id: "e-wallet-portal", from: "wallet", to: "portal", appears: "3.5", label: "presents badge → login", tone: "emerald", labelT: 0.5 },
  // Need 4 - certifications as proof
  { id: "e-iso-vesta", from: "iso", to: "vesta", appears: "3.6", label: "issues ISO 9001 (demo) - no re-KYB", tone: "emerald", curve: 30, labelT: 0.5 },
  // Need 5 - Vesta's own ecosystem
  { id: "e-vesta-eco", from: "vesta", to: "vestaEco", appears: "3.7", label: "creates & governs", tone: "violet", curve: -60, labelT: 0.5 },
  { id: "e-eco-zenith", from: "vestaEco", to: "zenith", appears: "3.7", label: "issues Authorized Repairer", tone: "emerald", labelT: 0.5 },
  { id: "e-umbra-claim", from: "umbra", to: "vestaEco", appears: "3.8", label: "claims - no credential: red", tone: "red", dashed: true, curve: 35, labelT: 0.5 },
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
  { id: "b-ok-zenith", node: "zenith", dx: 34, dy: -24, text: "✓", tone: "emerald", appears: "3.8" },
  { id: "b-no-umbra", node: "umbra", dx: 34, dy: -24, text: "✗", tone: "red", appears: "3.8" },
];

/** Stages whose meaning is a *change* to existing elements rather than a new
 *  element: the listed nodes pulse, and the note joins the caption. */
export const STAGE_CHANGES: Partial<
  Record<Stage, { nodes?: string[]; note?: string }>
> = {
  "3.1": { nodes: ["vesta"], note: "Vesta's DID is born" },
  "3.3": { nodes: ["vesta"], note: "the check turns green" },
  "3.4": {
    nodes: ["vesta"],
    note: "Vesta's first Verifiable Service is live",
  },
  "3.7": { nodes: ["umbra"], note: "the last problem gets its answer" },
  "3.8": { note: "full circle: anyone can tell" },
  "3.5": { nodes: ["portal"], note: "badge login configured on the portal" },
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
