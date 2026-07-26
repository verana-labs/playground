import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Container,
  Section,
  Chip,
  Breadcrumb,
  Placeholder,
} from "../../components/ui";
import { userWallets, getIntegration } from "../../lib/integrations";
import { LINKS } from "../../lib/site";

// Per-user-wallet playground page — the identical template of spec §4:
// breadcrumb · header · get the wallet · Service 1 (ACME badge issuer) ·
// Service 2 (ACME login) · refusal paths. Generated from integration.yaml.

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
  return { title: w ? `${w.name} playground` : "User wallet" };
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
      <section className="border-b border-rule">
        <Container className="py-10">
          {/* 1 · Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Playground", href: "/" },
              { label: "User wallets", href: "/#user-wallets" },
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
              {w.badge_loop === "live" ? (
                <Chip tone="verified">badge loop ✓</Chip>
              ) : (
                <Chip tone="pending">badge loop coming</Chip>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {w.download ? (
              <a href={w.download} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                Download
              </a>
            ) : null}
            {w.repo ? (
              <a href={w.repo} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Source ↗
              </a>
            ) : null}
            {w.demo_video ? (
              <a href={w.demo_video} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                Video ↗
              </a>
            ) : null}
          </div>
        </Container>
      </section>

      <Section>
        <Container className="max-w-3xl space-y-8">
          {/* 3 · Get the wallet */}
          <div className="card p-6">
            <span className="eyebrow">Get the wallet</span>
            <p className="mt-3 text-sm text-muted">
              Install {w.name}
              {w.download ? (
                <>
                  {" "}
                  from{" "}
                  <a className="text-accent underline" href={w.download} target="_blank" rel="noopener noreferrer">
                    its download link
                  </a>
                </>
              ) : null}
              . {w.notes ?? ""}
            </p>
          </div>

          {/* 4 · Service 1 — receive the badge */}
          {w.badge_loop === "live" ? (
            <Placeholder title="Service 1 — Receive your ECS-Badge (ACME badge issuer)">
              Wiring in progress: the QR / deep link to the ACME badge issuer
              (demo) will appear here, next to the expected Proof-of-Trust and
              the issuer verdict.
            </Placeholder>
          ) : (
            <Placeholder title="Service 1 — Receive your ECS-Badge">
              The badge loop for {w.name} activates when the wallet supports the
              current AnonCreds/DIDComm flow or when OpenID4VC issuance lands.
            </Placeholder>
          )}

          {/* 5 · Service 2 — present the badge */}
          <Placeholder title="Service 2 — Log in with your badge (ACME login)">
            The QR / deep link to the ACME login service (demo) will appear
            here, next to the expected Proof-of-Trust and the verifier verdict.
          </Placeholder>

          {/* 6 · Refusal paths */}
          <Placeholder title="Refusal paths — Umbra Corp (demo)">
            The same two actions against unauthorized demo services, ending in
            red verdicts — ships when the Umbra services are deployed.
          </Placeholder>

          <p className="text-xs text-muted">
            This page follows the identical per-wallet template of the{" "}
            <a className="text-accent underline" href={`${LINKS.spec}/spec.md`} target="_blank" rel="noopener noreferrer">
              playground spec §4
            </a>
            , generated from{" "}
            <code className="font-mono">integrations/{w.slug}/integration.yaml</code>.
          </p>
        </Container>
      </Section>
    </>
  );
}
