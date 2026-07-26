import Link from "next/link";
import type { Integration } from "../lib/integrations";
import { Chip } from "./ui";

/** Uniform wallet tile (spec §3.3 / §3.4): logo · name · organization ·
 *  track chip · license chip · Get it · Open its playground. */
export default function WalletTile({ w }: { w: Integration }) {
  const playgroundHref =
    w.kind === "user-wallet" ? `/user-wallets/${w.slug}` : `/cloud-wallets/${w.slug}`;
  return (
    <div className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-rule bg-surface-2 font-mono text-sm text-muted"
        >
          {w.name.charAt(0)}
        </span>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink">{w.name}</h3>
          <p className="truncate text-sm text-muted">{w.organization}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Chip>{w.track}</Chip>
        {w.license ? <Chip>{w.license}</Chip> : null}
        {w.badge_loop === "live" ? (
          <Chip tone="verified">badge loop ✓</Chip>
        ) : (
          <Chip tone="pending">badge loop coming</Chip>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
        {w.download ? (
          <a
            href={w.download}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost px-3 py-1.5 text-sm"
          >
            Get it
          </a>
        ) : null}
        <Link href={playgroundHref} className="btn btn-primary px-3 py-1.5 text-sm">
          Open its playground
        </Link>
      </div>
    </div>
  );
}

/** Closing card of each wallet list: Add your wallet → /integrate. */
export function AddYourWalletTile() {
  return (
    <Link
      href="/integrate"
      className="card group flex flex-col items-start justify-center gap-2 border-dashed p-5 transition-colors hover:border-primary"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-rule bg-surface-2 font-mono text-lg text-muted">
        +
      </span>
      <h3 className="font-semibold text-ink">Add your wallet</h3>
      <p className="text-sm text-muted">
        Open source? Integrate Verana and get your own playground page.
      </p>
      <span className="text-sm text-accent group-hover:underline">
        How to integrate →
      </span>
    </Link>
  );
}
