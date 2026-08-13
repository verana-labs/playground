// The four chapters of the Bolivia story, shared by the stepper and the
// footer. Chapter 1 lives at /usecases/bolivia; the rest at
// /usecases/bolivia/<slug>. This use case is intentionally UNLISTED: no
// nav entry, no home card, no sitemap entry, robots noindex - the link is
// shared directly when needed.

import type { Chapter } from "../../components/ChapterNav";

export const CHAPTERS_NAV: Chapter[] = [
  {
    n: 1,
    slug: null,
    href: "/usecases/bolivia",
    title: "El Estado y sus instituciones",
    short: "Las instituciones",
    intro:
      "Bolivia tiene registros que son fuente de verdad: el SEGIP, el SEPREC, Impuestos Nacionales. En línea, nada de lo que certifican puede probarse.",
  },
  {
    n: 2,
    slug: "solucion",
    href: "/usecases/bolivia/solucion",
    title: "La solución: un Estado verificable",
    short: "La solución",
    intro:
      "Credenciales verificables emitidas por las instituciones que ya son fuente de verdad, ancladas en una infraestructura pública de confianza.",
  },
  {
    n: 3,
    slug: "construccion",
    href: "/usecases/bolivia/construccion",
    title: "La construcción, paso a paso",
    short: "La construcción",
    intro:
      "Cada institución se vuelve verificable, cada credencial se gobierna, y cada verificación falla cerrada. Paso a paso, sobre la testnet de Verana.",
  },
  {
    n: 4,
    slug: "demo",
    href: "/usecases/bolivia/demo",
    title: "La demo en vivo",
    short: "La demo",
    intro:
      "El patrón completo ya corre en vivo en este playground. La maqueta boliviana se despliega bajo demanda para la presentación.",
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS_NAV.find((c) => c.slug === slug);
}
