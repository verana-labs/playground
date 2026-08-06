"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export type LightboxMedia = {
  kind: "image" | "video";
  src: string;
  caption?: string;
  alt?: string;
};

/** Full-viewport overlay showing a capture or clip at its readable size.
 *  Closes on backdrop click, the close button, or Escape. */
export default function MediaLightbox({
  media,
  onClose,
}: {
  media: LightboxMedia;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={media.caption ?? media.alt ?? "Media preview"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/25"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
      <figure
        className="flex max-h-full max-w-full flex-col items-center gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        {media.kind === "video" ? (
          <video
            key={media.src}
            controls
            autoPlay
            playsInline
            className="max-h-[85vh] max-w-full rounded-xl bg-black"
          >
            <source src={media.src} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- pre-optimized captures from wallets/
          <img
            src={media.src}
            alt={media.alt ?? media.caption ?? "Capture"}
            className="max-h-[85vh] max-w-full rounded-xl bg-white object-contain"
          />
        )}
        {media.caption ? (
          <figcaption className="max-w-prose text-center text-sm text-white/80">
            {media.caption}
          </figcaption>
        ) : null}
      </figure>
    </div>
  );
}
