import type { Metadata } from "next";
import { listPersonalWallets } from "../lib/wallets";
import TaquillaSite from "./TaquillaSite";

// Página NO listada (sin navegación, sin sitemap, noindex): la boletería
// ficticia de la demo de eventos, compartida directamente con los
// asistentes de la gira. Los boletos son credenciales reales en la red de
// pruebas, emitidas por el agente de Taquilla (demo).

export const metadata: Metadata = {
  title: { absolute: "Taquilla · Boletería de eventos (demo)" },
  description:
    "Regístrate a la gira Revolución del Contenido Empresarial (Costa Rica, Guatemala, Panamá) y recibe tu boleto como credencial verificable en tu wallet.",
  robots: { index: false, follow: false },
};

export default function TaquillaPage() {
  return <TaquillaSite wallets={listPersonalWallets({ scope: "eventos" })} />;
}
