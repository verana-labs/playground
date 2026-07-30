import type { Metadata } from "next";
import { Suspense } from "react";
import { listPersonalWallets } from "../lib/wallets";
import PersonalWalletsPlayground from "./PersonalWalletsPlayground";

// The single personal-wallets playground (spec §4, simplified): one page for
// all wallets, generated from personal-wallets.yaml. The visitor picks a wallet in
// the download section; the six DemoCredential scenarios run against the
// same shared services for everyone — only the QR artifact changes with the
// wallet's credential format (AnonCreds or OpenID4VC SD-JWT).

export const metadata: Metadata = {
  title: "Personal wallets",
  description:
    "One playground for every integrated personal wallet: pick your wallet, run the six DemoCredential scenarios against the Verana testnet with live trust resolution.",
};

export default function PersonalWallets() {
  const wallets = listPersonalWallets();
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <h1 className="text-4xl font-bold tracking-tight">Personal wallets</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            One playground for every integrated open-source personal wallet:
            pick your wallet, then run the six DemoCredential scenarios — the
            same live services for everyone, with the QR codes minted for your
            wallet&apos;s credential format.
          </p>
        </div>
      </header>
      <Suspense>
        <PersonalWalletsPlayground wallets={wallets} />
      </Suspense>
    </>
  );
}
