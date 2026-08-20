import type { Metadata } from "next";
import { Breadcrumb } from "../../components/ui";
import { ChapterFooter, Stepper } from "../../components/ChapterNav";
import { CHAPTERS_NAV } from "./chapters";
import { EXPLORE_HREF, FOOTER_LABELS, Section1 } from "./sections";

// UNLISTED page: no nav entry, no home card, no sitemap entry, and
// noindex. The link is shared directly with Orchestrating Identity and
// BHI. PENDING [AGREEMENT]: listing publicly is gated on the signed
// OID-Verana agreement (see content.ts header).

export const metadata: Metadata = {
  title: "Use case · BHI - 1 · Meet the Recruitment Trust Network",
  description:
    "Chapter 1 of the BHI Verifiable Hiring use case: the Better Hiring Institute, a single job application from search to offer, and why nothing in hiring can be proven today.",
  robots: { index: false, follow: false },
};

export default function BhiChapter1() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Use cases" },
              { label: "Better Hiring Institute" },
            ]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Learn with Better Hiring Institute how to make hiring verifiable,
            end to end
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            The Better Hiring Institute (BHI) are working with government and
            industry to fundamentally overhaul the way hiring is done in the
            UK.
          </p>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            Follow a single job application from search to offer: a candidate,
            an employer, a job board and a screening provider. See what breaks
            today, what changes when every party can be verified, and how to
            run every step yourself with a real wallet.
          </p>
        </div>
      </header>
      <Stepper chapters={CHAPTERS_NAV} current={1} />
      <Section1 />
      <ChapterFooter
        chapters={CHAPTERS_NAV}
        current={1}
        labels={FOOTER_LABELS}
        exploreHref={EXPLORE_HREF}
      />
    </>
  );
}
