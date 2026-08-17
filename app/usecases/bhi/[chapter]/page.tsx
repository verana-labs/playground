import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "../../../components/ui";
import { ChapterFooter, Stepper } from "../../../components/ChapterNav";
import { CHAPTERS_NAV, chapterBySlug } from "../chapters";
import {
  EXPLORE_HREF,
  FOOTER_LABELS,
  Section2,
  Section3,
  Section4,
} from "../sections";

// UNLISTED (noindex) - see ./page.tsx and chapters.ts for the
// publication gate (PENDING: the OID-Verana agreement).

export function generateStaticParams() {
  return CHAPTERS_NAV.filter((c) => c.slug !== null).map((c) => ({
    chapter: c.slug as string,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
  const { chapter } = await params;
  const c = chapterBySlug(chapter);
  return {
    title: c ? `Use case · BHI - ${c.n} · ${c.title}` : "Use case · BHI",
    description: c?.intro,
    robots: { index: false, follow: false },
  };
}

const BODIES: Record<string, React.ComponentType> = {
  solution: Section2,
  journey: Section3,
  demos: Section4,
};

export default async function BhiChapter({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter } = await params;
  const c = chapterBySlug(chapter);
  const Body = c?.slug ? BODIES[c.slug] : undefined;
  if (!c || !Body) notFound();

  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-10 sm:py-12">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "BHI", href: "/usecases/bhi" },
              { label: `Chapter ${c.n}` },
            ]}
          />
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl">
            {c.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">{c.intro}</p>
        </div>
      </header>
      <Stepper chapters={CHAPTERS_NAV} current={c.n} />
      <Body />
      <ChapterFooter
        chapters={CHAPTERS_NAV}
        current={c.n}
        labels={FOOTER_LABELS}
        exploreHref={EXPLORE_HREF}
      />
    </>
  );
}
