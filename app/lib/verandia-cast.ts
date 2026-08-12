// The Verandia cast on the Verana testnet - one vs-agent (Business Wallet)
// per participant, deployed and provisioned by the utopia-* workflows
// (spec: verana-spec → playground/verandia/spec.md §5). The cast shipped
// under the story's working title, so the deployed contract keeps the
// `utopia` identifiers: the DNS zone (and therefore the on-chain DIDs), the
// UtopiaCitizenID credential type, its VTJSC path, and the OID4VC config
// ids. Only a redeploy of the cast can rename those; everything site-side
// says Verandia.

import type { CastMember } from "./vesta-cast";

const ZONE = "utopia.playground.testnet.verana.network";

export const VERANDIA_CAST = {
  businessRegistry: {
    host: `business-registry.${ZONE}`,
    did: `did:webvh:QmezdxtknL9sjuJSoTj2vGGW1oKFMGYATSQnHDunAU5Bko:business-registry.utopia.playground.testnet.verana.network`,
  },
  civilRegistry: {
    host: `civil-registry.${ZONE}`,
    did: `did:webvh:QmQK1jY6YrR8dWBQkyPrDj2nj2txNYj41NzeW4VaUp7meD:civil-registry.utopia.playground.testnet.verana.network`,
  },
  taxBuro: {
    host: `tax-buro.${ZONE}`,
    did: `did:webvh:QmT1MWK3SGEhA5pGieFtvXMD19YpEUf8h6FAoF1MrTL4D4:tax-buro.utopia.playground.testnet.verana.network`,
  },
  meridianBank: {
    host: `meridian-bank.${ZONE}`,
    did: `did:webvh:Qmc39KYrwpQvyhfDPHWg3NTbJDssYA9nCAuNd8pitfv6D4:meridian-bank.utopia.playground.testnet.verana.network`,
  },
  quickcash: {
    host: `quickcash.${ZONE}`,
    did: `did:webvh:QmPEkB2TYgnkCMHmB5iyrv7j1qMT8NZuxbqovtwH4PK1zR:quickcash.utopia.playground.testnet.verana.network`,
  },
} as const satisfies Record<string, CastMember>;

/** True while a cast DID is still an explicit placeholder (none are). */
export const isPendingDid = (did: string) => did.includes("CastPending");

/** Credential-type names provisioned on the cast agents (workflow contract). */
export const VERANDIA_CITIZEN_ID_NAME = "UtopiaCitizenID";
export const VERANDIA_LEGAL_REP_NAME = "LegalRepresentative";

/** VTJSCs of the two Verandia schemas, published by their registry anchors
 *  (vs-agent naming convention: /vt/schemas-<base>-jsc.json). */
export const VERANDIA_CITIZEN_ID_JSC = `https://${VERANDIA_CAST.civilRegistry.host}/vt/schemas-utopia-citizen-id-jsc.json`;
export const VERANDIA_LEGAL_REP_JSC = `https://${VERANDIA_CAST.businessRegistry.host}/vt/schemas-legal-representative-jsc.json`;
