// The master scene graph of the CEXA story - one fixed layout, revealed and
// transformed stage by stage. Stage "3.0" is the pre-populated exchange
// world (two gray exchanges re-running the same KYC, the IDV provider
// invoicing both, Alice stuck in the queue, DarkPool phishing at the edge);
// stages 3.1-3.7 walk the four needs of the Association's checklist.
// Rendering machinery is shared with the other use cases
// (app/components/scene-graph.ts / StoryDiagram.tsx).

import { CEXA_CAST } from "../../lib/cexa-cast";
import { shortDid } from "../../lib/did";
import type {
  Accreditation,
  NodeCredential,
  SceneBadge,
  SceneEdge,
  SceneGraph,
  SceneNode,
} from "../../components/scene-graph";

export const STAGES = [
  "3.0",
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "3.5",
  "3.6",
  "3.7",
] as const;

export type Stage = (typeof STAGES)[number];

const sceneDid = (did: string) =>
  shortDid(did).replace(/\.cexa\.playground\.testnet\.verana\.network$/, "…");

const NODES: SceneNode[] = [
  // ---- the trust layer
  {
    id: "association",
    x: 600,
    y: 150,
    r: 28,
    icon: "network",
    tone: "violet",
    appears: "3.1",
    noteAlways: true,
    label: "Crypto Exchange Association (demo)",
    sub: "trust registry · EGF · fee schedule",
    did: CEXA_CAST.association.did,
    serviceType: "Trust registry service",
    operator: "Crypto Exchange Association (demo)",
    verifiedAt: "3.1",
  },
  // ---- the exchanges
  {
    id: "aurum",
    x: 260,
    y: 390,
    icon: "building",
    tone: "gray",
    appears: "3.0",
    label: "Aurum Exchange (demo)",
    sub: "pays 1.85 for every new customer",
    did: CEXA_CAST.aurum.did,
    serviceType: "Crypto exchange service (demo)",
    operator: "Aurum Exchange (demo)",
    verifiedAt: "3.2",
    toneByStage: { "3.2": "blue" },
    labelByStage: {
      "3.2": { sub: "accredited ISSUER member" },
      "3.4": { sub: sceneDid(CEXA_CAST.aurum.did) },
    },
  },
  {
    id: "borealis",
    x: 940,
    y: 390,
    icon: "building",
    tone: "gray",
    appears: "3.0",
    label: "Borealis Markets (demo)",
    sub: "same customer, same 1.85, same wait",
    did: CEXA_CAST.borealis.did,
    serviceType: "Crypto exchange service (demo)",
    operator: "Borealis Markets (demo)",
    verifiedAt: "3.3",
    toneByStage: { "3.3": "blue" },
    labelByStage: { "3.3": { sub: "accredited VERIFIER member" } },
  },
  // ---- the provider
  {
    id: "identisure",
    x: 140,
    y: 625,
    icon: "stamp",
    tone: "gray",
    appears: "3.0",
    label: "IdentiSure (demo)",
    sub: "IDV provider · 1.85 per full check",
    labelByStage: {
      "3.1": { sub: "EGF-authorized IDV provider" },
    },
  },
  // ---- people
  {
    id: "alice",
    x: 600,
    y: 600,
    icon: "user",
    tone: "amber",
    appears: "3.0",
    person: true,
    label: "Alice Moreau",
    sub: "KYC'd again at every exchange",
    toneByStage: { "3.4": "emerald" },
    labelByStage: {
      "3.4": { sub: "CryptoExchangeKYC in the wallet she chose" },
    },
  },
  // ---- the red world
  {
    id: "darkpool",
    x: 1070,
    y: 625,
    icon: "ghost",
    tone: "red",
    appears: "3.0",
    dashed: true,
    label: "DarkPool Exchange (demo)",
    sub: "asks for your passport too",
    did: CEXA_CAST.darkpool.did,
  },
];

const EDGES: SceneEdge[] = [
  // membership
  {
    id: "e-aurum-join",
    from: "aurum",
    to: "association",
    appears: "3.2",
    label: "ISSUER member · dues 5,000/yr",
    tone: "blue",
    labelT: 0.45,
  },
  {
    id: "e-borealis-join",
    from: "borealis",
    to: "association",
    appears: "3.3",
    label: "VERIFIER member · dues 2,000/yr",
    tone: "blue",
    labelT: 0.45,
  },
  // first onboarding
  {
    id: "e-identisure-aurum",
    from: "identisure",
    to: "aurum",
    appears: "3.4",
    label: "full KYC · 1.85 off-chain",
    tone: "gray",
    dashed: true,
  },
  {
    id: "e-aurum-alice",
    from: "aurum",
    to: "alice",
    appears: "3.4",
    label: "CryptoExchangeKYC · free issuance",
    tone: "emerald",
  },
  // reuse
  {
    id: "e-alice-borealis",
    from: "alice",
    to: "borealis",
    appears: "3.5",
    label: "presents + re-binding",
    tone: "emerald",
  },
  {
    id: "e-fee-issuer",
    from: "borealis",
    to: "aurum",
    appears: "3.5",
    label: "0.30 USDC per reuse",
    tone: "amber",
    curve: -70,
    labelT: 0.5,
  },
  {
    id: "e-fee-eco",
    from: "borealis",
    to: "association",
    appears: "3.5",
    label: "0.10 USDC",
    tone: "amber",
    curve: 55,
    width: 0.7,
    labelT: 0.6,
  },
  // the refusal
  {
    id: "e-alice-darkpool",
    from: "alice",
    to: "darkpool",
    appears: "3.6",
    label: "refused at Q1",
    tone: "red",
    dashed: true,
  },
];

const BADGES: SceneBadge[] = [
  {
    id: "b-registry",
    node: "association",
    dx: 0,
    dy: -62,
    text: "CryptoExchangeKYC · governed both sides",
    tone: "violet",
    appears: "3.1",
  },
  {
    id: "b-aurum-tu",
    node: "aurum",
    dx: -8,
    dy: -58,
    text: "trust units minted",
    tone: "emerald",
    appears: "3.2",
    until: "3.4",
  },
  {
    id: "b-evidence",
    node: "aurum",
    dx: -6,
    dy: -58,
    text: "evidence digest anchored",
    tone: "emerald",
    appears: "3.4",
  },
  {
    id: "b-rebind",
    node: "borealis",
    dx: 10,
    dy: -58,
    text: "NFC + face match",
    tone: "amber",
    appears: "3.5",
  },
  {
    id: "b-revoked",
    node: "alice",
    dx: 0,
    dy: -60,
    text: "credential revoked by Aurum",
    tone: "red",
    appears: "3.7",
  },
];

const CREDENTIALS: Record<string, NodeCredential[]> = {
  association: [
    {
      name: "ECS-Organization",
      tone: "violet",
      issuedBy: "Helvetia Trust Services (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.1",
    },
    {
      name: "ECS-Service",
      tone: "violet",
      issuedBy: "Crypto Exchange Association (demo), self-issued",
      appears: "3.1",
    },
  ],
  aurum: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Crypto Exchange Association (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.2",
      note: "The Association is an accredited ECS-Organization issuer: onboarding a member also makes it verifiable.",
    },
    {
      name: "ECS-Service",
      tone: "blue",
      issuedBy: "Aurum Exchange (demo), self-issued",
      appears: "3.2",
    },
  ],
  borealis: [
    {
      name: "ECS-Organization",
      tone: "blue",
      issuedBy: "Crypto Exchange Association (demo)",
      ecosystem: "Verana ECS Ecosystem",
      appears: "3.3",
    },
    {
      name: "ECS-Service",
      tone: "blue",
      issuedBy: "Borealis Markets (demo), self-issued",
      appears: "3.3",
    },
  ],
  alice: [
    {
      name: "CryptoExchangeKYC",
      tone: "emerald",
      issuedBy: "Aurum Exchange (demo)",
      ecosystem: "Crypto Exchange Association (demo)",
      appears: "3.4",
      note: "Claims include the KYC level, the screening date, the provider, and the digest of the sealed evidence package Aurum keeps.",
    },
  ],
};

const ACCREDITATIONS: Record<string, Accreditation[]> = {
  association: [
    {
      role: "ISSUER",
      schema: "ECS-Organization",
      context: "Verana ECS Ecosystem",
      appears: "3.1",
    },
  ],
  aurum: [
    {
      role: "ISSUER",
      schema: "CryptoExchangeKYC",
      context: "Crypto Exchange Association (demo)",
      appears: "3.2",
    },
  ],
  borealis: [
    {
      role: "VERIFIER",
      schema: "CryptoExchangeKYC",
      context: "Crypto Exchange Association (demo)",
      appears: "3.3",
    },
  ],
};

const NODE_NOTES: Record<string, string> = {
  identisure:
    "An IDV provider on the Association's authorized list (EGF). It works off-chain: it runs the document, liveness and AML checks and hands the evidence to the issuing exchange. Not a chain participant.",
  darkpool:
    "No credentials, no membership, no permissions. Every wallet that trust-resolves this DID gets UNTRUSTED, and the request is never even shown. Resolving as anything else would be an incident.",
  alice:
    "A customer. Before the Association: a fresh KYC queue at every exchange. After: one credential in her own wallet, accepted by every member.",
};

export const CEXA_SCENES: SceneGraph = {
  stages: STAGES,
  title: "The Crypto Exchange Association",
  defaultViewBox: "40 40 1120 660",
  nodes: NODES,
  edges: EDGES,
  badges: BADGES,
  credentials: CREDENTIALS,
  accreditations: ACCREDITATIONS,
  nodeNotes: NODE_NOTES,
  stageView: {
    "3.1": {
      only: ["association"],
      viewBox: "330 60 540 230",
      maxWidth: "max-w-2xl",
    },
    "3.2": {
      only: ["association", "aurum"],
      viewBox: "120 60 700 440",
      maxWidth: "max-w-3xl",
    },
    "3.3": {
      only: ["association", "aurum", "borealis"],
      viewBox: "120 60 970 440",
      maxWidth: "max-w-4xl",
    },
    "3.4": {
      only: ["association", "aurum", "identisure", "alice"],
      viewBox: "60 60 760 640",
      maxWidth: "max-w-4xl",
    },
    "3.5": {
      only: ["association", "aurum", "borealis", "alice"],
      viewBox: "120 60 970 640",
    },
    "3.6": {
      only: ["alice", "darkpool", "borealis"],
      viewBox: "480 300 680 400",
      maxWidth: "max-w-3xl",
    },
  },
  stageChanges: {
    "3.5": {
      nodes: ["borealis", "aurum"],
      note: "Borealis pays per reuse: 0.30 to Aurum, 0.10 to the Association - and Alice never re-uploads a document.",
    },
    "3.6": {
      nodes: ["darkpool"],
      note: "DarkPool cannot present a single verifiable credential: Q1 fails, and the wallet never shows its request.",
    },
    "3.7": {
      nodes: ["alice", "aurum", "borealis"],
      note: "Aurum discovers fraud and revokes. The next check at any member shows the credential dead - one revocation, network-wide effect.",
    },
  },
  verifiedNote:
    "Trust cards go live against the Verana testnet resolver once the CEXA cast deploys - the DIDs above are placeholders today.",
};
