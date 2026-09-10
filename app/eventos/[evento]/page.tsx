import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listPersonalWallets } from "../../lib/wallets";
import {
  EVENTO_SUBTITULO,
  EVENTO_TITULO,
  EVENTOS,
  EVENTOS_ORDEN,
  isEventoSlug,
} from "../../lib/eventos";
import EventoSite from "./EventoSite";

// Las tres landings de la gira (Costa Rica, Guatemala, Panamá): páginas NO
// listadas (sin navegación, sin sitemap, noindex), compartidas con los
// asistentes desde Taquilla. Cada una verifica el boleto contra su propio
// agente en la red de pruebas.

export const dynamicParams = false;

export function generateStaticParams() {
  return EVENTOS_ORDEN.map((evento) => ({ evento }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ evento: string }>;
}): Promise<Metadata> {
  const { evento } = await params;
  if (!isEventoSlug(evento)) return {};
  const e = EVENTOS[evento];
  return {
    title: { absolute: `${EVENTO_TITULO} · ${e.pais} · ${e.fechaTexto}` },
    description: `${EVENTO_SUBTITULO}. ${e.ciudad}, ${e.fechaTexto}, ${e.horario}. Entra con tu boleto verificable desde tu wallet.`,
    robots: { index: false, follow: false },
  };
}

export default async function EventoPage({
  params,
}: {
  params: Promise<{ evento: string }>;
}) {
  const { evento } = await params;
  if (!isEventoSlug(evento)) notFound();
  return <EventoSite evento={EVENTOS[evento]} wallets={listPersonalWallets()} />;
}
