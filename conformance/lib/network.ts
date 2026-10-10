import fs from "node:fs";
import yaml from "js-yaml";
import { z } from "zod";

const NetworkSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  vpr: z.string().min(1),
  protocol: z.enum(["v3", "v4"]),
  production: z.boolean(),
  castToken: z.string().min(1),
  resolver: z.url().nullable(),
  indexer: z.url().nullable(),
  rpc: z.url().nullable(),
  playground: z.url().nullable(),
  vocabulary: z.object({ ecosystem: z.string().min(1), participant: z.string().min(1) }),
  casts: z.array(z.string().min(1)).min(1).optional(),
  testable: z.boolean(),
  reason: z.string().min(1).optional(),
});

const NetworksFileSchema = z.object({ networks: z.array(NetworkSchema).min(1) });

export type Network = z.infer<typeof NetworkSchema>;

const TRUST_BACKEND_OF = { v3: "resolver", v4: "indexer" } as const;

export type TrustBackend = { kind: (typeof TRUST_BACKEND_OF)[Network["protocol"]]; url: string };

export function trustBackend(network: Network): TrustBackend {
  const kind = TRUST_BACKEND_OF[network.protocol];
  const url = network[kind];
  if (!url) throw new Error(`${network.id}: a ${network.protocol} network resolves trust with its ${kind}, which is not set`);
  return { kind, url };
}

const NETWORKS_FILE = new URL("../networks.yaml", import.meta.url);

export function parseNetworks(text: string): Network[] {
  const { networks } = NetworksFileSchema.parse(yaml.load(text, { schema: yaml.JSON_SCHEMA }));
  for (const n of networks) {
    const backend = TRUST_BACKEND_OF[n.protocol];
    if (n.testable && (!n[backend] || !n.playground))
      throw new Error(`${n.id}: a testable ${n.protocol} network needs a playground and its trust backend (${backend})`);
    if (!n.testable && !n.reason) throw new Error(`${n.id}: an untestable network needs a reason`);
  }
  return networks;
}

export function listNetworks(): Network[] {
  return parseNetworks(fs.readFileSync(NETWORKS_FILE, "utf8"));
}

export function selectedNetworks(): Network[] {
  const all = listNetworks();
  const wanted = process.env.CONFORMANCE_NETWORK;
  if (!wanted) return all;
  const found = all.find((n) => n.id === wanted);
  if (!found) throw new Error(`unknown network ${wanted}; known: ${all.map((n) => n.id).join(", ")}`);
  return [found];
}

export const testableNetworks = (): Network[] => selectedNetworks().filter((n) => n.testable);
export const untestableNetworks = (): Network[] => selectedNetworks().filter((n) => !n.testable);
