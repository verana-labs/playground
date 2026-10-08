// The BHI (Better Hiring Institute) cast - the UK Verifiable Hiring story at
// /usecases/bhi, built with Orchestrating Identity (OID). One vs-agent
// (Business Wallet) per participant, deployed and provisioned by the bhi-*
// workflows (.github/workflows/bhi/README.md). Real organisations: Better
// Hiring Institute and Orchestrating Identity appear as themselves; every
// other participant is fictional and always labeled (demo).
//
// Hosts: <org>.bhi.playground.<network>.verana.network. On testnet (V3) the
// DIDs below are the live did:webvh values read from each host's did.jsonl
// log (state.id) after the 2026-09-02 bootstrap. On devnet (V4) the cast has
// new agents, so `did` is undefined and the app finds each DID from its host.

import { NETWORK, networkHost } from "./network";

export type BhiCastMember = {
  host: string;
  /** The live did:webvh on testnet; undefined on devnet (host discovery). */
  did?: string;
};

const ZONE = networkHost("bhi.playground");

/** The testnet DID of a cast member, or undefined on another network. */
const testnetDid = (did: string) => (NETWORK === "testnet" ? did : undefined);

export const BHI_CAST = {
  /** Better Hiring Institute - anchor + the Recruitment Trust Network. */
  bhi: {
    host: `institute.${ZONE}`,
    did: testnetDid(`did:webvh:QmSyhjhHVXdvS88s79MdnpP2jYSxGgZDGVa4VUQccsKWt7:institute.${ZONE}`),
  },
  /** Orchestrating Identity - certified Orchestration Service Provider
   *  (real org); operates the DVS-Aligned Provider Ecosystem (demo). */
  oid: {
    host: `orchestrating-identity.${ZONE}`,
    did: testnetDid(`did:webvh:QmYPx4QNwMHecZ5WzhnAtNzUijy4coCnJWZTX4yhEFvYSW:orchestrating-identity.${ZONE}`),
  },
  /** Trustworthy Verification Services (demo) - the second certified
   *  grantor: proves the network does not depend on any one provider. */
  tvs: {
    host: `tvs.${ZONE}`,
    did: testnetDid(`did:webvh:QmZ1vh89e7N6uDkE7X7YFuXwSqA1YgZ6YoqC1zr7u5bVcM:tvs.${ZONE}`),
  },
  /** Meridian Technologies (demo) - the employer. */
  meridian: {
    host: `meridian.${ZONE}`,
    did: testnetDid(`did:webvh:QmWXZceB9zrp5YMzcb3t92bvGxjtc5Y8tW9aSkacij24Zh:meridian.${ZONE}`),
  },
  /** JobSearch (demo) - the job board / credential-request service. */
  jobsearch: {
    host: `jobsearch.${ZONE}`,
    did: testnetDid(`did:webvh:QmPSuGcm9rtkLZzkww9kJaSTDVmXpou2YD9n7cwfkvi2XP:jobsearch.${ZONE}`),
  },
  /** Northbank Identity (demo) - certified DVS issuer: right-to-work and
   *  employment credentials (HMRC as data source, see the story). */
  northbank: {
    host: `northbank.${ZONE}`,
    did: testnetDid(`did:webvh:QmVBC3cUfKTJpqVnpgkAv1WhF1G6CQ7gX71LfH3XFf22rG:northbank.${ZONE}`),
  },
  /** Caledonian University (demo) - awarding body, Qualification registry. */
  caledonian: {
    host: `caledonian.${ZONE}`,
    did: testnetDid(`did:webvh:QmadLMMjxzPWWmfn7E9zm5QEb2MuUfyG2gxrWFBZwtdRjs:caledonian.${ZONE}`),
  },
  /** Cirrus Certification (demo) - second accredited Qualification issuer. */
  cirrus: {
    host: `cirrus.${ZONE}`,
    did: testnetDid(`did:webvh:QmS8qJdyGgcLBNdMhVpHWpiSsMoH4azdLucUBEqxMhPywE:cirrus.${ZONE}`),
  },
  /** Halcyon Talent (demo) - the antagonist: a genuinely verifiable org
   *  with NO Verified Employer credential and NO verifier permissions. */
  halcyon: {
    host: `halcyon.${ZONE}`,
    did: testnetDid(`did:webvh:QmedbTy95TebBYn6s9gwxp5u2TzsRQs7aADrNXhf9atqWB:halcyon.${ZONE}`),
  },
} as const satisfies Record<string, BhiCastMember>;

/** The DID to show for a cast member: the live did:webvh on testnet, the
 *  did:web alias of its host on devnet. A vs-agent publishes its DID
 *  document at https://<host>/.well-known/did.json with the did:web id, so
 *  that alias resolves on both networks. */
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

/** V3 (testnet) VTJSCs, published by each schema's registry owner (vs-agent
 *  naming convention: /vt/schemas-<base>-jsc.json). On V4 (devnet) the
 *  /api/demo route finds each VTJSC at run time (app/lib/vtjsc.ts). */
export const BHI_QUALIFICATION_JSC = `https://${BHI_CAST.caledonian.host}/vt/schemas-qualification-jsc.json`;
export const BHI_EMPLOYMENT_JSC = `https://${BHI_CAST.northbank.host}/vt/schemas-employment-jsc.json`;
export const BHI_RTW_JSC = `https://${BHI_CAST.northbank.host}/vt/schemas-right-to-work-jsc.json`;
