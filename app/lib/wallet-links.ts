export type WalletLinkKind =
  | "hosted"
  | "download"
  | "playstore"
  | "appstore"
  | "web";

export type WalletLink = {
  kind: WalletLinkKind;
  url: string;
  trust_screen: boolean;
};

type LinkField = string | { url: string; trust_screen?: boolean } | undefined;

export type WalletLinkFields = {
  browser?: boolean;
  hosted?: string;
  download?: LinkField;
  playstore?: LinkField;
  appstore?: LinkField;
  web?: LinkField;
};

export function walletLinks(w: WalletLinkFields): WalletLink[] {
  const fields: [WalletLinkKind, LinkField][] = [
    ["hosted", w.hosted],
    ["download", w.browser && w.hosted ? undefined : w.download],
    ["playstore", w.playstore],
    ["appstore", w.appstore],
    ["web", w.web],
  ];
  const links: WalletLink[] = fields.flatMap(([kind, field]) =>
    !field
      ? []
      : typeof field === "string"
        ? [{ kind, url: field, trust_screen: true }]
        : [{ kind, url: field.url, trust_screen: field.trust_screen ?? true }],
  );
  return links.filter(
    (l) =>
      l.kind !== "download" ||
      !links.some((o) => o.kind !== "download" && o.url === l.url),
  );
}

export type StoreLink = WalletLink & { kind: "playstore" | "appstore" };

export const isStoreLink = (l: WalletLink): l is StoreLink =>
  l.kind === "playstore" || l.kind === "appstore";

export type Lang = "en" | "es";

const HINT: Record<
  Lang,
  Record<WalletLinkKind, string> & { plainOnly: string; plainToo: string }
> = {
  en: {
    hosted: "Web wallet",
    download: "Verana APK",
    playstore: "Stores",
    appstore: "Stores",
    web: "Web wallet",
    plainOnly: "Stores, no Verana trust screen",
    plainToo: "stores without trust screen",
  },
  es: {
    hosted: "Wallet web",
    download: "APK de Verana",
    playstore: "Tiendas",
    appstore: "Tiendas",
    web: "Wallet web",
    plainOnly: "Tiendas, sin pantalla de confianza Verana",
    plainToo: "tiendas sin pantalla de confianza",
  },
};

export function buildsHint(
  links: WalletLink[],
  lang: Lang = "en",
): { text: string; trusted: boolean } {
  const t = HINT[lang];
  const verana = [
    ...new Set(links.filter((l) => l.trust_screen).map((l) => t[l.kind])),
  ];
  const plain = links.some((l) => !l.trust_screen);
  if (!verana.length) return { text: t.plainOnly, trusted: false };
  return {
    text: plain ? [...verana, t.plainToo].join(" + ") : verana.join(" + "),
    trusted: true,
  };
}
