// Browser wallets (wwWallet and wallets built on it) keep their login token
// and unlocked key material in sessionStorage, scoped to ONE tab, and log
// out every other tab when a new one logs in. Opening each wallet action
// with target="_blank" therefore forces a fresh login every click. Funnel
// every action into one NAMED tab per wallet host instead: the first click
// logs in once, and every later click navigates the same still-logged-in
// tab. These links must NOT carry rel="noopener" or "noreferrer" - both
// sever the opener relationship that named-target reuse depends on - which
// is acceptable only because the wallet is our own first-party deployment.
export const walletTabTarget = (url: string): string => {
  try {
    return `wallet:${new URL(url).host}`;
  } catch {
    return "_blank";
  }
};
