import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PotCard } from "./ProofOfTrust";

const base = { did: "did:webvh:Qm:svc.example", credentials: [], failedCredentials: [] };

describe("PotCard", () => {
  it("renders TRUSTED with service and org blocks", () => {
    render(<PotCard label="Svc (demo)" did={base.did} pot={{ ...base, state: "TRUSTED", trustStatus: "TRUSTED",
      evaluatedAtBlock: 123, credentials: [
        { ecsType: "ECS-SERVICE", result: "VALID", claims: { name: "Example Service", description: "d" } },
        { ecsType: "ECS-ORG", result: "VALID", claims: { name: "Example Org", countryCode: "CH", registryId: "R-1" } },
      ] }} />);
    expect(screen.getByText("Trusted")).toBeDefined();
    expect(screen.getByText("Example Service")).toBeDefined();
    expect(screen.getByText("Example Org")).toBeDefined();
  });

  it("renders empty-state strings when credentials are absent", () => {
    render(<PotCard label="Svc" did={base.did} pot={{ ...base, state: "TRUSTED", trustStatus: "TRUSTED" }} />);
    expect(screen.getByText("No ECS-Service credential presented.")).toBeDefined();
    expect(screen.getByText("No ECS-Organization or ECS-Persona credential presented.")).toBeDefined();
  });

  it("renders UNVERIFIED as could-not-verify with retry, not untrusted", () => {
    render(<PotCard label="Svc" did={null} pot={{ ...base, state: "UNVERIFIED" }} />);
    expect(screen.getByText("Could not verify")).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
    expect(screen.queryByText("Untrusted")).toBeNull();
  });

  it("guards non-string resolver fields instead of crashing", () => {
    render(<PotCard label="Svc" did={base.did} pot={{ ...base, state: "TRUSTED", trustStatus: "TRUSTED",
      credentials: [
        { ecsType: 123 as unknown as string, result: { bad: true } as unknown as string, claims: {} },
      ] }} />);
    expect(screen.getByText("unknown")).toBeDefined();
  });

  it("renders failed credentials as first-class content when UNTRUSTED", () => {
    render(<PotCard label="Svc" did={base.did} pot={{ ...base, state: "UNTRUSTED", trustStatus: "UNTRUSTED",
      failedCredentials: [{ id: "cred-1", error: "expired", errorCode: "expired" }] }} />);
    expect(screen.getByText("Untrusted")).toBeDefined();
    expect(screen.getByText(/expired/)).toBeDefined();
  });
});
