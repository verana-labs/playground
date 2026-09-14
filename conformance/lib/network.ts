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
  testable: z.boolean(),
  reason: z.string().min(1).optional(),
});

const NetworksFileSchema = z.object({ networks: z.array(NetworkSchema).min(1) });

export type Network = z.infer<typeof NetworkSchema>;

const NETWORKS_FILE = new URL("../networks.yaml", import.meta.url);

export function listNetworks(): Network[] {
  const raw = yaml.load(fs.readFileSync(NETWORKS_FILE, "utf8"), { schema: yaml.JSON_SCHEMA });
  const { networks } = NetworksFileSchema.parse(raw);
  for (const n of networks) {
    if (n.testable && (!n.resolver || !n.playground))
      throw new Error(`${n.id}: a testable network needs a resolver and a playground`);
    if (!n.testable && !n.reason) throw new Error(`${n.id}: an untestable network needs a reason`);
  }
  return networks;
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
