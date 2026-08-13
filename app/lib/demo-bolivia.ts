// Bolivia demo claim sets: the values minted into a visitor's Cédula
// Digital offer and Representante Legal offer (chapter 4 of the Bolivia
// story). Same conventions as demo-verandia.ts - with one extra rule from
// the story: NO named individuals, so the demo identity is an explicitly
// generic holder ("Titular De Demostración") and the mandate names a role,
// not a person. The portrait reuses the generated demo avatar.

import { BADGE_DEMO_AVATAR } from "./demo-badge";

export const CEDULA_DEMO_AVATAR = BADGE_DEMO_AVATAR;

/** Per-scan identity: a fresh personalIdentifier per visitor, obviously
 *  fictional (CI-XXXXXXXX), holder deliberately generic - no persons. */
export function cedulaDemoClaims(): { name: string; value: string }[] {
  const personalIdentifier = `CI-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return [
    { name: "familyName", value: "De Demostración" },
    { name: "givenName", value: "Titular" },
    { name: "birthDate", value: "19940512" },
    { name: "personalIdentifier", value: personalIdentifier },
    { name: "nationality", value: "BO" },
    { name: "portrait", value: CEDULA_DEMO_AVATAR },
    { name: "issuingAuthority", value: "SEGIP (demo)" },
  ];
}

/** A generic legal representative of a generic registered company - a role,
 *  not a person. In the real flow the applicant first identifies with their
 *  Cédula Digital; the demo mints directly. */
export function boliviaLegalRepDemoClaims(): { name: string; value: string }[] {
  // The agent refuses to issue a configured claim with an empty value, so the
  // demo mandate always carries a validity date one year out.
  const yearOut = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const validUntil = yearOut.toISOString().slice(0, 10).replace(/-/g, "");
  return [
    { name: "companyName", value: "Empresa Registrada (demo)" },
    { name: "companyRegistryId", value: "BO-MAT-004271" },
    { name: "representativeName", value: "Titular De Demostración" },
    { name: "role", value: "gerente-general" },
    { name: "powers", value: "full" },
    { name: "validUntil", value: validUntil },
  ];
}

const toOid4vc = (claims: { name: string; value: string }[]) =>
  Object.fromEntries(
    claims.filter((c) => c.value !== "").map((c) => [c.name, c.value]),
  );

export const cedulaOid4vcClaims = () => toOid4vc(cedulaDemoClaims());
export const boliviaLegalRepOid4vcClaims = () =>
  toOid4vc(boliviaLegalRepDemoClaims());
