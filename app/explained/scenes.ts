// The master scene graph of the Vesta Appliances story — one fixed layout,
// revealed and transformed stage by stage. Every node/edge/badge declares
// the stage at which it appears (and optionally the stage at which it
// leaves, or per-stage tone/label overrides: gray "unprovable" services turn
// verified, the customer's "?" resolves). The StoryDiagram renders the graph
// at a given stage, highlighting what is new or changed. Same positions at
// every stage: the reader watches one picture grow — from the messy "today"
// world of Chapter 1 to the full-circle verdicts of 5.3.

export const STAGES = [
  "1.1",
  "1.2",
  "1.3",
  "2.1",
  "2.2",
  "2.3",
  "3.1",
  "3.2",
  "3.3",
  "4.1",
  "4.2",
  "4.3",
  "4.4",
  "4.5",
  "5.1",
  "5.2",
  "5.3",
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
    appears: "1.1",
    label: "Vesta Appliances",
    sub: "appliance maker · nothing provable online",
    toneByStage: { "4.1": "blue" },
    labelByStage: {
      "4.1": { sub: "a DID is born · did:webvh:…vesta" },
      "4.2": { sub: "Organization anchor · did:webvh:…vesta" },
    },
  },
  {
    id: "support",
    x: 120,
    y: 470,
    icon: "bot",
    tone: "gray",
    appears: "1.2",
    label: "Support chat",
    sub: "just a name on a screen",
    toneByStage: { "4.4": "blue" },
    labelByStage: { "4.4": { sub: "verifiable service" } },
  },
  {
    id: "badgeSvc",
    x: 300,
    y: 470,
    icon: "badge",
    tone: "gray",
    appears: "1.2",
    label: "Employee badges",
    sub: "password resets galore",
    toneByStage: { "4.4": "blue" },
    labelByStage: { "4.4": { sub: "issues ECS-Badge" } },
  },
  {
    id: "portal",
    x: 480,
    y: 470,
    icon: "key",
    tone: "gray",
    appears: "1.2",
    label: "Staff & partner portal",
    sub: "phished passwords",
    toneByStage: { "4.4": "blue" },
    labelByStage: { "4.4": { sub: "credential login" } },
  },
  {
    id: "customer",
    x: 700,
    y: 350,
    icon: "user",
    tone: "amber",
    appears: "1.2",
    label: "A customer",
    sub: "wants help with a washing machine",
  },
  {
    id: "fakeSupport",
    x: 540,
    y: 190,
    icon: "ghost",
    tone: "red",
    appears: "1.3",
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
    appears: "1.3",
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
    appears: "2.1",
    label: "Your wallet",
    sub: "checks before connecting",
  },
  {
    id: "ecs",
    x: 120,
    y: 90,
    icon: "landmark",
    tone: "violet",
    appears: "3.1",
    label: "ECS Ecosystem",
    sub: "identity credentials — the green check",
  },
  {
    id: "orgIssuer",
    x: 300,
    y: 90,
    icon: "stamp",
    tone: "blue",
    appears: "4.2",
    label: "KYB Issuer (demo)",
    sub: "accredited by ECS",
  },
  {
    id: "iso",
    x: 480,
    y: 90,
    icon: "award",
    tone: "violet",
    appears: "3.2",
    label: "ISO Certification Ecosystem",
    sub: "(demo) · accredited cert bodies",
  },
  {
    id: "vestaEco",
    x: 850,
    y: 90,
    icon: "network",
    tone: "violet",
    appears: "5.2",
    label: "Vesta Repair Network",
    sub: "only Vesta issues · anyone verifies",
  },
  {
    id: "zenith",
    x: 850,
    y: 430,
    icon: "wrench",
    tone: "emerald",
    appears: "5.2",
    label: "Zenith Repairs (demo)",
    sub: "a verifiable org itself",
  },
];

export const EDGES: SceneEdge[] = [
  // Chapter 1 — the world today
  { id: "e-vesta-support", from: "vesta", to: "support", appears: "1.2", tone: "gray" },
  { id: "e-vesta-badgeSvc", from: "vesta", to: "badgeSvc", appears: "1.2", label: "runs its services", tone: "gray", labelT: 0.55 },
  { id: "e-vesta-portal", from: "vesta", to: "portal", appears: "1.2", tone: "gray" },
  { id: "e-customer-support", from: "customer", to: "support", appears: "1.2", label: "contacts support…", tone: "gray", dashed: true, curve: 40, labelT: 0.45 },
  { id: "e-customer-fake", from: "customer", to: "fakeSupport", appears: "1.3", label: "…or the fake one? can't tell", tone: "red", dashed: true, curve: -20, labelT: 0.5 },
  { id: "e-umbra-customer", from: "umbra", to: "customer", appears: "1.3", label: "rings the doorbell", tone: "red", dashed: true, labelT: 0.5 },
  // Chapter 2 — the idea
  { id: "e-wallet-check", from: "wallet", to: "support", appears: "2.1", label: "verifies before connecting", tone: "emerald", dashed: true, curve: 45, labelT: 0.5 },
  // Chapter 4 — joining in practice
  { id: "e-ecs-orgIssuer", from: "ecs", to: "orgIssuer", appears: "4.2", label: "accredits", tone: "violet" },
  { id: "e-vesta-kyb", from: "vesta", to: "orgIssuer", appears: "4.2", label: "KYB over DIDComm — once", tone: "gray", dashed: true, curve: -40, labelT: 0.45 },
  { id: "e-orgIssuer-vesta", from: "orgIssuer", to: "vesta", appears: "4.2", label: "issues ECS-Org", tone: "emerald", curve: 40, labelT: 0.6 },
  { id: "e-badgeSvc-wallet", from: "badgeSvc", to: "wallet", appears: "4.4", label: "issues ECS-Badge", tone: "emerald", curve: 30, labelT: 0.5 },
  { id: "e-wallet-portal", from: "wallet", to: "portal", appears: "4.4", label: "presents badge → login", tone: "emerald", labelT: 0.5 },
  { id: "e-iso-vesta", from: "iso", to: "vesta", appears: "4.5", label: "issues ISO 9001 (demo) — no re-KYB", tone: "emerald", curve: 30, labelT: 0.5 },
  // Chapter 5 — Vesta's own ecosystem
  { id: "e-vesta-eco", from: "vesta", to: "vestaEco", appears: "5.2", label: "creates & governs", tone: "violet", curve: -60, labelT: 0.5 },
  { id: "e-eco-zenith", from: "vestaEco", to: "zenith", appears: "5.2", label: "issues Authorized Repairer", tone: "emerald", labelT: 0.5 },
  { id: "e-umbra-claim", from: "umbra", to: "vestaEco", appears: "5.3", label: "claims — no credential: red", tone: "red", dashed: true, curve: 35, labelT: 0.5 },
];

export const BADGES: SceneBadge[] = [
  // Chapter 1 — the customer cannot tell
  { id: "b-question", node: "customer", dx: 34, dy: -24, text: "?", tone: "red", appears: "1.3", until: "4.4" },
  // Chapter 2 — the plan
  { id: "b-plan", node: "vesta", dx: 44, dy: -6, text: "plan: prove → certify → govern", tone: "violet", appears: "2.3", until: "4.1" },
  // Chapter 3 — the gap only Vesta can fill
  { id: "b-gap", node: "umbra", dx: 0, dy: -44, text: "authorized repairers? no proof exists", tone: "red", appears: "3.3", until: "5.2" },
  // Chapter 4 — Vesta's credentials stack up
  { id: "b-ecsorg", node: "vesta", dx: 44, dy: -26, text: "ECS-Org", tone: "blue", appears: "4.2" },
  { id: "b-ecssvc", node: "vesta", dx: 44, dy: -6, text: "ECS-Service", tone: "violet", appears: "4.3" },
  { id: "b-trusted", node: "vesta", dx: 44, dy: 14, text: "✓ TRUSTED", tone: "emerald", appears: "4.3" },
  { id: "b-iso", node: "vesta", dx: 44, dy: 34, text: "ISO 9001 (demo)", tone: "amber", appears: "4.5" },
  { id: "b-ok-support", node: "support", dx: 30, dy: -24, text: "✓", tone: "emerald", appears: "4.4" },
  { id: "b-ok-badgeSvc", node: "badgeSvc", dx: 30, dy: -24, text: "✓", tone: "emerald", appears: "4.4" },
  { id: "b-ok-portal", node: "portal", dx: 30, dy: -24, text: "✓", tone: "emerald", appears: "4.4" },
  { id: "b-no-fake", node: "fakeSupport", dx: 34, dy: -24, text: "✗", tone: "red", appears: "4.4" },
  { id: "b-badge-wallet", node: "wallet", dx: 0, dy: -40, text: "ECS-Badge", tone: "emerald", appears: "4.4" },
  { id: "b-iso-support", node: "support", dx: 0, dy: -40, text: "ISO 9001", tone: "amber", appears: "4.5" },
  { id: "b-iso-badgeSvc", node: "badgeSvc", dx: 0, dy: -40, text: "ISO 9001", tone: "amber", appears: "4.5" },
  { id: "b-iso-portal", node: "portal", dx: 0, dy: -40, text: "ISO 9001", tone: "amber", appears: "4.5" },
  // Chapter 5 — full circle
  { id: "b-authorized-zenith", node: "zenith", dx: 0, dy: -40, text: "Authorized Repairer", tone: "emerald", appears: "5.2" },
  { id: "b-ok-zenith", node: "zenith", dx: 34, dy: -24, text: "✓", tone: "emerald", appears: "5.3" },
  { id: "b-no-umbra", node: "umbra", dx: 34, dy: -24, text: "✗", tone: "red", appears: "5.3" },
];

/** Stages whose meaning is a *change* to existing elements rather than a new
 *  element: the listed nodes pulse, and the note joins the caption. */
export const STAGE_CHANGES: Partial<
  Record<Stage, { nodes?: string[]; note?: string }>
> = {
  "1.3": { note: "which one is real? nobody can tell" },
  "2.3": { nodes: ["vesta"], note: "Vesta's plan" },
  "4.1": { nodes: ["vesta"], note: "Vesta's DID is born" },
  "4.4": {
    nodes: ["support", "badgeSvc", "portal"],
    note: "the services turn verifiable — the fake one turns red",
  },
  "5.1": { nodes: ["umbra"], note: "the last problem standing" },
  "5.3": { note: "full circle: anyone can tell" },
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
