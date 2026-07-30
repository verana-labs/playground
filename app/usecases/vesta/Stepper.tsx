import Link from "next/link";
import { Check } from "lucide-react";
import { CHAPTERS_NAV } from "./chapters";

// Persistent chapter stepper, sticky under the site nav on every chapter
// page and visible at all widths.

export default function Stepper({ current }: { current: number }) {
  return (
    <div className="sticky top-16 z-30 border-b border-[#efeef6] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto px-4 py-3.5 sm:gap-3 sm:px-6">
        {CHAPTERS_NAV.map((c, i) => {
          const state =
            c.n < current ? "done" : c.n === current ? "now" : "todo";
          return (
            <div key={c.n} className="flex min-w-0 items-center gap-2 sm:gap-3">
              {i > 0 ? (
                <span
                  aria-hidden
                  className="h-px w-6 shrink-0 bg-[#e4e2f0] sm:w-10"
                />
              ) : null}
              <Link
                href={c.href}
                aria-current={state === "now" ? "step" : undefined}
                className="group flex min-w-0 items-center gap-2.5"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors ${
                    state === "done"
                      ? "border-emerald-300 bg-emerald-50 text-emerald-600"
                      : state === "now"
                        ? "border-violet-500 bg-violet-50 text-violet-700 ring-4 ring-violet-100"
                        : "border-[#e4e2f0] bg-white text-[#8a8da1] group-hover:border-violet-300 group-hover:text-violet-700"
                  }`}
                >
                  {state === "done" ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    c.n
                  )}
                </span>
                <span
                  className={`truncate text-[13px] font-semibold sm:text-sm ${
                    state === "now"
                      ? "text-violet-700"
                      : "hidden text-[#8a8da1] group-hover:text-violet-700 md:inline"
                  }`}
                >
                  {c.short}
                </span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
