import type { Metadata } from "next";
import { Breadcrumb } from "../../components/ui";
import { ChapterFooter, Stepper } from "../../components/ChapterNav";
import { CHAPTERS_NAV } from "./chapters";
import { Section1 } from "./sections";

// Unlisted while the cast and the story are being prepared: noindex, and no
// links from the home page, the nav or the sitemap.
export const metadata: Metadata = {
  title: "Use case · Crypto Exchange Association - 1 · Pay twice, wait twice",
  description:
    "Chapter 1 of the CEXA story: every exchange runs the same KYC on the same customer, pays for it again, and loses sign-ups to the wait.",
  robots: { index: false, follow: false },
};

export default function CexaChapter1() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Use Cases" },
              { label: "Crypto Exchange Association" },
            ]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Reusable KYC for crypto exchanges, governed by the exchanges
            themselves
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Follow a group of exchanges as they found the Crypto Exchange
            Association (demo) on Verana: one governed KYC credential, checked
            once and reused everywhere - with the original issuer paid on every
            reuse, and every payment building a public, slashable trust score.
          </p>
        </div>
      </header>
      <Stepper chapters={CHAPTERS_NAV} current={1} />
      <Section1 />
      <ChapterFooter chapters={CHAPTERS_NAV} current={1} />
    </>
  );
}
