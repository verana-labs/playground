import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Eye, Hand, Terminal } from "lucide-react";
import { Container, Section, Breadcrumb, Placeholder } from "../../components/ui";
import ServiceTrustCard from "../../components/ServiceTrustCard";
import StoryDiagram from "../../components/StoryDiagram";
import { STEP_PAGES, getStepPage } from "../content";
import { LINKS } from "../../lib/site";

// One page per story step (verana-explained spec): every sub-step is
// story · progressive diagram · reproduce-it recipe · under the hood.

export function generateStaticParams() {
  return STEP_PAGES.map((s) => ({ step: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}): Promise<Metadata> {
  const { step } = await params;
  const page = getStepPage(step);
  return {
    title: page ? `Step ${page.n} · ${page.title}` : "Verana Explained",
    description: page?.intro,
  };
}

function KindChip({ kind }: { kind: "watch" | "hands-on" }) {
  return kind === "hands-on" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      <Hand className="h-3 w-3" /> hands-on — you do it
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
      <Eye className="h-3 w-3" /> watch — follow along
    </span>
  );
}

export default async function ExplainedStep({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const page = getStepPage(step);
  if (!page) notFound();

  const i = STEP_PAGES.findIndex((s) => s.slug === page.slug);
  const prev = i > 0 ? STEP_PAGES[i - 1] : undefined;
  const next = i < STEP_PAGES.length - 1 ? STEP_PAGES[i + 1] : undefined;

  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-12 sm:py-14">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Verana Explained", href: "/explained" },
              { label: `Step ${page.n}` },
            ]}
          />
          <div className="mt-6 flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold backdrop-blur">
              {page.n}
            </span>
            <h1 className="text-3xl font-bold md:text-4xl">
              {page.title}
              {page.pending ? (
                <span className="ml-3 align-middle text-sm font-medium text-amber-300">
                  (pending)
                </span>
              ) : null}
            </h1>
          </div>
          <p className="mt-5 max-w-3xl text-lg text-white/80">{page.intro}</p>
        </div>
      </header>

      {page.pending ? (
        <Section>
          <Container>
            <Placeholder title="This step ships once Steps 1–4 are fully live">
              The summary above is the preview: the DID Directory, crawlers
              that only index what verifies, and discovery for people, search
              engines, and AI agents. The full walkthrough — with its own
              progressive diagrams — will be added here.
            </Placeholder>
          </Container>
        </Section>
      ) : (
        page.substeps.map((sub, si) => (
          <Section
            key={sub.id}
            id={sub.id.replace(".", "-")}
            className={
              si % 2 === 1
                ? "border-t border-gray-200 bg-white"
                : "border-t border-gray-200"
            }
          >
            <Container className="max-w-4xl space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                    {sub.id}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {sub.title}
                  </h2>
                  <KindChip kind={sub.kind} />
                </div>
                <p className="mt-4 max-w-3xl text-gray-600">{sub.story}</p>
              </div>

              <StoryDiagram stage={sub.stage} />

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-900">
                  <Terminal className="h-4 w-4 text-violet-600" /> Reproduce it
                </h3>
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
                          {l.label} ↗
                        </a>
                      ),
                    )}
                  </div>
                ) : null}
              </div>

              <details className="group rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4">
                <summary className="cursor-pointer select-none text-sm font-semibold text-gray-700 hover:text-violet-700">
                  Under the hood
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

              {sub.liveService ? (
                <div>
                  <p className="mb-3 text-sm font-medium text-gray-700">
                    Live right now, resolved against the public registry:
                  </p>
                  <ServiceTrustCard serviceId={sub.liveService} />
                </div>
              ) : null}
            </Container>
          </Section>
        ))
      )}

      <Section className="border-t border-gray-200 bg-white">
        <Container className="max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {prev ? (
              <Link
                href={`/explained/${prev.slug}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-violet-300 hover:text-violet-700"
              >
                <ArrowLeft className="h-4 w-4" /> Step {prev.n} · {prev.title}
              </Link>
            ) : (
              <Link
                href="/explained"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-violet-300 hover:text-violet-700"
              >
                <ArrowLeft className="h-4 w-4" /> All steps
              </Link>
            )}
            {next ? (
              <Link
                href={`/explained/${next.slug}`}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-violet-700"
              >
                Step {next.n} · {next.title} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Full story specification:{" "}
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
