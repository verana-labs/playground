// The events cast on the Verana testnet - one vs-agent (Business Wallet) per
// participant, deployed and provisioned by the eventos-* workflows
// (.github/workflows/eventos/README.md): Taquilla (demo), the fictional
// ticket broker that issues the boletos, and the three event services
// (Costa Rica, Guatemala, Panamá) that verify them. DIDs stay as
// placeholders until each agent deploys; replace with the real did:webvh
// value from each host's did.jsonl log (state.id).

import type { CastMember } from "./vesta-cast";

const ZONE = "eventos.playground.testnet.verana.network";

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmEventosCastPending11111111111111111111111";

export const EVENTOS_CAST = {
  taquilla: {
    host: `taquilla.${ZONE}`,
    did: `did:webvh:${PENDING}:taquilla.${ZONE}`,
  },
  costaRica: {
    host: `costa-rica.${ZONE}`,
    did: `did:webvh:${PENDING}:costa-rica.${ZONE}`,
  },
  guatemala: {
    host: `guatemala.${ZONE}`,
    did: `did:webvh:${PENDING}:guatemala.${ZONE}`,
  },
  panama: {
    host: `panama.${ZONE}`,
    did: `did:webvh:${PENDING}:panama.${ZONE}`,
  },
} as const satisfies Record<string, CastMember>;

/** True while a cast DID is still an explicit placeholder. */
export const isEventosPendingDid = (did: string) => did.includes(PENDING);

// ---------------------------------------------------------------------------
// Workflow contract (eventos-* provisioning): AnonCreds credential-type names
// and per-schema VTJSC URLs, as created by provision-taquilla.sh. The
// /api/demo credential kinds and the event landings key on these.
// ---------------------------------------------------------------------------

/** AnonCreds credential-type names on the Taquilla agent. */
export const EVENTOS_ASISTENTE_NAME = "AsistenteEvento";
export const EVENTOS_PATROCINADOR_NAME = "PatrocinadorEvento";

/** VTJSCs, published by Taquilla, the registry owner (vs-agent naming
 *  convention: /vt/schemas-<base>-jsc.json). */
export const EVENTOS_ASISTENTE_JSC = `https://${EVENTOS_CAST.taquilla.host}/vt/schemas-asistente-jsc.json`;
export const EVENTOS_PATROCINADOR_JSC = `https://${EVENTOS_CAST.taquilla.host}/vt/schemas-patrocinador-jsc.json`;
