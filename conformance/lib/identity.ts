import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { listCastServices, type CastService } from "./cast-services";
import { fetchWithTimeout } from "./http";
import type { Network } from "./network";

const exec = promisify(execFile);

export type ServingVersion = {
  imageTag: string | null;
  packageVersion: string | null;
  source: "kubectl" | "landing";
  error?: string;
};

export const clusterNamespace = (): string | undefined => process.env.CONFORMANCE_K8S_NAMESPACE || undefined;

async function fromCluster(service: CastService, namespace: string): Promise<ServingVersion> {
  try {
    const { stdout } = await exec(
      "kubectl",
      ["get", "statefulset", service.id, "-n", namespace, "-o", "jsonpath={.spec.template.spec.containers[*].image}"],
      { timeout: 20_000 },
    );
    const image = stdout.split(/\s+/).find((i) => i.includes("veranalabs/vs-agent"));
    return { imageTag: image?.split(":").pop() ?? null, packageVersion: null, source: "kubectl", ...(image ? {} : { error: `no vs-agent container in: ${stdout}` }) };
  } catch (e) {
    return { imageTag: null, packageVersion: null, source: "kubectl", error: e instanceof Error ? e.message : String(e) };
  }
}

async function fromLanding(service: CastService): Promise<ServingVersion> {
  try {
    const res = await fetchWithTimeout(`https://${service.host}/`, { headers: { accept: "text/html" } });
    const html = await res.text();
    const version = /"version":"([^"]+)"/.exec(html)?.[1] ?? null;
    return { imageTag: null, packageVersion: version, source: "landing", ...(res.ok ? {} : { error: `HTTP ${res.status}` }) };
  } catch (e) {
    return { imageTag: null, packageVersion: null, source: "landing", error: e instanceof Error ? e.message : String(e) };
  }
}

export function servingVersion(service: CastService): Promise<ServingVersion> {
  const namespace = clusterNamespace();
  return namespace ? fromCluster(service, namespace) : fromLanding(service);
}

export async function snapshotTags(network: Network): Promise<Record<string, string | null>> {
  const namespace = clusterNamespace();
  if (!namespace) return {};
  const entries = await Promise.all(listCastServices(network).map(async (s) => [s.id, (await fromCluster(s, namespace)).imageTag] as const));
  return Object.fromEntries(entries);
}
