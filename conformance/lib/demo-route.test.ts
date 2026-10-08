import { describe, expect, it } from "vitest";
import { routeCredentials } from "./demo-route";

const REGISTRY = `
type CredentialKind = { label: string };

const CREDENTIALS: Record<string, CredentialKind> = {
  "demo-credential": {
    label: "DemoCredential",
    claims: () => [{ name: "demoId", value: \`demo-\${crypto.randomUUID().slice(0, 8)}\` }],
    oid4vcClaims: () => ({ name: "Playground Visitor" }),
  },
  plain: {
    label: "x",
    nested: { inner: { "not-a-key": 1 } },
  },
};

const OTHER = { "after-registry": {} };
`;

describe("routeCredentials", () => {
  it("lists the top-level keys of the registry and nothing nested or after it", () => {
    expect(routeCredentials(REGISTRY)).toEqual(["demo-credential", "plain"]);
  });

  it("reads the credentials the playground route mints today", () => {
    expect(routeCredentials()).toEqual(
      expect.arrayContaining(["demo-credential", "ecs-badge", "cexa-kyc", "verandia-citizen-id", "verandia-legal-rep", "bolivia-cedula", "eventos-asistente"]),
    );
  });

  it("fails loudly when the registry is gone", () => {
    expect(() => routeCredentials("export const OTHER = {};")).toThrow("declares no CREDENTIALS registry");
  });
});
