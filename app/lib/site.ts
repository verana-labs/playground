// Single source of truth for site identity, endpoints, and outbound links.
// Spec: verana-labs/verana-spec → playground/spec.md

export const SITE_URL = "https://playground.testnet.verana.network";
export const SITE_NAME = "Verana Playground";
export const SITE_TAGLINE = "Try the open trust layer. Live.";
export const SITE_DESCRIPTION =
  "The Verana Playground: understand the Verana concepts through the ACME story, and try the integrated user and cloud wallets — everything live on the Verana testnet, nothing simulated.";

/** Testnet endpoints (playground/README.md — shared reference). */
export const ENDPOINTS = {
  rpc: "https://rpc.testnet.verana.network",
  api: "https://api.testnet.verana.network",
  indexer: "https://idx.testnet.verana.network",
  resolver: "https://resolver.testnet.verana.network",
  frontend: "https://app.testnet.verana.network",
  faucet: "https://faucet-vs.testnet.verana.network",
} as const;

/** The trusted ECS Ecosystem anchor (from verana-labs/verana-demos). */
export const ECS_ECOSYSTEM_DID =
  "did:webvh:QmPXNqN9qj5eeFviA7d1ToPUPiN8KZcn2QwSWFjZXx4dZS:organization-vs.main.demos.testnet.verana.network";

export const NETWORK_NAME = "TESTNET";

export const LINKS = {
  veranaIo: "https://verana.io",
  docs: "https://docs.verana.io",
  foundation: "https://veranafoundation.org",
  council: "https://veranacouncil.org",
  github: "https://github.com/verana-labs",
  repo: "https://github.com/verana-labs/playground",
  spec: "https://github.com/verana-labs/verana-spec/tree/main/playground",
  guidelineUserWallet:
    "https://github.com/verana-labs/verana-spec/blob/main/playground/guidelines/user-wallet-integration.md",
  guidelineCloudWallet:
    "https://github.com/verana-labs/verana-spec/blob/main/playground/guidelines/cloud-wallet-integration.md",
  vtSpecV3: "https://verana-labs.github.io/verifiable-trust-spec/index-v3.html",
  vprSpecV3:
    "https://verana-labs.github.io/verifiable-trust-vpr-spec/index-v3.html",
  veranaDemos: "https://github.com/verana-labs/verana-demos",
} as const;
