import type { Metadata } from "next";
import { Breadcrumb } from "../../components/ui";
import Stepper from "./Stepper";
import ChapterFooter from "./ChapterFooter";
import LegacyHash from "./LegacyHash";
import { Section1 } from "./sections";

export const metadata: Metadata = {
  title: "Use case · Vesta Appliances - 1 · Meet Vesta",
  description:
    "Chapter 1 of the Vesta story: a real business, real services, and impostors trading on its name. Nothing can be proven.",
};

export default function VestaChapter1() {
  return (
    <>
      <LegacyHash />
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Use Cases" },
              { label: "Vesta Appliances" },
            ]}
          />
          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-white/25">
              {/* eslint-disable-next-line @next/next/no-img-element -- small pre-optimized cast asset */}
              <img src="/images/cast/vesta.png" alt="" aria-hidden className="h-full w-full object-contain" />
            </div>
            <h1 className="max-w-3xl text-4xl font-bold md:text-5xl">
              Learn with Vesta how to make your organization verifiable and
              trusted
            </h1>
          </div>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Follow Vesta Appliances, a company everyone recognizes, through
            its full journey: proving its identity, making its services
            verifiable, and governing trust for its partner network. Then do
            every step yourself, with a real wallet.
          </p>
        </div>
      </header>
      <Stepper current={1} />
      <Section1 />
      <ChapterFooter current={1} />
    </>
  );
}
