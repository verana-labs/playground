import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpectedRendering } from "./ExpectedRendering";

describe("ExpectedRendering", () => {
  it("renders the issue verdict sentence in the emerald tone", () => {
    render(<ExpectedRendering kind="issue" />);
    const pill = screen.getByText(
      "✅ Example Issuer (demo) is an authorized issuer of ECS-Badge in the ECS Ecosystem.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-emerald-700/);
  });

  it("renders the present verdict sentence in the emerald tone", () => {
    render(<ExpectedRendering kind="present" />);
    const pill = screen.getByText(
      "✅ Example Web Verifier (demo) is an authorized verifier of ECS-Badge in the ECS Ecosystem.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-emerald-700/);
  });

  it("renders the issue-refused verdict sentence in the red tone", () => {
    render(<ExpectedRendering kind="issue-refused" />);
    const pill = screen.getByText(
      "❌ Umbra Repairs (demo) is not an authorized issuer of ECS-Badge — accepting is blocked.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-red-600/);
  });

  it("renders the present-refused verdict sentence in the red tone", () => {
    render(<ExpectedRendering kind="present-refused" />);
    const pill = screen.getByText(
      "❌ Umbra Repairs (demo) is not an authorized verifier of ECS-Badge — sharing is blocked.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-red-600/);
  });
});
