import type { Metadata } from "next";
import { Container, Section } from "../components/ui";
import WalletTile, { AddYourWalletTile } from "../components/WalletTile";
import { personalWallets } from "../lib/integrations";

// Personal wallets index: hero + the integrated-wallet tiles (formerly home
// section 3). Each tile opens the wallet's identical playground page.

export const metadata: Metadata = {
  title: "Personal wallets",
  description:
    "The integrated open-source personal wallets — each with an identical playground page running the six DemoCredential scenarios against the Verana testnet.",
};

export default function PersonalWallets() {
  const wallets = personalWallets();
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <h1 className="text-4xl font-bold tracking-tight">Personal wallets</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            Every integrated open-source personal wallet gets an identical
            playground page: six DemoCredential scenarios with live trust
            resolution — same logic, same services, only the wallet changes.
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
        </Container>
      </Section>
    </>
  );
}
