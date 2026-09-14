import { describe, expect, it } from "vitest";
import type { CastService } from "./cast-services";
import { listScenarios, serviceFor } from "./scenarios";
import { expectedTrust, type TrustExpectation } from "./trust-expectation";

function service(id: string, demoPerm: CastService["demoPerm"], oid4vcRole: CastService["oid4vcRole"]): CastService {
  return { cast: "demo", org: id, id, host: `${id}.playground.testnet.verana.network`, pinnedTag: "v0", oid4vcRole, demoPerm, issuerId: null, configPath: id };
}

const SERVICES: Record<string, CastService> = {
  "demo-issuer-accredited": service("demo-issuer-accredited", "issuer", "issuer"),
  "demo-issuer-unaccredited": service("demo-issuer-unaccredited", "none", "issuer"),
  "demo-issuer-untrusted": service("demo-issuer-untrusted", null, "issuer"),
  "demo-verifier-accredited": service("demo-verifier-accredited", "verifier", "verifier"),
  "demo-verifier-unaccredited": service("demo-verifier-unaccredited", "none", "verifier"),
  "demo-verifier-untrusted": service("demo-verifier-untrusted", null, "verifier"),
  taquilla: service("taquilla", null, "issuer"),
  "evento-costa-rica": service("evento-costa-rica", null, "verifier"),
  "evento-guatemala": service("evento-guatemala", null, "verifier"),
};

const EXPECTED: Record<string, TrustExpectation> = {
  "issue-accredited": { q1: "TRUSTED", q2: true, q3: null },
  "issue-unaccredited": { q1: "TRUSTED", q2: false, q3: null },
  "issue-untrusted": { q1: "UNTRUSTED", q2: null, q3: null },
  "present-accredited": { q1: "TRUSTED", q2: null, q3: true },
  "present-unaccredited": { q1: "TRUSTED", q2: null, q3: false },
  "present-untrusted": { q1: "UNTRUSTED", q2: null, q3: null },
  "boleto-asistente": { q1: "TRUSTED", q2: true, q3: null },
  "boleto-patrocinador": { q1: "TRUSTED", q2: true, q3: null },
  "entrada-costa-rica": { q1: "TRUSTED", q2: null, q3: true },
  "entrada-otro-evento": { q1: "TRUSTED", q2: null, q3: true },
};

describe("expectedTrust", () => {
  it("covers exactly the ten scenarios", () => {
    expect(Object.keys(EXPECTED).sort()).toEqual(
      listScenarios()
        .map((s) => s.id)
        .sort(),
    );
  });

  for (const scenario of listScenarios())
    it(`${scenario.id}`, () => {
      const serviceId = serviceFor(scenario, "openid4vc-sdjwt");
      const fixture = SERVICES[serviceId];
      if (!fixture) throw new Error(`no fixture service for ${serviceId}`);
      expect(expectedTrust(scenario, fixture)).toEqual(EXPECTED[scenario.id]);
    });
});
