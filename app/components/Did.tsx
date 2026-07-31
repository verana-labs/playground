"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { didHost, shortDid } from "../lib/did";

// The uniform DID display: shortened SCID (QmVd...8r7S), a copy button for
// the full DID, and an external link to the vs-agent's root site when the
// DID resolves to a web host. Sized by the caller via className.

export function DidBadge({
  did,
  className = "",
}: {
  did: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const host = didHost(did);

  const copy = () => {
    navigator.clipboard
      .writeText(did)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <span className={`inline-flex min-w-0 items-center gap-1 ${className}`}>
      <code className="min-w-0 truncate font-mono" title={did}>
        {shortDid(did)}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Copy the full DID"
        title="Copy the full DID"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600" aria-hidden />
        ) : (
          <Copy className="h-3 w-3" aria-hidden />
        )}
      </button>
      {host ? (
        <a
          href={`https://${host}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label={`Open https://${host}`}
          title={`Open https://${host}`}
        >
          <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      ) : null}
    </span>
  );
}
