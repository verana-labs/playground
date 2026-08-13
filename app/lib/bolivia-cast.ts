// The Bolivia cast on the Verana testnet - one vs-agent (Business Wallet)
// per participant, deployed and provisioned by the bolivia-* workflows
// (the Spanish public-sector story at /usecases/bolivia). Until each agent
// ships, its DID is an explicit placeholder (the pre-cast pattern); refresh
// each value from https://<host>/.well-known/did.jsonl (state.id) once the
// host is live. Real institutions, always labeled (demo) by the cast.

import type { CastMember } from "./vesta-cast";

const ZONE = "bolivia.playground.testnet.verana.network";

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmBoliviaCastPending111111111111111111111111";

export const BOLIVIA_CAST = {
  seprec: {
    host: `seprec.${ZONE}`,
    did: `did:webvh:${PENDING}:seprec.bolivia.playground.testnet.verana.network`,
  },
  segip: {
    host: `segip.${ZONE}`,
    did: `did:webvh:${PENDING}:segip.bolivia.playground.testnet.verana.network`,
  },
  impuestos: {
    host: `impuestos.${ZONE}`,
    did: `did:webvh:${PENDING}:impuestos.bolivia.playground.testnet.verana.network`,
  },
  bancoUnion: {
    host: `banco-union.${ZONE}`,
    did: `did:webvh:${PENDING}:banco-union.bolivia.playground.testnet.verana.network`,
  },
  prestamista: {
    host: `prestamista.${ZONE}`,
    did: `did:webvh:${PENDING}:prestamista.bolivia.playground.testnet.verana.network`,
  },
} as const satisfies Record<string, CastMember>;

/** True while a cast DID is still an explicit placeholder. */
export const isBoliviaPendingDid = (did: string) => did.includes(PENDING);

/** Credential-type names provisioned on the cast agents (workflow contract). */
export const BOLIVIA_CEDULA_NAME = "CedulaDigital";
export const BOLIVIA_LEGAL_REP_NAME = "LegalRepresentative";

/** VTJSCs of the two Bolivia schemas, published by their registry anchors
 *  (vs-agent naming convention: /vt/schemas-<base>-jsc.json). */
export const BOLIVIA_CEDULA_JSC = `https://${BOLIVIA_CAST.segip.host}/vt/schemas-cedula-digital-jsc.json`;
export const BOLIVIA_LEGAL_REP_JSC = `https://${BOLIVIA_CAST.seprec.host}/vt/schemas-legal-representative-jsc.json`;
