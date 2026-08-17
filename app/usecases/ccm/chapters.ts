// The four chapters of the CCM story, shared by the stepper and the
// footer. Chapter 1 lives at /usecases/ccm; the rest at
// /usecases/ccm/<slug>. This use case is intentionally UNLISTED: no
// nav entry, no home card, no sitemap entry, robots noindex - the link is
// shared directly with the Camara de Comercio de Medellin.

import type { Chapter } from "../../components/ChapterNav";

export const CHAPTERS_NAV: Chapter[] = [
  {
    n: 1,
    slug: null,
    href: "/usecases/ccm",
    title: "La cámara y el certificado de hoy",
    short: "El certificado hoy",
    intro:
      "La Cámara de Comercio de Medellín es la fuente de verdad sobre las empresas de Antioquia. Su prueba estrella, el certificado de existencia y representación legal, sigue siendo un documento que envejece desde el día en que se expide.",
  },
  {
    n: 2,
    slug: "solucion",
    href: "/usecases/ccm/solucion",
    title: "La solución: la representación legal como credencial",
    short: "La solución",
    intro:
      "Una credencial verificable emitida por la cámara, revocable el día que el poder cesa, con un modelo de negocio mejor para el banco, para el usuario y para la cámara.",
  },
  {
    n: 3,
    slug: "construccion",
    href: "/usecases/ccm/construccion",
    title: "La construcción, paso a paso",
    short: "La construcción",
    intro:
      "La cámara se vuelve verificable, su ecosistema se publica en el registro de Verana, y cada verificación del banco falla cerrada. Paso a paso, sobre la testnet.",
  },
  {
    n: 4,
    slug: "demo",
    href: "/usecases/ccm/demo",
    title: "La demo en vivo",
    short: "La demo",
    intro:
      "Los servicios (demo) de la maqueta, en vivo sobre la testnet de Verana: obtenga la credencial desde el portal de la cámara y preséntela en la ventanilla del banco.",
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS_NAV.find((c) => c.slug === slug);
}
