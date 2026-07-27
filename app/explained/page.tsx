import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, Section, Breadcrumb } from "../components/ui";
import StoryDiagram from "../components/StoryDiagram";
import { STEP_PAGES } from "./content";
import { LINKS } from "../lib/site";

export const metadata: Metadata = {
  title: "Verana Explained",
  description:
    "Verana, explained through one continuous story: ACME Corp creates itself in Verana, deploys verifiable services, gets certified, and builds its own trust ecosystem.",
};

export default function Explained() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[{ label: "Playground", href: "/" }, { label: "Verana Explained" }]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Verana, explained by ACME Corp
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            One continuous story, live on testnet. Each step grows the same
            diagram: watch ACME go from a lone DID to a full trust ecosystem —
            and reproduce every move yourself.
          </p>
        </div>
      </header>

      <Section>
        <Container className="max-w-4xl space-y-10">
          <div className="grid gap-4">
            {STEP_PAGES.map((s) => (
              <Link
                key={s.slug}
                href={`/explained/${s.slug}`}
                className="group flex items-start gap-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-base font-bold text-white">
                  {s.n}
                </span>
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-lg font-bold text-gray-900">
                    {s.title}
                    {s.pending ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                        pending
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 block text-sm text-gray-500">
                    {s.intro}
                  </span>
                </span>
                <ArrowRight className="ml-auto mt-1 h-5 w-5 shrink-0 text-gray-300 transition-colors group-hover:text-violet-600" />
              </Link>
            ))}
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-gray-700">
              Where the story ends — the full picture, built step by step:
            </p>
            <StoryDiagram stage="4.3" />
          </div>

          <p className="text-sm text-gray-500">
            The full story specification:{" "}
            <a
              className="text-violet-600 underline hover:text-violet-700"
              href={`${LINKS.spec}/verana-explained/spec.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              verana-spec / playground / verana-explained ↗
            </a>
          </p>
        </Container>
      </Section>
    </>
  );
}
