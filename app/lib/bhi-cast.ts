// The BHI (Better Hiring Institute) cast - the UK Verifiable Hiring story at
// /usecases/bhi, built with Orchestrating Identity (OID). One vs-agent
// (Business Wallet) per participant, deployed and provisioned by the bhi-*
// workflows (deploy/bhi/README.md). Real organisations: Better
// Hiring Institute and Orchestrating Identity appear as themselves; every
// other participant is fictional and always labeled (demo).
//
// Hosts: <org>.bhi.playground.<network>.verana.network. The build knows no
// DID: the app finds the DID of each member from its host at run time.

import { networkHost } from "./network";

export type BhiCastMember = {
  host: string;
  /** A fixed did:webvh, when the build knows it. Undefined on V4: the app
   *  finds the DID from the host. */
  did?: string;
};

const ZONE = networkHost("bhi.playground");

/** A cast member without a fixed DID. */
const member = (host: string): BhiCastMember => ({ host });

export const BHI_CAST = {
  /** Better Hiring Institute - anchor + the Recruitment Trust Network. */
  bhi: member(`institute.${ZONE}`),
  /** Orchestrating Identity - certified Orchestration Service Provider
   *  (real org); operates the DVS-Aligned Provider Ecosystem (demo). */
  oid: member(`orchestrating-identity.${ZONE}`),
  /** Trustworthy Verification Services (demo) - the second certified
   *  grantor: proves the network does not depend on any one provider. */
  tvs: member(`tvs.${ZONE}`),
  /** Meridian Technologies (demo) - the employer. */
  meridian: member(`meridian.${ZONE}`),
  /** JobSearch (demo) - the job board / credential-request service. */
  jobsearch: member(`jobsearch.${ZONE}`),
  /** Northbank Identity (demo) - certified DVS issuer: right-to-work and
   *  employment credentials (HMRC as data source, see the story). */
  northbank: member(`northbank.${ZONE}`),
  /** Caledonian University (demo) - awarding body, Qualification registry. */
  caledonian: member(`caledonian.${ZONE}`),
  /** Cirrus Certification (demo) - second accredited Qualification issuer. */
  cirrus: member(`cirrus.${ZONE}`),
  /** Halcyon Talent (demo) - the antagonist: a genuinely verifiable org
   *  with NO Verified Employer credential and NO verifier permissions. */
  halcyon: member(`halcyon.${ZONE}`),
} as const satisfies Record<string, BhiCastMember>;

/** The DID to show for a cast member: its fixed did:webvh when the build
 *  knows it, else the did:web alias of its host. A vs-agent publishes its
 *  DID document at https://<host>/.well-known/did.json with the did:web id,
 *  so that alias resolves on every network. */
export const bhiDisplayDid = (member: BhiCastMember): string =>
  member.did ?? `did:web:${member.host}`;

/** True while a cast DID is still an explicit placeholder (none are, since
 *  the 2026-09-02 bootstrap - kept for the pre-deploy gating pattern). */
export const isBhiPendingDid = (did: string) => did.includes("CastPending");

// ---------------------------------------------------------------------------
// Workflow contract (bhi-* provisioning): AnonCreds credential-type names
// and per-schema VTJSC URLs, as created by the provision scripts. The
// /api/demo credential kinds and the chapter-4 demos key on these.
// ---------------------------------------------------------------------------

/** V3 AnonCreds credential-type names on the issuing agents. On V4 the
 *  route matches a credential definition by its VTJSC only. */
export const BHI_QUALIFICATION_NAME = "Qualification";
export const BHI_EMPLOYMENT_NAME = "Employment";
export const BHI_RTW_NAME = "RightToWork";

/** V3 VTJSCs, published by each schema's registry owner (vs-agent naming
 *  convention: /vt/schemas-<base>-jsc.json). On V4 the /api/demo route finds
 *  each VTJSC at run time (app/lib/vtjsc.ts). */
export const BHI_QUALIFICATION_JSC = `https://${BHI_CAST.caledonian.host}/vt/schemas-qualification-jsc.json`;
export const BHI_EMPLOYMENT_JSC = `https://${BHI_CAST.northbank.host}/vt/schemas-employment-jsc.json`;
export const BHI_RTW_JSC = `https://${BHI_CAST.northbank.host}/vt/schemas-right-to-work-jsc.json`;
