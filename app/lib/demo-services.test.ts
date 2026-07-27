import { describe, expect, it, vi, afterEach } from "vitest";
import { DEMO_SERVICES, getDemoService, serviceDid } from "./demo-services";

afterEach(() => vi.unstubAllGlobals());

describe("demo services", () => {
  it("knows the five main.demos services", () => {
    expect(DEMO_SERVICES.map((s) => s.id)).toEqual([
      "organization-vs", "issuer-chatbot-vs", "issuer-web-vs",
      "verifier-chatbot-vs", "verifier-web-vs",
    ]);
    expect(getDemoService("nope")).toBeUndefined();
  });

  it("prefers the did:webvh alsoKnownAs", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: "did:web:x", alsoKnownAs: ["did:webvh:Qm:x"] }), { status: 200 }))));
    expect(await serviceDid("x")).toBe("did:webvh:Qm:x");
  });

  it("returns null on failure", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("down"))));
    expect(await serviceDid("x")).toBeNull();
  });

  it("extends the registry from DEMO_SERVICES_EXTRA", () => {
    vi.stubEnv("DEMO_SERVICES_EXTRA", JSON.stringify([
      { id: "keycloak-auth", label: "Keycloak Auth (demo)", host: "auth.example", role: "verifier" }]));
    expect(getDemoService("keycloak-auth")?.label).toBe("Keycloak Auth (demo)");
    vi.unstubAllEnvs();
  });
});
