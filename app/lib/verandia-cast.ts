// The Verandia cast - one vs-agent (Business Wallet) per participant,
// deployed and provisioned by the verandia-* workflows (spec: verana-spec →
// playground/verandia/spec.md §5, .github/workflows/verandia/README.md).
//
// Testnet (V3): the DIDs below are the live did:webvh values. Refresh a value
// from https://<host>/.well-known/did.jsonl (state.id) if an agent is created
// again from scratch.
// Devnet (V4): the app finds each agent by its host, so `did` is undefined.

import { NETWORK, networkHost } from "./network";

/** A Verandia cast member. `did` is known on testnet only. */
export type VerandiaMember = {
  host: string;
  did?: string;
};

const ZONE = networkHost("verandia.playground");

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmVerandiaCastPending11111111111111111111111";

/** The testnet DID of a member; undefined on the other networks. */
const testnetDid = (did: string) => (NETWORK === "testnet" ? did : undefined);

export const VERANDIA_CAST = {
  businessRegistry: {
    host: `business-registry.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmUAypd4BYzB2LVQcQvgijdkbowdc9VX2mF3JtLDmSrEP4:business-registry.verandia.playground.testnet.verana.network",
    ),
  },
  civilRegistry: {
    host: `civil-registry.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmTZUoFAMvMDiDKEMxEsW8sWth7WEocWnEpPVf7AA6c9mQ:civil-registry.verandia.playground.testnet.verana.network",
    ),
  },
  taxBuro: {
    host: `tax-buro.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmUb8gstdQFm1P6DyTrDCq4ukZBLx5KoM9VYCdh7hZyHCs:tax-buro.verandia.playground.testnet.verana.network",
    ),
  },
  meridianBank: {
    host: `meridian-bank.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmQxoLMKcQj8t7J3uNWZF9yStSiCKkoVmrsdTGJVCZ8k43:meridian-bank.verandia.playground.testnet.verana.network",
    ),
  },
  quickcash: {
    host: `quickcash.${ZONE}`,
    did: testnetDid(
      "did:webvh:Qma27dn8bEHCbkM4J5Rvwi5WsDiJppEJtFyYAEUEhETBRS:quickcash.verandia.playground.testnet.verana.network",
    ),
  },
} as const satisfies Record<string, VerandiaMember>;

/** True while a cast DID is still an explicit placeholder. An undefined DID
 *  (V4: the app finds the agent by its host) is not a placeholder. */
export const isPendingDid = (did: string | undefined) =>
  did !== undefined && did.includes(PENDING);

/** The DID to show for a member: its did:webvh on testnet, else the did:web
 *  alias of its host (the agent publishes /.well-known/did.json there). */
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
