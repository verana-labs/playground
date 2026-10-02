import { describe, expect, it } from "vitest";
import type { CastService } from "./cast-services";
import { credentialParams, mintGap, planCredentials, probeFailure, type Prober } from "./mint-plan";

const service = (id: string, oid4vcRole: CastService["oid4vcRole"]): CastService => ({
  cast: "demo",
  org: id,
  id,
  host: `${id}.playground.devnet.verana.network`,
  pinnedTag: "v2",
  oid4vcRole,
  demoPerm: null,
  issuerId: null,
  configPath: "",
});

const SERVICES = [service("demo-issuer-accredited", "issuer"), service("demo-untrusted", null), service("demo-verifier-accredited", "verifier")];

describe("planCredentials", () => {
  it("asks every OpenID4VC service about every credential and keeps the ones that mint", async () => {
    const asked: string[] = [];
    const probe: Prober = async (s, role, credential) => {
      asked.push(`${s.id}:${role}:${credential}`);
      return credential === "demo-credential" ? { outcome: "mints", detail: "oid4vc" } : { outcome: "unsupported", detail: "mint degraded" };
    };
    const [demo, badge] = await planCredentials(["demo-credential", "ecs-badge"], SERVICES, probe);
    expect(asked).toEqual([
      "demo-issuer-accredited:issuer:demo-credential",
      "demo-verifier-accredited:verifier:demo-credential",
      "demo-issuer-accredited:issuer:ecs-badge",
      "demo-verifier-accredited:verifier:ecs-badge",
    ]);
    expect(demo?.issuers.map((s) => s.id)).toEqual(["demo-issuer-accredited"]);
    expect(demo?.verifiers.map((s) => s.id)).toEqual(["demo-verifier-accredited"]);
    expect(demo && mintGap(demo, "devnet-v4")).toBeNull();
    expect(badge && mintGap(badge, "devnet-v4")).toBe(
      "no issuer mints an offer and no verifier mints a request for ecs-badge on devnet-v4 (tried demo-issuer-accredited unsupported, demo-verifier-accredited unsupported)",
    );
  });

  it("passes the mint parameters scenarios.yaml declares for a credential", async () => {
    const seen: (Record<string, string> | undefined)[] = [];
    await planCredentials(["eventos-asistente"], SERVICES.slice(0, 1), async (_s, _r, _c, params) => {
      seen.push(params);
      return { outcome: "unsupported", detail: "" };
    });
    expect(seen).toEqual([credentialParams("eventos-asistente")]);
    expect(credentialParams("eventos-asistente")).toEqual({ evento: "costa-rica", nombre: "Conformance" });
  });
});

describe("probeFailure", () => {
  it("tells a degraded mint from a failed call", () => {
    expect(probeFailure(new Error('mint degraded for openid4vc-sdjwt: {"kind":"unsupported"}')).outcome).toBe("unsupported");
    expect(probeFailure(new Error("GET https://playground/api/demo/x -> HTTP 404"))).toEqual({ outcome: "error", detail: "GET https://playground/api/demo/x -> HTTP 404" });
  });
});
