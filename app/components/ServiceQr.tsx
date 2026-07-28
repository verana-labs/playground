"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";

type PotApiResponse = {
  service?: { appUrl?: string } | null;
};

function UnavailableCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4">
      <p className="text-xs text-gray-400">Live service link unavailable right now.</p>
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

export function ServiceQr({ serviceId, label }: { serviceId: string; label: string }) {
  const [appUrl, setAppUrl] = useState<string | null | undefined>(undefined);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setAppUrl(undefined);
    setQrDataUrl(null);
    fetch(`/api/pot/${serviceId}`)
      .then((res) => (res.ok ? (res.json() as Promise<PotApiResponse>) : null))
      .then((body) => {
        if (alive) setAppUrl(body?.service?.appUrl ?? null);
      })
      .catch(() => {
        if (alive) setAppUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [serviceId, attempt]);

  useEffect(() => {
    if (!appUrl) return;
    let alive = true;
    QRCode.toDataURL(appUrl, { width: 160, margin: 1 })
      .then((url) => {
        if (alive) setQrDataUrl(url);
      })
      .catch(() => {
        if (alive) setQrDataUrl(null);
      });
    return () => {
      alive = false;
    };
  }, [appUrl]);

  if (appUrl === undefined) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-400">
        Resolving the live service link…
      </div>
    );
  }

  if (!appUrl) {
    return <UnavailableCard onRetry={retry} />;
  }

  if (!qrDataUrl) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-400">
        Resolving the live service link…
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
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
        <p className="text-center text-xs text-gray-500">
          Scan or open the live demo service.
        </p>
      </div>
    </div>
  );
}
