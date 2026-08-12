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
    did: `did:webvh:${PENDING}:business-registry.${ZONE}`,
  },
  civilRegistry: {
    host: `civil-registry.${ZONE}`,
    did: `did:webvh:${PENDING}:civil-registry.${ZONE}`,
  },
  taxBuro: {
    host: `tax-buro.${ZONE}`,
    did: `did:webvh:${PENDING}:tax-buro.${ZONE}`,
  },
  meridianBank: {
    host: `meridian-bank.${ZONE}`,
    did: `did:webvh:${PENDING}:meridian-bank.${ZONE}`,
  },
  quickcash: {
    host: `quickcash.${ZONE}`,
    did: `did:webvh:${PENDING}:quickcash.${ZONE}`,
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
