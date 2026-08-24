"use client";
import { withBase } from "../../lib/base-path";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import { BadgeCheck, Lock, RefreshCw, ShieldX } from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { useSelectedWallet } from "./DemoWalletFlow";

// Chapter-4 demo 2: a mimicked Vesta Portal login window. Sign in with an
// ECS-Badge: the portal requests a badge presentation, shows the presented
// credential, and decides from the badge ISSUER's chain - Vesta employee,
// Authorized Repairer partner employee, or access denied. The decision is
// computed live by /api/portal-login/[id] against the network resolver.

type Claim = { name: string; value: string };

type LoginResult = {
  done: boolean;
  verified?: boolean;
  claims?: Claim[];
  decision?: "employee" | "partner" | "denied";
  company?: string;
  trustVerdict?: string | null;
  trustNote?: string | null;
};

const claim = (claims: Claim[] | undefined, name: string) =>
  claims?.find((c) => c.name === name)?.value;

function DecisionBanner({ result }: { result: LoginResult }) {
  const name = claim(result.claims, "name");
  if (result.decision === "employee") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="flex items-center gap-2 font-bold">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
          Welcome, Vesta employee!
        </p>
        <p className="mt-1 text-emerald-700/90">
          Your badge was issued by Vesta Appliances. Full staff access granted.
        </p>
      </div>
    );
  }
  if (result.decision === "partner") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="flex items-center gap-2 font-bold">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
          Welcome{name ? `, ${name}` : ""}!
        </p>
        <p className="mt-1 text-emerald-700/90">
          Your company{result.company ? `, ${result.company},` : ""} is a
          member of the Vesta Authorized Repair Network. You can access all
          our services for repair companies: parts, manuals, and warranty
          claims.
        </p>
      </div>
    );
  }
  // Distinguish "the badge itself could not be trusted" (transient resolver
  // failure, unauthorized or untrusted issuer) from the membership rule.
  const verdict = result.trustVerdict;
  const reason =
    verdict === "RESOLVER_UNAVAILABLE"
      ? "The portal could not reach the trust resolver to verify your badge - try again in a moment."
      : verdict === "UNTRUSTED"
        ? "Your badge was issued by an organization that is not a trusted verifiable service."
        : verdict === "TRUSTED_NOT_AUTHORIZED"
          ? "Your badge was issued by an organization that is not authorized to issue ECS-Badges."
          : "Your badge was issued by an organization that does not present a valid Authorized Repairer credential - it is not a member of the Vesta Authorized Repair Network.";
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <p className="flex items-center gap-2 font-bold">
        <ShieldX className="h-4 w-4 shrink-0" aria-hidden />
        Access denied
      </p>
      <p className="mt-1 text-red-600/90">{reason}</p>
      {result.trustNote ? (
        <p className="mt-1.5 text-xs text-red-500/80">{result.trustNote}</p>
      ) : null}
    </div>
  );
}

function PresentedBadge({ claims }: { claims: Claim[] }) {
  const photo = claim(claims, "photo");
  const rows = claims.filter(
    (c) => c.value && !["photo", "biometricPattern", "biometricPatternScheme", "birthDate"].includes(c.name),
  );
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      {photo?.startsWith("data:image/") ? (
        // eslint-disable-next-line @next/next/no-img-element -- badge photo is a data URI from the presentation
        <img
          src={photo}
          alt="Badge photo"
          className="h-16 w-16 shrink-0 rounded-xl border border-gray-200 bg-white object-cover"
        />
      ) : null}
      <dl className="min-w-0 flex-1 space-y-1">
        {rows.map((c) => (
          <div key={c.name} className="flex items-baseline justify-between gap-4">
            <dt className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {c.name}
            </dt>
            <dd className="truncate font-mono text-xs text-gray-700">{c.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function PortalLoginDemo({
  wallets,
}: {
  wallets: PersonalWallet[];
}) {
  const { wallet } = useSelectedWallet(wallets);
  const [attempt, setAttempt] = useState(0);
  const [started, setStarted] = useState(false);
  const [mint, setMint] = useState<
    { url: string; id: string | null; rail: string } | null | undefined
  >(undefined);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<LoginResult | null>(null);

  const format = wallet?.formats.includes("anoncreds")
    ? "anoncreds"
    : "openid4vc-sdjwt";

  const startOver = useCallback(() => {
    setResult(null);
    setMint(undefined);
    setQrDataUrl(undefined);
    setAttempt((n) => n + 1);
    setStarted(true);
  }, []);

  // Mint a fresh presentation request per attempt.
  useEffect(() => {
    if (!started) return;
    let alive = true;
    fetch(withBase(`/api/portal-login?format=${encodeURIComponent(format)}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => {
        if (!alive) return;
        setMint(body?.url ? body : null);
      })
      .catch(() => {
        if (alive) setMint(null);
      });
    return () => {
      alive = false;
    };
  }, [started, attempt, format]);

  useEffect(() => {
    if (!mint?.url) return;
    let alive = true;
    QRCode.toDataURL(mint.url, { width: 180, margin: 1 })
      .then((url) => {
        if (alive) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [mint]);

  // Poll for the decision once the request is up.
  const settled = !!result?.done;
  useEffect(() => {
    if (!mint?.id || settled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/portal-login/${mint.id}?rail=${encodeURIComponent(mint.rail)}`,
        );
        if (res.ok) {
          const body = (await res.json()) as LoginResult;
          if (!alive) return;
          if (body?.done) {
            setResult(body);
            return;
          }
        }
      } catch {
        // transient - keep polling
      }
      if (alive) timer = setTimeout(poll, 3000);
    };
    poll();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [mint, settled, attempt]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
        </span>
        <span className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs text-gray-500 ring-1 ring-gray-200">
          <Lock className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
          <span className="truncate">
            portal.vesta.playground.testnet.verana.network
          </span>
        </span>
      </div>

      {/* Portal body */}
      <div className="px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-sm text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- small brand asset */}
          <img
            src={withBase("/images/logo.webp")}
            alt="Vesta Appliances"
            className="mx-auto h-12 w-12 rounded-xl"
          />
          <h4 className="mt-3 text-lg font-bold text-gray-900">Vesta Portal</h4>
          <p className="mt-1 text-sm text-gray-500">
            Staff &amp; partner sign-in
          </p>

          <div className="mt-6">
            {!started ? (
              <button
                type="button"
                onClick={startOver}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
              >
                <BadgeCheck className="h-4 w-4" aria-hidden />
                Sign in with your ECS-Badge
              </button>
            ) : result?.done ? (
              <div className="space-y-4 text-left">
                {result.claims?.length ? (
                  <PresentedBadge claims={result.claims} />
                ) : null}
                <DecisionBanner result={result} />
                <button
                  type="button"
                  onClick={startOver}
                  className="mx-auto flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Start over - try another badge
                </button>
              </div>
            ) : mint === null ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
                <p className="text-xs text-gray-500">
                  The portal is unreachable right now.
                </p>
                <button
                  type="button"
                  onClick={startOver}
                  className="mx-auto mt-2 flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  <RefreshCw className="h-3 w-3" aria-hidden />
                  Retry
                </button>
              </div>
            ) : !qrDataUrl ? (
              <div className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-500">
                Preparing the sign-in request…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-xl border border-gray-100 bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URI */}
                  <img
                    src={qrDataUrl}
                    alt="Portal sign-in QR"
                    className="h-full w-full"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Present your ECS-Badge with {wallet?.name ?? "your wallet"}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
