import type { Metadata } from "next";
import { Breadcrumb } from "../../components/ui";
import { ChapterFooter, Stepper } from "../../components/ChapterNav";
import { CHAPTERS_NAV } from "./chapters";
import { Section1 } from "./sections";

export const metadata: Metadata = {
  title: "Use case · Republic of Verandia - 1 · Meet Verandia",
  description:
    "Chapter 1 of the Verandia story: a democracy with real institutions, real services, and scammers trading on the Republic's name. Nothing can be proven.",
};

export default function VerandiaChapter1() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Use Cases" },
              { label: "Republic of Verandia" },
            ]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Learn with Verandia how a democracy deploys verifiable identity
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Follow the Republic of Verandia through its full journey: an
            eIDAS-2-compatible Citizen ID for every citizen, a verifiable
            Business ID for every company, legal representation as proof, and
            passwordless sign-in at the Tax Buro and the bank. Then do every
            step yourself, with a real wallet.
          </p>
        </div>
      </header>
      <Stepper chapters={CHAPTERS_NAV} current={1} />
      <Section1 />
      <ChapterFooter chapters={CHAPTERS_NAV} current={1} />
    </>
  );
}
