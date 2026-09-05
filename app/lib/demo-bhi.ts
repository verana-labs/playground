// BHI demo claim sets: the values minted into a visitor's Qualification,
// Employment and Right to Work offers (Run the demos, BHI chapter 4).
// Same conventions as demo-verandia.ts: AnonCreds claims carry every schema
// attribute the demo sets (the /api/demo attr-fill covers the rest); the
// SD-JWT rail drops empty placeholders. Alex Chen (demo) is the default
// candidate; the applicant-journey wizard lets the visitor rename them,
// which flows into the Right to Work claims only. No portrait: a photo
// claim makes wallets that support it (Inji) demand live face
// verification, which the demo persona cannot pass.

type Claim = { name: string; value: string };

export type DemoApplicant = { firstName: string; surname: string };

export const DEFAULT_APPLICANT: DemoApplicant = {
  firstName: "Alex",
  surname: "Chen",
};

/** Visitor-supplied names reach a real testnet credential: keep them short
 *  and name-shaped (letters, spaces, hyphens, apostrophes, dots), falling
 *  back to the default persona. */
export function sanitizeApplicantName(
  value: string | null | undefined,
  fallback: string,
): string {
  const cleaned = (value ?? "")
    .replace(/[^\p{L}\p{M}' .-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40)
    .trim();
  return cleaned || fallback;
}

export function applicantFromParams(params: URLSearchParams): DemoApplicant {
  return {
    firstName: sanitizeApplicantName(
      params.get("firstName"),
      DEFAULT_APPLICANT.firstName,
    ),
    surname: sanitizeApplicantName(
      params.get("surname"),
      DEFAULT_APPLICANT.surname,
    ),
  };
}

/** One credential per qualification: the issuing service decides which of
 *  Alex's two qualifications it mints - the BSc from Caledonian, the cloud
 *  certification from Cirrus. Scanning both issuers fills the wallet with
 *  two Qualification credentials from two institutions. */
export function qualificationDemoClaims(serviceId: string): Claim[] {
  if (serviceId === "cirrus") {
    return [
      { name: "issuingEstablishment", value: "Cirrus Certification (demo)" },
      { name: "dateAwarded", value: "2024-03-15" },
      { name: "qualificationSubject", value: "Cloud Architecture" },
      { name: "qualificationType", value: "Professional certification" },
      { name: "gradeAwarded", value: "Pass" },
    ];
  }
  return [
    { name: "issuingEstablishment", value: "Caledonian University (demo)" },
    { name: "dateAwarded", value: "2017-07-01" },
    { name: "qualificationSubject", value: "Computer Science" },
    { name: "qualificationType", value: "BSc" },
    { name: "gradeAwarded", value: "First Class Honours" },
  ];
}

/** One credential per employment relationship: each scan mints one of
 *  Alex's three employments (the newest has no end date - a current
 *  employment). Scanning repeatedly builds the five-year history in the
 *  wallet, the repeating behaviour of the Employment schema. */
const EMPLOYMENTS: Claim[][] = [
  [
    { name: "employer", value: "Nimbus Software (demo)" },
    { name: "startDate", value: "2019-09-02" },
    { name: "endDate", value: "2021-05-28" },
  ],
  [
    { name: "employer", value: "Aurora Retail Group (demo)" },
    { name: "startDate", value: "2021-06-14" },
    { name: "endDate", value: "2022-12-16" },
  ],
  [
    { name: "employer", value: "Vector Data Ltd (demo)" },
    { name: "startDate", value: "2023-01-09" },
    // no endDate: a current employment
  ],
];

export function employmentDemoClaims(): Claim[] {
  // Copy: callers (the /api/demo AnonCreds attr-fill) append to the returned
  // array, and the shared entries must not accumulate those additions.
  const picked = EMPLOYMENTS[Math.floor(Math.random() * EMPLOYMENTS.length)];
  return picked.map((c) => ({ ...c }));
}

/** Exactly one Right to Work credential per person - the one credential
 *  that carries the applicant's (possibly visitor-chosen) name. */
export function rtwDemoClaims(
  applicant: DemoApplicant = DEFAULT_APPLICANT,
): Claim[] {
  return [
    { name: "firstName", value: applicant.firstName },
    { name: "surname", value: applicant.surname },
    { name: "birthDate", value: "19940211" },
    { name: "nationality", value: "GB" },
    { name: "rtwEstablishedDate", value: "2026-08-01" },
    // no rtwExpiryDate: a British citizen's right to work does not expire
  ];
}

const toOid4vc = (claims: Claim[]) =>
  Object.fromEntries(
    claims.filter((c) => c.value !== "").map((c) => [c.name, c.value]),
  );

export const qualificationOid4vcClaims = (serviceId: string) =>
  toOid4vc(qualificationDemoClaims(serviceId));
export const employmentOid4vcClaims = () => toOid4vc(employmentDemoClaims());
export const rtwOid4vcClaims = (applicant?: DemoApplicant) =>
  toOid4vc(rtwDemoClaims(applicant));
