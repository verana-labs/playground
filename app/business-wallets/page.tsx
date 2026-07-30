import type { Metadata } from "next";
import { Building2, FileBadge, ScanSearch, ShieldCheck } from "lucide-react";
import { Container, Section } from "../components/ui";
import WalletTile, { AddYourWalletTile } from "../components/WalletTile";
import { businessWallets } from "../lib/integrations";

// Business wallets index: hero + the integrated-wallet tiles (formerly home
// section 4). Each tile opens the wallet's identical playground page.

export const metadata: Metadata = {
  title: "Business wallets",
  description:
    "The integrated open-source business wallets - each with an identical playground page: a hosted, Verana-verified demo service you can exercise end to end.",
};

export default function BusinessWallets() {
  const wallets = businessWallets();
  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-16">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
              <Building2 className="h-7 w-7" aria-hidden />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Business wallets</h1>
          </div>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/85">
            Every integrated open-source business wallet gets an identical
            playground page: a hosted, Verana-verified demo service you can
            exercise end to end.
          </p>
        </div>
      </header>

      {/* What the integration is about */}
      <Section>
        <Container wide>
          <p className="reveal max-w-3xl text-base leading-relaxed text-gray-600">
            A business wallet is the organization-side wallet: it hosts an
            organization&apos;s services - support agents, credential issuers,
            login portals - and gives each of them a verifiable identity.
            Integrating Verana means the hosted service becomes a{" "}
            <strong className="font-semibold text-gray-900">
              Verifiable Service
            </strong>
            : it presents the required credentials, so anyone can verify what
            it is and who operates it before connecting.
          </p>
          <div className="reveal-stagger mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">
                Become a Verifiable Service
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                The hosted service is identified by a resolvable DID. Its DID
                Document presents the required credentials as Linked
                Verifiable Presentations: <em>ECS-Service</em> (what the
                service is) and <em>ECS-Organization</em> (who operates it),
                issued under ecosystem governance.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <ScanSearch className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">
                Be trust-resolvable
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                Anyone - a personal wallet, another service - resolves the DID
                against the public registry and sees the Proof-of-Trust before
                connecting. TRUSTED is earned from the credential chain, never
                just claimed.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <FileBadge className="h-5 w-5" aria-hidden />
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">
                Issue and verify under accreditation
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                With ISSUER or VERIFIER accreditations in an ecosystem, the
                hosted service offers credentials and requests presentations - 
                and every peer&apos;s wallet checks those accreditations before
                accepting or sharing.
              </p>
            </div>
          </div>
          <p className="reveal mt-6 max-w-3xl text-sm leading-relaxed text-gray-500">
            Three integration tracks: <strong className="font-medium text-gray-700">native</strong>{" "}
            (your stack speaks Verifiable Trust directly),{" "}
            <strong className="font-medium text-gray-700">sidecar</strong> (run{" "}
            vs-agent alongside your stack - it handles DIDs, DIDComm, Linked
            VPs and registry operations), or{" "}
            <strong className="font-medium text-gray-700">bridge</strong>{" "}
            (keep your OpenID4VC stack, add trust resolution). Each integrated
            wallet below runs a live, Verana-verified demo service.
          </p>
        </Container>
      </Section>

      <Section className="border-t border-gray-200 bg-white">
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
