import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "../../../components/ui";
import Stepper from "../Stepper";
import ChapterFooter from "../ChapterFooter";
import { CHAPTERS_NAV, chapterBySlug } from "../chapters";
import { Section2, Section3, Section4 } from "../sections";

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
      ? `Use case · Vesta Appliances - ${c.n} · ${c.title}`
      : "Use case · Vesta Appliances",
    description: c?.intro,
  };
}

const BODIES: Record<string, React.ComponentType> = {
  solution: Section2,
  journey: Section3,
  demos: Section4,
};

export default async function VestaChapter({
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
              { label: "Vesta Appliances", href: "/usecases/vesta" },
              { label: `Chapter ${c.n}` },
            ]}
          />
          <div className="mt-5 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-white/25">
              {/* eslint-disable-next-line @next/next/no-img-element -- small pre-optimized cast asset */}
              <img src="/images/cast/vesta.png" alt="" aria-hidden className="h-full w-full object-contain" />
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight md:text-4xl">
              {c.title}
            </h1>
          </div>
          <p className="mt-3 max-w-2xl text-lg text-white/80">{c.intro}</p>
        </div>
      </header>
      <Stepper current={c.n} />
      <Body />
      <ChapterFooter current={c.n} />
    </>
  );
}
