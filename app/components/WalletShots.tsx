import type { Integration } from "../lib/integrations";

/** Real captures of this wallet rendering Verana trust — the per-wallet form of
 *  spec §4's "expected wallet rendering", beside the generic verdict wording. */
export default function WalletShots({ w }: { w: Integration }) {
  const shots = w.screenshots ?? [];
  if (!shots.length) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">
        Verana trust, rendered in {w.name}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-gray-500">
        Captured on a device against the testnet resolver.
      </p>
      <ul className="mt-5 grid gap-5 sm:grid-cols-3">
        {shots.map((s) => (
          <li key={s.src} className="flex flex-col gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-optimized WebP captures served from public/ */}
            <img
              src={s.src}
              alt={s.caption ?? `${w.name} rendering Verana trust`}
              loading="lazy"
              className="w-full rounded-xl border border-gray-200 bg-gray-50"
            />
            {s.caption ? (
              <p className="text-xs leading-relaxed text-gray-500">{s.caption}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
