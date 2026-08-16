// CEXA demo claim sets: the values minted into a visitor's CEXA-Kyc offer
// (Run the demos, CEXA chapter 5). Same conventions as demo-verandia.ts:
// AnonCreds claims carry every schema attribute; the SD-JWT rail reuses the
// same values. Alice Moreau is the story's holder; each scan mints a fresh
// documentNumberHash and evidenceDigest so every visitor holds a
// distinguishable (but obviously fictional) credential. In the real flow
// the sealed evidence bundle rides in the wallet next to the credential;
// the demo mints the digest claim only.

const hex = (bytes: number) =>
  Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export function cexaKycDemoClaims(): { name: string; value: string }[] {
  return [
    { name: "fullName", value: "Alice Moreau" },
    { name: "birthDate", value: "19970823" },
    { name: "nationality", value: "FR" },
    { name: "documentNumberHash", value: `sha256:${hex(16)}` },
    { name: "kycLevel", value: "standard" },
    { name: "screeningDate", value: "20260810" },
    { name: "provider", value: "IdentiSure (demo)" },
    { name: "evidenceDigest", value: `sha384-${hex(24)}` },
  ];
}

const toOid4vc = (claims: { name: string; value: string }[]) =>
  Object.fromEntries(
    claims.filter((c) => c.value !== "").map((c) => [c.name, c.value]),
  );

export const cexaKycOid4vcClaims = () => toOid4vc(cexaKycDemoClaims());
