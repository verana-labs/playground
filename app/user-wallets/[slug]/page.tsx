import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, Github, PlayCircle } from "lucide-react";
import {
  Container,
  Section,
  Breadcrumb,
  Placeholder,
} from "../../components/ui";
import WalletLogo from "../../components/WalletLogo";
import WalletShots from "../../components/WalletShots";
import { ExpectedRendering } from "../../components/ExpectedRendering";
import { ProofOfTrust } from "../../components/ProofOfTrust";
import { ServiceQr } from "../../components/ServiceQr";
import { userWallets, getIntegration } from "../../lib/integrations";
import { LINKS } from "../../lib/site";

// Per-user-wallet playground page — the identical template of spec §4:
// breadcrumb · header · get the wallet · Service 1 (Vesta badge issuer) ·
// Service 2 (Vesta login) · refusal paths. Generated from integration.yaml.

export function generateStaticParams() {
  return userWallets().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = getIntegration(slug);
  return {
    title: w ? `${w.name} playground` : "User wallet",
    description: w
      ? `Try ${w.name} against the Verana testnet — receive and present credentials with live trust resolution.`
      : undefined,
  };
}

export default async function UserWalletPlayground({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = getIntegration(slug);
  if (!w || w.kind !== "user-wallet") notFound();

  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {/* 1 · Breadcrumb */}
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "User wallets", href: "/#user-wallets" },
              { label: w.name },
            ]}
          />
          {/* 2 · Header */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <WalletLogo w={w} size="header" onDark />
            <div>
              <h1 className="text-3xl font-bold">{w.name}</h1>
              <p className="text-white/80">{w.organization}</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
                {w.track}
              </span>
              {w.license ? (
                <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
                  {w.license}
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {w.download ? (
              <a
                href={w.download}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-medium text-violet-700 transition-colors hover:bg-violet-50"
              >
                <Download className="h-4 w-4" /> Get the wallet
              </a>
            ) : null}
            {w.repo ? (
              <a
                href={w.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
              >
                <Github className="h-4 w-4" /> Source
              </a>
            ) : null}
            {w.demo_video ? (
              <a
                href={w.demo_video}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
              >
                <PlayCircle className="h-4 w-4" /> Video
              </a>
            ) : null}
          </div>
        </div>
      </header>

      <Section>
        <Container className="space-y-8">
          {/* 3 · Get the wallet */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                1
              </span>
              <h2 className="text-lg font-bold text-gray-900">Get the wallet</h2>
            </div>
            <p className="ml-11 text-sm leading-relaxed text-gray-500">
              {w.notes ?? `Install ${w.name} to take part in the demos.`}
            </p>
            <div className="ml-11 mt-4 flex flex-wrap gap-3">
              {w.appstore ? (
                <a
                  href={w.appstore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  App Store
                </a>
              ) : null}
              {w.playstore ? (
                <a
                  href={w.playstore}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Google Play
                </a>
              ) : null}
              {!w.appstore && !w.playstore && w.download ? (
                <a
                  href={w.download}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Download
                </a>
              ) : null}
            </div>
          </div>

          <WalletShots w={w} />

          {/* 4 · Receive your ECS-Badge */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                2
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Receive your ECS-Badge
              </h2>
            </div>
            <div className="ml-11 grid gap-6 md:grid-cols-2">
              {w.badge_loop === "live" ? (
                <ServiceQr serviceId="issuer-web-vs" label="Vesta badge issuer (demo)" />
              ) : (
                <Placeholder title="Scan to receive your badge">
                  The AnonCreds/DIDComm badge flow reaches this wallet soon —
                  resolve & connect already work
                </Placeholder>
              )}
              <div className="space-y-4">
                <ExpectedRendering kind="issue" />
                <ProofOfTrust
                  serviceId="issuer-web-vs"
                  title="The issuer's live Proof-of-Trust"
                />
              </div>
            </div>
          </div>

          {/* 5 · Log in with your badge */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                3
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Log in with your badge
              </h2>
            </div>
            <div className="ml-11 grid gap-6 md:grid-cols-2">
              {w.badge_loop === "live" ? (
                <ServiceQr serviceId="verifier-web-vs" label="Vesta login service (demo)" />
              ) : (
                <Placeholder title="Scan to log in">
                  The AnonCreds/DIDComm login flow reaches this wallet soon —
                  resolve & connect already work
                </Placeholder>
              )}
              <div className="space-y-4">
                <ExpectedRendering kind="present" />
                <ProofOfTrust
                  serviceId="verifier-web-vs"
                  title="The verifier's live Proof-of-Trust"
                />
              </div>
            </div>
          </div>

          {/* 6 · Refusal paths */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                4
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Refusal paths — Umbra Repairs (demo)
              </h2>
            </div>
            <details className="ml-11 rounded-2xl border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer select-none font-medium text-gray-700 transition-colors hover:text-violet-700">
                See the refusal verdicts
              </summary>
              <div className="mt-4 space-y-4">
                <p className="text-sm leading-relaxed text-gray-500">
                  Umbra Repairs (demo) holds no participant entries — every
                  offer and request from it ends in the red verdict. Coming
                  live with the Umbra services.
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  <ExpectedRendering kind="issue-refused" />
                  <ExpectedRendering kind="present-refused" />
                </div>
              </div>
            </details>
          </div>

          <p className="text-xs text-gray-500">
            This page follows the identical per-wallet template of the{" "}
            <a
              className="text-violet-600 underline"
              href={`${LINKS.spec}/spec.md`}
              target="_blank"
              rel="noopener noreferrer"
            >
              playground spec §4
            </a>
            , generated from{" "}
            <code>integrations/{w.slug}/integration.yaml</code>.
          </p>
        </Container>
      </Section>
    </>
  );
}
