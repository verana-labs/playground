// The four chapters of the BHI (Better Hiring Institute) Verifiable
// Hiring story, shared by the stepper and the footer. Chapter 1 lives at
// /usecases/bhi; the rest at /usecases/bhi/<slug>.
//
// Listed publicly since 2026-09-23: nav entry, sitemap and indexable
// pages. (A home card is still pending a hero illustration - the other
// use cases each carry a custom WebP.) The use case was unlisted while
// the OID-Verana agreement was pending.

import type { Chapter } from "../../components/ChapterNav";

export const CHAPTERS_NAV: Chapter[] = [
  {
    n: 1,
    slug: null,
    href: "/usecases/bhi",
    title: "Meet the Recruitment Trust Network",
    short: "Meet BHI",
    intro:
      "Follow a single job application from search to offer: a candidate, an employer, a job board and a screening provider. Between the application and the start date sit four to eight weeks of one repeated task: proving things.",
  },
  {
    n: 2,
    slug: "solution",
    href: "/usecases/bhi/solution",
    title: "The solution: become verifiable",
    short: "The solution",
    intro:
      "Five needs, the infrastructure they run on, and the ecosystems BHI joins or builds. Two layers that must never be conflated: the UK DVS trust framework sets the rules; Verana is the infrastructure that makes them checkable at transaction time.",
  },
  {
    n: 3,
    slug: "journey",
    href: "/usecases/bhi/journey",
    title: "The journey",
    short: "The journey",
    intro:
      "Six builds: BHI's identity and its ecosystem, the employer, the job board, the candidate's wallet, the application itself, and what happens to the impostors.",
  },
  {
    n: 4,
    slug: "demos",
    href: "/usecases/bhi/demos",
    title: "Run the demos",
    short: "The demos",
    intro:
      "Get your credentials, apply for a job, and watch a fake employer fail. Everything runs on the Verana testnet; participation is free.",
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS_NAV.find((c) => c.slug === slug);
}
