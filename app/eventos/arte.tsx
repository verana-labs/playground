// Country art for the three stops of the tour (the mockup's line-art
// skylines): Costa Rica's volcano and palms, Guatemala's Tikal temple,
// Panamá's skyline. Pure SVG in currentColor over whatever gradient the
// caller paints, so one scene works on a hero, an event card and a boleto.

import type { Evento } from "../lib/eventos";

export type Arte = Evento["arte"];

function Volcan() {
  return (
    <g>
      <circle cx="470" cy="92" r="34" fill="currentColor" opacity="0.9" />
      <path
        d="M40 300 L250 78 L282 108 L306 84 L560 300 Z"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M120 300 L250 160 L300 214 L372 140 L470 300 Z"
        fill="currentColor"
        opacity="0.22"
      />
      <path d="M262 92 L282 108 L306 84" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx="300" cy="58" r="10" fill="currentColor" opacity="0.35" />
      <circle cx="318" cy="38" r="14" fill="currentColor" opacity="0.28" />
      <circle cx="344" cy="18" r="18" fill="currentColor" opacity="0.2" />
      <path d="M96 300 V214" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.85" />
      <path
        d="M96 214 c-40 -34 -80 -30 -100 -2 c40 -10 72 -4 100 2z M96 214 c-8 -50 14 -84 46 -92 c-22 28 -38 58 -46 92z M96 214 c28 -44 70 -56 100 -36 c-42 2 -74 16 -100 36z M96 214 c-32 -40 -44 -80 -22 -108 c-4 36 6 74 22 108z"
        fill="currentColor"
        opacity="0.75"
      />
      <path d="M0 300 H600" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <path d="M170 318 q20 -12 40 0 t40 0 t40 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
    </g>
  );
}

function Templo() {
  return (
    <g>
      <circle cx="120" cy="88" r="34" fill="currentColor" opacity="0.9" />
      <path d="M380 70 q14 -12 28 0 M420 56 q14 -12 28 0" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <rect x="120" y="252" width="360" height="48" fill="currentColor" opacity="0.28" />
      <rect x="160" y="212" width="280" height="40" fill="currentColor" opacity="0.26" />
      <rect x="196" y="176" width="208" height="36" fill="currentColor" opacity="0.24" />
      <rect x="228" y="144" width="144" height="32" fill="currentColor" opacity="0.22" />
      <rect x="256" y="120" width="88" height="24" fill="currentColor" opacity="0.2" />
      <rect x="264" y="76" width="72" height="44" rx="3" fill="currentColor" opacity="0.6" />
      <rect x="276" y="62" width="48" height="14" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="290" y="92" width="20" height="28" rx="2" fill="currentColor" opacity="0.2" />
      <rect x="286" y="120" width="28" height="180" fill="currentColor" opacity="0.35" />
      <path d="M286 144 h28 M286 168 h28 M286 192 h28 M286 216 h28 M286 240 h28 M286 264 h28" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <path d="M0 300 H600" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <path d="M40 300 c20 -40 60 -40 80 0 M480 300 c20 -40 60 -40 80 0" fill="currentColor" opacity="0.2" />
    </g>
  );
}

function Skyline() {
  return (
    <g>
      <circle cx="500" cy="80" r="32" fill="currentColor" opacity="0.9" />
      <rect x="40" y="196" width="46" height="104" fill="currentColor" opacity="0.26" />
      <rect x="96" y="150" width="56" height="150" fill="currentColor" opacity="0.32" />
      <rect x="162" y="184" width="40" height="116" fill="currentColor" opacity="0.24" />
      <path d="M216 300 L236 96 c18 -44 68 -44 86 0 L338 300 Z" fill="currentColor" opacity="0.5" />
      <path d="M246 300 L258 120 c8 -12 26 -12 34 0 L306 300 Z" fill="currentColor" opacity="0.2" />
      <rect x="352" y="140" width="52" height="160" fill="currentColor" opacity="0.32" />
      <rect x="414" y="176" width="40" height="124" fill="currentColor" opacity="0.26" />
      <rect x="464" y="206" width="56" height="94" fill="currentColor" opacity="0.22" />
      <path d="M106 170 h36 M106 190 h36 M106 210 h36 M362 160 h32 M362 180 h32 M362 200 h32 M362 220 h32" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M0 300 H600" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <path d="M20 318 q24 -12 48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0 t48 0" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.45" />
    </g>
  );
}

export function ArteEvento({
  arte,
  className,
}: {
  arte: Arte;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 600 330"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax meet"
    >
      {arte === "volcan" ? <Volcan /> : arte === "templo" ? <Templo /> : <Skyline />}
    </svg>
  );
}
