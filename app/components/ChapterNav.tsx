import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Container, Section } from "./ui";

// Generic chapter navigation for the use-case stories: the persistent
// stepper (sticky under the site nav on every chapter page, visible at all
// widths) and the prev/Continue footer. Each use case declares its own
// Chapter[] list (see app/usecases/*/chapters.ts) and passes it in.

export type Chapter = {
  n: number;
  slug: string | null; // null = the base route
  href: string;
  title: string;
  short: string;
  intro: string;
};

export function Stepper({
  chapters,
  current,
}: {
  chapters: Chapter[];
  current: number;
}) {
  return (
    <div className="sticky top-16 z-30 border-b border-[#efeef6] bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto px-4 py-3.5 sm:gap-3 sm:px-6">
        {chapters.map((c, i) => {
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

export function ChapterFooter({
  chapters,
  current,
}: {
  chapters: Chapter[];
  current: number;
}) {
  const prev = chapters.find((c) => c.n === current - 1);
  const next = chapters.find((c) => c.n === current + 1);
  return (
    <Section className="border-t border-[#efeef6] bg-white">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {prev ? (
            <Link
              href={prev.href}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9d7ea] bg-white px-5 py-3 text-sm font-semibold text-[#4c5065] transition-colors hover:border-violet-300 hover:text-violet-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {prev.n} · {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.href}
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              Continue: {next.n} · {next.title}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <Link
              href="/personal-wallets"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              Explore the integrated wallets
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </Container>
    </Section>
  );
}
