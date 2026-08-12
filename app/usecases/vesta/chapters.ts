// The Vesta use case, split into four chapter routes with a persistent
// stepper. Chapter 1 lives at /usecases/vesta; the rest at /usecases/vesta/<slug>.

import type { Chapter } from "../../components/ChapterNav";

export type { Chapter };

export const CHAPTERS_NAV: Chapter[] = [
  {
    n: 1,
    slug: null,
    href: "/usecases/vesta",
    title: "Meet Vesta Appliances",
    short: "Meet Vesta",
    intro:
      "A real business, real services, and impostors trading on its name. Nothing can be proven.",
  },
  {
    n: 2,
    slug: "solution",
    href: "/usecases/vesta/solution",
    title: "The solution: become verifiable",
    short: "The solution",
    intro:
      "Marc's five needs, Verana's three pillars, and the ecosystems Vesta joins or builds.",
  },
  {
    n: 3,
    slug: "journey",
    href: "/usecases/vesta/journey",
    title: "Marc's journey",
    short: "The journey",
    intro:
      "Five needs, five builds: identity, verifiable services, badges, certification as proof, and Vesta's own ecosystem.",
  },
  {
    n: 4,
    slug: "demos",
    href: "/usecases/vesta/demos",
    title: "Run the demos",
    short: "The demos",
    intro:
      "Get a badge, log in to the portal with it, and search the directory of Authorized Repairers.",
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS_NAV.find((c) => c.slug === slug);
}
