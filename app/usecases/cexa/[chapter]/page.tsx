import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "../../../components/ui";
import { ChapterFooter, Stepper } from "../../../components/ChapterNav";
import { CHAPTERS_NAV, chapterBySlug } from "../chapters";
import { Section2, Section3, Section4, Section5 } from "../sections";

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
    title: c
      ? `Use case · Crypto Exchange Association - ${c.n} · ${c.title}`
      : "Use case · Crypto Exchange Association",
    description: c?.intro,
    // Unlisted while the cast and the story are being prepared.
    robots: { index: false, follow: false },
  };
}

const BODIES: Record<string, React.ComponentType> = {
  solution: Section2,
  journey: Section3,
  money: Section4,
  demos: Section5,
};

export default async function CexaChapter({
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
              { label: "Crypto Exchange Association", href: "/usecases/cexa" },
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
      <ChapterFooter chapters={CHAPTERS_NAV} current={c.n} />
    </>
  );
}
