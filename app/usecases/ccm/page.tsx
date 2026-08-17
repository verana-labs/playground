import type { Metadata } from "next";
import { Breadcrumb } from "../../components/ui";
import { ChapterFooter, Stepper } from "../../components/ChapterNav";
import { CHAPTERS_NAV } from "./chapters";
import { EXPLORE_HREF, FOOTER_LABELS_ES, Section1 } from "./sections";

// Página NO listada: sin entrada de navegación, sin tarjeta en el home,
// sin sitemap, y noindex. El enlace se comparte directamente con la CCM.

export const metadata: Metadata = {
  title: "Caso de uso · CCM - 1 · La cámara y el certificado de hoy",
  description:
    "Capítulo 1 del caso CCM: la Cámara de Comercio de Medellín, el certificado de existencia y representación legal, y por qué un PDF no puede probar quién representa a una empresa hoy.",
  robots: { index: false, follow: false },
};

export default function CcmChapter1() {
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Casos de uso" },
              { label: "Cámara de Comercio de Medellín" },
            ]}
          />
          <h1 className="mt-6 max-w-3xl text-4xl font-bold md:text-5xl">
            La representación legal, verificable: el certificado que no
            envejece
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/80">
            Cómo la Cámara de Comercio de Medellín (demo) emite la prueba de
            representación legal como credencial verificable: obtenida desde
            el portal donde el representante ya está autenticado, presentada
            al banco en un escaneo, revocable el día que el poder cesa, y con
            una tarifa por verificación que convierte el certificado en un
            ingreso recurrente.
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
