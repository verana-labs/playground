import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Github } from "lucide-react";
import {
  Container,
  Section,
  Breadcrumb,
  Placeholder,
} from "../../components/ui";
import ServiceTrustCard from "../../components/ServiceTrustCard";
import {
  cloudWallets,
  userWallets,
  getIntegration,
} from "../../lib/integrations";
import { LINKS } from "../../lib/site";

// Per-cloud-wallet playground page - the identical template of spec §5:
// breadcrumb · header · the hosted demo service · the use case to test ·
// under the hood. Generated from integration.yaml.

export function generateStaticParams() {
  return cloudWallets().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = getIntegration(slug);
  return { title: w ? `${w.name} playground` : "Cloud wallet" };
}

export default async function CloudWalletPlayground({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = getIntegration(slug);
  if (!w || w.kind !== "cloud-wallet") notFound();
  const pickers = userWallets();

  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {/* 1 · Breadcrumb */}
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Cloud wallets", href: "/#cloud-wallets" },
              { label: w.name },
            ]}
          />
          {/* 2 · Header */}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span
              aria-hidden
              className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-xl font-bold text-white backdrop-blur"
            >
              {w.name.charAt(0)}
            </span>
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
          </div>
        </div>
      </header>

      <Section>
        <Container className="space-y-8">
          {/* 3 · The hosted demo service */}
          {w.demo_service ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
                  1
                </span>
                <h2 className="text-lg font-bold text-gray-900">
                  The hosted demo service
                </h2>
              </div>
              <p className="mb-4 ml-11 text-sm text-gray-500">
                A standing service run by {w.name}, trust-resolved against the
                public registry <em>right now</em>:
              </p>
              <div className="ml-11">
                <ServiceTrustCard serviceId={w.demo_service} />
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
              <li>1. Resolve the hosted service - see the Proof-of-Trust.</li>
              <li>2. Receive a credential issued by the hosted service.</li>
              <li>3. Present it back to the hosted service&apos;s verifier.</li>
            </ol>
            <p className="ml-11 mt-4 text-sm text-gray-500">
              Run it with any integrated user wallet:{" "}
              {pickers.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 ? " · " : ""}
                  <Link
                    href={`/user-wallets/${p.slug}`}
                    className="font-medium text-violet-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </span>
              ))}
            </p>
          </div>

          {/* 5 · Under the hood */}
          <Placeholder title="3 · Under the hood">
            Integration pattern ({w.track}), credential-acquisition path, and
            registry links (ecosystem, schema, permissions) - ships with the
            live wiring.
          </Placeholder>

          <p className="text-xs text-gray-400">
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
