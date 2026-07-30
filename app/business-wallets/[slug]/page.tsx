import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Github, PlayCircle } from "lucide-react";
import {
  Container,
  Section,
  Breadcrumb,
  Placeholder,
} from "../../components/ui";
import WalletLogo from "../../components/WalletLogo";
import { ProofOfTrust } from "../../components/ProofOfTrust";
import {
  businessWallets,
  personalWallets,
  getIntegration,
} from "../../lib/integrations";
import { getDemoService } from "../../lib/demo-services";
import { ECS_ECOSYSTEM_DID, ENDPOINTS, LINKS } from "../../lib/site";

// Per-business-wallet playground page — the identical template of spec §5:
// breadcrumb · header · the hosted demo service · the use case to test ·
// under the hood. Generated from integration.yaml.

export function generateStaticParams() {
  return businessWallets().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = getIntegration(slug);
  return {
    title: w ? `${w.name} playground` : "Business wallet",
    description: w
      ? `${w.name} on the Verana playground — a hosted verifiable service with live Proof-of-Trust.`
      : undefined,
  };
}

export default async function CloudWalletPlayground({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = getIntegration(slug);
  if (!w || w.kind !== "business-wallet") notFound();
  const pickers = personalWallets();
  // The standing service this business wallet hosts, named by its descriptor
  // (spec §5.3). Unknown ids fall through to the Placeholder branch.
  const demoService = w.demo_service ? getDemoService(w.demo_service) : undefined;
  const liveServiceId = demoService?.id;

  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {/* 1 · Breadcrumb */}
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Business wallets", href: "/business-wallets" },
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
                <ExternalLink className="h-4 w-4" /> Get it
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
          {/* 3 · The hosted demo service */}
          {liveServiceId ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-2 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold text-gray-900">
                  The hosted demo service
                </h2>
              </div>
              <p className="ml-11 mb-4 text-sm text-gray-500">
                A standing service run by {w.name}, Verana-verified — its DID
                and live Proof-of-Trust, resolved against the testnet on page
                load.
              </p>
              <div className="ml-11">
                <ProofOfTrust serviceId={liveServiceId} />
                {demoService ? (
                  <p className="mt-2 text-xs text-gray-500">
                    <code>{demoService.host}</code>
                    {" — "}
                    <a
                      href={`https://${demoService.host}/.well-known/did.json`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:underline"
                    >
                      DID document
                    </a>
                    {" · "}
                    <a
                      href={`${ENDPOINTS.resolver}/docs`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-600 hover:underline"
                    >
                      Resolver API
                    </a>
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <Placeholder title="1 · The hosted demo service">
              A standing service run by {w.name}, Verana-verified: its DID and
              live Proof-of-Trust card (TRUSTED · ECS-Org · ECS-Service · demo
              credential) will render here, resolved on page load.
            </Placeholder>
          )}

          {/* 4 · The use case to test */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                2
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                The use case to test
              </h2>
            </div>
            <ol className="ml-11 space-y-2 text-sm text-gray-600">
              <li>1. Resolve the hosted service — see the Proof-of-Trust.</li>
              <li>2. Receive a credential issued by the hosted service.</li>
              <li>3. Present it back to the hosted service&apos;s verifier.</li>
            </ol>
            <p className="ml-11 mt-4 text-sm text-gray-500">
              Run it with any integrated personal wallet:{" "}
              {pickers.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 ? " · " : ""}
                  <Link
                    href={`/personal-wallets/${p.slug}`}
                    className="font-medium text-violet-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </span>
              ))}
            </p>
          </div>

          {/* 5 · Under the hood */}
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                3
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Under the hood
              </h2>
            </div>
            <details className="ml-11 rounded-2xl border border-gray-200 bg-white p-5">
              <summary className="cursor-pointer select-none font-medium text-gray-700 transition-colors hover:text-violet-700">
                See how this wallet is wired
              </summary>
              <div className="mt-4 space-y-4">
                <p className="text-sm leading-relaxed text-gray-600">
                  {w.track === "native"
                    ? "Pattern A/B — the stack itself (or a vs-agent sidecar) owns the DID, DIDComm, Linked VPs and VPR operations."
                    : "Pattern C — bridge: OID4VC stack + a resolvable DID with Linked VPs; trust checks via the public Trust Resolver."}
                </p>
                <p className="text-sm leading-relaxed text-gray-500">
                  ECS credentials are obtained via the vs-agent Admin API or
                  out-of-band, then published as Linked VPs on the
                  service&apos;s DID document. The reference automation lives
                  in{" "}
                  <a
                    href={LINKS.veranaDemos}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-violet-600 hover:underline"
                  >
                    verana-demos
                  </a>
                  &apos;s <code>common/common.sh</code>.
                </p>
                <div>
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Registry links
                  </p>
                  <ul className="space-y-1.5 text-sm">
                    <li>
                      <span className="text-gray-500">ECS Ecosystem: </span>
                      <a
                        href={`${ENDPOINTS.resolver}/v1/trust/resolve?did=${encodeURIComponent(ECS_ECOSYSTEM_DID)}&detail=full`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-mono text-xs text-violet-600 hover:underline"
                      >
                        {ECS_ECOSYSTEM_DID}
                      </a>
                    </li>
                    <li>
                      <a
                        href={ENDPOINTS.frontend}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-violet-600 hover:underline"
                      >
                        Network frontend
                      </a>
                    </li>
                    <li>
                      <a
                        href={`${ENDPOINTS.resolver}/docs`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-violet-600 hover:underline"
                      >
                        Resolver API docs
                      </a>
                    </li>
                  </ul>
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
              playground spec §5
            </a>
            , generated from{" "}
            <code>integrations/{w.slug}/integration.yaml</code>.
          </p>
        </Container>
      </Section>
    </>
  );
}
