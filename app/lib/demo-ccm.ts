// CCM demo claim set: the values minted into a visitor's credencial de
// Representación Legal (chapter 4 of the CCM story). Same conventions as
// demo-bolivia.ts - real institutions always "(demo)", and NO named
// individuals: the demo identity is an explicitly generic holder
// ("Titular De Demostración") and the mandate names a role, not a person.
// In the real flow the applicant is already authenticated as legal
// representative in the CCM virtual-services portal; the demo mints
// directly.

/** A generic legal representative of a generic company registered with the
 *  chamber (demo). Fresh matricula/cedula per scan, obviously fictional. */
export function ccmLegalRepDemoClaims(): { name: string; value: string }[] {
  const serial = crypto.randomUUID().replace(/\D/g, "").padEnd(8, "0").slice(0, 8);
  // The agent refuses to issue a configured claim with an empty value, so the
  // demo credential always carries a validity date one year out - mirroring
  // the story's rule that the credential expires with the annual renewal of
  // the matricula mercantil.
  const yearOut = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const validUntil = yearOut.toISOString().slice(0, 10).replace(/-/g, "");
  return [
    { name: "companyName", value: "Comercializadora Antioquia S.A.S. (demo)" },
    { name: "nit", value: `901${serial.slice(0, 6)}-1` },
    { name: "companyRegistryId", value: `CCM-MAT-${serial.slice(0, 6)}` },
    { name: "representativeName", value: "Titular De Demostración" },
    { name: "representativeId", value: `CC-${serial}` },
    { name: "role", value: "representante-legal-principal" },
    { name: "powers", value: "full" },
    { name: "issuingChamber", value: "Cámara de Comercio de Medellín (demo)" },
    { name: "validUntil", value: validUntil },
  ];
}

const toOid4vc = (claims: { name: string; value: string }[]) =>
  Object.fromEntries(
    claims.filter((c) => c.value !== "").map((c) => [c.name, c.value]),
  );

export const ccmLegalRepOid4vcClaims = () => toOid4vc(ccmLegalRepDemoClaims());
