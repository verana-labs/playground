// Utopia demo claim sets: the values minted into a visitor's Citizen ID
// offer and Legal Representative offer (Run the demos, Utopia chapter 4).
// Same conventions as demo-badge.ts: AnonCreds claims carry every schema
// attribute (empty strings for the unset ones); the SD-JWT rail drops the
// empty placeholders. The portrait reuses the generated demo avatar.

import { BADGE_DEMO_AVATAR } from "./demo-badge";

export const CITIZEN_DEMO_AVATAR = BADGE_DEMO_AVATAR;

/** Per-scan citizen identity: the demo mints a fresh personalIdentifier so
 *  every visitor holds a distinguishable (but obviously fictional) ID. */
export function citizenDemoClaims(): { name: string; value: string }[] {
  const personalIdentifier = `UT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  return [
    { name: "familyName", value: "Solano" },
    { name: "givenName", value: "Aria" },
    { name: "birthDate", value: "19940512" },
    { name: "personalIdentifier", value: personalIdentifier },
    { name: "nationality", value: "UT" },
    { name: "portrait", value: CITIZEN_DEMO_AVATAR },
    { name: "issuingAuthority", value: "National Civil Registry (demo)" },
  ];
}

/** Tomás Ferreira, managing director of Solaris Bakery (demo) - the story's
 *  legal representative. In the real flow the applicant first identifies
 *  with their Citizen ID; the demo mints directly. */
export function legalRepDemoClaims(): { name: string; value: string }[] {
  return [
    { name: "companyName", value: "Solaris Bakery (demo)" },
    { name: "companyRegistryId", value: "UT-REG-004271" },
    { name: "representativeName", value: "Tomás Ferreira" },
    { name: "role", value: "managing-director" },
    { name: "powers", value: "full" },
    { name: "validUntil", value: "" },
  ];
}

const toOid4vc = (claims: { name: string; value: string }[]) =>
  Object.fromEntries(
    claims.filter((c) => c.value !== "").map((c) => [c.name, c.value]),
  );

export const citizenOid4vcClaims = () => toOid4vc(citizenDemoClaims());
export const legalRepOid4vcClaims = () => toOid4vc(legalRepDemoClaims());
