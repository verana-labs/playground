import type { Metadata } from "next";
import {
  ArrowLeftRight,
  Bot,
  Building2,
  FileBadge,
  Layers,
  ScanSearch,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Button, Chip, Container, Section } from "../components/ui";
import WalletTile, { AddYourWalletTile } from "../components/WalletTile";
import { ComingSoonWalletTile } from "../components/ComingSoonTile";
import WalletLogo from "../components/WalletLogo";
import { businessWallets, getIntegration } from "../lib/integrations";
import { listComingSoon } from "../lib/coming-soon";

// Business wallets index: hero + the integrated-wallet tiles (formerly home
// section 4). Each tile opens the wallet's identical playground page.

export const metadata: Metadata = {
  title: "Business wallets",
  description:
    "The integrated open-source business wallets - each with an identical playground page: a hosted, Verana-verified demo service you can exercise end to end.",
};

export default function BusinessWallets() {
  const vsAgent = getIntegration("vs-agent");
  const wallets = businessWallets().filter((w) => w.slug !== "vs-agent");
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

      {/* Verana's own business wallet: the VS Agent showcase */}
      <Section className="border-t border-gray-200 bg-white" id="vs-agent">
        <Container wide>
          <div className="reveal rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-4">
              {vsAgent ? <WalletLogo w={vsAgent} size="header" /> : null}
              <div className="min-w-0">
                <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-700">
                  Verana&apos;s business wallet
                </div>
                <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-[#0f1222]">
                  VS Agent
                </h2>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                <Chip tone="verified">reference implementation</Chip>
                <Chip>Apache-2.0</Chip>
                <Chip>self-hosted</Chip>
              </div>
            </div>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-600">
              VS Agent is the reference business wallet of the Verana
              ecosystem: an open-source container that packs the complete
              stack of a{" "}
              <strong className="font-semibold text-gray-900">
                Verifiable Service
              </strong>
              . It gives a hosted service a resolvable DID, manages its
              credentials and Linked Verifiable Presentations, resolves trust
              before every exchange, and runs the registry operations for
              you. It is the runtime behind every demo service in this
              playground, and the sidecar that powers most of the other
              integrations below.
            </p>
            <div className="reveal-stagger mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <FileBadge className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  Holder, issuer and verifier
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  One runtime plays all three roles under ecosystem
                  accreditation: it holds its own credentials, issues to
                  peers and verifies presentations, with revocation support
                  on every rail.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <ArrowLeftRight className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  Dual transport
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  DIDComm (Issue Credential v2, Present Proof v2, vt-flow)
                  and OpenID4VCI / OpenID4VP with SD-JWT VC, DCQL and
                  Presentation Exchange, plus Token Status List revocation.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Layers className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  The right format for each credential
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  Public credentials as JSON-LD Linked VPs with on-chain
                  digest anchoring; AnonCreds where presentations must stay
                  unlinkable; SD-JWT VC for OpenID4VC interop. Each class
                  keeps its matching revocation semantics.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Workflow className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  Ecosystem-driven lifecycle
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  The vt-flow protocol turns on-chain ecosystem actions into
                  wallet actions: onboarding triggers issuance, and a revoked
                  participant means the credential is revoked, pushed to the
                  holder and cleaned up automatically - no polling.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <ShieldCheck className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  Trust resolution built in
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  Every DIDComm connection and every OpenID4VP presentation
                  is checked against the Verana registry before it is
                  accepted: Proof-of-Trust on both transports, fail closed.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <Bot className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-3 font-semibold text-gray-900">
                  Any service shape
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  Chat services on Hologram, MCP servers, A2A agents and
                  plain HTTP APIs, all declared under one DID. Plugin
                  architecture, Docker self-hosting, REST admin API and
                  NestJS / JS clients.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href="/business-wallets/vs-agent">
                Open its playground
              </Button>
              <Button
                href="https://github.com/verana-labs/vs-agent"
                variant="ghost"
                external
              >
                Get it on GitHub
              </Button>
              <Button
                href="https://github.com/verana-labs/verana-spec/blob/main/v4/vs-agent/spec.md"
                variant="ghost"
                external
              >
                Read the spec
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="border-t border-gray-200 bg-white">
        <Container wide>
          <h2 className="reveal text-2xl font-extrabold tracking-tight text-[#0f1222]">
            Other Verana-compatible wallets
          </h2>
          <p className="reveal mt-2 mb-8 max-w-3xl text-sm leading-relaxed text-gray-500">
            Open-source business wallets integrated with Verana - each with
            its own playground page and hosted demo service.
          </p>
          <div className="reveal-stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map((w) => (
              <WalletTile key={w.slug} w={w} />
            ))}
            {listComingSoon("business").map((w) => (
              <ComingSoonWalletTile key={w.id} w={w} />
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
