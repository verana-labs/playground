import Link from "next/link";
import { BookOpen, ExternalLink, Hand, Terminal } from "lucide-react";
import TrustCard, { type TrustCardData } from "../components/TrustCard";
import { DidBadge } from "../components/Did";
import StoryDiagram from "../components/StoryDiagram";
import type { SceneGraph } from "../components/scene-graph";

// Shared building blocks of the use-case journey chapters (Vesta, Verandia,
// ...): the sub-step block (story · points · diagram · Reproduce it · Under
// the hood), the sub-heading, and the kind chip. Content stays per use case
// (app/usecases/*/content.ts); the rendering is identical by design.

export type SubStep<S extends string = string> = {
  id: string;
  stage: S;
  title: string;
  kind: "story" | "watch" | "hands-on";
  story: string;
  points?: string[];
  underHood?: string[];
  reproduce?: string[];
  links?: { label: string; href: string }[];
  image?: { src: string; alt: string; caption?: string };
  /** Prominent mono display (e.g. the generated DID). */
  code?: { label: string; value: string; note?: string };
  /** Skip the scene diagram for this step (used when a step shares a stage). */
  noDiagram?: boolean;
  /** Inline Proof-of-Trust card (story data) rendered after the prose. */
  trustCard?: TrustCardData;
};

export type JourneyNeed<S extends string = string> = {
  /** Anchor id (#need-N) - the §2 checklist chips deep-link here. */
  id: string;
  n: number;
  title: string;
  tag: string;
  intro: string;
  steps: SubStep<S>[];
};

/** UI chrome strings of the story blocks; per-use-case override for
 *  localized stories (the content itself always comes localized). */
export type StoryLabels = {
  story: string;
  handsOn: string;
  reproduce: string;
  underHood: string;
  diagramHint: string;
  newInStep: string;
};

const DEFAULT_LABELS: StoryLabels = {
  story: "story",
  handsOn: "hands-on - you do it",
  reproduce: "Reproduce it",
  underHood: "Under the hood",
  diagramHint: "Click a participant to see the credentials it presents.",
  newInStep: "New in this step:",
};

export function SubHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[1.65rem] font-extrabold tracking-tight text-[#0f1222]">
      {children}
    </h3>
  );
}

export function KindChip({
  kind,
  labels = DEFAULT_LABELS,
}: {
  kind: SubStep["kind"];
  labels?: StoryLabels;
}) {
  if (kind === "hands-on")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <Hand className="h-3 w-3" /> {labels.handsOn}
      </span>
    );
  if (kind === "watch") return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
      <BookOpen className="h-3 w-3" /> {labels.story}
    </span>
  );
}

export function SubStepBlock({
  sub,
  graph,
  labels = DEFAULT_LABELS,
}: {
  sub: SubStep;
  graph: SceneGraph;
  labels?: StoryLabels;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h4 className="text-xl font-bold text-gray-900">{sub.title}</h4>
          <KindChip kind={sub.kind} labels={labels} />
        </div>
        <p className="mt-4 max-w-3xl text-gray-600">{sub.story}</p>
        {sub.points?.length ? (
          <ul className="mt-4 max-w-3xl space-y-2.5">
            {sub.points.map((p, pi) => (
              <li
                key={pi}
                className="flex gap-3 text-[15px] leading-relaxed text-gray-600"
              >
                <span
                  aria-hidden
                  className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500"
                />
                {p}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {sub.trustCard ? (
        <div className="max-w-md">
          <TrustCard data={sub.trustCard} />
        </div>
      ) : null}

      {sub.code ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {sub.code.label}
          </div>
          {sub.code.value.startsWith("did:") ? (
            <DidBadge
              did={sub.code.value}
              className="mt-2 flex text-sm text-violet-700"
            />
          ) : (
            <code className="mt-2 block break-all font-mono text-sm text-violet-700">
              {sub.code.value}
            </code>
          )}
          {sub.code.note ? (
            <p className="mt-2 text-xs text-gray-400">{sub.code.note}</p>
          ) : null}
        </div>
      ) : null}

      {sub.links?.length && !sub.reproduce?.length ? (
        <div className="flex flex-wrap gap-2">
          {sub.links.map((l) =>
            l.href.startsWith("/") ? (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
              >
                {l.label} <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden />
              </a>
            ),
          )}
        </div>
      ) : null}

      {sub.noDiagram ? null : (
        <StoryDiagram
          graph={graph}
          stage={sub.stage}
          hint={labels.diagramHint}
          newInStepLabel={labels.newInStep}
        />
      )}

      {sub.image ? (
        <figure className="mx-auto max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sub.image.src}
            alt={sub.image.alt}
            className="w-full rounded-2xl border border-gray-200 object-cover shadow-sm"
          />
          {sub.image.caption ? (
            <figcaption className="mt-2 text-center text-xs text-gray-400">
              {sub.image.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      {sub.reproduce?.length ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900">
            <Terminal className="h-4 w-4 text-violet-600" /> {labels.reproduce}
          </h4>
          <ol className="mt-4 space-y-3">
            {sub.reproduce.map((r, ri) => (
              <li key={ri} className="flex gap-3 text-sm text-gray-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">
                  {ri + 1}
                </span>
                <span className="pt-0.5">{r}</span>
              </li>
            ))}
          </ol>
          {sub.links?.length ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              {sub.links.map((l) =>
                l.href.startsWith("/") ? (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    {l.label}
                  </Link>
                ) : (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                  >
                    {l.label} <ExternalLink className="inline h-3 w-3 align-[-1px]" aria-hidden />
                  </a>
                ),
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {sub.underHood?.length ? (
        <details className="group rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4">
          <summary className="cursor-pointer select-none text-sm font-semibold text-gray-700 hover:text-violet-700">
            {labels.underHood}
          </summary>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            {sub.underHood.map((u, ui) => (
              <li key={ui} className="flex gap-2">
                <span className="text-violet-500" aria-hidden>
                  ▸
                </span>
                {u}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

    </div>
  );
}
