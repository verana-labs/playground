import type { Integration } from "../lib/integrations";

const TONES = [
  "bg-violet-50 text-violet-700",
  "bg-blue-50 text-blue-700",
  "bg-amber-50 text-amber-700",
  "bg-emerald-50 text-emerald-700",
];

/** Wallet logo (spec §3.3/§3.4 tiles, §4.2/§5.2 headers). Falls back to the
 *  initial while a descriptor carries no logo. */
export default function WalletLogo({
  w,
  size,
  onDark = false,
}: {
  w: Integration;
  size: "tile" | "header";
  onDark?: boolean;
}) {
  const box =
    size === "tile" ? "h-10 w-10 rounded-lg text-base" : "h-14 w-14 rounded-2xl text-xl";

  if (w.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- pre-optimized <5 kB assets; the set includes SVG, which next/image only serves under dangerouslyAllowSVG
      <img
        src={w.logo}
        alt=""
        aria-hidden
        width={size === "tile" ? 40 : 56}
        height={size === "tile" ? 40 : 56}
        className={`${box} shrink-0 bg-white object-contain ring-1 ${
          onDark ? "ring-white/25" : "ring-black/5"
        }`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${box} flex shrink-0 items-center justify-center font-bold ${
        onDark
          ? "bg-white/15 text-white backdrop-blur"
          : TONES[w.name.charCodeAt(0) % TONES.length]
      }`}
    >
      {w.name.charAt(0)}
    </span>
  );
}
