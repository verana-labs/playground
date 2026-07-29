"use client";

import { useState } from "react";
import {
  Award,
  BadgeCheck,
  Bot,
  Building2,
  Ghost,
  KeyRound,
  Landmark,
  Network,
  Stamp,
  User,
  Wallet,
  Wrench,
} from "lucide-react";
import {
  ACCREDITATIONS,
  BADGES,
  CREDENTIALS,
  EDGES,
  NODES,
  NODE_NOTES,
  STAGE_CHANGES,
  STAGE_VIEW,
  nodeLabelAt,
  nodeToneAt,
  stageIndex,
  visibleAt,
  type SceneEdge,
  type Stage,
  type Tone,
} from "../usecases/vesta/scenes";

// Renders the master Vesta scene graph at a given stage: everything visible
// at that point of the story, with new or changed elements highlighted.
// Pure SVG, server-rendered; positions never move between stages.

const ICONS = {
  building: Building2,
  landmark: Landmark,
  stamp: Stamp,
  bot: Bot,
  badge: BadgeCheck,
  key: KeyRound,
  wallet: Wallet,
  award: Award,
  network: Network,
  wrench: Wrench,
  ghost: Ghost,
  user: User,
} as const;

const TONE: Record<Tone, { stroke: string; halo: string; pill: string; pillText: string }> = {
  violet: { stroke: "#7c3aed", halo: "#ede9fe", pill: "#f5f3ff", pillText: "#6d28d9" },
  blue: { stroke: "#2563eb", halo: "#dbeafe", pill: "#eff6ff", pillText: "#1d4ed8" },
  emerald: { stroke: "#059669", halo: "#d1fae5", pill: "#ecfdf5", pillText: "#047857" },
  amber: { stroke: "#d97706", halo: "#fef3c7", pill: "#fffbeb", pillText: "#b45309" },
  red: { stroke: "#dc2626", halo: "#fee2e2", pill: "#fef2f2", pillText: "#b91c1c" },
  gray: { stroke: "#9ca3af", halo: "#f3f4f6", pill: "#f9fafb", pillText: "#4b5563" },
};

const nodeById = new Map(NODES.map((n) => [n.id, n]));

function edgeGeometry(e: SceneEdge) {
  const a = nodeById.get(e.from)!;
  const b = nodeById.get(e.to)!;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const r1 = (a.r ?? 22) + 10;
  const r2 = (b.r ?? 22) + 16;
  const x1 = a.x + ux * r1;
  const y1 = a.y + uy * r1;
  const x2 = b.x - ux * r2;
  const y2 = b.y - uy * r2;
  const t = e.labelT ?? 0.5;
  if (!e.curve) {
    return {
      d: `M ${x1} ${y1} L ${x2} ${y2}`,
      lx: x1 + (x2 - x1) * t,
      ly: y1 + (y2 - y1) * t,
    };
  }
  const cx = (x1 + x2) / 2 + -uy * e.curve;
  const cy = (y1 + y2) / 2 + ux * e.curve;
  const omt = 1 - t;
  return {
    d: `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`,
    lx: omt * omt * x1 + 2 * omt * t * cx + t * t * x2,
    ly: omt * omt * y1 + 2 * omt * t * cy + t * t * y2,
  };
}

function Pill({
  x,
  y,
  text,
  tone,
  isNew,
}: {
  x: number;
  y: number;
  text: string;
  tone: Tone;
  isNew: boolean;
}) {
  const c = TONE[tone];
  const w = text.length * 5.7 + 14;
  return (
    <g className={isNew ? "sd-new" : undefined}>
      <rect
        x={x - w / 2}
        y={y - 9}
        width={w}
        height={18}
        rx={9}
        fill={c.pill}
        stroke={c.stroke}
        strokeOpacity={0.45}
      />
      <text
        x={x}
        y={y + 3.5}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={c.pillText}
      >
        {text}
      </text>
    </g>
  );
}

export default function StoryDiagram({ stage }: { stage: Stage }) {
  const idx = stageIndex(stage);
  const [selected, setSelected] = useState<string | null>(null);
  const isNew = (el: { appears: Stage }) => stageIndex(el.appears) === idx;

  const view = STAGE_VIEW[stage];
  const inView = (id: string) => !view?.only || view.only.includes(id);
  const nodes = NODES.filter((n) => visibleAt(n, stage) && inView(n.id));
  const edges = EDGES.filter(
    (e) => visibleAt(e, stage) && inView(e.from) && inView(e.to),
  );
  const badges = BADGES.filter((b) => visibleAt(b, stage) && inView(b.node));
  const changes = STAGE_CHANGES[stage];
  const changedNodes = new Set(changes?.nodes ?? []);
  const tones = Array.from(new Set(edges.map((e) => e.tone)));
  const newLabels = [
    ...nodes.filter(isNew).map((n) => nodeLabelAt(n, stage).label ?? ""),
    ...edges.filter(isNew).map((e) => e.label ?? ""),
    ...(changes?.note ? [changes.note] : []),
  ].filter(Boolean);

  return (
    <figure
      className={`rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5 ${
        view?.maxWidth ? `${view.maxWidth} mx-auto` : ""
      }`}
    >
      <div>
        <svg
          viewBox={view?.viewBox ?? "30 20 930 570"}
          role="img"
          aria-label={`The Vesta story graph at step ${stage}`}
          className="h-auto w-full"
        >
          <defs>
            {tones.map((t) => (
              <marker
                key={t}
                id={`sd-arrow-${stage}-${t}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke={TONE[t].stroke} strokeWidth="1.6" />
              </marker>
            ))}
          </defs>

          {edges.map((e) => {
            const g = edgeGeometry(e);
            const c = TONE[e.tone];
            return (
              <g key={e.id} className={isNew(e) ? "sd-new" : undefined}>
                <path
                  d={g.d}
                  fill="none"
                  stroke={c.stroke}
                  strokeWidth={isNew(e) ? 2.2 : 1.5}
                  strokeOpacity={isNew(e) ? 0.95 : 0.55}
                  strokeDasharray={e.dashed ? "5 4" : undefined}
                  markerEnd={`url(#sd-arrow-${stage}-${e.tone})`}
                />
                {e.label ? (
                  <Pill x={g.lx} y={g.ly} text={e.label} tone={e.tone} isNew={false} />
                ) : null}
              </g>
            );
          })}

          {nodes.map((n) => {
            const tone = nodeToneAt(n, stage);
            const c = TONE[tone];
            const r = n.r ?? 22;
            const highlight = isNew(n) || changedNodes.has(n.id);
            const { label, sub } = nodeLabelAt(n, stage);
            const Icon = ICONS[n.icon];
            return (
              <g
                key={n.id}
                className={`cursor-pointer outline-none focus:outline-none ${highlight ? "sd-new" : ""}`}
                style={{ outline: "none" }}
                role="button"
                tabIndex={0}
                aria-label={`${label ?? n.id} - view presented credentials`}
                onClick={() =>
                  setSelected((cur) => (cur === n.id ? null : n.id))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected((cur) => (cur === n.id ? null : n.id));
                  }
                }}
              >
                {selected === n.id ? (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r + 12}
                    fill="none"
                    stroke={c.stroke}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                ) : null}
                {highlight ? (
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={r + 9}
                    fill="none"
                    stroke={c.stroke}
                    strokeWidth={2}
                    className="sd-ping"
                  />
                ) : null}
                <circle cx={n.x} cy={n.y} r={r + 7} fill={c.halo} opacity={0.55} />
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={r}
                  fill="#ffffff"
                  stroke={c.stroke}
                  strokeWidth={1.8}
                  strokeDasharray={n.dashed ? "4 3" : undefined}
                />
                <g
                  transform={`translate(${n.x - 10}, ${n.y - 10})`}
                  style={{ color: c.stroke }}
                >
                  <Icon width={20} height={20} strokeWidth={1.8} />
                </g>
                {label ? (
                  <>
                    {n.verifiedAt && stageIndex(n.verifiedAt) <= idx ? (
                      <g
                        transform={`translate(${n.x - (label.length * 6.6) / 2 - 17}, ${n.y + r + 9})`}
                        style={{ color: "#059669" }}
                        aria-label="trusted"
                      >
                        <BadgeCheck width={13} height={13} strokeWidth={2.2} />
                      </g>
                    ) : null}
                    <text
                      x={n.x}
                      y={n.y + r + 20}
                      textAnchor="middle"
                      fontSize={12}
                      fontWeight={700}
                      fill="#111827"
                    >
                      {label}
                    </text>
                  </>
                ) : null}
                {sub ? (
                  <text
                    x={n.x}
                    y={n.y + r + (label ? 35 : 22)}
                    textAnchor="middle"
                    fontSize={9.5}
                    fill="#6b7280"
                  >
                    {sub}
                  </text>
                ) : null}
              </g>
            );
          })}

          {badges.map((b) => {
            const n = nodeById.get(b.node)!;
            return (
              <Pill
                key={b.id}
                x={n.x + b.dx + (b.dx > 0 ? (b.text.length * 5.7 + 14) / 2 : 0)}
                y={n.y + b.dy}
                text={b.text}
                tone={b.tone}
                isNew={isNew(b)}
              />
            );
          })}
        </svg>
      </div>
      {selected ? (
        <NodeDetail id={selected} stage={stage} onClose={() => setSelected(null)} />
      ) : (
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Click a participant to see the credentials it presents.
        </p>
      )}
      {newLabels.length > 0 ? (
        <figcaption className="mt-2 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span className="font-semibold text-violet-600">
            New in {stage}:
          </span>
          {newLabels.map((l) => (
            <span
              key={l}
              className="rounded-full bg-violet-50 px-2 py-0.5 font-medium text-violet-700"
            >
              {l}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}

function NodeDetail({
  id,
  stage,
  onClose,
}: {
  id: string;
  stage: Stage;
  onClose: () => void;
}) {
  const idx = stageIndex(stage);
  const node = NODES.find((n) => n.id === id);
  if (!node) return null;
  const { label } = nodeLabelAt(node, stage);
  const tone = nodeToneAt(node, stage);
  const c = TONE[tone];
  const verified = node.verifiedAt && stageIndex(node.verifiedAt) <= idx;
  const impostor = node.dashed === true;
  const creds = (CREDENTIALS[id] ?? []).filter((cr) => visibleAt(cr, stage));
  const accs = (ACCREDITATIONS[id] ?? []).filter(
    (a) => stageIndex(a.appears) <= idx,
  );
  const note = NODE_NOTES[id];
  const Icon = ICONS[node.icon];
  return (
    <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
          style={{ color: c.stroke, border: `1.5px solid ${c.stroke}` }}
        >
          <Icon width={16} height={16} strokeWidth={1.8} />
        </span>
        <span className="font-semibold text-gray-900">{label}</span>
        {verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <BadgeCheck className="h-3 w-3" /> trusted
          </span>
        ) : impostor ? (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
            ✗ unverifiable
          </span>
        ) : null}
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-full px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-700"
          aria-label="Close details"
        >
          ✕
        </button>
      </div>
      {creds.length > 0 ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {creds.map((cr) => {
            const ct = TONE[cr.tone];
            return (
              <li
                key={cr.name}
                className="rounded-xl border bg-white p-3"
                style={{ borderColor: `${ct.stroke}55` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: ct.pill, color: ct.pillText }}
                  >
                    {cr.name}
                  </span>
                  <span className="ml-auto text-[11px] font-semibold text-emerald-600">
                    ✓ verified
                  </span>
                </div>
                <dl className="mt-2 space-y-0.5 text-[11px] text-gray-500">
                  <div>
                    <dt className="inline font-medium text-gray-600">
                      Issued by:
                    </dt>{" "}
                    <dd className="inline">{cr.issuedBy}</dd>
                  </div>
                  {cr.ecosystem ? (
                    <div>
                      <dt className="inline font-medium text-gray-600">
                        Governed by:
                      </dt>{" "}
                      <dd className="inline">{cr.ecosystem}</dd>
                    </div>
                  ) : null}
                  {cr.note ? <div className="text-gray-400">{cr.note}</div> : null}
                </dl>
              </li>
            );
          })}
        </ul>
      ) : null}
      {accs.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {accs.map((a) => (
            <li key={a.text} className="text-[11px] text-gray-500">
              <span className="font-medium text-violet-700">Accreditation:</span>{" "}
              {a.text}
            </li>
          ))}
        </ul>
      ) : null}
      {creds.length === 0 && note ? (
        <p
          className={`mt-2 text-xs leading-relaxed ${
            impostor ? "text-red-600" : "text-gray-500"
          }`}
        >
          {note}
        </p>
      ) : note && creds.length > 0 ? null : null}
    </div>
  );
}
