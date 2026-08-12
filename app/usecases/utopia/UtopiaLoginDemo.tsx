"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  BadgeCheck,
  Building2,
  IdCard,
  Landmark,
  Lock,
  PiggyBank,
  RefreshCw,
  ShieldX,
} from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { useSelectedWallet } from "../vesta/DemoWalletFlow";
import { UTOPIA_CAST } from "../../lib/utopia-cast";

// Chapter-4 demos 3 and 4: mimicked relying-party windows for the Republic
// of Utopia - the Tax Buro portal and the Meridian Bank online banking
// window. Both run the same two-mode flow: sign in with the Utopia Citizen
// ID (mode "citizen"), or with the Legal Representative credential (mode
// "company"). The decision is computed live by /api/utopia-login/[id] from
// the credential issuer's chain: Civil Registry -> citizen space, Business
// Registry -> company space, anything else -> denied.

type Claim = { name: string; value: string };

type LoginResult = {
  done: boolean;
  verified?: boolean;
  claims?: Claim[];
  decision?: "citizen" | "company" | "denied";
  name?: string;
  company?: string;
  trustVerdict?: string | null;
  trustNote?: string | null;
};

export type UtopiaPortalId = "tax-buro" | "meridian-bank";

const PORTALS: Record<
  UtopiaPortalId,
  {
    title: string;
    subtitle: string;
    host: string;
    citizenButton: string;
    companyButton: string;
    citizenWelcome: string;
    companyWelcome: (company?: string) => string;
    deniedCompany: string;
  }
> = {
  "tax-buro": {
    title: "Tax Buro of Utopia",
    subtitle: "Citizen & company sign-in",
    host: UTOPIA_CAST.taxBuro.host,
    citizenButton: "Sign in with your Citizen ID",
    companyButton: "Company space (Legal Representation)",
    citizenWelcome:
      "Your Citizen ID was issued by the National Civil Registry. Personal tax space opened - no password, no account.",
    companyWelcome: (company) =>
      `Your Legal Representative credential was issued by the National Business Registry${
        company ? ` for ${company}` : ""
      }. Company tax space opened.`,
    deniedCompany:
      "Your credential was not issued by the National Business Registry - it does not prove legal representation in Utopia.",
  },
  "meridian-bank": {
    title: "Meridian Bank",
    subtitle: "Online banking (demo)",
    host: UTOPIA_CAST.meridianBank.host,
    citizenButton: "Open an account with your Citizen ID",
    companyButton: "Corporate access (Legal Representation)",
    citizenWelcome:
      "Identity verified against the National Civil Registry - your account is open. KYC in one scan: no document uploads, no video-ident.",
    companyWelcome: (company) =>
      `Legal representation verified against the National Business Registry${
        company ? ` - corporate access to the ${company} account granted` : ""
      }.`,
    deniedCompany:
      "Your credential was not issued by the National Business Registry - corporate access refused.",
  },
};

const claim = (claims: Claim[] | undefined, name: string) =>
  claims?.find((c) => c.name === name)?.value;

function DecisionBanner({
  result,
  mode,
  portal,
}: {
  result: LoginResult;
  mode: "citizen" | "company";
  portal: UtopiaPortalId;
}) {
  const copy = PORTALS[portal];
  if (result.decision === "citizen" || result.decision === "company") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        <p className="flex items-center gap-2 font-bold">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden />
          Welcome{result.name ? `, ${result.name}` : ""}!
        </p>
        <p className="mt-1 text-emerald-700/90">
          {result.decision === "citizen"
            ? copy.citizenWelcome
            : copy.companyWelcome(result.company)}
        </p>
      </div>
    );
  }
  // Distinguish "the credential itself could not be trusted" (transient
  // resolver failure, unauthorized or untrusted issuer) from the issuer rule.
  const verdict = result.trustVerdict;
  const reason =
    verdict === "RESOLVER_UNAVAILABLE"
      ? "The service could not reach the trust resolver to verify your credential - try again in a moment."
      : verdict === "UNTRUSTED"
        ? "Your credential was issued by an organization that is not a trusted verifiable service."
        : verdict === "TRUSTED_NOT_AUTHORIZED"
          ? "Your credential was issued by an organization that is not authorized to issue it."
          : mode === "company"
            ? copy.deniedCompany
            : "Your credential was not issued by the National Civil Registry - it is not a Utopia Citizen ID.";
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

function PresentedCredential({ claims }: { claims: Claim[] }) {
  const portrait = claim(claims, "portrait");
  const rows = claims.filter((c) => c.value && c.name !== "portrait");
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
      {portrait?.startsWith("data:image/") ? (
        // eslint-disable-next-line @next/next/no-img-element -- ID portrait is a data URI from the presentation
        <img
          src={portrait}
          alt="ID portrait"
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

export default function UtopiaLoginDemo({
  wallets,
  portal,
}: {
  wallets: PersonalWallet[];
  portal: UtopiaPortalId;
}) {
  const { wallet } = useSelectedWallet(wallets);
  const copy = PORTALS[portal];
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<"citizen" | "company" | null>(null);
  const [mint, setMint] = useState<
    { url: string; id: string | null; rail: string } | null | undefined
  >(undefined);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<LoginResult | null>(null);

  const format = wallet?.formats.includes("anoncreds")
    ? "anoncreds"
    : "openid4vc-sdjwt";

  const start = useCallback((m: "citizen" | "company") => {
    setResult(null);
    setMint(undefined);
    setQrDataUrl(undefined);
    setAttempt((n) => n + 1);
    setMode(m);
  }, []);
  const reset = useCallback(() => {
    setResult(null);
    setMint(undefined);
    setQrDataUrl(undefined);
    setMode(null);
  }, []);

  // Mint a fresh presentation request per attempt.
  useEffect(() => {
    if (!mode) return;
    let alive = true;
    fetch(
      `/api/utopia-login?portal=${portal}&mode=${mode}&format=${encodeURIComponent(format)}`,
    )
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
  }, [mode, attempt, format, portal]);

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
    if (!mint?.id || !mode || settled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/utopia-login/${mint.id}?portal=${portal}&mode=${mode}&rail=${encodeURIComponent(mint.rail)}`,
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
  }, [mint, mode, settled, attempt, portal]);

  const BrandIcon = portal === "meridian-bank" ? PiggyBank : Landmark;

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
          <span className="truncate">{copy.host}</span>
        </span>
      </div>

      {/* Portal body */}
      <div className="px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-sm text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <BrandIcon className="h-6 w-6" aria-hidden />
          </span>
          <h4 className="mt-3 text-lg font-bold text-gray-900">{copy.title}</h4>
          <p className="mt-1 text-sm text-gray-500">{copy.subtitle}</p>

          <div className="mt-6">
            {!mode ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => start("citizen")}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
                >
                  <IdCard className="h-4 w-4" aria-hidden />
                  {copy.citizenButton}
                </button>
                <button
                  type="button"
                  onClick={() => start("company")}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-2.5 text-sm font-medium text-violet-700 transition-colors hover:border-violet-300 hover:bg-violet-50"
                >
                  <Building2 className="h-4 w-4" aria-hidden />
                  {copy.companyButton}
                </button>
              </div>
            ) : result?.done ? (
              <div className="space-y-4 text-left">
                {result.claims?.length ? (
                  <PresentedCredential claims={result.claims} />
                ) : null}
                <DecisionBanner result={result} mode={mode} portal={portal} />
                <button
                  type="button"
                  onClick={reset}
                  className="mx-auto flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                  Start over - try another credential
                </button>
              </div>
            ) : mint === null ? (
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
                <p className="text-xs text-gray-500">
                  The service is unreachable right now.
                </p>
                <button
                  type="button"
                  onClick={() => start(mode)}
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
                    alt={`${copy.title} sign-in QR`}
                    className="h-full w-full"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Present your{" "}
                  {mode === "company"
                    ? "Legal Representative credential"
                    : "Utopia Citizen ID"}{" "}
                  with {wallet?.name ?? "your wallet"}.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mx-auto flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
