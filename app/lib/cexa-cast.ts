// The CEXA cast on the Verana testnet - the Crypto Exchange Association
// (demo) and its members (exchanges and banks: one membership, one fee
// schedule), to be deployed and provisioned by the cexa-* workflows
// (phase 2). Every DID below is still a pending placeholder: refresh each
// value from https://<host>/.well-known/did.jsonl (state.id) once the host
// is live.

import type { CastMember } from "./vesta-cast";

const ZONE = "cexa.playground.testnet.verana.network";

/** Base58-safe, unmistakably fake SCID - replaced when the agent deploys. */
const PENDING = "QmCexaCastPending111111111111111111111111111";

export const CEXA_CAST = {
  /** The association anchor: owns the trust registry and both schemas. */
  association: {
    host: `association.${ZONE}`,
    did: `did:webvh:${PENDING}:association.${ZONE}`,
  },
  /** Accredited issuer member - runs the full KYC, issues the credential. */
  aurum: {
    host: `aurum.${ZONE}`,
    did: `did:webvh:${PENDING}:aurum.${ZONE}`,
  },
  /** Accredited verifier member - accepts the credential on reuse. */
  borealis: {
    host: `borealis.${ZONE}`,
    did: `did:webvh:${PENDING}:borealis.${ZONE}`,
  },
  /** Bank member, ISSUER + VERIFIER - the cross-sector corridor. */
  novara: {
    host: `novara.${ZONE}`,
    did: `did:webvh:${PENDING}:novara.${ZONE}`,
  },
  /** Deliberately unprovisioned (umbra pattern): a DID and nothing else. */
  darkpool: {
    host: `darkpool.${ZONE}`,
    did: `did:webvh:${PENDING}:darkpool.${ZONE}`,
  },
} as const satisfies Record<string, CastMember>;

/** True while a cast DID is still an explicit placeholder. */
export const isPendingDid = (did: string) => did.includes(PENDING);

/** Credential-type names provisioned on the cast agents (workflow contract). */
export const CEXA_KYC_NAME = "CryptoExchangeKYC";
export const CEXA_COUNTERPARTY_NAME = "VerifiedCounterparty";

/** VTJSCs of the two founding schemas, published by the association anchor
 *  (vs-agent naming convention: /vt/schemas-<base>-jsc.json). The
 *  VerifiedCounterparty credential is org-level and published by each member
 *  as a Linked VP: counterparty checks are free reads of the member's DID. */
export const CEXA_KYC_JSC = `https://${CEXA_CAST.association.host}/vt/schemas-crypto-exchange-kyc-jsc.json`;
export const CEXA_COUNTERPARTY_JSC = `https://${CEXA_CAST.association.host}/vt/schemas-verified-counterparty-jsc.json`;

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

/** Total verification fee per reuse, before deposits and rewards. */
export const CEXA_REUSE_FEE_USDC =
  CEXA_FEES.verificationIssuerUsdc + CEXA_FEES.verificationEcosystemUsdc;
