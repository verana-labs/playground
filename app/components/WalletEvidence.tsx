import type { Integration } from "../lib/integrations";

/** The recording and the device captures of this wallet rendering Verana trust
 *  — the per-wallet form of spec §4's "expected wallet rendering", and the
 *  screen recording the listing requirements ask for. */
export default function WalletEvidence({ w }: { w: Integration }) {
  const shots = w.screenshots ?? [];
  const isFile = w.demo_video?.startsWith("/");
  if (!shots.length && !w.demo_video) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">
        Verana trust, rendered in {w.name}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-gray-500">
        Captured on a device against the testnet resolver.
      </p>

      {w.demo_video ? (
        <div className="mt-5">
          {isFile ? (
            <video
              controls
              playsInline
              preload="metadata"
              poster={shots[0]?.src}
              className="mx-auto w-full max-w-[280px] rounded-xl border border-gray-200 bg-black"
            >
              <source src={w.demo_video} type="video/mp4" />
            </video>
          ) : (
            <a
              href={w.demo_video}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-violet-600 hover:underline"
            >
              Watch the demo recording →
            </a>
          )}
          {w.demo_video_note ? (
            <p className="mt-2 text-center text-xs text-gray-500">
              {w.demo_video_note}
            </p>
          ) : null}
        </div>
      ) : null}

      {shots.length ? (
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
      ) : null}
    </div>
  );
}
