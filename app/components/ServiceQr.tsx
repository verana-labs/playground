"use client";
import { withBase } from "../lib/base-path";

import { BadgeCheck, ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type DemoApiResponse = {
  kind?: string;
  url?: string | null;
  proofExchangeId?: string | null;
  credentialExchangeId?: string | null;
  verificationSessionId?: string | null;
  issuanceSessionId?: string | null;
};

type CredentialStatus = {
  state?: string | null;
  done?: boolean;
  declined?: boolean;
  error?: string | null;
};

type ProofStatus = {
  state?: string | null;
  verified?: boolean;
  claims?: { name: string; value: string }[];
};

type HostedWallet = { name: string; url: string };

function StartOverButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mx-auto mt-4 flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700"
    >
      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
      Start over
    </button>
  );
}

/** Issuance outcome - each QR is single-use, so once the wallet answered the
 *  offer the QR is replaced by the outcome and a fresh start. */
function IssuanceOutcome({
  declined,
  onRestart,
}: {
  declined: boolean;
  onRestart: () => void;
}) {
  if (declined) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
        <p className="text-sm font-semibold text-gray-700">
          Offer declined in the wallet.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Each QR is single-use - start over to mint a fresh offer.
        </p>
        <StartOverButton onClick={onRestart} />
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
      <div className="flex items-center justify-center gap-2 text-emerald-700">
        <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
        <span className="font-semibold">Credential delivered</span>
      </div>
      <p className="mt-2 text-xs text-emerald-700/80">
        It is now in your wallet. Each QR is single-use - start over to mint
        a fresh offer.
      </p>
      <StartOverButton onClick={onRestart} />
    </div>
  );
}

/** What the verifier received - shown in place of the QR once the wallet
 *  has presented the DemoCredential. */
function PresentedCredential({
  proof,
  onRestart,
}: {
  proof: ProofStatus;
  onRestart: () => void;
}) {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="flex items-center justify-center gap-2 text-emerald-700">
        <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
        <span className="font-semibold">DemoCredential presented</span>
      </div>
      {proof.claims?.length ? (
        <dl className="mx-auto mt-4 max-w-xs space-y-1.5">
          {proof.claims.map((c) => (
            <div key={c.name} className="flex items-baseline justify-between gap-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70">
                {c.name}
              </dt>
              <dd className="break-all font-mono text-sm text-emerald-900">
                {c.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
      <p className="mt-3 text-center text-xs text-emerald-700/80">
        {proof.verified
          ? "Cryptographically verified by the service - you're in, no password, no account."
          : "Presentation received - verification still pending on the service."}
      </p>
      <StartOverButton onClick={onRestart} />
    </div>
  );
}

function UnavailableCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-5 py-4">
      <p className="text-xs text-gray-500">Live service link unavailable right now.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-2 inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
      >
        <RefreshCw className="h-3 w-3" />
        Retry
      </button>
    </div>
  );
}

function OpenInWalletLink({
  wallet,
  appUrl,
}: {
  wallet: HostedWallet;
  appUrl: string;
}) {
  const queryStart = appUrl.indexOf("?");
  if (queryStart < 0) return null;
  const href = `${wallet.url.replace(/\/$/, "")}/?${appUrl.slice(queryStart + 1)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
    >
      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      Open in {wallet.name}
    </a>
  );
}

// Auto-reveals when scrolled into view: revealing fetches /api/demo/<id>,
// which mints a fresh live action for this visitor - an OOB credential offer
// (issuers) or OOB presentation request (verifiers), or the plain connection
// invitation for the untrusted service.
export function ServiceQr({
  serviceId,
  label,
  format = "anoncreds",
  credential,
  demoParams,
  openInWallet,
  bare = false,
}: {
  serviceId: string;
  label: string;
  /** Credential format of the selected wallet - decides the minted QR. */
  format?: string;
  /** Extra mint query this wallet needs, e.g. `query=pe` or `signer=x5c`. The
   *  OpenID4VP rails are mutually exclusive, so a wallet that cannot read the
   *  default one has to be minted its own. */
  demoParams?: string;
  openInWallet?: HostedWallet;
  /** Which credential the demo mints (default: the DemoCredential);
   *  "ecs-badge" mints the Vesta chapter-4 badge offer. */
  credential?: string;
  /** Render only the QR itself - no card wrapper, no URL, no caption.
   *  Used when the QR sits inside the caller's own card. */
  bare?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [appUrl, setAppUrl] = useState<string | null | undefined>(undefined);
  const [unsupported, setUnsupported] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined);
  const [qrFailed, setQrFailed] = useState(false);
  const [proofId, setProofId] = useState<string | null>(null);
  const [proof, setProof] = useState<ProofStatus | null>(null);
  const [credId, setCredId] = useState<string | null>(null);
  const [credStatus, setCredStatus] = useState<CredentialStatus | null>(null);
  // Which rail minted the action - decides the status endpoint polled.
  const [rail, setRail] = useState<"didcomm" | "oid4vc">("didcomm");
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Auto-reveal: mint and show the QR as soon as the card scrolls into
  // view (once). Environments without IntersectionObserver reveal at mount.
  useEffect(() => {
    if (revealed) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setRevealed(true);
      },
      { rootMargin: "0px 0px 120px 0px", threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [revealed]);

  useEffect(() => {
    if (!revealed) return;
    let alive = true;
    setAppUrl(undefined);
    setUnsupported(false);
    setProofId(null);
    setProof(null);
    setCredId(null);
    setCredStatus(null);
    fetch(
      withBase(`/api/demo/${serviceId}?format=${encodeURIComponent(format)}${
        credential ? `&credential=${encodeURIComponent(credential)}` : ""
      }${demoParams ? `&${demoParams}` : ""}`),
    )
      .then((res) => (res.ok ? (res.json() as Promise<DemoApiResponse>) : null))
      .then((body) => {
        if (!alive) return;
        if (body?.kind === "unsupported") {
          setUnsupported(true);
          setAppUrl(null);
          return;
        }
        setAppUrl(body?.url ?? null);
        setRail(body?.kind?.startsWith("oid4vc") ? "oid4vc" : "didcomm");
        setProofId(body?.proofExchangeId ?? body?.verificationSessionId ?? null);
        setCredId(body?.credentialExchangeId ?? body?.issuanceSessionId ?? null);
      })
      .catch(() => {
        if (alive) setAppUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [serviceId, attempt, revealed, format, credential, demoParams]);

  // Verifier flows: poll the presentation status so the QR flips into the
  // presented credential the moment the wallet shares it.
  const presented = proof?.state === "done";
  useEffect(() => {
    if (!revealed || !proofId || presented) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch(withBase(`/api/demo/${serviceId}/proof/${proofId}?rail=${rail}`));
        if (res.ok) {
          const body = (await res.json()) as ProofStatus;
          if (!alive) return;
          if (body?.state === "done") {
            setProof(body);
            return;
          }
        }
      } catch {
        // keep polling - transient errors are expected while the pod scales
      }
      if (alive) timer = setTimeout(poll, 3000);
    };
    poll();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [revealed, proofId, presented, serviceId, attempt, rail]);

  // Issuer flows: poll the credential-exchange status so the single-use QR
  // flips into the delivered/declined outcome once the wallet answered.
  const credSettled = !!credStatus && !!(credStatus.done || credStatus.declined);
  useEffect(() => {
    if (!revealed || !credId || credSettled) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const res = await fetch(withBase(`/api/demo/${serviceId}/credential/${credId}?rail=${rail}`));
        if (res.ok) {
          const body = (await res.json()) as CredentialStatus;
          if (!alive) return;
          if (body?.done || body?.declined) {
            setCredStatus(body);
            return;
          }
        }
      } catch {
        // keep polling - transient errors are expected while the pod scales
      }
      if (alive) timer = setTimeout(poll, 3000);
    };
    poll();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [revealed, credId, credSettled, serviceId, attempt, rail]);

  useEffect(() => {
    if (!appUrl) return;
    let alive = true;
    setQrDataUrl(undefined);
    setQrFailed(false);
    QRCode.toDataURL(appUrl, { width: 160, margin: 1 })
      .then((url) => {
        if (alive) setQrDataUrl(url);
      })
      .catch(() => {
        if (alive) setQrFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [appUrl, attempt]);

  let content: React.ReactNode;
  if (credSettled && credStatus) {
    content = (
      <IssuanceOutcome declined={!!credStatus.declined} onRestart={retry} />
    );
  } else if (proof && proof.state === "done") {
    content = <PresentedCredential proof={proof} onRestart={retry} />;
  } else if (unsupported) {
    content = (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-4 text-xs text-gray-500">
        The OpenID4VC rail for the demo services is being enabled - this
        scenario reaches OpenID4VC wallets soon.
      </div>
    );
  } else if (!revealed || appUrl === undefined || (appUrl && !qrDataUrl && !qrFailed)) {
    content = (
      <div className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-500">
        Resolving the live service link…
      </div>
    );
  } else if (!appUrl || qrFailed) {
    content = <UnavailableCard onRetry={retry} />;
  } else if (bare) {
    content = (
      <div className="flex justify-center">
        <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white p-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URI, not a static asset next/image can optimize */}
          <img src={qrDataUrl} alt={`${label} QR`} className="h-full w-full" />
        </div>
      </div>
    );
  } else {
    content = (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URI, not a static asset next/image can optimize */}
            <img src={qrDataUrl} alt={`${label} QR`} className="h-full w-full" />
          </div>
          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-center font-mono text-xs text-violet-600 underline"
          >
            {appUrl}
          </a>
          {openInWallet ? (
            <OpenInWalletLink wallet={openInWallet} appUrl={appUrl} />
          ) : null}
          <p className="text-center text-xs text-gray-500">
            Scan with your <strong className="font-semibold">wallet</strong> - a
            live, single-use out-of-band action from this service. Your wallet
            trust-resolves it and shows the verdict before anything else
            happens.
          </p>
        </div>
      </div>
    );
  }

  // The wrapper is the IntersectionObserver target, so it exists before the
  // reveal happens.
  return <div ref={rootRef}>{content}</div>;
}
