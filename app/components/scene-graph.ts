// Generic scene-graph types and helpers for the use-case story diagrams
// (StoryDiagram). Each use case declares one SceneGraph - a fixed layout of
// nodes/edges/badges revealed and transformed stage by stage - and the
// diagram component renders it at a given stage. Extracted from the Vesta
// story so every use case (Vesta, Utopia, ...) shares the same machinery.

export type Tone = "violet" | "blue" | "emerald" | "amber" | "red" | "gray";

type StageOverride<T> = Partial<Record<string, T>>;

export type SceneIcon =
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
  | "user"
  | "bank"
  | "id";

export type SceneNode = {
  id: string;
  x: number;
  y: number;
  /** default 22; the protagonist uses 28 */
  r?: number;
  icon: SceneIcon;
  tone: Tone;
  appears: string;
  until?: string;
  dashed?: boolean;
  label?: string;
  sub?: string;
  /** DID shown on the trust card. */
  did?: string;
  /** Service type line on the trust card's Service step. */
  serviceType?: string;
  /** Organization display name on the trust card's Operated-by step. */
  operator?: string;
  /** From this stage on, a green trusted check renders before the name. */
  verifiedAt?: string;
  /** A person / wallet holder rather than a service (trust card variant). */
  person?: boolean;
  /** Show this node's note on the trust card even when it presents credentials. */
  noteAlways?: boolean;
  /** Latest override ≤ current stage wins. */
  labelByStage?: StageOverride<{ label?: string; sub?: string }>;
  toneByStage?: StageOverride<Tone>;
};

export type SceneEdge = {
  id: string;
  from: string;
  to: string;
  appears: string;
  until?: string;
  label?: string;
  tone: Tone;
  dashed?: boolean;
  /** Bend the line: perpendicular offset of the control point. */
  curve?: number;
  /** Label position along the edge, 0..1 (default 0.5). */
  labelT?: number;
  /** Stroke width multiplier (default 1) - e.g. 0.7 for minor edges. */
  width?: number;
};

export type SceneBadge = {
  id: string;
  /** Anchor node id; offset from its center (dx 0 = centered). */
  node: string;
  dx: number;
  dy: number;
  text: string;
  tone: Tone;
  appears: string;
  until?: string;
};

/** A credential presented by a participant, as shown in the click-to-open
 *  detail panel. */
export type NodeCredential = {
  name: string;
  tone: Tone;
  issuedBy: string;
  ecosystem?: string;
  appears: string;
  until?: string;
  note?: string;
  /** Not presented by this DID: inherited from the parent service's DID. */
  inherited?: boolean;
};

/** Accreditations (issuer/verifier permissions) shown on the trust card. */
export type Accreditation = {
  role: "ISSUER" | "VERIFIER";
  schema: string;
  context: string;
  appears: string;
};

/** Per-stage view overrides: `only` restricts the render to the listed
 *  nodes (edges/badges follow), `viewBox` crops the canvas, `maxWidth`
 *  constrains the rendered size. */
export type StageView = { only?: string[]; viewBox?: string; maxWidth?: string };

/** Stages whose meaning is a *change* to existing elements rather than a new
 *  element: the listed nodes pulse, and the note joins the caption. */
export type StageChange = { nodes?: string[]; note?: string };

export type SceneGraph = {
  /** Ordered stage ids; the first is the baseline world (never rendered as
   *  a page stage itself, so nothing pulses when the journey opens). */
  stages: readonly string[];
  /** Accessible name of the story, for the diagram aria-label. */
  title: string;
  /** viewBox used when a stage declares no crop. */
  defaultViewBox: string;
  nodes: SceneNode[];
  edges: SceneEdge[];
  badges: SceneBadge[];
  /** Credentials presented by each participant (filtered by stage). */
  credentials: Record<string, NodeCredential[]>;
  accreditations: Record<string, Accreditation[]>;
  /** Panel text for participants with no presented credentials (or context). */
  nodeNotes: Record<string, string>;
  stageView: Partial<Record<string, StageView>>;
  stageChanges: Partial<Record<string, StageChange>>;
  /** Trust card footnote under verified participants (per-cast wording). */
  verifiedNote?: string;
};

export function stageIndex(graph: SceneGraph, s: string): number {
  return graph.stages.indexOf(s);
}

/** Visibility window: appears ≤ stage < until. */
export function visibleAt(
  graph: SceneGraph,
  el: { appears: string; until?: string },
  stage: string,
): boolean {
  const idx = stageIndex(graph, stage);
  if (stageIndex(graph, el.appears) > idx) return false;
  if (el.until && stageIndex(graph, el.until) <= idx) return false;
  return true;
}

/** Resolve a node's label/sub at a given stage (latest override ≤ stage). */
export function nodeLabelAt(
  graph: SceneGraph,
  node: SceneNode,
  stage: string,
): { label?: string; sub?: string } {
  let label = node.label;
  let sub = node.sub;
  if (node.labelByStage) {
    const idx = stageIndex(graph, stage);
    for (const s of graph.stages) {
      if (stageIndex(graph, s) > idx) break;
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
export function nodeToneAt(
  graph: SceneGraph,
  node: SceneNode,
  stage: string,
): Tone {
  let tone = node.tone;
  if (node.toneByStage) {
    const idx = stageIndex(graph, stage);
    for (const s of graph.stages) {
      if (stageIndex(graph, s) > idx) break;
      const o = node.toneByStage[s];
      if (o) tone = o;
    }
  }
  return tone;
}
