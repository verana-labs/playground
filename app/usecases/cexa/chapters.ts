// The CEXA use case, split into five chapter routes with a persistent
// stepper. Chapter 1 lives at /usecases/cexa; the rest at
// /usecases/cexa/<slug>. Unlisted for now: every chapter page carries
// robots noindex, and the story is linked from nowhere on the site.

import type { Chapter } from "../../components/ChapterNav";

export type { Chapter };

export const CHAPTERS_NAV: Chapter[] = [
  {
    n: 1,
    slug: null,
    href: "/usecases/cexa",
    title: "Pay twice, wait twice",
    short: "Problem",
    intro:
      "Every exchange runs the same KYC on the same customer, pays for it again, and loses sign-ups to the wait. The check is a commodity; the friction is not.",
  },
  {
    n: 2,
    slug: "solution",
    href: "/usecases/cexa/solution",
    title: "The solution: a KYC that travels",
    short: "Solution",
    intro:
      "Exchanges found the Crypto Exchange Association (demo) on Verana: one governed credential, authorized providers, membership with teeth, and a reuse fee that pays the original issuer.",
  },
  {
    n: 3,
    slug: "journey",
    href: "/usecases/cexa/journey",
    title: "The Association's journey",
    short: "Journey",
    intro:
      "Found the Association, onboard the members, run one full KYC, reuse it in sixty seconds, and watch the impostor and the revoked credential both fail.",
  },
  {
    n: 4,
    slug: "money",
    href: "/usecases/cexa/money",
    title: "The money: who pays whom",
    short: "Money",
    intro:
      "Dues, free issuance, the 0.40 reuse fee and its split, and the trust score every payment builds. Every flow diagrammed, every number from the fee schedule.",
  },
  {
    n: 5,
    slug: "demos",
    href: "/usecases/cexa/demos",
    title: "Run the demos",
    short: "Demos",
    intro:
      "Get a CryptoExchangeKYC credential, open an account at Borealis Markets (demo) with it, and watch DarkPool Exchange (demo) get refused.",
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS_NAV.find((c) => c.slug === slug);
}
