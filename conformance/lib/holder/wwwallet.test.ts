import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Network } from "../network";
import { describeScreen, hostedWalletUrl, readScreen, settled, walletLink } from "./wwwallet";

const fixture = (name: string): string => readFileSync(new URL(`../fixtures/wwwallet/${name}`, import.meta.url), "utf8");
const devnet = { castToken: "devnet" } as Network;

describe("readScreen", () => {
  it("reads a trusted and authorized issuer off the issuance consent", () => {
    const screen = readScreen(fixture("offer-authorized.txt"));
    expect(screen).toMatchObject({ verdict: "TRUSTED", role: "issuer", authorized: true, credential: "VerandiaCitizenIDCredential", failure: null, shared: false });
    expect(settled(screen)).toBe(true);
    expect(describeScreen(screen, "enabled")).toBe("TRUSTED, authorized issuer of VerandiaCitizenIDCredential, Continue enabled");
  });

  it("tells an authorized verifier from an unauthorized one", () => {
    expect(readScreen(fixture("request-authorized.txt"))).toMatchObject({ verdict: "TRUSTED", role: "verifier", authorized: true, credential: "CEXAKycCredential" });
    const refused = readScreen(fixture("request-not-authorized.txt"));
    expect(refused).toMatchObject({ verdict: "TRUSTED", role: "verifier", authorized: false, credential: "VerandiaCitizenIDCredential" });
    expect(describeScreen(refused, "disabled")).toBe("TRUSTED, not authorized verifier of VerandiaCitizenIDCredential, Next disabled");
  });

  it("does not read UNTRUSTED as TRUSTED", () => {
    expect(readScreen(fixture("offer-untrusted.txt"))).toMatchObject({ verdict: "UNTRUSTED", authorized: false, credential: "DemoCredential" });
  });

  it("is not settled while the registry check runs", () => {
    const screen = readScreen("wwWallet Credential Issuance CHECKING… OFFERS YOU DemoCredential Checking the Verana public registry… Cancel Continue");
    expect(screen.checking).toBe(true);
    expect(settled(screen)).toBe(false);
  });

  it("reads the failure and success popups", () => {
    const failed = readScreen(fixture("insufficient-credentials.txt"));
    expect(failed.failure).toMatch(/^Failed to send credentials Insufficient Credentials\./);
    expect(settled(failed)).toBe(true);
    expect(readScreen(fixture("shared.txt"))).toMatchObject({ shared: true, failure: null });
  });
});

describe("hostedWalletUrl", () => {
  it("fills the network into the hosted instance of personal-wallets.yaml", () => {
    expect(hostedWalletUrl(devnet)).toBe("https://wwwallet.playground.devnet.verana.network");
  });

  it("fails when no hosted wwwallet is listed", () => {
    expect(() => hostedWalletUrl(devnet, "wallets:\n  - id: wwwallet\n")).toThrow(/no hosted wwwallet/);
  });
});

describe("walletLink", () => {
  it("hands the offer or request query string to the hosted wallet", () => {
    expect(walletLink("https://w.example", "openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fi.example%2Fo%2F1")).toBe(
      "https://w.example/?credential_offer_uri=https%3A%2F%2Fi.example%2Fo%2F1",
    );
    expect(() => walletLink("https://w.example", "https://i.example/s")).toThrow(/no query string/);
  });
});
