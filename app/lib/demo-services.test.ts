import { describe, expect, it, vi, afterEach } from "vitest";
import { DEMO_SERVICES, getDemoService, serviceDid, serviceDidFor } from "./demo-services";

afterEach(() => vi.unstubAllGlobals());

describe("demo services", () => {
  it("knows the Vesta cast, the Verandia cast, the planned demo cast, the main.demos cast and the hosted cloud-stack anchors", () => {
    expect(DEMO_SERVICES.map((s) => s.id)).toEqual([
      "vesta", "helvetia-trust", "vesta-portal", "vesta-repair-network",
      "iso-certification", "normacert", "vesta-iberia", "vesta-nordics",
      "zenith", "umbra",
      "civil-registry", "business-registry", "tax-buro", "meridian-bank",
      "quickcash",
      "playground-demo",
      "demo-issuer-accredited", "demo-issuer-unaccredited",
      "demo-verifier-accredited", "demo-verifier-unaccredited",
      "demo-issuer-untrusted", "demo-verifier-untrusted", "demo-untrusted",
      "organization-vs", "issuer-chatbot-vs", "issuer-web-vs",
      "verifier-chatbot-vs", "verifier-web-vs",
      "mosip-organization-vs", "unfold-organization-vs",
    ]);
    expect(getDemoService("nope")).toBeUndefined();
  });

  it("carries the live Vesta cast DIDs so resolution needs no discovery fetch", () => {
    for (const id of ["vesta", "helvetia-trust", "vesta-portal", "zenith", "umbra"]) {
      const s = getDemoService(id);
      expect(s?.did).toMatch(/^did:webvh:Qm/);
      expect(s?.host).toContain("playground.testnet.verana.network");
    }
    expect(getDemoService("vesta")?.appUrl).toBe(
      "https://vesta.playground.testnet.verana.network/invitation",
    );
  });

  it("gives every playground cast demo service its DIDComm invitation link", () => {
    for (const id of [
      "demo-issuer-accredited", "demo-issuer-unaccredited",
      "demo-verifier-accredited", "demo-verifier-unaccredited",
      "demo-issuer-untrusted", "demo-verifier-untrusted", "demo-untrusted",
    ]) {
      expect(getDemoService(id)?.appUrl).toBe(
        `https://${id}.playground.testnet.verana.network/invitation`,
      );
    }
  });

  it("prefers the did:webvh alsoKnownAs", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: "did:web:x", alsoKnownAs: ["did:webvh:Qm:x"] }), { status: 200 }))));
    expect(await serviceDid("x")).toBe("did:webvh:Qm:x");
  });

  it("picks the string did:webvh candidate among junk entries", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: { nope: true }, alsoKnownAs: [42, "did:webvh:ok"] }), { status: 200 }))));
    expect(await serviceDid("x")).toBe("did:webvh:ok");
  });

  it("returns null when no did document field is a usable string", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: { nope: true }, alsoKnownAs: [42] }), { status: 200 }))));
    expect(await serviceDid("x")).toBeNull();
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

  it("drops malformed extras and survives garbage env", () => {
    vi.stubEnv("DEMO_SERVICES_EXTRA", JSON.stringify([
      { id: "good", label: "Good (demo)", host: "good.example", role: "issuer" },
      { label: "no id", host: "x.example" },
      { id: "no-host" },
      null,
      "string-entry",
    ]));
    expect(getDemoService("good")?.host).toBe("good.example");
    expect(getDemoService("no-host")).toBeUndefined();
    vi.stubEnv("DEMO_SERVICES_EXTRA", "{not json");
    expect(getDemoService("organization-vs")).toBeDefined();
    expect(getDemoService("good")).toBeUndefined();
    vi.unstubAllEnvs();
  });

  it("resolves a literal did on an extra entry without any network call", async () => {
    vi.stubEnv("DEMO_SERVICES_EXTRA", JSON.stringify([
      { id: "fides-labs", label: "FIDES Labs Issuer (external)", host: "fides.acc.credenco.com",
        did: "did:web:issuer.example:did:abc", role: "issuer" }]));
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const service = getDemoService("fides-labs");
    expect(service).toBeDefined();
    expect(await serviceDidFor(service!)).toBe("did:web:issuer.example:did:abc");
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });

  it("falls back to host discovery when an entry carries no literal did", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify({
      id: "did:web:x", alsoKnownAs: ["did:webvh:Qm:x"] }), { status: 200 }))));
    const service = getDemoService("organization-vs");
    expect(service).toBeDefined();
    expect(await serviceDidFor(service!)).toBe("did:webvh:Qm:x");
  });
});
