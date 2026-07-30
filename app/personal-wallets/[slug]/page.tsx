import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Download,
  FileBadge,
  FileSearch,
  Github,
  PlayCircle,
  ShieldQuestion,
} from "lucide-react";
import {
  Container,
  Section,
  Breadcrumb,
  Chip,
  Placeholder,
} from "../../components/ui";
import WalletLogo from "../../components/WalletLogo";
import WalletEvidence from "../../components/WalletEvidence";
import {
  ExpectedRendering,
  type ExpectedRenderingKind,
} from "../../components/ExpectedRendering";
import { ProofOfTrust } from "../../components/ProofOfTrust";
import { ServiceQr } from "../../components/ServiceQr";
import {
  personalWallets,
  getIntegration,
  type Integration,
} from "../../lib/integrations";
import { LINKS } from "../../lib/site";

// Per-personal-wallet playground page — the identical template of spec §4:
// breadcrumb · header · what you'll test (Q1/Q2/Q3) · get the wallet
// (modified APK) · issuer demos (trio) · verifier demos (trio). Every page
// runs the same six DemoCredential scenarios against the shared Playground
// demo cast; only the wallet (and its captures) changes.

export function generateStaticParams() {
  return personalWallets().map((w) => ({ slug: w.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = getIntegration(slug);
  return {
    title: w ? `${w.name} playground` : "Personal wallet",
    description: w
      ? `Try ${w.name} against the Verana testnet — six DemoCredential scenarios with live trust resolution.`
      : undefined,
  };
}

const QUESTIONS = [
  {
    icon: ShieldQuestion,
    chip: "Q1 · on every connection",
    title: "Is this service trusted, and who operates it?",
    body: "Before connecting, the wallet trust-resolves the service DID against the public registry and shows the Proof-of-Trust.",
  },
  {
    icon: FileBadge,
    chip: "Q2 · on every credential offer",
    title: "Is it authorized to issue this credential?",
    body: "Before you can accept an offer, the wallet checks the issuer's accreditation for that schema in its ecosystem.",
  },
  {
    icon: FileSearch,
    chip: "Q3 · on every presentation request",
    title: "Is it authorized to verify this credential?",
    body: "Before you can share, the wallet checks the verifier's accreditation for the requested schema.",
  },
] as const;

type Scenario = {
  key: ExpectedRenderingKind;
  serviceId: string;
  title: string;
  trusted: boolean;
  accredited?: boolean;
  blurb: string;
  /** Q1-only scenarios work for any wallet that trust-resolves on connect;
   *  the credential scenarios need the wallet's rail (demo_loop). */
  needsRail: boolean;
};

const ISSUER_SCENARIOS: Scenario[] = [
  {
    key: "issue-accredited",
    serviceId: "demo-issuer-accredited",
    title: "Accredited Issuer (demo)",
    trusted: true,
    accredited: true,
    blurb:
      "Trusted, and authorized to issue the DemoCredential. Accept its offer and you hold a DemoCredential — you'll use it in the verifier demos below.",
    needsRail: true,
  },
  {
    key: "issue-unaccredited",
    serviceId: "demo-issuer-unaccredited",
    title: "Unaccredited Issuer (demo)",
    trusted: true,
    accredited: false,
    blurb:
      "A perfectly trusted service — but it holds no issuer accreditation for the DemoCredential, so your wallet must block its offer. Trust and authorization are different questions.",
    needsRail: true,
  },
  {
    key: "issue-untrusted",
    serviceId: "demo-untrusted",
    title: "Untrusted Service (demo)",
    trusted: false,
    blurb:
      "Fails trust resolution outright — no verifiable identity, no operator. Your wallet refuses the connection before any offer can reach you.",
    needsRail: false,
  },
];

const VERIFIER_SCENARIOS: Scenario[] = [
  {
    key: "present-accredited",
    serviceId: "demo-verifier-accredited",
    title: "Accredited Verifier (demo)",
    trusted: true,
    accredited: true,
    blurb:
      "Trusted, and authorized to verify the DemoCredential. Present the credential you received above and you're in — no password, no account: the trust chain did the work.",
    needsRail: true,
  },
  {
    key: "present-unaccredited",
    serviceId: "demo-verifier-unaccredited",
    title: "Unaccredited Verifier (demo)",
    trusted: true,
    accredited: false,
    blurb:
      "Trusted, but not authorized to verify the DemoCredential — your wallet must refuse to share it. Verifiers need accreditation too: no over-asking.",
    needsRail: true,
  },
  {
    key: "present-untrusted",
    serviceId: "demo-untrusted",
    title: "Untrusted Service (demo)",
    trusted: false,
    blurb:
      "The same untrusted service, now trying to request a presentation. It never gets that far: the connection is refused at trust resolution.",
    needsRail: false,
  },
];

function ScenarioCard({ s, w }: { s: Scenario; w: Integration }) {
  const capture = w.captures?.[s.key];
  const live = !s.needsRail || w.demo_loop === "live";
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-bold text-gray-900">{s.title}</h3>
        <Chip tone={s.trusted ? "verified" : "default"}>
          {s.trusted ? "TRUSTED" : "UNTRUSTED"}
        </Chip>
        {s.trusted ? (
          <Chip tone={s.accredited ? "verified" : "default"}>
            {s.accredited ? "accredited" : "not accredited"}
          </Chip>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.blurb}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          {capture ? (
            <figure className="rounded-xl border border-gray-200 bg-gray-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- integrator-submitted capture served from public/ */}
              <img
                src={capture.src}
                alt={capture.caption ?? `${w.name} — ${s.title}`}
                loading="lazy"
                className="mx-auto max-h-96 w-auto rounded-lg"
              />
              {capture.caption ? (
                <figcaption className="mt-1.5 text-center text-xs text-gray-500">
                  {capture.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : (
            <ExpectedRendering kind={s.key} />
          )}
        </div>
        <div className="space-y-3">
          {live ? (
            <ServiceQr serviceId={s.serviceId} label={s.title} />
          ) : (
            <Placeholder title="Scenario coming for this wallet">
              This wallet does not run the DemoCredential flow on its rail yet
              — trust resolution demos already work.
            </Placeholder>
          )}
          <details className="rounded-xl border border-gray-200 bg-white p-4">
            <summary className="cursor-pointer select-none text-sm font-medium text-gray-700 transition-colors hover:text-violet-700">
              Live Proof-of-Trust of this service
            </summary>
            <div className="mt-3">
              <ProofOfTrust serviceId={s.serviceId} />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
        {n}
      </span>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
    </div>
  );
}

export default async function UserWalletPlayground({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = getIntegration(slug);
  if (!w || w.kind !== "personal-wallet") notFound();

  return (
    <>
      <header className="hero-gradient text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          {/* Breadcrumb */}
          <Breadcrumb
            onDark
            items={[
              { label: "Playground", href: "/" },
              { label: "Personal wallets", href: "/#personal-wallets" },
              { label: w.name },
            ]}
          />
          {/* Header */}
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
        <Container className="space-y-10">
          {/* 1 · What you'll test — the Q1/Q2/Q3 mental model (spec §4.3) */}
          <div>
            <StepHeading n={1} title="What you'll test" />
            <p className="ml-11 text-sm leading-relaxed text-gray-500">
              A Verana-integrated wallet answers three questions for you, at
              the right moments — before you connect, before you accept, before
              you share. The six demos below make each answer visible, in green
              and in red.
            </p>
            <div className="ml-11 mt-4 grid gap-4 md:grid-cols-3">
              {QUESTIONS.map((q) => (
                <div
                  key={q.chip}
                  className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <q.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-violet-600">
                    {q.chip}
                  </p>
                  <h3 className="mt-1 font-semibold text-gray-900">{q.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                    {q.body}
                  </p>
                </div>
              ))}
            </div>
            <p className="ml-11 mt-4 text-sm leading-relaxed text-gray-500">
              Every demo service below is operated by the{" "}
              <strong className="font-semibold text-gray-700">
                Playground Organization (demo)
              </strong>{" "}
              under its{" "}
              <strong className="font-semibold text-gray-700">
                Playground Ecosystem (demo)
              </strong>{" "}
              and its single <em>DemoCredential</em> schema — real registry
              entries, resolved live on the Verana testnet. Same services on
              every wallet page; only the wallet changes.
            </p>
          </div>

          {/* 2 · Get the wallet — the modified APK (spec §4.4) */}
          <div>
            <StepHeading n={2} title="Get the wallet" />
            <div className="ml-11 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {w.verana_builtin ? (
                <p className="text-sm leading-relaxed text-gray-600">
                  {w.name} supports Verana{" "}
                  <strong className="font-semibold text-gray-900">
                    out of the box
                  </strong>{" "}
                  — install the standard build from the links below; no special
                  version needed.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-gray-600">
                  Download the{" "}
                  <strong className="font-semibold text-gray-900">
                    modified APK
                  </strong>{" "}
                  by clicking the link below — it is the Verana-integrated
                  build of {w.name}, configured for the testnet. Store builds
                  may not include the integration; store links only complement
                  the direct download.
                </p>
              )}
              {w.notes ? (
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {w.notes}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {w.download ? (
                  <a
                    href={w.download}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                  >
                    <Download className="h-4 w-4" />{" "}
                    {w.verana_builtin ? "Get the wallet" : "Download the modified APK"}
                  </a>
                ) : null}
                {w.playstore ? (
                  <a
                    href={w.playstore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Google Play
                  </a>
                ) : null}
                {w.appstore ? (
                  <a
                    href={w.appstore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    App Store
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <WalletEvidence w={w} />

          {/* 3 · Issuer demos (spec §4.5) */}
          <div>
            <StepHeading n={3} title="Issuer demos — three services, three verdicts" />
            <p className="ml-11 text-sm leading-relaxed text-gray-500">
              Three issuer services offer you the DemoCredential. Only one
              offer should ever reach your wallet&apos;s accept button.
            </p>
            <div className="ml-11 mt-4 space-y-4">
              {ISSUER_SCENARIOS.map((s) => (
                <ScenarioCard key={s.key} s={s} w={w} />
              ))}
            </div>
          </div>

          {/* 4 · Verifier demos (spec §4.6) */}
          <div>
            <StepHeading n={4} title="Verifier demos — log in with your DemoCredential" />
            <p className="ml-11 text-sm leading-relaxed text-gray-500">
              Three verifier services ask you to present the DemoCredential you
              received above. Only one request should ever reach your
              wallet&apos;s share button.
            </p>
            <div className="ml-11 mt-4 space-y-4">
              {VERIFIER_SCENARIOS.map((s) => (
                <ScenarioCard key={s.key} s={s} w={w} />
              ))}
            </div>
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
