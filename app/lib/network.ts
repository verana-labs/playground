// The Verana network of this build. NEXT_PUBLIC_VERANA_NETWORK is inlined at
// build time (Dockerfile build arg), so the server bundle, the client bundle
// and the prerendered pages agree on one value. See docs/networks.md.

export type VeranaNetwork = "testnet" | "devnet";

/**
 * The Verana protocol of the network: v3 used the trust resolver and
 * vs-agent v1; v4 uses the indexer trust resolution and vs-agent v2.
 * Every network runs v4 now. The v3 code paths stay for reference only.
 */
export type VeranaProtocol = "v3" | "v4";

type NetworkConfig = {
  protocol: VeranaProtocol;
  label: string;
  chainId: string;
  ecsEcosystemDid: string;
};

// CI deploys testnet only (docs/networks.md). The devnet entry is for a
// local build against devnet.
const NETWORKS: Record<VeranaNetwork, NetworkConfig> = {
  testnet: {
    protocol: "v4",
    label: "TESTNET",
    chainId: "vna-testnet-1",
    ecsEcosystemDid:
      "did:webvh:QmVEcKodsZWNhMx6UT7Sq4V8JBrcvohdJTutG6q88WQPhQ:ecs-ecosystem.testnet.verana.network",
  },
  devnet: {
    protocol: "v4",
    label: "DEVNET",
    chainId: "vna-devnet-1",
    ecsEcosystemDid:
      "did:webvh:QmQueP3dCakEphRR694eYzZEhF53FvzPCPrdoHK3aMeFKh:ecs-ecosystem.devnet.verana.network",
  },
};

export const NETWORK: VeranaNetwork =
  process.env.NEXT_PUBLIC_VERANA_NETWORK === "devnet" ? "devnet" : "testnet";

export const NETWORK_CONFIG = NETWORKS[NETWORK];
export const PROTOCOL: VeranaProtocol = NETWORK_CONFIG.protocol;

/** A host name in the zone of the network: `<prefix>.<network>.verana.network`. */
export const networkHost = (prefix: string) => `${prefix}.${NETWORK}.verana.network`;
