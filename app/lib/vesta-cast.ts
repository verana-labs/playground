// The live Vesta cast on the Verana testnet - one vs-agent (Business Wallet)
// per participant, deployed and provisioned by the vesta-* workflows
// (.github/workflows/vesta/README.md). The did:webvh SCIDs change only if an
// agent is re-created from scratch; refresh a value from the last entry of
// https://<host>/.well-known/did.jsonl (state.id).

import { ENDPOINTS } from "./site";

export type CastMember = {
  host: string;
  did: string;
};

const ZONE = "playground.testnet.verana.network";

export const VESTA_CAST = {
  helvetia: {
    host: `helvetia-trust.${ZONE}`,
    did: "did:webvh:QmYZq8Q1puVDZ3GrNnmp8GfySbXJQvShHfdqXRDnGGMcis:helvetia-trust.playground.testnet.verana.network",
  },
  vesta: {
    host: `vesta.${ZONE}`,
    did: "did:webvh:QmVdceDZTiP34oz168Yjtm7PHFLb7g9hbWgQEFzfmV8r7S:vesta.playground.testnet.verana.network",
  },
  portal: {
    host: `portal.vesta.${ZONE}`,
    did: "did:webvh:QmccwmWukyccMmpV95zscKPqWKR3QbwXNaK91rzhLhGqS2:portal.vesta.playground.testnet.verana.network",
  },
  repairNetwork: {
    host: `repair-network.vesta.${ZONE}`,
    did: "did:webvh:QmQsRhCr3FWepkKSrSFNSeacZ4ZquTSV9myoeZL6kJgQpp:repair-network.vesta.playground.testnet.verana.network",
  },
  iso: {
    host: `iso-certification.${ZONE}`,
    did: "did:webvh:QmSYiWtR5H8M5D26G7y4KaxbbXv5ANfhxkcMYNHGcfWLtd:iso-certification.playground.testnet.verana.network",
  },
  normacert: {
    host: `normacert.${ZONE}`,
    did: "did:webvh:QmTyozr73CTL8JRaV49cE8X5nQhhCjMMvyrsPEiVn7iVbL:normacert.playground.testnet.verana.network",
  },
  iberia: {
    host: `vesta-iberia.${ZONE}`,
    did: "did:webvh:Qmdkh28Vdj2uQWtTBuPbiwVNYz9Lh2eqQfpMavoknrParX:vesta-iberia.playground.testnet.verana.network",
  },
  nordics: {
    host: `vesta-nordics.${ZONE}`,
    did: "did:webvh:Qme6Siyj5ASTR7rMtx7B7RMkeKVTntDFmBzuTJj2CbK29M:vesta-nordics.playground.testnet.verana.network",
  },
  zenith: {
    host: `zenith.${ZONE}`,
    did: "did:webvh:QmccFRC56Mo4ACAH99h8KzRzoapTtMKJ1rqeEPs6sJxSqN:zenith.playground.testnet.verana.network",
  },
  umbra: {
    host: `umbra.${ZONE}`,
    did: "did:webvh:QmPFgCVbJ1hNWXgCNcQia2hLT4eZ3916zsULhu5jaSKuPF:umbra.playground.testnet.verana.network",
  },
  ecs: {
    host: "ecs-trust-registry.testnet.verana.network",
    did: "did:webvh:QmcTCdA8z7cs7BwCKyrrJrTTmvff3wmxSn7WUZtP2iAM7T:ecs-trust-registry.testnet.verana.network",
  },
} as const satisfies Record<string, CastMember>;

/** Live testnet credential schema ids (indexer: /verana/cs/v1/get/<id>). */
export const SCHEMA_IDS = {
  ecsOrganization: 168,
  ecsService: 170,
  ecsBadge: 250,
  iso9001Demo: 251,
  authorizedRepairer: 252,
} as const;

/** On-chain trust registry ids (indexer: /verana/tr/v1/get/<id>). */
export const TRUST_REGISTRY_IDS = {
  ecs: 89,
  iso: 187,
  repairNetwork: 188,
} as const;

export const didDocUrl = (m: CastMember) =>
  `https://${m.host}/.well-known/did.json`;

export const trustRegistryUrl = (id: number) =>
  `${ENDPOINTS.frontend}/tr/${id}`;

export const didPageUrl = (m: CastMember) =>
  `${ENDPOINTS.frontend}/did/${encodeURIComponent(m.did)}`;
