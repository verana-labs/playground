// The live Vesta cast - one vs-agent (Business Wallet) per participant,
// deployed and provisioned by the vesta-* workflows
// (deploy/vesta/README.md).
//
// The build knows no DID of a cast member: a caller finds the DID from the
// host at run time (see serviceDidFor in demo-services.ts).

import { ENDPOINTS } from "./site";
import { NETWORK_CONFIG, PROTOCOL, networkHost } from "./network";

/** A cast member with a known DID (the other casts use this type). */
export type CastMember = {
  host: string;
  did: string;
};

/** A Vesta cast member. `did` is set only when the build knows a fixed
 *  DID (the ECS Ecosystem); on V4 the agents have none at build time. */
export type VestaCastMember = {
  host: string;
  did?: string;
};

/** V3 is the old protocol. No network runs it anymore; the switches stay
 *  for reference. */
const V3 = PROTOCOL === "v3";

const ZONE = networkHost("playground");

const ECS_DID = NETWORK_CONFIG.ecsEcosystemDid;

/** A cast member without a fixed DID. */
const member = (host: string): VestaCastMember => ({ host });

export const VESTA_CAST = {
  helvetia: member(`helvetia-trust.${ZONE}`),
  vesta: member(`vesta.${ZONE}`),
  portal: member(`portal.vesta.${ZONE}`),
  repairNetwork: member(`repair-network.vesta.${ZONE}`),
  iso: member(`iso-certification.${ZONE}`),
  normacert: member(`normacert.${ZONE}`),
  iberia: member(`vesta-iberia.${ZONE}`),
  nordics: member(`vesta-nordics.${ZONE}`),
  zenith: member(`zenith.${ZONE}`),
  umbra: member(`umbra.${ZONE}`),
  // The ECS Ecosystem (the trust anchor) of the network. Its controller host
  // is the last segment of its DID.
  ecs: {
    host: ECS_DID.split(":").pop() ?? "",
    did: ECS_DID,
  },
} as const satisfies Record<string, VestaCastMember>;

/** The service that issues the ECS Organization credentials of the cast.
 *  V4: ecs-org-issuer, the organization issuer of the ECS Ecosystem;
 *  Helvetia stays an ordinary cast member. V3 (the old protocol): Helvetia
 *  Trust Services (demo), an accredited ECS-Org issuer of the cast. */
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

/** Credential schema ids. On V4 the ids are not known at build time, so the
 *  map is empty: the app finds a schema by its title (app/lib/vtjsc.ts). */
export const SCHEMA_IDS: Partial<Record<SchemaKey, number>> = {};

type TrustRegistryKey = "ecs" | "iso" | "repairNetwork";

/** Trust registry (V4: Ecosystem) ids. On V4 the ids are not known at build
 *  time, so the map is empty. */
export const TRUST_REGISTRY_IDS: Partial<Record<TrustRegistryKey, number>> = {};

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
