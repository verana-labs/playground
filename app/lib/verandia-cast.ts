// The Verandia cast - one vs-agent (Business Wallet) per participant,
// deployed and provisioned by the verandia-* workflows (spec: verana-spec →
// playground/verandia/spec.md §5, .github/workflows/verandia/README.md).
//
// The build knows no DID: the app finds each agent by its host at run time.

import { networkHost } from "./network";

/** A Verandia cast member. `did` is set only when the build knows a fixed
 *  did:webvh; on V4 it is undefined. */
export type VerandiaMember = {
  host: string;
  did?: string;
};

const ZONE = networkHost("verandia.playground");

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmVerandiaCastPending11111111111111111111111";

/** A cast member without a fixed DID. */
const member = (host: string): VerandiaMember => ({ host });

export const VERANDIA_CAST = {
  businessRegistry: member(`business-registry.${ZONE}`),
  civilRegistry: member(`civil-registry.${ZONE}`),
  taxBuro: member(`tax-buro.${ZONE}`),
  meridianBank: member(`meridian-bank.${ZONE}`),
  quickcash: member(`quickcash.${ZONE}`),
} as const satisfies Record<string, VerandiaMember>;

/** True while a cast DID is still an explicit placeholder. An undefined DID
 *  (V4: the app finds the agent by its host) is not a placeholder. */
export const isPendingDid = (did: string | undefined) =>
  did !== undefined && did.includes(PENDING);

/** The DID to show for a member: its fixed did:webvh when the build knows
 *  it, else the did:web alias of its host (the agent publishes
 *  /.well-known/did.json there). */
export const displayDid = (member: VerandiaMember) =>
  member.did ?? `did:web:${member.host}`;

/** Credential-type names provisioned on the cast agents (workflow contract). */
export const VERANDIA_CITIZEN_ID_NAME = "VerandiaCitizenID";
export const VERANDIA_LEGAL_REP_NAME = "LegalRepresentative";

/** V3: the VTJSCs of the two Verandia schemas, published by their registry
 *  anchors (vs-agent naming convention: /vt/schemas-<base>-jsc.json). On V4
 *  the agent names a VTJSC after the numeric schema id, so the app finds it
 *  by the title below (app/lib/vtjsc.ts). */
export const VERANDIA_CITIZEN_ID_JSC = `https://${VERANDIA_CAST.civilRegistry.host}/vt/schemas-verandia-citizen-id-jsc.json`;
export const VERANDIA_LEGAL_REP_JSC = `https://${VERANDIA_CAST.businessRegistry.host}/vt/schemas-legal-representative-jsc.json`;

/** V4: the JSON Schema titles of the two Verandia schemas (workflow contract:
 *  .github/workflows/verandia/cast.sh). */
export const VERANDIA_CITIZEN_ID_TITLE = "VerandiaCitizenIDCredential";
export const VERANDIA_LEGAL_REP_TITLE = "LegalRepresentativeCredential";
