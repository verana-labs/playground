import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PersonalWallet } from "../lib/wallets";
import { QrPanel } from "./ui";

const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; LLY-NX1) Chrome/156.0";
const URL = "https://taquilla.eventos.playground.testnet.verana.network/s?id=abcd1234";

const wallet = (id: string, name: string) => ({ id, name }) as PersonalWallet;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("QrPanel", () => {
  it("swaps the generic phone link for the hologram button on a didcomm mint", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ANDROID_UA);

    render(<QrPanel url={URL} rail="didcomm" wallet={wallet("hologram", "Hologram")} alt="QR" hint="" />);

    const link = screen.getByRole("link", { name: /Abrir en Hologram/ });
    expect(link.getAttribute("href")).toMatch(/^intent:\/\/invite\?_url=.*scheme=hologram-zone/);
    expect(screen.queryByText(/Abrir en la wallet/)).toBeNull();
  });

  it("keeps the generic phone link for other wallets", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(ANDROID_UA);

    render(<QrPanel url={URL} rail="didcomm" wallet={wallet("bcwallet", "BC Wallet")} alt="QR" hint="" />);

    expect(screen.getByText(/Abrir en la wallet/)).toBeDefined();
    expect(screen.queryByText(/Abrir en Hologram/)).toBeNull();
  });
});
