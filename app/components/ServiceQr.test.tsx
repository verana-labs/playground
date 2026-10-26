import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QRCode from "qrcode";
import { hologramInvitationLink, ServiceQr } from "./ServiceQr";

const ok = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(() => Promise.resolve("data:image/png;base64,MOCKQR")) },
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// jsdom has no IntersectionObserver, so the component auto-reveals at
// mount (the browser reveals on scroll-into-view).
function renderRevealed(serviceId: string, label: string) {
  render(<ServiceQr serviceId={serviceId} label={label} />);
}

describe("ServiceQr", () => {
  it("reveals automatically and mints the live action", async () => {
    vi.stubGlobal("fetch", vi.fn(() => ok({ kind: "invitation", url: null })));

    render(
      <ServiceQr serviceId="demo-issuer-accredited" label="Accredited Issuer (demo)" />,
    );

    expect(
      await screen.findByText("Live service link unavailable right now."),
    ).toBeDefined();
    expect(fetch).toHaveBeenCalledWith(
      "/api/demo/demo-issuer-accredited?format=anoncreds",
    );
  });

  it("renders the QR image and the live link when the service has an appUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        ok({
          kind: "credential-offer",
          url: "https://demo-issuer-accredited.playground.testnet.verana.network/s?id=abcd1234",
        }),
      ),
    );

    renderRevealed("demo-issuer-accredited", "Accredited Issuer (demo)");

    const img = await screen.findByAltText("Accredited Issuer (demo) QR");
    expect(img.getAttribute("src")).toBe("data:image/png;base64,MOCKQR");

    const link = screen.getByRole("link", {
      name: "https://demo-issuer-accredited.playground.testnet.verana.network/s?id=abcd1234",
    });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText("wallet")).toBeDefined();
    expect(fetch).toHaveBeenCalledWith("/api/demo/demo-issuer-accredited?format=anoncreds");
  });

  it("swaps the QR for the presented credential when the verifier flow completes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/proof/")) {
          return ok({
            state: "done",
            verified: true,
            claims: [
              { name: "name", value: "Playground Visitor" },
              { name: "demoId", value: "demo-12345678" },
            ],
          });
        }
        return ok({
          kind: "presentation-request",
          url: "https://demo-verifier-accredited.playground.testnet.verana.network/s?id=wxyz7890",
          proofExchangeId: "proof-1",
        });
      }),
    );

    renderRevealed("demo-verifier-accredited", "Accredited Verifier (demo)");

    expect(await screen.findByText("DemoCredential presented")).toBeDefined();
    expect(screen.getByText("demo-12345678")).toBeDefined();
    expect(screen.getByText(/Cryptographically verified/)).toBeDefined();
    expect(fetch).toHaveBeenCalledWith(
      "/api/demo/demo-verifier-accredited/proof/proof-1?rail=didcomm",
    );
    expect(screen.queryByAltText("Accredited Verifier (demo) QR")).toBeNull();
  });

  it("renders the unavailable card with retry when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network down"))));

    renderRevealed("demo-issuer-accredited", "Accredited Issuer (demo)");

    expect(
      await screen.findByText("Live service link unavailable right now."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
  });

  it("renders the unavailable card when no live action link is available", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        ok({ kind: "invitation", url: null }),
      ),
    );

    renderRevealed("playground-demo", "Playground Demo");

    expect(
      await screen.findByText("Live service link unavailable right now."),
    ).toBeDefined();
  });

  it("reaches the unavailable card, not a stuck pulse, when QR generation itself fails", async () => {
    vi.mocked(QRCode.toDataURL).mockRejectedValueOnce(new Error("qr generation failed"));
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        ok({
          kind: "credential-offer",
          url: "https://demo-issuer-accredited.playground.testnet.verana.network/s?id=abcd1234",
        }),
      ),
    );

    renderRevealed("demo-issuer-accredited", "Accredited Issuer (demo)");

    expect(
      await screen.findByText("Live service link unavailable right now."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
    expect(screen.queryByText("Resolving the live service link…")).toBeNull();
  });

  it("opens an OpenID4VC action in the hosted wallet when one is given", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        ok({
          kind: "oid4vc-credential-offer",
          url: "openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fdemo-issuer-accredited.playground.testnet.verana.network%2Foid4vci%2Foffers%2Fabcd1234",
        }),
      ),
    );

    render(
      <ServiceQr
        serviceId="demo-issuer-accredited"
        label="Accredited Issuer (demo)"
        format="openid4vc-sdjwt"
        openInWallet={{
          name: "wwWallet",
          url: "https://wwwallet.playground.testnet.verana.network/",
        }}
      />,
    );

    const link = await screen.findByRole("link", { name: "Open in wwWallet" });
    expect(link.getAttribute("href")).toBe(
      "https://wwwallet.playground.testnet.verana.network/?credential_offer_uri=https%3A%2F%2Fdemo-issuer-accredited.playground.testnet.verana.network%2Foid4vci%2Foffers%2Fabcd1234",
    );
    // A named per-host tab, so repeat clicks reuse the wallet's logged-in
    // session (sessionStorage is per tab); no noopener/noreferrer - both
    // would sever the named-target reuse.
    expect(link.getAttribute("target")).toBe(
      "wallet:wwwallet.playground.testnet.verana.network",
    );
    expect(link.getAttribute("rel")).toBeNull();
  });

  it("opens a DIDComm invitation in Hologram by package on Android, with a Play Store fallback", async () => {
    const appUrl = "https://demo-issuer-accredited.playground.testnet.verana.network/s?id=b7a0c2e1";
    vi.stubGlobal("fetch", vi.fn(() => ok({ kind: "invitation", url: appUrl })));
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14; LLY-NX1) Chrome/156.0");

    render(
      <ServiceQr serviceId="demo-issuer-accredited" label="Accredited Issuer (demo)" walletId="hologram" />,
    );

    const href = (await screen.findByRole("link", { name: /Open in Hologram/ })).getAttribute("href") ?? "";
    const encoded = /_url=([^#]+)/.exec(href)?.[1] ?? "";
    expect(href.startsWith("intent://invite?_url=")).toBe(true);
    expect(href).toContain("#Intent;scheme=hologram-zone;package=io.twentysixty.mobileagent.m;");
    expect(href).toContain(`S.browser_fallback_url=${encodeURIComponent("https://play.google.com/store/apps/details?id=io.twentysixty.mobileagent.m")}`);
    expect(encoded).not.toMatch(/[+/=]/);
    expect(Buffer.from(encoded, "base64url").toString()).toBe(appUrl);
  });

  it("uses the hologram-zone scheme on iOS and offers nothing on desktop", () => {
    const appUrl = "https://x.example/s?id=1";
    expect(hologramInvitationLink(appUrl, "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe(
      `hologram-zone://invite?_url=${Buffer.from(appUrl).toString("base64url")}`,
    );
    expect(hologramInvitationLink(appUrl, "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_0) Chrome/156.0")).toBeNull();
  });

  it("shows no Hologram button on a desktop browser", async () => {
    vi.stubGlobal("fetch", vi.fn(() => ok({ kind: "invitation", url: "https://x.example/s?id=1" })));
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/156.0");

    render(<ServiceQr serviceId="demo-issuer-accredited" label="A" walletId="hologram" />);

    expect(await screen.findByRole("img")).toBeDefined();
    expect(screen.queryByRole("link", { name: /Open in Hologram/ })).toBeNull();
  });

  it("offers no Hologram link to other wallets or on the OpenID4VC rail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) =>
        String(input).includes("openid4vc")
          ? ok({ kind: "oid4vc-credential-offer", url: "openid-credential-offer://?credential_offer_uri=x" })
          : ok({ kind: "invitation", url: "https://demo-issuer-accredited.playground.testnet.verana.network/s?id=1" }),
      ),
    );

    vi.spyOn(navigator, "userAgent", "get").mockReturnValue("Mozilla/5.0 (Linux; Android 14; LLY-NX1) Chrome/156.0");

    render(<ServiceQr serviceId="demo-issuer-accredited" label="A" walletId="bcwallet" />);
    render(<ServiceQr serviceId="demo-issuer-accredited" label="B" format="openid4vc-sdjwt" walletId="hologram" />);

    expect(await screen.findAllByRole("img")).toHaveLength(2);
    expect(screen.queryByRole("link", { name: /Open in Hologram/ })).toBeNull();
  });

  it("does not call a completed exchange a delivery when the wallet was meant to refuse", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/credential/")) return ok({ state: "Completed", done: true });
        return ok({
          kind: "oid4vc-credential-offer",
          url: "openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fdemo-issuer-unaccredited.playground.testnet.verana.network%2Foid4vci%2Foffers%2Fabcd1234",
          issuanceSessionId: "session-1",
        });
      }),
    );

    render(
      <ServiceQr
        serviceId="demo-issuer-unaccredited"
        label="Unaccredited Issuer (demo)"
        format="openid4vc-sdjwt"
        expect="refuse"
      />,
    );

    expect(
      await screen.findByText("The issuer completed the exchange"),
    ).toBeDefined();
    expect(screen.queryByText("Credential delivered")).toBeNull();
    expect(screen.getByText(/not enforcing the check/)).toBeDefined();
  });

  it("flags a presentation the wallet should have refused", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/proof/")) {
          return ok({
            state: "done",
            verified: true,
            claims: [{ name: "demoId", value: "demo-12345678" }],
          });
        }
        return ok({
          kind: "presentation-request",
          url: "https://demo-verifier-unaccredited.playground.testnet.verana.network/s?id=wxyz7890",
          proofExchangeId: "proof-1",
        });
      }),
    );

    render(
      <ServiceQr
        serviceId="demo-verifier-unaccredited"
        label="Unaccredited Verifier (demo)"
        expect="refuse"
      />,
    );

    expect(await screen.findByText("Your wallet shared it anyway")).toBeDefined();
    expect(screen.queryByText("DemoCredential presented")).toBeNull();
    expect(screen.getByText("demo-12345678")).toBeDefined();
  });

  it("does not offer to open the action in a wallet when none is hosted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        ok({
          kind: "oid4vc-credential-offer",
          url: "openid-credential-offer://?credential_offer_uri=https%3A%2F%2Fdemo-issuer-accredited.playground.testnet.verana.network%2Foid4vci%2Foffers%2Fabcd1234",
        }),
      ),
    );

    renderRevealed("demo-issuer-accredited", "Accredited Issuer (demo)");

    expect(await screen.findByAltText("Accredited Issuer (demo) QR")).toBeDefined();
    expect(screen.queryByRole("link", { name: /^open in /i })).toBeNull();
  });
});
