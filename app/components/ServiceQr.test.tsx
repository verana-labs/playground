import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import QRCode from "qrcode";
import { ServiceQr } from "./ServiceQr";

const ok = (body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(() => Promise.resolve("data:image/png;base64,MOCKQR")) },
}));

afterEach(() => vi.unstubAllGlobals());

// The component is collapsed by default (spec §4: "Show QR" executes the
// demo); every test reveals it first.
function renderRevealed(serviceId: string, label: string) {
  render(<ServiceQr serviceId={serviceId} label={label} />);
  fireEvent.click(screen.getByRole("button", { name: `Show QR code — ${label}` }));
}

describe("ServiceQr", () => {
  it("stays collapsed — no fetch — until the Show QR button is clicked", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(
      <ServiceQr serviceId="demo-issuer-accredited" label="Accredited Issuer (demo)" />,
    );

    expect(
      screen.getByRole("button", { name: /Show QR code — Accredited Issuer \(demo\)/ }),
    ).toBeDefined();
    expect(fetchSpy).not.toHaveBeenCalled();
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
    expect(fetch).toHaveBeenCalledWith("/api/demo/demo-issuer-accredited");
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
});
