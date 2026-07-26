import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Section,
  Chip,
  Breadcrumb,
  Placeholder,
} from "../../components/ui";
import { cloudWallets, userWallets, getIntegration } from "../../lib/integrations";
import { LINKS } from "../../lib/site";

// Per-cloud-wallet playground page — the identical template of spec §5:
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
      <section className="border-b border-rule">
        <Container className="py-10">
          {/* 1 · Breadcrumb */}
          <Breadcrumb
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
              className="grid h-14 w-14 place-items-center rounded-xl border border-rule bg-surface font-mono text-xl text-muted"
            >
              {w.name.charAt(0)}
            </span>
            <div>
              <h1 className="display text-3xl text-ink">{w.name}</h1>
              <p className="text-muted">{w.organization}</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Chip>{w.track}</Chip>
              {w.license ? <Chip>{w.license}</Chip> : null}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {w.download ? (
              <a href={w.download} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Get it ↗
              </a>
            ) : null}
            {w.repo ? (
              <a href={w.repo} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Source ↗
              </a>
            ) : null}
          </div>
        </Container>
      </section>

      <Section>
        <Container className="max-w-3xl space-y-8">
          {/* 3 · The hosted demo service */}
          <Placeholder title="The hosted demo service">
            A standing service run by {w.name}, Verana-verified: its DID and
            live Proof-of-Trust card (TRUSTED · ECS-Org · ECS-Service · demo
            credential) will render here, resolved on page load.
          </Placeholder>

          {/* 4 · The use case to test */}
          <div className="card p-6">
            <span className="eyebrow">The use case to test</span>
            <ol className="mt-4 space-y-2 text-sm text-muted">
              <li>1. Resolve the hosted service — see the Proof-of-Trust.</li>
              <li>2. Receive a credential issued by the hosted service.</li>
              <li>3. Present it back to the hosted service&apos;s verifier.</li>
            </ol>
            <p className="mt-4 text-sm text-muted">
              Run it with any integrated user wallet:{" "}
              {pickers.map((p, i) => (
                <span key={p.slug}>
                  {i > 0 ? " · " : ""}
                  <Link href={`/user-wallets/${p.slug}`} className="text-accent hover:underline">
                    {p.name}
                  </Link>
                </span>
              ))}
            </p>
          </div>

          {/* 5 · Under the hood */}
          <Placeholder title="Under the hood">
            Integration pattern ({w.track}), credential-acquisition path, and
            registry links (ecosystem, schema, permissions) — ships with the
            live wiring.
          </Placeholder>

          <p className="text-xs text-muted">
            This page follows the identical per-wallet template of the{" "}
            <a className="text-accent underline" href={`${LINKS.spec}/spec.md`} target="_blank" rel="noopener noreferrer">
              playground spec §5
            </a>
            , generated from{" "}
            <code className="font-mono">integrations/{w.slug}/integration.yaml</code>.
          </p>
        </Container>
      </Section>
    </>
  );
}
