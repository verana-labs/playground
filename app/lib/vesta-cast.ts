// The live Vesta cast - one vs-agent (Business Wallet) per participant,
// deployed and provisioned by the vesta-* workflows
// (.github/workflows/vesta/README.md).
//
// Testnet (V3): the did:webvh values below are the live DIDs. A did:webvh
// SCID changes only when an agent is created again from scratch; refresh a
// value from the last entry of https://<host>/.well-known/did.jsonl (state.id).
//
// Devnet (V4): the cast members have no fixed DID here. A caller finds the
// DID from the host (see serviceDidFor in demo-services.ts).

import { ENDPOINTS } from "./site";
import { NETWORK_CONFIG, PROTOCOL, networkHost } from "./network";

/** A cast member with a known DID (the other casts use this type). */
export type CastMember = {
  host: string;
  did: string;
};

/** A Vesta cast member. On V4 the DID is not known at build time. */
export type VestaCastMember = {
  host: string;
  did?: string;
};

const V3 = PROTOCOL === "v3";

const ZONE = networkHost("playground");

/** The testnet DID on V3, and no DID on V4. */
const testnetDid = (did: string): string | undefined => (V3 ? did : undefined);

const ECS_DID = NETWORK_CONFIG.ecsEcosystemDid;

export const VESTA_CAST = {
  helvetia: {
    host: `helvetia-trust.${ZONE}`,
    did: testnetDid("did:webvh:QmYZq8Q1puVDZ3GrNnmp8GfySbXJQvShHfdqXRDnGGMcis:helvetia-trust.playground.testnet.verana.network"),
  },
  vesta: {
    host: `vesta.${ZONE}`,
    did: testnetDid("did:webvh:QmVdceDZTiP34oz168Yjtm7PHFLb7g9hbWgQEFzfmV8r7S:vesta.playground.testnet.verana.network"),
  },
  portal: {
    host: `portal.vesta.${ZONE}`,
    did: testnetDid("did:webvh:QmccwmWukyccMmpV95zscKPqWKR3QbwXNaK91rzhLhGqS2:portal.vesta.playground.testnet.verana.network"),
  },
  repairNetwork: {
    host: `repair-network.vesta.${ZONE}`,
    did: testnetDid("did:webvh:QmQsRhCr3FWepkKSrSFNSeacZ4ZquTSV9myoeZL6kJgQpp:repair-network.vesta.playground.testnet.verana.network"),
  },
  iso: {
    host: `iso-certification.${ZONE}`,
    did: testnetDid("did:webvh:QmSYiWtR5H8M5D26G7y4KaxbbXv5ANfhxkcMYNHGcfWLtd:iso-certification.playground.testnet.verana.network"),
  },
  normacert: {
    host: `normacert.${ZONE}`,
    did: testnetDid("did:webvh:QmTyozr73CTL8JRaV49cE8X5nQhhCjMMvyrsPEiVn7iVbL:normacert.playground.testnet.verana.network"),
  },
  iberia: {
    host: `vesta-iberia.${ZONE}`,
    did: testnetDid("did:webvh:Qmdkh28Vdj2uQWtTBuPbiwVNYz9Lh2eqQfpMavoknrParX:vesta-iberia.playground.testnet.verana.network"),
  },
  nordics: {
    host: `vesta-nordics.${ZONE}`,
    did: testnetDid("did:webvh:Qme6Siyj5ASTR7rMtx7B7RMkeKVTntDFmBzuTJj2CbK29M:vesta-nordics.playground.testnet.verana.network"),
  },
  zenith: {
    host: `zenith.${ZONE}`,
    did: testnetDid("did:webvh:QmccFRC56Mo4ACAH99h8KzRzoapTtMKJ1rqeEPs6sJxSqN:zenith.playground.testnet.verana.network"),
  },
  umbra: {
    host: `umbra.${ZONE}`,
    did: testnetDid("did:webvh:QmPFgCVbJ1hNWXgCNcQia2hLT4eZ3916zsULhu5jaSKuPF:umbra.playground.testnet.verana.network"),
  },
  // The ECS Ecosystem (the trust anchor) of the network. Its controller host
  // is the last segment of its DID.
  ecs: {
    host: ECS_DID.split(":").pop() ?? "",
    did: ECS_DID,
  },
} as const satisfies Record<string, VestaCastMember>;

/** The service that issues the ECS Organization credentials of the cast.
 *  V3: Helvetia Trust Services (demo), an accredited ECS-Org issuer of the
 *  cast. V4: ecs-org-issuer, the organization issuer of the ECS Ecosystem;
 *  Helvetia stays an ordinary cast member. */
export const ECS_ORG_ISSUER: {
  /** Full name, as an "issued by" value. */
  name: string;
  /** Short name, as a diagram label. */
  label: string;
  /** Diagram subtitle. */
  sub: string;
  /** The name with its role, for a sentence. */
  described: string;
  /** The organization that operates it. */
  operator: string;
  member: VestaCastMember;
} = V3
  ? {
      name: "Helvetia Trust Services (demo)",
      label: "Helvetia Trust Services",
      sub: "(demo) · accredited ECS-Org issuer",
      described: "Helvetia Trust Services (demo), an accredited ECS-Org issuer",
      operator: "Helvetia Trust Services (demo)",
      member: VESTA_CAST.helvetia,
    }
  : {
      name: "ecs-org-issuer (ECS Ecosystem)",
      label: "ecs-org-issuer",
      sub: "the ECS Ecosystem's organization issuer",
      described: "ecs-org-issuer, the accredited organization issuer of the ECS Ecosystem",
      operator: "The ECS Ecosystem operator",
      member: { host: networkHost("ecs-org-issuer") },
    };

type SchemaKey =
  | "ecsOrganization"
  | "ecsService"
  | "ecsBadge"
  | "iso9001Demo"
  | "authorizedRepairer";

/** Credential schema ids. Testnet only (indexer: /verana/cs/v1/get/<id>);
 *  on devnet the ids are not known at build time, so the map is empty. */
export const SCHEMA_IDS: Partial<Record<SchemaKey, number>> = V3
  ? {
      ecsOrganization: 168,
      ecsService: 170,
      ecsBadge: 250,
      iso9001Demo: 251,
      authorizedRepairer: 252,
    }
  : {};

type TrustRegistryKey = "ecs" | "iso" | "repairNetwork";

/** Trust registry (V4: Ecosystem) ids. Testnet only (indexer:
 *  /verana/tr/v1/get/<id>); on devnet the map is empty. */
export const TRUST_REGISTRY_IDS: Partial<Record<TrustRegistryKey, number>> = V3
  ? { ecs: 89, iso: 187, repairNetwork: 188 }
  : {};

export const didDocUrl = (m: VestaCastMember) =>
  `https://${m.host}/.well-known/did.json`;

/** The Verana app page of a trust registry (V3) or an Ecosystem (V4), or
 *  undefined when the id is not known. */
export const trustRegistryUrl = (id: number | undefined) =>
  id === undefined
    ? undefined
    : `${ENDPOINTS.frontend}/${V3 ? "tr" : "ecosystems"}/${id}`;

/** The Verana app page of a credential schema: the participants tree on V3,
 *  the schema page on V4. Undefined when the id is not known. */
export const credentialSchemaUrl = (id: number | undefined) =>
  id === undefined
    ? undefined
    : `${ENDPOINTS.frontend}/${V3 ? "participants" : "credential-schemas"}/${id}`;

/** The Verana app page of a DID, or undefined when the DID is not known. */
export const didPageUrl = (m: VestaCastMember) =>
  m.did ? `${ENDPOINTS.frontend}/did/${encodeURIComponent(m.did)}` : undefined;
