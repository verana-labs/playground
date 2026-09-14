import { describe, expect, it } from "vitest";
import { CONFORMANCE_SCENARIOS } from "../../app/lib/wallet-profiles";
import { listScenarios, serviceFor } from "./scenarios";

describe("scenarios.yaml", () => {
  const scenarios = listScenarios();

  it("declares every conformance scenario", () => {
    const ids = new Set(scenarios.map((s) => s.id));
    for (const id of CONFORMANCE_SCENARIOS) expect(ids.has(id), id).toBe(true);
  });

  it("names the untrusted service per rail", () => {
    const untrusted = scenarios.find((s) => s.id === "issue-untrusted")!;
    expect(serviceFor(untrusted, "anoncreds")).toBe("demo-untrusted");
    expect(serviceFor(untrusted, "openid4vc-sdjwt")).toBe("demo-issuer-untrusted");
    expect(serviceFor(scenarios.find((s) => s.id === "issue-accredited")!, "anoncreds")).toBe("demo-issuer-accredited");
  });

  it("chains presentations to the issuance they need", () => {
    for (const s of scenarios.filter((x) => x.kind === "present"))
      expect(scenarios.some((x) => x.id === s.needs && x.kind === "issue"), s.id).toBe(true);
  });
});
