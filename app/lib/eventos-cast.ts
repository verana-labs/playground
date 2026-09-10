// The events cast on the Verana testnet - one vs-agent (Business Wallet) per
// participant, deployed and provisioned by the eventos-* workflows
// (.github/workflows/eventos/README.md): Taquilla (demo), the fictional
// ticket broker that issues the boletos, and the three event services
// (Costa Rica, Guatemala, Panamá) that verify them. DIDs below are the live
// did:webvh values read from each host's did.jsonl log (state.id) after the
// 2026-09-10 bootstrap; they change only if an agent is re-created from
// scratch.

import type { CastMember } from "./vesta-cast";

const ZONE = "eventos.playground.testnet.verana.network";

export const EVENTOS_CAST = {
  taquilla: {
    host: `taquilla.${ZONE}`,
    did: `did:webvh:QmRVcQzG7DD6nv9kbKaPkAdSmeLhQd8Raku2VRDxoadW9G:taquilla.${ZONE}`,
  },
  costaRica: {
    host: `costa-rica.${ZONE}`,
    did: `did:webvh:QmdqAdfmup1mDygxuNENmB9VAfussM5d6jPCN36jxmWS11:costa-rica.${ZONE}`,
  },
  guatemala: {
    host: `guatemala.${ZONE}`,
    did: `did:webvh:QmdLqxQGi4xi9rbAjhJDvvZoFch6C3dL8Si7X31DN35oJK:guatemala.${ZONE}`,
  },
  panama: {
    host: `panama.${ZONE}`,
    did: `did:webvh:QmSJE4FebBmWWd9uQuf3jy4s2sjYoidSjNSKU7SkNHctDa:panama.${ZONE}`,
  },
} as const satisfies Record<string, CastMember>;

/** True while a cast DID is still an explicit placeholder (none are, since
 *  the 2026-09-10 bootstrap - kept for the pre-deploy gating pattern). */
export const isEventosPendingDid = (did: string) => did.includes("CastPending");

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
