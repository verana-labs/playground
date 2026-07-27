// The master scene graph of the ACME story — one fixed layout, revealed
// stage by stage. Every node/edge/badge declares the stage at which it
// appears; the StoryDiagram renders the graph at a given stage, highlighting
// what is new. Same positions at every stage: the reader watches one picture
// grow (verana.io/ecosystems visual grammar, playground palette).

export const STAGES = [
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "2.1",
  "2.2",
  "2.3",
  "3.1",
  "3.2",
  "3.3",
  "4.1",
  "4.2",
  "4.3",
] as const;

export type Stage = (typeof STAGES)[number];

export function stageIndex(s: Stage): number {
  return STAGES.indexOf(s);
}

export type Tone = "violet" | "blue" | "emerald" | "amber" | "red" | "gray";

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
    | "ghost";
  tone: Tone;
  appears: Stage;
  dashed?: boolean;
  /** Base label/sub, overridable per stage (latest override ≤ current wins). */
  label?: string;
  sub?: string;
  labelByStage?: Partial<Record<Stage, { label?: string; sub?: string }>>;
};

export type SceneEdge = {
  id: string;
  from: string;
  to: string;
  appears: Stage;
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
  /** Anchor node id; offset from its center. */
  node: string;
  dx: number;
  dy: number;
  text: string;
  tone: Tone;
  appears: Stage;
};

export const NODES: SceneNode[] = [
  {
    id: "anchor",
    x: 300,
    y: 300,
    r: 28,
    icon: "building",
    tone: "blue",
    appears: "1.1",
    sub: "did:webvh:…acme",
    labelByStage: {
      "1.1": { label: undefined, sub: "did:webvh:…acme — a DID, nothing else yet" },
      "1.2": { label: "ACME Corp", sub: "Organization anchor · did:webvh:…acme" },
    },
  },
  { id: "ecs", x: 120, y: 90, icon: "landmark", tone: "violet", appears: "1.2", label: "ECS Ecosystem", sub: "trust registry root" },
  { id: "orgIssuer", x: 330, y: 90, icon: "stamp", tone: "blue", appears: "1.2", label: "Org-schema Issuer (demo)", sub: "validator" },
  { id: "chatbot", x: 120, y: 480, icon: "bot", tone: "blue", appears: "2.1", label: "Customer Support", sub: "Hologram chatbot" },
  { id: "badgeIssuer", x: 300, y: 480, icon: "badge", tone: "blue", appears: "2.2", label: "Badge Issuer", sub: "issues ECS-Badge" },
  { id: "login", x: 480, y: 480, icon: "key", tone: "blue", appears: "2.3", label: "Credential Login", sub: "verifies ECS-Badge" },
  { id: "wallet", x: 660, y: 480, icon: "wallet", tone: "emerald", appears: "2.1", label: "Your wallet", sub: "Hologram Messaging" },
  { id: "iso", x: 630, y: 90, icon: "award", tone: "violet", appears: "3.1", label: "ISO Certification Ecosystem", sub: "(demo)" },
  { id: "certBody", x: 630, y: 210, icon: "stamp", tone: "blue", appears: "3.1", label: "CertBody B (demo)", sub: "accredited issuer" },
  { id: "acmeEco", x: 850, y: 150, icon: "network", tone: "violet", appears: "4.1", label: "ACME Partner Ecosystem", sub: "(demo) · governed issuance, open verification" },
  { id: "zenith", x: 850, y: 310, icon: "wrench", tone: "emerald", appears: "4.2", label: "Zenith Repairs (demo)", sub: "authorized partner" },
  { id: "umbra", x: 850, y: 470, icon: "ghost", tone: "red", appears: "4.3", dashed: true, label: "Umbra Corp (demo)", sub: "claims partnership — fails" },
];

export const EDGES: SceneEdge[] = [
  // Step 1 — anchor onboarding
  { id: "e-ecs-orgIssuer", from: "ecs", to: "orgIssuer", appears: "1.2", label: "accredits", tone: "violet" },
  { id: "e-anchor-kyb", from: "anchor", to: "orgIssuer", appears: "1.2", label: "KYB over DIDComm", tone: "gray", dashed: true, curve: -40, labelT: 0.45 },
  { id: "e-orgIssuer-anchor", from: "orgIssuer", to: "anchor", appears: "1.2", label: "issues ECS-Org", tone: "emerald", curve: 40, labelT: 0.6 },
  // Step 2 — the services (delegated ECS-Service) + your wallet
  { id: "e-anchor-chatbot", from: "anchor", to: "chatbot", appears: "2.1", label: "issues ECS-Service", tone: "violet", labelT: 0.55 },
  { id: "e-wallet-chatbot", from: "wallet", to: "chatbot", appears: "2.1", label: "chat over DIDComm", tone: "emerald", dashed: true, curve: 55, labelT: 0.5 },
  { id: "e-anchor-badgeIssuer", from: "anchor", to: "badgeIssuer", appears: "2.2", label: "issues ECS-Service", tone: "violet", labelT: 0.6 },
  { id: "e-badgeIssuer-wallet", from: "badgeIssuer", to: "wallet", appears: "2.2", label: "issues ECS-Badge", tone: "emerald", curve: 30, labelT: 0.5 },
  { id: "e-anchor-login", from: "anchor", to: "login", appears: "2.3", label: "issues ECS-Service", tone: "violet", labelT: 0.65 },
  { id: "e-wallet-login", from: "wallet", to: "login", appears: "2.3", label: "presents badge → login", tone: "emerald", labelT: 0.5 },
  // Step 3 — certification
  { id: "e-iso-certBody", from: "iso", to: "certBody", appears: "3.1", label: "accredits", tone: "violet" },
  { id: "e-anchor-iso-join", from: "anchor", to: "certBody", appears: "3.1", label: "joins as Holder", tone: "gray", dashed: true, curve: -30, labelT: 0.45 },
  { id: "e-anchor-ecsorg-id", from: "anchor", to: "certBody", appears: "3.2", label: "identifies with ECS-Org — no re-KYB", tone: "blue", dashed: true, curve: 20, labelT: 0.55 },
  { id: "e-certBody-anchor", from: "certBody", to: "anchor", appears: "3.2", label: "issues ISO 9001 (demo)", tone: "emerald", curve: 60, labelT: 0.5 },
  // Step 4 — ACME's own ecosystem
  { id: "e-anchor-acmeEco", from: "anchor", to: "acmeEco", appears: "4.1", label: "creates & controls", tone: "violet", curve: -50, labelT: 0.55 },
  { id: "e-acmeEco-zenith", from: "acmeEco", to: "zenith", appears: "4.2", label: "issues Authorized Partner", tone: "emerald", labelT: 0.5 },
  { id: "e-umbra-claim", from: "umbra", to: "acmeEco", appears: "4.3", label: "no credential — red verdict", tone: "red", dashed: true, curve: 45, labelT: 0.5 },
];

export const BADGES: SceneBadge[] = [
  { id: "b-ecsorg", node: "anchor", dx: 40, dy: -26, text: "ECS-Org", tone: "blue", appears: "1.2" },
  { id: "b-ecssvc", node: "anchor", dx: 40, dy: -6, text: "ECS-Service", tone: "violet", appears: "1.3" },
  { id: "b-trusted", node: "anchor", dx: 40, dy: 14, text: "✓ TRUSTED", tone: "emerald", appears: "1.4" },
  { id: "b-iso", node: "anchor", dx: 40, dy: 34, text: "ISO 9001 (demo)", tone: "amber", appears: "3.2" },
  { id: "b-badge-wallet", node: "wallet", dx: 0, dy: -40, text: "ECS-Badge", tone: "emerald", appears: "2.2" },
  // Step 3.3 — the certification surfaces on every ACME service card
  { id: "b-iso-chatbot", node: "chatbot", dx: 0, dy: -40, text: "ISO 9001", tone: "amber", appears: "3.3" },
  { id: "b-iso-badgeIssuer", node: "badgeIssuer", dx: 0, dy: -40, text: "ISO 9001", tone: "amber", appears: "3.3" },
  { id: "b-iso-login", node: "login", dx: 0, dy: -40, text: "ISO 9001", tone: "amber", appears: "3.3" },
  { id: "b-zenith-ok", node: "zenith", dx: 34, dy: -24, text: "✓", tone: "emerald", appears: "4.2" },
  { id: "b-umbra-no", node: "umbra", dx: 34, dy: -24, text: "✗", tone: "red", appears: "4.3" },
];

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
