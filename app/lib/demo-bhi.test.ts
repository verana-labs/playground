import { describe, expect, it } from "vitest";
import {
  employmentDemoClaims,
  employmentOid4vcClaims,
  qualificationDemoClaims,
  rtwDemoClaims,
  rtwOid4vcClaims,
} from "./demo-bhi";

describe("BHI demo claims", () => {
  it("hands out a fresh employment array every call (the /api/demo attr-fill appends to it)", () => {
    // Regression: the shared EMPLOYMENTS entries were returned by reference,
    // so the AnonCreds attr-fill's pushes (id, "-" placeholders) accumulated
    // in them and every later SD-JWT offer failed with "unknown claim 'id'".
    for (let i = 0; i < 30; i++) {
      const claims = employmentDemoClaims();
      claims.push({ name: "id", value: "urn:uuid:polluted" });
      claims[0] = { name: "employer", value: "mutated" };
    }
    for (let i = 0; i < 30; i++) {
      const claims = employmentDemoClaims();
      expect(claims.map((c) => c.name)).not.toContain("id");
      expect(claims[0].value).not.toBe("mutated");
    }
  });

  it("keeps every employment claim set inside the configured OID4VC claim list", () => {
    const configured = ["employer", "startDate", "endDate"];
    for (let i = 0; i < 30; i++) {
      for (const name of Object.keys(employmentOid4vcClaims())) {
        expect(configured).toContain(name);
      }
    }
  });

  it("omits the schema-optional claims instead of sending placeholders", () => {
    expect(Object.keys(rtwOid4vcClaims())).not.toContain("rtwExpiryDate");
    expect(rtwDemoClaims().map((c) => c.name)).not.toContain("rtwExpiryDate");
  });

  it("branches the qualification on the issuing service", () => {
    const cirrus = qualificationDemoClaims("cirrus");
    const caledonian = qualificationDemoClaims("caledonian");
    expect(cirrus.find((c) => c.name === "issuingEstablishment")?.value).toContain("Cirrus");
    expect(caledonian.find((c) => c.name === "issuingEstablishment")?.value).toContain("Caledonian");
  });
});
