// The CCM cast on the Verana testnet - one vs-agent (Business Wallet) per
// participant, deployed and provisioned by the ccm-* workflows (the
// Colombian legal-representation story at /usecases/ccm). Two agents:
// the Camara de Comercio de Medellin (demo) and Bancolombia (demo).
// Real institutions, always labeled (demo) by the cast. DIDs stay as
// placeholders until each agent deploys; replace with the real did:webvh
// value from each host's did.jsonl log (state.id).

import type { CastMember } from "./vesta-cast";

const ZONE = "ccm.playground.testnet.verana.network";

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmCcmCastPending1111111111111111111111111111";

export const CCM_CAST = {
  camara: {
    host: `camara.${ZONE}`,
    did: `did:webvh:${PENDING}:camara.${ZONE}`,
  },
  bancolombia: {
    host: `bancolombia.${ZONE}`,
    did: `did:webvh:${PENDING}:bancolombia.${ZONE}`,
  },
} as const satisfies Record<string, CastMember>;

/** True while a cast DID is still an explicit placeholder. */
export const isCcmPendingDid = (did: string) => did.includes(PENDING);

/** Credential-type name provisioned on the chamber agent (workflow contract). */
export const CCM_LEGAL_REP_NAME = "RepresentacionLegal";

/** VTJSC of the Representacion Legal schema, published by the chamber
 *  (vs-agent naming convention: /vt/schemas-<base>-jsc.json). */
export const CCM_LEGAL_REP_JSC = `https://${CCM_CAST.camara.host}/vt/schemas-representacion-legal-jsc.json`;
