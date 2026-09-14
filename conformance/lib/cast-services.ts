import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import type { Network } from "./network";

export type CastService = {
  cast: string;
  org: string;
  id: string;
  host: string;
  pinnedTag: string;
  oid4vcRole: "issuer" | "verifier" | null;
  demoPerm: "issuer" | "verifier" | "none" | null;
  issuerId: string | null;
  configPath: string;
};

const DEFAULT_WORKFLOWS_DIR = fileURLToPath(new URL("../../.github/workflows/", import.meta.url));

function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = /^([A-Z0-9_]+)=("?)(.*?)\2\s*$/.exec(line.trim());
    if (m && m[1] !== undefined && m[3] !== undefined) out[m[1]] = m[3];
  }
  return out;
}

function templateTag(castDir: string, cast: string): string {
  const doc = yaml.load(fs.readFileSync(path.join(castDir, "deployment.template.yaml"), "utf8"), { schema: yaml.JSON_SCHEMA });
  const record = doc as { image?: { tag?: unknown }; chartVersion?: unknown };
  const tag = record.image?.tag ?? record.chartVersion;
  if (typeof tag !== "string" || !tag) throw new Error(`${cast}: deployment.template.yaml has no image tag`);
  return tag;
}

function issuerIdOf(castDir: string, role: string | undefined): string | null {
  if (!role?.startsWith("issuer")) return null;
  const file = path.join(castDir, "oid4vc", `${role}.json.tpl`);
  if (!fs.existsSync(file)) return null;
  const m = /"issuer"\s*:\s*\{\s*"id"\s*:\s*"([^"]+)"/.exec(fs.readFileSync(file, "utf8"));
  return m?.[1] ?? null;
}

function roleOf(value: string | undefined): CastService["oid4vcRole"] {
  if (!value) return null;
  if (value.startsWith("issuer")) return "issuer";
  if (value.startsWith("verifier")) return "verifier";
  return null;
}

function permOf(value: string | undefined): CastService["demoPerm"] {
  return value === "issuer" || value === "verifier" || value === "none" ? value : null;
}

export function listCastServices(network: Network, workflowsDir: string = DEFAULT_WORKFLOWS_DIR): CastService[] {
  const casts = fs
    .readdirSync(workflowsDir)
    .filter((d) => fs.existsSync(path.join(workflowsDir, d, "orgs")))
    .sort();
  return casts.flatMap((cast) => {
    const castDir = path.join(workflowsDir, cast);
    const tag = templateTag(castDir, cast);
    return fs
      .readdirSync(path.join(castDir, "orgs"))
      .sort()
      .map((org) => {
        const configPath = path.join(castDir, "orgs", org, "config.env");
        const env = parseEnv(fs.readFileSync(configPath, "utf8"));
        const id = env.RELEASE_NAME;
        const host = env.INGRESS_HOST?.replaceAll("__NETWORK__", network.castToken);
        if (!id || !host) throw new Error(`${configPath}: RELEASE_NAME and INGRESS_HOST are required`);
        return {
          cast,
          org,
          id,
          host,
          pinnedTag: env.VS_AGENT_IMAGE_TAG || tag,
          oid4vcRole: roleOf(env.OID4VC_ROLE),
          demoPerm: permOf(env.DEMO_PERM),
          issuerId: issuerIdOf(castDir, env.OID4VC_ROLE),
          configPath,
        };
      });
  });
}

export function scopedCasts(): string[] {
  return (process.env.CONFORMANCE_CASTS ?? "demo,eventos")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const inScope = (service: CastService): boolean => scopedCasts().includes(service.cast);

export function issuerMetadataUrls(service: CastService): string[] {
  const urls = [`https://${service.host}/.well-known/openid-credential-issuer`];
  if (service.issuerId) urls.push(`https://${service.host}/oid4vci/${service.issuerId}/.well-known/openid-credential-issuer`);
  return urls;
}
