import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { chromium, type Browser, type Page } from "playwright-core";
import { z } from "zod";
import type { Network } from "../network";

const WALLETS_FILE = new URL("../../../personal-wallets.yaml", import.meta.url);
const SIGNUP_TIMEOUT_MS = 60_000;
const SCREEN_TIMEOUT_MS = 90_000;
const POLL_MS = 500;
const STEP_SETTLE_MS = 1_000;
const QUIET_MS = 1_500;
const QUIET_MAX_MS = 20_000;
const CARDS = 'button[id^="slider-select-credentials-"]';
const VERDICTS = ["TRUSTED", "PARTIAL", "UNTRUSTED", "UNVERIFIED"] as const;
const FAILURE_TITLES = /(Failed to add credential|Failed to send credentials|Authorization Process Failed|Send Response Error|Issuance Error)/;

const WalletsSchema = z.looseObject({ wallets: z.array(z.looseObject({ id: z.string(), hosted: z.string().optional() })) });

export type Verdict = (typeof VERDICTS)[number];
export type Control = "enabled" | "disabled" | "absent";

export type Screen = {
  text: string;
  verdict: Verdict | null;
  role: "issuer" | "verifier" | null;
  authorized: boolean | null;
  credential: string | null;
  checking: boolean;
  unchecked: boolean;
  failure: string | null;
  shared: boolean;
  syncAsked: boolean;
};

export type WwWallet = {
  hosted: string;
  open: (link: string) => Promise<Screen>;
  control: () => Promise<Control>;
  accept: () => Promise<Screen | null>;
  share: () => Promise<Screen>;
  cancel: () => Promise<void>;
  screenshot: (name: string) => Promise<string>;
  close: () => Promise<void>;
};

export function hostedWalletUrl(network: Network, text: string = fs.readFileSync(WALLETS_FILE, "utf8")): string {
  const entry = WalletsSchema.parse(yaml.load(text, { schema: yaml.JSON_SCHEMA })).wallets.find((w) => w.id === "wwwallet");
  if (!entry?.hosted) throw new Error("personal-wallets.yaml lists no hosted wwwallet instance");
  return entry.hosted.replaceAll("__NETWORK__", network.castToken).replace(/\/$/, "");
}

export function walletLink(hosted: string, link: string): string {
  const query = link.indexOf("?");
  if (query < 0) throw new Error(`no query string in ${link}`);
  return `${hosted}/?${link.slice(query + 1)}`;
}

export function readScreen(raw: string): Screen {
  const text = raw.replace(/\s+/g, " ").trim();
  const verdict = new RegExp(`\\b(${VERDICTS.join("|")})\\b`).exec(text)?.[1] as Verdict | undefined;
  const accreditation = /\bis (not )?an authorized (issuer|verifier) of (\S+)/.exec(text);
  const failure = FAILURE_TITLES.exec(text);
  return {
    text,
    verdict: verdict ?? null,
    role: (accreditation?.[2] as Screen["role"] | undefined) ?? null,
    authorized: accreditation ? !accreditation[1] : null,
    credential: accreditation?.[3] ?? null,
    checking: /CHECKING…|Checking the Verana public registry/.test(text),
    unchecked: text.includes("could not be checked against the registry"),
    failure: failure ? text.slice(failure.index, failure.index + 200).replace(/ Close$/, "") : null,
    shared: text.includes("Successful credential sharing"),
    syncAsked: text.includes("modified your wallet in another session"),
  };
}

export const settled = (s: Screen): boolean => !s.checking && (s.authorized !== null || s.unchecked || s.failure !== null || s.shared);

export function describeScreen(s: Screen, control: Control): string {
  if (s.failure) return s.failure;
  if (s.shared) return "Successful credential sharing";
  const accreditation = s.authorized === null ? "accreditation not checked" : `${s.authorized ? "authorized" : "not authorized"} ${s.role ?? "party"} of ${s.credential}`;
  return `${s.verdict ?? "no verdict"}, ${accreditation}, ${s.role === "issuer" ? "Continue" : "Next"} ${control}`;
}

async function dialogText(page: Page): Promise<string | null> {
  const dialogs = page.locator("[role=dialog]");
  for (let i = (await dialogs.count()) - 1; i >= 0; i--) {
    const dialog = dialogs.nth(i);
    if (await dialog.isVisible().catch(() => false)) return dialog.innerText().catch(() => null);
  }
  return null;
}

async function waitForScreen(page: Page, done: (s: Screen | null) => boolean, what: string): Promise<Screen | null> {
  const deadline = Date.now() + SCREEN_TIMEOUT_MS;
  let last: Screen | null = null;
  while (Date.now() < deadline) {
    const text = await dialogText(page);
    last = text === null ? null : readScreen(text);
    if (done(last)) return last;
    await page.waitForTimeout(POLL_MS);
  }
  throw new Error(`wwWallet showed no ${what} within ${SCREEN_TIMEOUT_MS / 1000}s; last dialog: ${last?.text.slice(0, 300) ?? "none"}`);
}

async function clickWhenEnabled(page: Page, selector: string): Promise<void> {
  try {
    await page.locator(`${selector}:enabled`).first().click({ timeout: SCREEN_TIMEOUT_MS });
  } catch (e) {
    const screen = await dialogText(page);
    throw new Error(`wwWallet never enabled ${selector}: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}; dialog: ${screen?.replace(/\s+/g, " ").slice(0, 300) ?? "none"}`);
  }
}

async function signUp(page: Page, hosted: string): Promise<void> {
  await page.goto(hosted, { waitUntil: "domcontentloaded" });
  await page.locator("#signUp-switch-loginsignup").click({ timeout: SIGNUP_TIMEOUT_MS });
  await page.locator('input[name="name"]').fill(`verana-conformance-${Date.now()}`);
  const policies = page.locator("input[type=checkbox][required]");
  if (await policies.isVisible().catch(() => false)) await policies.check();
  await page.locator('button[id$="-submit-loginsignup"]').first().click();
  const dismiss = page.getByRole("button", { name: /^dismiss$/i });
  const retry = page.locator("#continue-prf-loginsignup");
  await dismiss.or(retry).first().waitFor({ timeout: SIGNUP_TIMEOUT_MS });
  if (await retry.isVisible().catch(() => false)) {
    await retry.click();
    await dismiss.waitFor({ timeout: SIGNUP_TIMEOUT_MS });
  }
  await dismiss.click();
}

export async function openWwWallet(hosted: string, shotsDir: string): Promise<WwWallet> {
  fs.mkdirSync(shotsDir, { recursive: true });
  const browser: Browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 420, height: 2200 }, locale: "en-US" });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("WebAuthn.enable");
    await cdp.send("WebAuthn.addVirtualAuthenticator", {
      options: { protocol: "ctap2", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true, hasPrf: true },
    });
    let inflight = 0;
    page.on("request", () => inflight++);
    page.on("requestfinished", () => inflight--);
    page.on("requestfailed", () => inflight--);
    const quiet = async (): Promise<void> => {
      const deadline = Date.now() + QUIET_MAX_MS;
      let since = Date.now();
      while (Date.now() < deadline) {
        if (inflight > 0) since = Date.now();
        else if (Date.now() - since >= QUIET_MS) return;
        await page.waitForTimeout(200);
      }
    };
    await signUp(page, hosted);

    const control = async (): Promise<Control> => {
      const button = page.locator("#consent, #next-select-credentials").first();
      if (!(await button.isVisible().catch(() => false))) return "absent";
      return (await button.isEnabled()) ? "enabled" : "disabled";
    };

    return {
      hosted,
      open: async (link) => {
        await quiet();
        await page.goto(walletLink(hosted, link), { waitUntil: "domcontentloaded" });
        for (let i = 0; i < 3; i++) {
          const screen = (await waitForScreen(page, (s) => s !== null && (settled(s) || s.syncAsked), "consent screen")) as Screen;
          if (!screen.syncAsked) return screen;
          await page.locator("#continue-login-state").click();
          await page.locator("#continue-login-state, #submitting-login-state").first().waitFor({ state: "detached", timeout: SIGNUP_TIMEOUT_MS });
        }
        throw new Error("wwWallet asked three times to sync the wallet with the passkey");
      },
      control,
      accept: async () => {
        await page.locator("#consent").click();
        return waitForScreen(page, (s) => s === null || s.failure !== null, "end of the issuance");
      },
      share: async () => {
        const send = page.locator("#send-select-credentials");
        const next = page.locator("#next-select-credentials");
        await clickWhenEnabled(page, "#next-select-credentials");
        for (let i = 0; i < 6 && !(await send.isVisible()); i++) {
          await send.or(page.locator(CARDS)).first().waitFor({ timeout: SCREEN_TIMEOUT_MS });
          if (await send.isVisible()) break;
          if (await next.isDisabled()) await page.locator(`${CARDS}:enabled`).first().click();
          await clickWhenEnabled(page, "#next-select-credentials");
          await page.waitForTimeout(STEP_SETTLE_MS);
        }
        await clickWhenEnabled(page, "#send-select-credentials");
        return (await waitForScreen(page, (s) => s !== null && (s.shared || s.failure !== null), "result of the presentation")) as Screen;
      },
      cancel: async () => {
        const cancel = page.locator("#cancel-select-credentials").first();
        if (await cancel.isVisible().catch(() => false)) await cancel.click();
      },
      screenshot: async (name) => {
        const file = path.join(shotsDir, `${name}.png`);
        await page.screenshot({ path: file });
        return file;
      },
      close: () => browser.close(),
    };
  } catch (e) {
    await browser.close();
    throw new Error(`wwWallet sign-up with a virtual passkey failed: ${e instanceof Error ? e.message : String(e)}`);
  }
}
