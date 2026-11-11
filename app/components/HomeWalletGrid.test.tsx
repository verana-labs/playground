import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PersonalWallet } from "../lib/wallets";
import { HomeWalletGrid } from "./HomeWalletGrid";

function wallet(id: string, fork?: string): PersonalWallet {
  return {
    id,
    name: `Wallet ${id}`,
    vendor: `Vendor ${id}`,
    status: "recommended",
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
  wallet("a"),
  wallet("b", "https://github.com/x/b/releases/tag/v1"),
  ...["c", "d", "e"].map((id) => wallet(id)),
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
  it("shows every wallet and the add tile, with no expander", () => {
    renderGrid();
    expect(screen.getAllByRole("link", { name: /Wallet / })).toHaveLength(5);
    expect(screen.getByText("Add your wallet")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("calls the official recommended build recommended and the fork integrated", () => {
    renderGrid();
    expect(
      screen.getByRole("link", { name: /Wallet a/ }).textContent,
    ).toContain("Recommended");
    expect(
      screen.getByRole("link", { name: /Wallet b/ }).textContent,
    ).toContain("Integrated");
  });
});
