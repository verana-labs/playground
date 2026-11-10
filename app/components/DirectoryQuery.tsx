"use client";

import { useState } from "react";
import { Building2, Loader2, Search } from "lucide-react";
import { withBase } from "../lib/base-path";
import type { DirectoryResult } from "../lib/trust-graph";
import { Chip } from "./ui";

// One directory query of a use-case story, run live on the Verana Graph (the
// trust graph) through /api/directory/<id>. The card shows the answer and,
// on request, the exact search requests behind it.

type State =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "done"; result: DirectoryResult }
  | { phase: "error"; message: string };

export default function DirectoryQuery({
  queryId,
  text,
  emptyNote,
}: {
  queryId: string;
  /** The question, in words. */
  text: string;
  /** What to say when no service matches. */
  emptyNote: string;
}) {
  const [state, setState] = useState<State>({ phase: "idle" });

  async function run() {
    setState({ phase: "loading" });
    try {
      const res = await fetch(withBase(`/api/directory/${queryId}`), { cache: "no-store" });
      const body = (await res.json()) as DirectoryResult & { error?: string };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setState({ phase: "done", result: body });
    } catch (err) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "The trust graph did not answer.",
      });
    }
  }

  const loading = state.phase === "loading";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
          <Search className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm leading-relaxed text-gray-600">{text}</p>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Search className="h-4 w-4" aria-hidden />
          )}
          {state.phase === "done" || state.phase === "error" ? "Run it again" : "Ask the trust graph"}
        </button>
      </div>

      {state.phase === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          The trust graph did not answer: {state.message}
        </p>
      )}

      {state.phase === "done" && (
        <div className="mt-4" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="verified">live answer</Chip>
            <span className="text-xs text-gray-500">
              {state.result.entries.length === 1
                ? "1 trusted service"
                : `${state.result.entries.length} trusted services`}
              {state.result.truncated ? " (first page only)" : ""}
            </span>
          </div>

          {state.result.entries.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{emptyNote}</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {state.result.entries.map((entry) => (
                <li
                  key={entry.did}
                  className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{entry.name}</p>
                    {entry.operator && entry.operator !== entry.name && (
                      <p className="text-xs text-gray-600">
                        operated by {entry.operator}
                        {entry.countryCode ? ` (${entry.countryCode})` : ""}
                      </p>
                    )}
                    <p className="break-all font-mono text-[11px] text-gray-500">{entry.host}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <details className="mt-3 text-xs text-gray-500">
            <summary className="cursor-pointer font-semibold text-violet-700">
              The search behind this answer
            </summary>
            <ol className="mt-2 space-y-3">
              {state.result.steps.map((step) => (
                <li key={step.label}>
                  <p className="leading-relaxed text-gray-600">
                    {step.label}: {step.total === 1 ? "1 hit" : `${step.total} hits`}.
                  </p>
                  <pre className="mt-1 overflow-x-auto rounded-lg bg-gray-900 p-3 text-[11px] leading-relaxed text-gray-100">
                    {`POST /v4/graph/search\n${JSON.stringify(step.request, null, 2)}`}
                  </pre>
                </li>
              ))}
            </ol>
            {state.result.note && (
              <p className="mt-2 leading-relaxed text-gray-600">{state.result.note}</p>
            )}
          </details>
        </div>
      )}
    </div>
  );
}
