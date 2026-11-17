import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PersonalWallet } from "../lib/wallets";
import { WalletPicker } from "./WalletPicker";

function wallet(id: string): PersonalWallet {
  return {
    id,
    name: `Wallet ${id}`,
    vendor: `Vendor ${id}`,
    status: "recommended",
    formats: ["openid4vc-sdjwt"],
    links: [{ kind: "download", url: `https://example.org/${id}.apk`, trust_screen: true }],
    captures: {},
  };
}

const FIVE = ["a", "b", "c", "d", "e"].map(wallet);

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
  it("shows every wallet, with no expander", () => {
    renderPicker(FIVE);
    expect(cells().map((t) => t.match(/Wallet (\w)/)![1])).toEqual(["a", "b", "c", "d", "e"]);
    expect(screen.queryByRole("button", { name: /Show all|Show fewer/ })).toBeNull();
    expect(screen.getAllByRole("button").every((b) => !b.hasAttribute("aria-expanded"))).toBe(true);
  });

  it("calls a recommended official build recommended, and one that ships through a fork integrated", () => {
    renderPicker([wallet("h"), { ...wallet("f"), fork: "https://github.com/x/f/releases/tag/v1" }]);
    const [builtin, fork] = cells();
    expect(builtin).toContain("Recommended");
    expect(fork).toContain("Integrated");
  });

  it("keeps the badge on the title row of every card", () => {
    renderPicker([wallet("a"), { ...wallet("f"), fork: "https://github.com/x/f/releases/tag/v1" }]);
    expect(screen.getByTitle("Wallet a").parentElement!.textContent).toBe("Wallet aRecommended");
    expect(screen.getByTitle("Wallet f").parentElement!.textContent).toBe("Wallet fIntegrated");
  });

  it("flags the extra store builds that lack the trust screen", () => {
    const withPlainStore: PersonalWallet = {
      ...wallet("s"),
      links: [
        ...wallet("s").links,
        { kind: "playstore", url: "https://play.google.com/store/apps/details?id=s", trust_screen: false },
      ],
    };
    renderPicker([wallet("a"), withPlainStore]);
    const [plain, extra] = cells();
    expect(plain).not.toContain("without trust screen");
    expect(extra).toContain("Stores without trust screen");
  });

  it("selects a wallet from its card", () => {
    const onSelect = renderPicker(FIVE);
    fireEvent.click(screen.getByRole("button", { name: /Wallet c/ }));
    expect(onSelect).toHaveBeenCalledWith("c");
  });
});
