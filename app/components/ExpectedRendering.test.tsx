import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExpectedRendering } from "./ExpectedRendering";

describe("ExpectedRendering", () => {
  it("renders the issue verdict sentence", () => {
    render(<ExpectedRendering kind="issue" />);
    expect(
      screen.getByText(
        "✅ Example Issuer (demo) is an authorized issuer of ECS-Badge in the ECS Ecosystem.",
      ),
    ).toBeDefined();
  });

  it("renders the present verdict sentence", () => {
    render(<ExpectedRendering kind="present" />);
    expect(
      screen.getByText(
        "✅ Example Web Verifier (demo) is an authorized verifier of ECS-Badge in the ECS Ecosystem.",
      ),
    ).toBeDefined();
  });

  it("renders the issue-refused verdict sentence in the red tone", () => {
    render(<ExpectedRendering kind="issue-refused" />);
    const pill = screen.getByText(
      "❌ Umbra Corp (demo) is not an authorized issuer of ECS-Badge — accepting is blocked.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-red-700/);
  });

  it("renders the present-refused verdict sentence in the red tone", () => {
    render(<ExpectedRendering kind="present-refused" />);
    const pill = screen.getByText(
      "❌ Umbra Corp (demo) is not an authorized verifier of ECS-Badge — sharing is blocked.",
    );
    expect(pill.closest("div")?.className).toMatch(/text-red-700/);
  });
});
