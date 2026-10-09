// Single source of truth for site identity, endpoints, and outbound links.
// Spec: verana-labs/verana-spec → playground/spec.md

import { NETWORK, NETWORK_CONFIG, PROTOCOL, networkHost } from "./network";

export const SITE_URL = `https://${networkHost("playground")}`;
export const SITE_NAME = "Verana Playground";
export const SITE_TAGLINE = "Try the open trust layer. Live.";
export const SITE_DESCRIPTION =
  `The Verana Playground: understand the Verana concepts through the Vesta Appliances story, and try the integrated personal and business wallets - everything live on the Verana ${NETWORK}, nothing simulated.`;

/** Endpoints of the network (playground/README.md - shared reference). */
export const ENDPOINTS = {
  rpc: `https://${networkHost("rpc")}`,
  api: `https://${networkHost("api")}`,
  indexer: `https://${networkHost("idx")}`,
  // On V4 the indexer resolves trust; there is no separate resolver.
  resolver: `https://${networkHost(PROTOCOL === "v4" ? "idx" : "resolver")}`,
  resolverDocs:
    PROTOCOL === "v4"
      ? `https://${networkHost("idx")}/openapi.json`
      : `https://${networkHost("resolver")}/docs`,
  frontend: `https://${networkHost("app")}`,
  faucet: `https://${networkHost(PROTOCOL === "v4" ? "faucet" : "faucet-vs")}`,
} as const;

/** The ECS Ecosystem of the network (the trust anchor). */
export const ECS_ECOSYSTEM_DID = NETWORK_CONFIG.ecsEcosystemDid;

export const NETWORK_NAME = NETWORK_CONFIG.label;
export const NETWORK_PRODUCTION = false;

export const LINKS = {
  veranaIo: "https://verana.io",
  docs: "https://docs.verana.io",
  foundation: "https://veranafoundation.org",
  council: "https://veranacouncil.org",
  github: "https://github.com/verana-labs",
  repo: "https://github.com/verana-labs/playground",
  spec: "https://github.com/verana-labs/verana-spec/tree/main/playground",
  guidelineUserWallet:
    "https://github.com/verana-labs/verana-spec/blob/main/playground/guidelines/personal-wallet-integration.md",
  guidelineCloudWallet:
    "https://github.com/verana-labs/verana-spec/blob/main/playground/guidelines/business-wallet-integration.md",
  vtSpec: "https://verana-labs.github.io/verifiable-trust-spec/",
  vuaDefinition:
    "https://verana-labs.github.io/verifiable-trust-spec/#what-is-a-verifiable-user-agent-vua",
  vprSpec:
    "https://verana-labs.github.io/verifiable-trust-vpr-spec/",
  veranaDemos: "https://github.com/verana-labs/verana-demos",
} as const;
