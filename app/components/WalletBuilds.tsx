import { Download, ExternalLink, Github } from "lucide-react";
import { walletTabTarget } from "../lib/wallet-tab";
import {
  buildsHint,
  isStoreLink,
  type Lang,
  type WalletLink,
} from "../lib/wallet-links";
import type { PersonalWallet } from "../lib/wallets";
import { StoreBadges } from "./StoreBadges";

const PRIMARY =
  "inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700";
const SECONDARY =
  "inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200";

export function BuildsHint({
  links,
  lang = "en",
  className = "text-[11px]",
}: {
  links: WalletLink[];
  lang?: Lang;
  className?: string;
}) {
  const hint = buildsHint(links, lang);
  return (
    <span
      className={`block truncate ${className} ${hint.trusted ? "text-gray-400" : "text-amber-700"}`}
    >
      {hint.text}
    </span>
  );
}

export function NoTrustScreenNote({ name }: { name: string }) {
  return (
    <p className="text-sm leading-relaxed text-gray-600">
      {name} has{" "}
      <strong className="font-semibold text-gray-900">
        no Verana trust screen
      </strong>
      : its store builds complete the demos as published, but they don&apos;t
      check the registry, so they won&apos;t refuse the unaccredited or
      untrusted services.
    </p>
  );
}

function LinkButton({
  wallet,
  link,
}: {
  wallet: PersonalWallet;
  link: WalletLink;
}) {
  if (link.kind === "hosted")
    return (
      <a href={link.url} target={walletTabTarget(link.url)} className={PRIMARY}>
        <ExternalLink className="h-4 w-4" /> Open the wallet
      </a>
    );
  if (link.kind === "web")
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={SECONDARY}
      >
        Open the web wallet
      </a>
    );
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={link.trust_screen ? PRIMARY : SECONDARY}
    >
      <Download className="h-4 w-4" />{" "}
      {wallet.browser
        ? "Run it from source"
        : wallet.verana_builtin
          ? "Get the wallet"
          : link.trust_screen
            ? "Download the modified APK"
            : "Download the APK"}
    </a>
  );
}

function SourceButton({ wallet }: { wallet: PersonalWallet }) {
  const href = wallet.fork ?? wallet.repo;
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={
        wallet.fork ? "The modified source behind this build" : "Upstream source"
      }
      className={SECONDARY}
    >
      <Github className="h-4 w-4" />
      {wallet.fork ? "Source" : "Upstream"}
    </a>
  );
}

function Actions({
  wallet,
  links,
  source,
}: {
  wallet: PersonalWallet;
  links: WalletLink[];
  source: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {links
        .filter((l) => !isStoreLink(l))
        .map((l) => (
          <LinkButton key={l.kind} wallet={wallet} link={l} />
        ))}
      <StoreBadges links={links} />
      {source ? <SourceButton wallet={wallet} /> : null}
    </div>
  );
}

export function WalletBuildActions({
  wallet,
  source = false,
}: {
  wallet: PersonalWallet;
  source?: boolean;
}) {
  const verana = wallet.links.filter((l) => l.trust_screen);
  const plain = wallet.links.filter((l) => !l.trust_screen);
  return (
    <>
      {verana.length ? (
        <div className="mt-4">
          <Actions wallet={wallet} links={verana} source={source} />
        </div>
      ) : null}
      {plain.length ? (
        <div
          className={
            verana.length ? "mt-5 border-t border-gray-100 pt-4" : "mt-4"
          }
        >
          {verana.length ? (
            <p className="mb-2 text-sm text-gray-600">
              Also works with the store build{plain.length > 1 ? "s" : ""}{" "}
              <span className="text-gray-500">(no Verana trust screen)</span>
            </p>
          ) : null}
          <Actions
            wallet={wallet}
            links={plain}
            source={source && !verana.length}
          />
        </div>
      ) : null}
    </>
  );
}
