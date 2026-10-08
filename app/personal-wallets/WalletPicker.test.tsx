import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PersonalWallet, WalletStatus } from "../lib/wallets";
import { WalletPicker } from "./WalletPicker";

function wallet(id: string, status: WalletStatus): PersonalWallet {
  return {
    id,
    name: `Wallet ${id}`,
    vendor: `Vendor ${id}`,
    status,
    formats: ["openid4vc-sdjwt"],
    links: [{ kind: "download", url: `https://example.org/${id}.apk`, trust_screen: true }],
    captures: {},
  };
}

const THIRTEEN = [
  ...["a", "b", "c", "d"].map((id) => wallet(id, "recommended")),
  ...["e", "f", "g", "h", "i", "j", "k"].map((id) => wallet(id, "compatible")),
  ...["l", "m"].map((id) => wallet(id, "testing")),
];

function cells() {
  return Array.from(document.getElementById("wallet-picker")!.children).map(
    (cell) => cell.textContent ?? "",
  );
}

function renderPicker(wallets: PersonalWallet[], selectedId = wallets[0]!.id) {
  const onSelect = vi.fn();
  render(<WalletPicker wallets={wallets} comingSoon={[]} selectedId={selectedId} onSelect={onSelect} />);
  return onSelect;
}

describe("WalletPicker", () => {
  it("shows the first five wallets and the expander as the sixth card", () => {
    renderPicker(THIRTEEN);
    const shown = cells();
    expect(shown).toHaveLength(6);
    expect(shown.slice(0, 5).map((t) => t.match(/Wallet (\w)/)![1])).toEqual(["a", "b", "c", "d", "e"]);
    expect(shown[5]).toContain("Show all 13 wallets");
    expect(shown[5]).toContain("8 more: compatible and testing");
    const expander = screen.getByRole("button", { name: /Show all 13 wallets/ });
    expect(expander.getAttribute("aria-expanded")).toBe("false");
  });

  it("expands to every wallet and turns the last card into show fewer", () => {
    renderPicker(THIRTEEN);
    fireEvent.click(screen.getByRole("button", { name: /Show all 13 wallets/ }));
    const shown = cells();
    expect(shown).toHaveLength(14);
    expect(shown[13]).toContain("Show fewer");
    expect(screen.getByRole("button", { name: /Show fewer/ }).getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Show fewer/ }));
    expect(cells()).toHaveLength(6);
  });

  it("shows six wallets or fewer without an expander", () => {
    renderPicker(THIRTEEN.slice(0, 6));
    expect(cells()).toHaveLength(6);
    expect(screen.queryByRole("button", { name: /Show all/ })).toBeNull();
  });

  it("starts expanded when the selected wallet is past the first five", () => {
    renderPicker(THIRTEEN, "l");
    expect(cells()).toHaveLength(14);
    expect(screen.getByRole("button", { name: /Wallet l/ }).getAttribute("aria-pressed")).toBe("true");
  });

  it("selects a wallet from its card", () => {
    const onSelect = renderPicker(THIRTEEN);
    fireEvent.click(screen.getByRole("button", { name: /Wallet c/ }));
    expect(onSelect).toHaveBeenCalledWith("c");
  });
});
