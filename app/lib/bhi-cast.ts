// The BHI (Better Hiring Institute) cast on the Verana testnet - the UK
// Verifiable Hiring story at /usecases/bhi, built with Orchestrating
// Identity (OID). One vs-agent (Business Wallet) per participant, to be
// deployed and provisioned by future bhi-* workflows (the vesta-*/ccm-*
// pattern). Real organisations: Better Hiring Institute and Orchestrating
// Identity appear as themselves; every other participant is fictional and
// always labeled (demo). DIDs stay as placeholders until each agent
// deploys; replace with the real did:webvh value from each host's
// did.jsonl log (state.id).
//
// PENDING (source: verana-spec playground/submission/oid-bhi.md, build
// notes): the deployment inventory for this cast has NOT been provided by
// OID yet - host list, which participants get live agents, and the demo
// claim sets are our proposal and await confirmation in the OID meeting.

import type { CastMember } from "./vesta-cast";

const ZONE = "bhi.playground.testnet.verana.network";

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmBhiCastPending1111111111111111111111111111";

export const BHI_CAST = {
  /** Better Hiring Institute - anchor + the Recruitment Trust Network. */
  bhi: {
    host: `bhi.${ZONE}`,
    did: `did:webvh:${PENDING}:bhi.${ZONE}`,
  },
  /** Orchestrating Identity - certified Orchestration Service Provider
   *  (real org); operates the DVS-Aligned Provider Ecosystem (demo). */
  oid: {
    host: `orchestrating-identity.${ZONE}`,
    did: `did:webvh:${PENDING}:orchestrating-identity.${ZONE}`,
  },
  /** Trustworthy Verification Services (demo) - the second certified
   *  grantor: proves the network does not depend on any one provider. */
  tvs: {
    host: `tvs.${ZONE}`,
    did: `did:webvh:${PENDING}:tvs.${ZONE}`,
  },
  /** Meridian Technologies (demo) - the employer. */
  meridian: {
    host: `meridian.${ZONE}`,
    did: `did:webvh:${PENDING}:meridian.${ZONE}`,
  },
  /** JobSearch (demo) - the job board / credential-request service. */
  jobsearch: {
    host: `jobsearch.${ZONE}`,
    did: `did:webvh:${PENDING}:jobsearch.${ZONE}`,
  },
  /** Northbank Identity (demo) - certified DVS issuer: right-to-work and
   *  employment-history credentials (HMRC as data source, see the story). */
  northbank: {
    host: `northbank.${ZONE}`,
    did: `did:webvh:${PENDING}:northbank.${ZONE}`,
  },
  /** Caledonian University (demo) - awarding body, degree credential. */
  caledonian: {
    host: `caledonian.${ZONE}`,
    did: `did:webvh:${PENDING}:caledonian.${ZONE}`,
  },
  /** Cirrus Certification (demo) - professional cloud certification. */
  cirrus: {
    host: `cirrus.${ZONE}`,
    did: `did:webvh:${PENDING}:cirrus.${ZONE}`,
  },
  /** Halcyon Talent (demo) - the antagonist: fake job ads. Deployed as a
   *  genuinely verifiable org with NO Verified Employer credential. */
  halcyon: {
    host: `halcyon.${ZONE}`,
    did: `did:webvh:${PENDING}:halcyon.${ZONE}`,
  },
} as const satisfies Record<string, CastMember>;

/** True while a cast DID is still an explicit placeholder. */
export const isBhiPendingDid = (did: string) => did.includes(PENDING);
