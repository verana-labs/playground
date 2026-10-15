// The CEXA cast - the Crypto Exchange Association (demo) and its members
// (exchanges and banks: one membership, one fee schedule), deployed and
// provisioned by the cexa-* workflows (.github/workflows/cexa/README.md).
//
// Testnet (V3): the DIDs below are the live did:webvh values. Refresh a value
// from https://<host>/.well-known/did.jsonl (state.id) if an agent is created
// again from scratch.
// Devnet (V4): the app finds each agent by its host, so `did` is undefined.

import { NETWORK, PROTOCOL, networkHost } from "./network";
import { ENDPOINTS } from "./site";

/** A CEXA cast member. `did` is known on testnet only. */
export type CexaMember = {
  host: string;
  did?: string;
};

const ZONE = networkHost("cexa.playground");

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmCexaCastPending111111111111111111111111111";

/** The testnet DID of a member; undefined on the other networks. */
const testnetDid = (did: string) => (NETWORK === "testnet" ? did : undefined);

export const CEXA_CAST = {
  /** The Association: controls the Ecosystem and both schemas. */
  association: {
    host: `association.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmRp5jsiA5HuA2AfUS9H6MhqaMQ6qD5P8vT3ZzrbbtWrzq:association.cexa.playground.testnet.verana.network",
    ),
  },
  /** Accredited issuer member - runs the full KYC, issues the credential. */
  aurum: {
    host: `aurum.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmRuewX4EPBQLiK4mWwJkrw4JKfzbzoNM9YTbCznjGWNfc:aurum.cexa.playground.testnet.verana.network",
    ),
  },
  /** Accredited verifier member - accepts the credential on reuse. */
  borealis: {
    host: `borealis.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmZhWnfEmxZa8QYYeWBj5PCbze3Vv1jjmtT6R6Udu2NCzq:borealis.cexa.playground.testnet.verana.network",
    ),
  },
  /** Bank member, ISSUER + VERIFIER - the cross-sector corridor. */
  novara: {
    host: `novara.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmXesvi2DDWVt9MgdxXziP92bojMf4X9pFYA4z7gABnpUM:novara.cexa.playground.testnet.verana.network",
    ),
  },
  /** The outsider: a real, verifiable exchange that never joined - ECS
   *  credentials only, no membership, no CEXA-VerifiedCounterparty. */
  darkpool: {
    host: `darkpool.${ZONE}`,
    did: testnetDid(
      "did:webvh:QmVap281SXu4pZRYEUdCS1pRpbZYdafzugFWE9H4bxXfEc:darkpool.cexa.playground.testnet.verana.network",
    ),
  },
} as const satisfies Record<string, CexaMember>;

/** True while a cast DID is still an explicit placeholder. An undefined DID
 *  (devnet) is not a placeholder: the app finds the DID from the host. */
export const isPendingDid = (did: string | undefined) =>
  did !== undefined && did.includes(PENDING);

/** Credential-type names provisioned on the cast agents (workflow contract). */
export const CEXA_KYC_NAME = "CEXA-Kyc";
export const CEXA_COUNTERPARTY_NAME = "CEXA-VerifiedCounterparty";

/** V4: the JSON Schema titles of the two schemas (.github/workflows/cexa/cast.sh).
 *  The app finds each schema id and VTJSC by its title (app/lib/vtjsc.ts). */
export const CEXA_KYC_TITLE = "CEXAKycCredential";
export const CEXA_COUNTERPARTY_TITLE = "CEXAVerifiedCounterpartyCredential";

/** V3: the VTJSCs of the two schemas, published by the Association
 *  (vs-agent naming convention: /vt/schemas-<base>-jsc.json). The
 *  CEXA-VerifiedCounterparty credential is org-level and published by each member
 *  as a Linked VP: counterparty checks are free reads of the member's DID.
 *  On V4 the agent names each VTJSC after the numeric schema id, so the app
 *  finds it at run time (app/lib/vtjsc.ts). */
export const CEXA_KYC_JSC = `https://${CEXA_CAST.association.host}/vt/schemas-cexa-kyc-jsc.json`;
export const CEXA_COUNTERPARTY_JSC = `https://${CEXA_CAST.association.host}/vt/schemas-cexa-verified-counterparty-jsc.json`;

/** The path of the example EGF document on the playground site. Testnet (V3)
 *  serves public/cexa/cexa-egf.md, the document that the V3 trust registry
 *  anchors. V4 serves public/cexa/cexa-egf-v4.md (the same rules in V4 terms),
 *  which the cexa-01 workflow anchors by digest. CAUTION: the chain keeps the
 *  digest of each document, so do not change a document after its anchor. */
export const CEXA_EGF_PATH =
  PROTOCOL === "v4" ? "/cexa/cexa-egf-v4.md" : "/cexa/cexa-egf.md";
export const CEXA_EGF_URL = `https://${networkHost("playground")}${CEXA_EGF_PATH}`;

/** The name of the issuer of the ECS-Organization credential of every cast
 *  member. On V4 each agent gets it from ecs-org-issuer, the organization
 *  issuer of the ECS Ecosystem. */
export const CEXA_ECS_ORG_ISSUER =
  PROTOCOL === "v4"
    ? `ECS Organization Issuer (${NETWORK})`
    : "Helvetia Trust Services (demo)";

// ---------------------------------------------------------------------------
// The EGF fee schedule and the network rates that drive every money panel of
// the use case. Fees are EGF-governed (the association sets them); the rates
// are network governance parameters (target Model C values). Amounts in
// USDC, the pricing asset of both CEXA schemas; trust deposits always settle
// in the native denom and are shown as fiat-worth.

export const CEXA_FEES = {
  /** Pricing asset of both schemas (CredentialSchema.pricing_asset). */
  pricingAsset: "USDC",
  /** Yearly membership dues (validation fees on the ecosystem root). */
  duesIssuerYearlyUsdc: 5000,
  duesVerifierYearlyUsdc: 2000,
  /** Issuing the credential is free by design: no toll on the on-ramp. */
  issuanceUsdc: 0,
  /** Per-reuse verification fees. Example values: any framework sets its
   *  own schedule; the split mechanism reads the same regardless. */
  verificationIssuerUsdc: 0.9,
  verificationEcosystemUsdc: 0.1,
  /** Market reference: a full KYC check with AML screening at a leading
   *  IDV provider (list price; volume pricing is lower). */
  fullKycUsdc: 1.85,
} as const;

export const CEXA_RATES = {
  /** Deposit-bound share of every trust fee, both payer and payee side. */
  trustDepositRate: 0.05,
  /** Wallet user agent reward, share of the fees of a paid session. */
  walletAgentRewardRate: 0.05,
  /** User agent reward, share of the fees of a paid session. */
  userAgentRewardRate: 0.05,
  /** Trust unit peg decay per daily epoch (score half-life ~23 months). */
  tuDecayPerEpoch: 0.001,
} as const;

/** On-chain ids of the CEXA Ecosystem and of its two schemas. */
type CexaIds = {
  ecosystem?: number;
  kycSchema?: number;
  counterpartySchema?: number;
};

/** Testnet (V3): the trust registry and the schemas that cexa-01 made. */
const TESTNET_IDS: CexaIds = { ecosystem: 197, kycSchema: 261, counterpartySchema: 262 };

/** Devnet (V4): put the ids here after cexa-01 runs. The pages link to the
 *  Verana app only when an id is known. */
const DEVNET_IDS: CexaIds = {};

const IDS = NETWORK === "testnet" ? TESTNET_IDS : DEVNET_IDS;

export const CEXA_TRUST_REGISTRY_ID = IDS.ecosystem;
export const CEXA_KYC_SCHEMA_ID = IDS.kycSchema;
export const CEXA_COUNTERPARTY_SCHEMA_ID = IDS.counterpartySchema;

/** Deep links to the Verana app. V3 shows the ecosystem at /tr/<id> and a
 *  schema at /tr/cs/<id>. V4 shows them at /ecosystems/<id> and
 *  /credential-schemas/<id>. Both show the participant tree of a schema at
 *  /participants/<schemaId>. */
export const cexaEcosystemUrl = (id: number) =>
  `${ENDPOINTS.frontend}${PROTOCOL === "v4" ? "/ecosystems/" : "/tr/"}${id}`;
export const cexaSchemaUrl = (id: number) =>
  `${ENDPOINTS.frontend}${PROTOCOL === "v4" ? "/credential-schemas/" : "/tr/cs/"}${id}`;
export const cexaParticipantsUrl = (schemaId: number) =>
  `${ENDPOINTS.frontend}/participants/${schemaId}`;

/** Total verification fee per reuse, before deposits and rewards. */
export const CEXA_REUSE_FEE_USDC =
  CEXA_FEES.verificationIssuerUsdc + CEXA_FEES.verificationEcosystemUsdc;
