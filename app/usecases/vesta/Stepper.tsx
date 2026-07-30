import Link from "next/link";
import { Check } from "lucide-react";
import { CHAPTERS_NAV } from "./chapters";

// Persistent chapter stepper, sticky under the site nav on every chapter
// page and visible at all widths.

export default function Stepper({ current }: { current: number }) {
  return (
    <div className="sticky top-16 z-30 border-b border-[#efeef6] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 py-2.5 sm:gap-2 sm:px-6">
        {CHAPTERS_NAV.map((c, i) => {
          const state =
            c.n < current ? "done" : c.n === current ? "now" : "todo";
          return (
            <div key={c.n} className="flex min-w-0 items-center gap-1 sm:gap-2">
              {i > 0 ? (
                <span
                  aria-hidden
                  className="h-px w-4 shrink-0 bg-[#d9d7ea] sm:w-7"
                />
              ) : null}
              <Link
                href={c.href}
                aria-current={state === "now" ? "step" : undefined}
                className="group flex min-w-0 items-center gap-2"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold transition-all ${
                    state === "done"
                      ? "bg-emerald-500 text-white"
                      : state === "now"
                        ? "bg-gradient-to-br from-[#6d28d9] to-[#8b5cf6] text-white shadow-[0_6px_14px_rgb(109,40,217,0.35)]"
                        : "border-2 border-[#e4e2f0] bg-white text-[#8a8da1] group-hover:border-violet-300 group-hover:text-violet-700"
                  }`}
                >
                  {state === "done" ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    c.n
                  )}
                </span>
                <span
                  className={`truncate text-xs font-bold sm:text-[13px] ${
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
