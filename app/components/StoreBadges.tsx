import { withBase } from "../lib/base-path";
import {
  isStoreLink,
  type Lang,
  type StoreLink,
  type WalletLink,
} from "../lib/wallet-links";

type Badge = { src: string; alt: string; className: string };

// The en Google Play PNG carries its own clear space; the es one and the Apple SVGs do not.
const BADGES: Record<Lang, Record<StoreLink["kind"], Badge>> = {
  en: {
    playstore: {
      src: "/images/store-badges/google-play-en.png",
      alt: "Get it on Google Play",
      className: "h-[60px]",
    },
    appstore: {
      src: "/images/store-badges/app-store-en-us.svg",
      alt: "Download on the App Store",
      className: "m-2.5 h-10",
    },
  },
  es: {
    playstore: {
      src: "/images/store-badges/google-play-es-419.png",
      alt: "Descargar en Google Play",
      className: "mx-2.5 my-1 h-[52px]",
    },
    appstore: {
      src: "/images/store-badges/app-store-es-mx.svg",
      alt: "Descárgalo en el App Store",
      className: "m-2.5 h-10",
    },
  },
};

export function StoreBadges({
  links,
  lang = "en",
}: {
  links: WalletLink[];
  lang?: Lang;
}) {
  const stores = links.filter(isStoreLink);
  if (!stores.length) return null;
  return (
    <span className="-mx-2.5 flex flex-wrap items-center">
      {stores.map((l) => {
        const badge = BADGES[lang][l.kind];
        return (
          <a
            key={l.kind}
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- official artwork, served as published */}
            <img
              src={withBase(badge.src)}
              alt={badge.alt}
              className={`block w-auto max-w-none ${badge.className}`}
            />
          </a>
        );
      })}
    </span>
  );
}
