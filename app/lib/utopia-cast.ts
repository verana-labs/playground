// The Utopia cast on the Verana testnet - one vs-agent (Business Wallet)
// per participant, to be deployed and provisioned by the utopia-* workflows
// (spec: verana-spec → playground/utopia/spec.md §5). Until the cast ships,
// DIDs are explicit placeholders (the Vesta pre-cast pattern); refresh each
// value from https://<host>/.well-known/did.jsonl (state.id) once deployed.

import type { CastMember } from "./vesta-cast";

const ZONE = "utopia.playground.testnet.verana.network";

/** Base58-safe, unmistakably fake SCID - replaced when the cast deploys. */
const PENDING = "QmUtopiaCastPending11111111111111111111111111";

export const UTOPIA_CAST = {
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

/** True until the cast is deployed and the placeholder DIDs are replaced. */
export const isPendingDid = (did: string) => did.includes(PENDING);

/** Credential-type names provisioned on the cast agents (workflow contract). */
export const UTOPIA_CITIZEN_ID_NAME = "UtopiaCitizenID";
export const UTOPIA_LEGAL_REP_NAME = "LegalRepresentative";

/** VTJSCs of the two Utopia schemas, published by their registry anchors
 *  (vs-agent naming convention: /vt/schemas-<base>-jsc.json). */
export const UTOPIA_CITIZEN_ID_JSC = `https://${UTOPIA_CAST.civilRegistry.host}/vt/schemas-utopia-citizen-id-jsc.json`;
export const UTOPIA_LEGAL_REP_JSC = `https://${UTOPIA_CAST.businessRegistry.host}/vt/schemas-legal-representative-jsc.json`;
