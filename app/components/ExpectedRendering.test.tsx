import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpectedRendering } from "./ExpectedRendering";

describe("ExpectedRendering", () => {
  it("renders the accredited-issuer verdict in the emerald tone", () => {
    render(<ExpectedRendering kind="issue-accredited" />);
    const pill = screen.getByText(
      "✅ Accredited Issuer (demo) is an authorized issuer of DemoCredential in Playground Ecosystem (demo) — accept the offer.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-emerald-700/);
  });

  it("renders the unaccredited-issuer verdict in the red tone", () => {
    render(<ExpectedRendering kind="issue-unaccredited" />);
    const pill = screen.getByText(
      "❌ Unaccredited Issuer (demo) is not an authorized issuer of DemoCredential — accepting is blocked.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-red-600/);
  });

  it("renders the untrusted connection refusal for the issuer trio", () => {
    render(<ExpectedRendering kind="issue-untrusted" />);
    const pill = screen.getByText(
      "❌ Untrusted Service (demo) fails trust resolution — the connection is refused before any offer.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-red-600/);
  });

  it("renders the accredited-verifier verdict in the emerald tone", () => {
    render(<ExpectedRendering kind="present-accredited" />);
    const pill = screen.getByText(
      "✅ Accredited Verifier (demo) is an authorized verifier of DemoCredential in Playground Ecosystem (demo) — share to log in.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-emerald-700/);
  });

  it("renders the unaccredited-verifier verdict in the red tone", () => {
    render(<ExpectedRendering kind="present-unaccredited" />);
    const pill = screen.getByText(
      "❌ Unaccredited Verifier (demo) is not an authorized verifier of DemoCredential — sharing is blocked.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-red-600/);
  });

  it("renders the untrusted connection refusal for the verifier trio", () => {
    render(<ExpectedRendering kind="present-untrusted" />);
    const pill = screen.getByText(
      "❌ Untrusted Service (demo) fails trust resolution — the connection is refused before any request.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-red-600/);
  });
});
