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

describe("ServiceQr", () => {
  it("renders the QR image and the live link when the service has an appUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        ok({
          service: {
            id: "issuer-web-vs",
            label: "Example Issuer Web App (demo)",
            appUrl: "https://app.issuer-web-vs.demos.testnet.verana.network",
          },
          did: "did:webvh:Qm:svc.example",
          pot: null,
        }),
      ),
    );

    render(<ServiceQr serviceId="issuer-web-vs" label="Vesta badge issuer (demo)" />);

    const img = await screen.findByAltText("Vesta badge issuer (demo) QR");
    expect(img.getAttribute("src")).toBe("data:image/png;base64,MOCKQR");

    const link = screen.getByRole("link", {
      name: "https://app.issuer-web-vs.demos.testnet.verana.network",
    });
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText("Scan or open the live demo service.")).toBeDefined();
    expect(fetch).toHaveBeenCalledWith("/api/pot/issuer-web-vs");
  });

  it("renders the unavailable card with retry when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("network down"))));

    render(<ServiceQr serviceId="issuer-web-vs" label="Vesta badge issuer (demo)" />);

    expect(
      await screen.findByText("Live service link unavailable right now."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
  });

  it("renders the unavailable card when the service has no appUrl", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        ok({
          service: { id: "issuer-chatbot-vs", label: "Example Issuer Chatbot (demo)" },
          did: "did:webvh:Qm:svc.example",
          pot: null,
        }),
      ),
    );

    render(<ServiceQr serviceId="issuer-chatbot-vs" label="Vesta badge issuer (demo)" />);

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
          service: {
            id: "issuer-web-vs",
            label: "Example Issuer Web App (demo)",
            appUrl: "https://app.issuer-web-vs.demos.testnet.verana.network",
          },
          did: "did:webvh:Qm:svc.example",
          pot: null,
        }),
      ),
    );

    render(<ServiceQr serviceId="issuer-web-vs" label="Vesta badge issuer (demo)" />);

    expect(
      await screen.findByText("Live service link unavailable right now."),
    ).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
    expect(screen.queryByText("Resolving the live service link…")).toBeNull();
  });
});
