"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Temporary banner: remove after GDC26 (September 3, 2026).
const GDC_URL = "https://globaldigitalcollaboration.org/";
const DISMISS_KEY = "vp-gdc26-dismissed";

export default function GdcBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="border-b border-[#efeef6] bg-white text-sm">
      {/* GDC brand barcode strip, tiled at half its native 20px height. */}
      <div
        aria-hidden
        className="h-2.5 w-full"
        style={{
          backgroundImage: "url(/images/gdc-barcode.png)",
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
        }}
      />
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-3 px-4 py-2 text-gray-600 sm:px-6">
        <span className="text-center">
          Meet Verana at the Global Digital Collaboration conference (GDC26),
          September 1-3, 2026, Palexpo Geneva.{" "}
          <a
            href={GDC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-violet-600 hover:underline"
          >
            Learn more
          </a>
        </span>
        <button
          type="button"
          aria-label="Dismiss GDC26 announcement"
          onClick={() => {
            setDismissed(true);
            try {
              localStorage.setItem(DISMISS_KEY, "1");
            } catch {
              /* ignore */
            }
          }}
          className="ml-auto shrink-0 text-gray-400 hover:text-gray-900"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
