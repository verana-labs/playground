// The Verandia cast on the Verana testnet - one vs-agent (Business Wallet)
// per participant, deployed and provisioned by the verandia-* workflows
// (spec: verana-spec → playground/verandia/spec.md §5). DIDs still marked
// as pending placeholders belong to agents whose redeploy on the verandia
// zone has not finished; refresh each value from
// https://<host>/.well-known/did.jsonl (state.id) once the host is live.

import type { CastMember } from "./vesta-cast";

const ZONE = "verandia.playground.testnet.verana.network";

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmVerandiaCastPending11111111111111111111111";

export const VERANDIA_CAST = {
  businessRegistry: {
    host: `business-registry.${ZONE}`,
    did: `did:webvh:QmUAypd4BYzB2LVQcQvgijdkbowdc9VX2mF3JtLDmSrEP4:business-registry.verandia.playground.testnet.verana.network`,
  },
  civilRegistry: {
    host: `civil-registry.${ZONE}`,
    did: `did:webvh:QmTZUoFAMvMDiDKEMxEsW8sWth7WEocWnEpPVf7AA6c9mQ:civil-registry.verandia.playground.testnet.verana.network`,
  },
  taxBuro: {
    host: `tax-buro.${ZONE}`,
    did: `did:webvh:${PENDING}:tax-buro.verandia.playground.testnet.verana.network`,
  },
  meridianBank: {
    host: `meridian-bank.${ZONE}`,
    did: `did:webvh:${PENDING}:meridian-bank.verandia.playground.testnet.verana.network`,
  },
  quickcash: {
    host: `quickcash.${ZONE}`,
    did: `did:webvh:${PENDING}:quickcash.verandia.playground.testnet.verana.network`,
  },
} as const satisfies Record<string, CastMember>;

/** True while a cast DID is still an explicit placeholder. */
export const isPendingDid = (did: string) => did.includes(PENDING);

/** Credential-type names provisioned on the cast agents (workflow contract). */
export const VERANDIA_CITIZEN_ID_NAME = "VerandiaCitizenID";
export const VERANDIA_LEGAL_REP_NAME = "LegalRepresentative";

/** VTJSCs of the two Verandia schemas, published by their registry anchors
 *  (vs-agent naming convention: /vt/schemas-<base>-jsc.json). */
export const VERANDIA_CITIZEN_ID_JSC = `https://${VERANDIA_CAST.civilRegistry.host}/vt/schemas-verandia-citizen-id-jsc.json`;
export const VERANDIA_LEGAL_REP_JSC = `https://${VERANDIA_CAST.businessRegistry.host}/vt/schemas-legal-representative-jsc.json`;
