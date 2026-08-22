import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QRCode from "qrcode";
import { ServiceQr } from "./ServiceQr";

const ok = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(() => Promise.resolve("data:image/png;base64,MOCKQR")) },
}));

afterEach(() => vi.unstubAllGlobals());

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
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
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
