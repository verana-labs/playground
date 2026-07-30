import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { Container, Section } from "../components/ui";
import WalletTile, { AddYourWalletTile } from "../components/WalletTile";
import { businessWallets } from "../lib/integrations";

// Business wallets index: hero + the integrated-wallet tiles (formerly home
// section 4). Each tile opens the wallet's identical playground page.

export const metadata: Metadata = {
  title: "Business wallets",
  description:
    "The integrated open-source business wallets — each with an identical playground page: a hosted, Verana-verified demo service you can exercise end to end.",
};

export default function BusinessWallets() {
  const wallets = businessWallets();
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <h1 className="text-4xl font-bold tracking-tight">Business wallets</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            Every integrated open-source business wallet gets an identical
            playground page: a hosted, Verana-verified demo service you can
            exercise end to end.
          </p>
        </div>
      </header>

      <Section>
        <Container wide>
          <div className="reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((w) => (
              <WalletTile key={w.slug} w={w} />
            ))}
            <AddYourWalletTile />
          </div>
          <p className="reveal mt-8 flex items-center gap-2 text-sm text-gray-500">
            <Building2 className="h-4 w-4 text-violet-600" />
            Business wallets host organizations&apos; verifiable services - like
            the Vesta demo cast behind this playground.
          </p>
        </Container>
      </Section>
    </>
  );
}
