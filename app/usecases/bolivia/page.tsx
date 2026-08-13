import type { Metadata } from "next";
import { Breadcrumb } from "../../components/ui";
import { ChapterFooter, Stepper } from "../../components/ChapterNav";
import { CHAPTERS_NAV } from "./chapters";
import { EXPLORE_HREF, FOOTER_LABELS_ES, Section1 } from "./sections";

// Página NO listada: sin entrada de navegación, sin tarjeta en el home,
// sin sitemap, y noindex. El enlace se comparte directamente.

export const metadata: Metadata = {
  title: "Caso de uso · Bolivia - 1 · El Estado y sus instituciones",
  description:
    "Capítulo 1 del caso Bolivia: las instituciones reales del Estado (SEGIP, SEPREC, Impuestos Nacionales, AGETIC) y lo que hoy no se puede probar en línea.",
  robots: { index: false, follow: false },
};

export default function BoliviaChapter1() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Casos de uso" },
              { label: "Bolivia" },
            ]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            Bolivia verificable: la identidad digital sobre una infraestructura
            pública de confianza
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Cómo las instituciones que ya son fuente de verdad (el SEGIP, el
            SEPREC, Impuestos Nacionales) proyectan sus competencias al mundo
            digital: la cédula como credencial verificable, la matrícula como
            prueba, la sesión sin contraseñas, y todo verificable por cualquier
            wallet, con estándares abiertos.
          </p>
        </div>
      </header>
      <Stepper chapters={CHAPTERS_NAV} current={1} />
      <Section1 />
      <ChapterFooter
        chapters={CHAPTERS_NAV}
        current={1}
        labels={FOOTER_LABELS_ES}
        exploreHref={EXPLORE_HREF}
      />
    </>
  );
}
