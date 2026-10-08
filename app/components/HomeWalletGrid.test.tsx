import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PersonalWallet, WalletStatus } from "../lib/wallets";
import { HomeWalletGrid } from "./HomeWalletGrid";

function wallet(
  id: string,
  status: WalletStatus,
  fork?: string,
): PersonalWallet {
  return {
    id,
    name: `Wallet ${id}`,
    vendor: `Vendor ${id}`,
    status,
    formats: ["openid4vc-sdjwt"],
    links: [
      {
        kind: "download",
        url: `https://example.org/${id}.apk`,
        trust_screen: true,
      },
    ],
    captures: {},
    ...(fork ? { fork } : {}),
  };
}

const WALLETS = [
  wallet("a", "recommended"),
  wallet("b", "recommended", "https://github.com/x/b/releases/tag/v1"),
  ...["c", "d", "e", "f"].map((id) => wallet(id, "compatible")),
  wallet("g", "testing"),
];

function renderGrid(wallets = WALLETS) {
  render(
    <HomeWalletGrid
      wallets={wallets}
      trailing={<a href="/add">Add your wallet</a>}
    />,
  );
}

describe("HomeWalletGrid", () => {
  it("shows the first five wallets and an expander card, then every wallet and the add tile", () => {
    renderGrid();
    expect(screen.getAllByRole("link", { name: /Wallet / })).toHaveLength(5);
    expect(screen.queryByText("Add your wallet")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Show all 7 wallets/ }));

    expect(screen.getAllByRole("link", { name: /Wallet / })).toHaveLength(7);
    expect(screen.getByText("Add your wallet")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: /Show fewer/ })
        .getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("calls the official recommended build recommended and the fork integrated", () => {
    renderGrid();
    expect(
      screen.getByRole("link", { name: /Wallet a/ }).textContent,
    ).toContain("Recommended");
    expect(
      screen.getByRole("link", { name: /Wallet b/ }).textContent,
    ).toContain("Integrated");
    expect(
      screen.getByRole("link", { name: /Wallet c/ }).textContent,
    ).toContain("Compatible");
  });

  it("shows every wallet and the add tile without an expander when there are six or fewer", () => {
    renderGrid(WALLETS.slice(0, 6));
    expect(screen.getAllByRole("link", { name: /Wallet / })).toHaveLength(6);
    expect(screen.getByText("Add your wallet")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
