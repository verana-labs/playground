// The Verandia use case, split into four chapter routes with a persistent
// stepper. Chapter 1 lives at /usecases/verandia; the rest at
// /usecases/verandia/<slug>.

import type { Chapter } from "../../components/ChapterNav";

export type { Chapter };

export const CHAPTERS_NAV: Chapter[] = [
  {
    n: 1,
    slug: null,
    href: "/usecases/verandia",
    title: "Meet the Republic of Verandia",
    short: "Meet Verandia",
    intro:
      "A democracy with real institutions, real services, and scammers trading on the Republic's name. Nothing can be proven.",
  },
  {
    n: 2,
    slug: "solution",
    href: "/usecases/verandia/solution",
    title: "The solution: a verifiable Republic",
    short: "The solution",
    intro:
      "The Minister's five needs, Verana's three pillars, and the ecosystems Verandia joins or builds.",
  },
  {
    n: 3,
    slug: "journey",
    href: "/usecases/verandia/journey",
    title: "The Minister's journey",
    short: "The journey",
    intro:
      "Five needs, five builds: verifiable institutions, the Citizen ID, Business IDs, legal representation, and passwordless authentication.",
  },
  {
    n: 4,
    slug: "demos",
    href: "/usecases/verandia/demos",
    title: "Run the demos",
    short: "The demos",
    intro:
      "Get your Citizen ID, prove legal representation, sign in to the Tax Buro and Meridian Bank - and watch an unauthorized verifier get refused.",
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS_NAV.find((c) => c.slug === slug);
}
