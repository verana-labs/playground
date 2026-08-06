"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Download,
  FileBadge,
  FileSearch,
  Github,
  Maximize2,
  ShieldQuestion,
} from "lucide-react";
import MediaLightbox, {
  type LightboxMedia,
} from "../components/MediaLightbox";
import { Container, Section, SectionHeading, Chip } from "../components/ui";
import { LINKS } from "../lib/site";
import { ServiceQr } from "../components/ServiceQr";
import LiveTrustCard from "../components/LiveTrustCard";
import { ComingSoonPickerTile } from "../components/ComingSoonTile";
import type { ComingSoonWallet } from "../lib/coming-soon";
import type {
  CredentialFormat,
  PersonalWallet,
  ScenarioKey,
} from "../lib/wallets";

/** portrait = handset-like capture (renders beside the demo card content);
 *  wide = square or landscape (renders below it). */
function useImageOrientation(src?: string) {
  const [orientation, setOrientation] = useState<"portrait" | "wide" | null>(
    null,
  );
  useEffect(() => {
    setOrientation(null);
    if (!src) return;
    let alive = true;
    const img = new window.Image();
    img.onload = () => {
      if (alive)
        setOrientation(img.naturalHeight > img.naturalWidth ? "portrait" : "wide");
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return orientation;
}

// The interactive body of the single personal-wallets playground: wallet
// picker (deep-linkable via ?wallet=<id>), download section, and the two
// demo trios. All wallets exercise the same six services; the selected
// wallet's credential format decides which QR artifact is minted.

const FORMAT_LABEL: Record<CredentialFormat, string> = {
  anoncreds: "AnonCreds",
  "openid4vc-sdjwt": "OpenID4VC SD-JWT",
};

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
    title: "Is it accredited to issue this credential?",
    body: "Before you can accept an offer, the wallet checks the issuer's accreditation for that schema in its ecosystem.",
  },
  {
    icon: FileSearch,
    chip: "Q3 · on every presentation request",
    title: "Is it accredited to request the presentation of this credential?",
    body: "Before you can share, the wallet checks the verifier's accreditation for the requested schema.",
  },
] as const;

type Scenario = {
  key: string;
  serviceId: string;
  title: string;
  trusted: boolean;
  accredited?: boolean;
  blurb: string;
};

const ISSUER_SCENARIOS: Scenario[] = [
  {
    key: "issue-accredited",
    serviceId: "demo-issuer-accredited",
    title: "Accredited Issuer (demo)",
    trusted: true,
    accredited: true,
    blurb:
      "Trusted, and authorized to issue the DemoCredential. Accept its offer and you hold a DemoCredential - you'll use it in the verifier demos below.",
  },
  {
    key: "issue-unaccredited",
    serviceId: "demo-issuer-unaccredited",
    title: "Unaccredited Issuer (demo)",
    trusted: true,
    accredited: false,
    blurb:
      "A perfectly trusted service - but it holds no issuer accreditation for the DemoCredential, so your wallet must block its offer. Trust and authorization are different questions.",
  },
  {
    key: "issue-untrusted",
    serviceId: "demo-issuer-untrusted",
    title: "Untrusted Issuer (demo)",
    trusted: false,
    blurb:
      "Fails trust resolution outright - no verifiable identity, no operator. Its very real credential offer reaches your wallet, and your wallet refuses it at Q1, before anything about you is shared.",
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
      "Trusted, and authorized to verify the DemoCredential. Present the credential you received above and you're in - no password, no account: the trust chain did the work.",
  },
  {
    key: "present-unaccredited",
    serviceId: "demo-verifier-unaccredited",
    title: "Unaccredited Verifier (demo)",
    trusted: true,
    accredited: false,
    blurb:
      "Trusted, but not authorized to verify the DemoCredential - your wallet must refuse to share it. Verifiers need accreditation too: no over-asking.",
  },
  {
    key: "present-untrusted",
    serviceId: "demo-verifier-untrusted",
    title: "Untrusted Verifier (demo)",
    trusted: false,
    blurb:
      "The untrusted counterpart on the verifier side: it asks you to present your DemoCredential, trust resolution fails, and your wallet refuses to share - your data never leaves.",
  },
];

function WalletIcon({
  w,
  size = 40,
}: {
  w: PersonalWallet;
  size?: number;
}) {
  if (w.icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- pre-optimized small assets from wallets/
      <img
        src={w.icon}
        alt=""
        aria-hidden
        width={size}
        height={size}
        className="shrink-0 rounded-lg bg-white object-contain ring-1 ring-black/5"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-lg bg-violet-50 font-bold text-violet-700"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {w.name.charAt(0)}
    </span>
  );
}

/** Corner control that opens the sibling media in the lightbox. */
function ExpandButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="absolute right-1.5 top-1.5 rounded-lg bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
    >
      <Maximize2 className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function ScenarioCapture({
  capture,
  walletName,
  position,
}: {
  capture: { src: string; caption?: string; clip?: string };
  walletName: string;
  position: "side" | "bottom";
}) {
  const [zoom, setZoom] = useState<LightboxMedia | null>(null);
  // Still and clip sit side by side rather than stacked: both are phone-shaped, so stacking
  // them doubles the column height and leaves the trust card beside it floating in a void.
  const media =
    position === "side"
      ? "w-full min-w-0"
      : "mx-auto max-h-72 w-auto max-w-full";
  return (
    <figure
      className={
        position === "side"
          ? `mx-auto mt-4 w-full md:mx-0 md:mt-0 ${
              capture.clip ? "max-w-[320px]" : "max-w-[200px]"
            }`
          : "mt-4"
      }
    >
      <div
        className={
          capture.clip
            ? "flex items-start gap-3"
            : position === "bottom"
              ? ""
              : "block"
        }
      >
        <button
          type="button"
          onClick={() =>
            setZoom({
              kind: "image",
              src: capture.src,
              caption: capture.caption,
              alt: capture.caption ?? `${walletName} capture`,
            })
          }
          aria-label="View this capture at full size"
          className={`block cursor-zoom-in ${capture.clip ? "min-w-0 flex-1" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimized captures from wallets/ */}
          <img
            src={capture.src}
            alt={capture.caption ?? `${walletName} capture`}
            loading="lazy"
            className={`rounded-xl border border-gray-200 bg-gray-50 ${media}`}
          />
        </button>
        {/* No poster: with the still as poster the clip reads as a duplicate of the capture
            beside it. Its own first frame is the wallet home screen, which says "video". */}
        {capture.clip ? (
          <div className="relative min-w-0 flex-1">
            {/* Keyed on the source: swapping <source> under a live <video> does not reload it,
                so without this every wallet keeps showing the first wallet's clips. */}
            <video
              key={capture.clip}
              controls
              playsInline
              preload="metadata"
              aria-label={`${walletName} running this scenario`}
              className={`rounded-xl border border-gray-200 bg-black ${media}`}
            >
              <source src={capture.clip} type="video/mp4" />
            </video>
            <ExpandButton
              label="Watch this clip at full size"
              onClick={() =>
                setZoom({
                  kind: "video",
                  src: capture.clip as string,
                  caption: capture.caption,
                })
              }
            />
          </div>
        ) : null}
      </div>
      {capture.caption ? (
        <figcaption className="mt-1.5 text-center text-xs text-gray-500">
          {capture.caption}
        </figcaption>
      ) : null}
      {zoom ? <MediaLightbox media={zoom} onClose={() => setZoom(null)} /> : null}
    </figure>
  );
}

function ScenarioCard({
  s,
  format,
  demoParams,
  capture,
  walletName,
}: {
  s: Scenario;
  format: CredentialFormat;
  /** The selected wallet's mint query, so its QR carries a rail it can read. */
  demoParams?: string;
  capture?: { src: string; caption?: string; clip?: string };
  walletName: string;
}) {
  const orientation = useImageOrientation(capture?.src);
  const accreditations = s.accredited
    ? [
        {
          role: (s.key.startsWith("issue") ? "ISSUER" : "VERIFIER") as
            | "ISSUER"
            | "VERIFIER",
          schema: "DemoCredential",
          context: "Playground Ecosystem (demo)",
        },
      ]
    : [];
  const sideCapture = capture && orientation === "portrait";
  const bottomCapture = capture && orientation === "wide";
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
      <div
        className={
          sideCapture
            ? capture?.clip
              ? "mt-4 md:grid md:grid-cols-[minmax(0,1fr)_320px] md:gap-4"
              : "mt-4 md:grid md:grid-cols-[minmax(0,1fr)_200px] md:gap-4"
            : "mt-4"
        }
      >
        <div className="space-y-3">
          <ServiceQr
            serviceId={s.serviceId}
            label={s.title}
            format={format}
            demoParams={demoParams}
          />
          <LiveTrustCard
            serviceId={s.serviceId}
            accreditations={accreditations}
          />
        </div>
        {sideCapture ? (
          <ScenarioCapture
            capture={capture}
            walletName={walletName}
            position="side"
          />
        ) : null}
      </div>
      {bottomCapture ? (
        <ScenarioCapture
          capture={capture}
          walletName={walletName}
          position="bottom"
        />
      ) : null}
    </div>
  );
}

export default function PersonalWalletsPlayground({
  wallets,
  comingSoon = [],
}: {
  wallets: PersonalWallet[];
  comingSoon?: ComingSoonWallet[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = searchParams.get("wallet");
  const [selectedId, setSelectedId] = useState<string>(
    wallets.some((w) => w.id === initial) ? (initial as string) : wallets[0]?.id,
  );
  const wallet = useMemo(
    () => wallets.find((w) => w.id === selectedId) ?? wallets[0],
    [wallets, selectedId],
  );
  const [formatChoice, setFormatChoice] = useState<CredentialFormat | null>(
    null,
  );
  const [demoZoom, setDemoZoom] = useState<LightboxMedia | null>(null);
  const format: CredentialFormat =
    formatChoice && wallet?.formats.includes(formatChoice)
      ? formatChoice
      : (wallet?.formats[0] ?? "anoncreds");

  const select = (id: string) => {
    setSelectedId(id);
    setFormatChoice(null);
    router.replace(`/personal-wallets?wallet=${id}`, { scroll: false });
  };

  if (!wallet) return null;

  return (
    <Section>
      <Container className="space-y-10">
        {/* 1 · What you'll test - the Q1/Q2/Q3 mental model */}
        <div>
          <SectionHeading
            eyebrow="Purpose"
            title="What you'll test"
            subtitle={
              <>
                A{" "}
                <a
                  href={LINKS.vuaDefinition}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-violet-700 hover:underline"
                >
                  Verifiable User Agent (VUA)
                </a>{" "}
                wallet answers three questions for you, at the right moments -
                before you connect, before you accept, before you share. The
                six demos below make each answer visible, in green and in red.
              </>
            }
          />
          <div className="grid gap-4 md:grid-cols-3">
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
          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            Every demo service below is operated by the{" "}
            <strong className="font-semibold text-gray-700">
              Playground Organization (demo)
            </strong>{" "}
            under its{" "}
            <strong className="font-semibold text-gray-700">
              Playground Ecosystem (demo)
            </strong>{" "}
            and its single <em>DemoCredential</em> schema - real registry
            entries, resolved live on the Verana testnet. The same services
            for every wallet; only the QR format changes.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Behind each demo, credential issuance and presentation requests
            are handled by{" "}
            <Link
              href="/business-wallets/vs-agent"
              className="text-violet-600 underline"
            >
              vs-agent
            </Link>
            , the open source business wallet provided by the Verana
            Foundation: the same software any organization can deploy to run
            its own verifiable services.
          </p>
        </div>

        {/* 2 · Get the wallet - pick, then install */}
        <div>
          <SectionHeading eyebrow="Choose your wallet" title="Get the wallet" />
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => select(w.id)}
                  aria-pressed={w.id === wallet.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    w.id === wallet.id
                      ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300"
                      : "border-gray-200 bg-white hover:border-violet-200"
                  }`}
                >
                  <WalletIcon w={w} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold text-gray-900">
                        {w.name}
                      </span>
                      {w.recommended ? (
                        <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                          Recommended
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-xs text-gray-500">
                      {w.vendor}
                    </span>
                  </span>
                </button>
              ))}
              {comingSoon.map((w) => (
                <ComingSoonPickerTile key={w.id} w={w} />
              ))}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-4">
                <WalletIcon w={wallet} size={56} />
                <span className="min-w-0">
                  <span className="block text-xl font-bold tracking-tight text-gray-900">
                    {wallet.name}
                  </span>
                  {wallet.website ? (
                    <a
                      href={wallet.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-gray-500 hover:text-violet-700 hover:underline"
                    >
                      {wallet.vendor}
                    </a>
                  ) : (
                    <span className="block text-sm text-gray-500">
                      {wallet.vendor}
                    </span>
                  )}
                </span>
                <span className="ml-auto flex flex-wrap gap-1.5">
                  {wallet.formats.map((f) => (
                    <Chip key={f} tone={f === format ? "verified" : "default"}>
                      {wallet.formats.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => setFormatChoice(f)}
                          className="font-medium"
                        >
                          {FORMAT_LABEL[f]}
                        </button>
                      ) : (
                        FORMAT_LABEL[f]
                      )}
                    </Chip>
                  ))}
                </span>
              </div>
              {wallet.verana_builtin ? (
                <p className="text-sm leading-relaxed text-gray-600">
                  {wallet.name} supports Verana{" "}
                  <strong className="font-semibold text-gray-900">
                    out of the box
                  </strong>{" "}
                  - install the standard build from the links below; no special
                  version needed.
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-gray-600">
                  Download the{" "}
                  <strong className="font-semibold text-gray-900">
                    modified APK
                  </strong>{" "}
                  by clicking the link below - it is the Verana-integrated
                  build of {wallet.name}, configured for the testnet. Store
                  builds may not include the integration.
                </p>
              )}
              {wallet.notes ? (
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {wallet.notes}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={wallet.download}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  <Download className="h-4 w-4" />{" "}
                  {wallet.verana_builtin
                    ? "Get the wallet"
                    : "Download the modified APK"}
                </a>
                {wallet.fork ?? wallet.repo ? (
                  <a
                    href={wallet.fork ?? wallet.repo}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={
                      wallet.fork
                        ? "The modified source behind this build"
                        : "Upstream source"
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    <Github className="h-4 w-4" />
                    {wallet.fork ? "Source" : "Upstream"}
                  </a>
                ) : null}
                {wallet.playstore ? (
                  <a
                    href={wallet.playstore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Google Play
                  </a>
                ) : null}
                {wallet.appstore ? (
                  <a
                    href={wallet.appstore}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    App Store
                  </a>
                ) : null}
                {wallet.web ? (
                  <a
                    href={wallet.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Open the web wallet
                  </a>
                ) : null}
              </div>

              {wallet.video ? (
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {wallet.name} running the demos
                  </h3>
                  <div className="mt-4">
                    <div className="relative mx-auto w-full max-w-[280px]">
                      <video
                        key={wallet.video.src}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full rounded-xl border border-gray-200 bg-black"
                      >
                        <source src={wallet.video.src} type="video/mp4" />
                      </video>
                      <ExpandButton
                        label="Watch this video at full size"
                        onClick={() =>
                          setDemoZoom({
                            kind: "video",
                            src: wallet.video?.src as string,
                            caption: wallet.video?.note,
                          })
                        }
                      />
                    </div>
                    {wallet.video.note ? (
                      <p className="mt-2 text-center text-xs text-gray-500">
                        {wallet.video.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* 3 · Issuer demos */}
        <div>
          <SectionHeading
            eyebrow="Accredited issuers"
            title="Issuer demos - three services, three verdicts"
            subtitle={
              <>
                Three issuer services offer you the DemoCredential over{" "}
                <strong className="font-medium text-gray-700">
                  {FORMAT_LABEL[format]}
                </strong>
                . Only one offer should ever reach your wallet&apos;s accept
                button.
              </>
            }
          />
          <div className="space-y-4">
            {ISSUER_SCENARIOS.map((s) => (
              <ScenarioCard
                key={s.key}
                s={s}
                format={format}
                demoParams={wallet.demoParams}
                capture={wallet.captures[s.key as ScenarioKey]}
                walletName={wallet.name}
              />
            ))}
          </div>
        </div>

        {/* 4 · Verifier demos */}
        <div>
          <SectionHeading
            eyebrow="Accredited relying parties"
            title="Verifier Demos: relying parties"
            subtitle="Three verifier services ask you to present the DemoCredential you received above. Only one request should ever reach your wallet's share button."
          />
          <div className="space-y-4">
            {VERIFIER_SCENARIOS.map((s) => (
              <ScenarioCard
                key={s.key}
                s={s}
                format={format}
                demoParams={wallet.demoParams}
                capture={wallet.captures[s.key as ScenarioKey]}
                walletName={wallet.name}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          This page is generated from{" "}
          <a
            className="text-violet-600 underline"
            href="https://github.com/verana-labs/playground/blob/main/personal-wallets.yaml"
            target="_blank"
            rel="noopener noreferrer"
          >
            <code>personal-wallets.yaml</code>
          </a>{" "}
          - to list your wallet, test the loop with AnonCreds and/or OpenID4VC
          SD-JWT and open a PR with your entry, icon, and optional captures
          and videos.
        </p>
      </Container>
      {demoZoom ? (
        <MediaLightbox media={demoZoom} onClose={() => setDemoZoom(null)} />
      ) : null}
    </Section>
  );
}
