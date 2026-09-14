import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { z } from "zod";

export const RAILS = ["anoncreds", "openid4vc-sdjwt"] as const;
export const BUILD_KINDS = ["store", "publisher", "fork", "browser"] as const;
export const PLATFORMS = ["android", "ios", "web"] as const;
export const VCI_DRAFTS = ["draft11", "draft13", "draft15", "v1"] as const;
export const VP_QUERY_LANGUAGES = ["dcql", "presentation_exchange"] as const;
export const VP_CLIENT_ID_PREFIXES = ["x509_hash", "did"] as const;
export const VP_RESPONSE_MODES = ["direct_post", "direct_post.jwt"] as const;
export const AS_DOCUMENTS = ["oauth-authorization-server", "openid-configuration"] as const;
export const UNLOCK_RECIPES = ["password", "passcode", "pinfield", "keypad6", "device-credential", "none"] as const;
export const VIEW_TREES = ["readable", "ocr", "browser"] as const;
export const BUILD_POLICIES = [
  "signed-issuer-metadata",
  "eu-trusted-list-anchor",
  "no-did-issuers",
  "did-client-id-only",
  "strict-webvh-log",
] as const;
export const CONFORMANCE_SCENARIOS = [
  "issue-accredited",
  "issue-unaccredited",
  "issue-untrusted",
  "present-accredited",
  "present-unaccredited",
  "present-untrusted",
  "boleto-asistente",
  "boleto-patrocinador",
  "entrada-costa-rica",
  "entrada-otro-evento",
] as const;

const scheme = z.string().regex(/^[a-z][a-z0-9.+-]*$/);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const PresentationSchema = z.object({
  query: z.enum(VP_QUERY_LANGUAGES),
  clientId: z.enum(VP_CLIENT_ID_PREFIXES),
  responseMode: z.enum(VP_RESPONSE_MODES),
});

const OpenId4VcSchema = z.object({
  library: z.string().min(1),
  proxy: z.string().min(1),
  vciDrafts: z.array(z.enum(VCI_DRAFTS)).min(1),
  offerSchemes: z.array(scheme).min(1),
  requestSchemes: z.array(scheme).min(1),
  asDiscovery: z.array(z.enum(AS_DOCUMENTS)).min(1),
  presentation: PresentationSchema,
  demoParams: z.string(),
});

const DidCommSchema = z.object({
  library: z.string().min(1),
  proxy: z.string().min(1),
  invitationSchemes: z.array(scheme).min(1),
  demoParams: z.string(),
});

const IdentitySchema = z.object({
  package: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  repo: z.string().url().optional(),
  ref: z.string().min(1).optional(),
  url: z.string().url().optional(),
});

const IncompatibilitySchema = z.object({
  cause: z.string().min(1),
  reference: z.string().url().optional(),
  scenarios: z.union([z.literal("all"), z.array(z.enum(CONFORMANCE_SCENARIOS)).min(1)]),
  services: z.array(z.string().min(1)).optional(),
  verified: isoDate,
});

const DeviceSchema = z.object({
  activity: z.string().min(1),
  unlock: z.enum(UNLOCK_RECIPES),
  secret: z.string().optional(),
  coldStart: z.boolean(),
  neverForceStop: z.boolean().optional(),
});

const BuildSchema = z.object({
  kind: z.enum(BUILD_KINDS),
  listed: z.boolean().optional(),
  label: z.string().min(1),
  obtain: z.string().url(),
  identity: IdentitySchema,
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  presumptive: z.array(z.enum(PLATFORMS)).optional(),
  promises: z.string().min(1),
  presentation: PresentationSchema.optional(),
  demoParams: z.string().optional(),
  policies: z.array(z.enum(BUILD_POLICIES)).optional(),
  incompatibilities: z.array(IncompatibilitySchema).optional(),
  device: DeviceSchema.optional(),
});

const QuirksSchema = z.object({
  actsOnLinkOnlyAtColdStart: z.boolean(),
  locksOnBackground: z.boolean(),
  viewTree: z.enum(VIEW_TREES),
  notes: z.string().optional(),
});

const BRANCH_LIKE = /\/|^(main|master|develop|dev|trunk)$/;

function demoParamsIssues(presentation: z.infer<typeof PresentationSchema>, demoParams: string): string[] {
  const parts = new Set(demoParams.split("&").filter(Boolean));
  const issues: string[] = [];
  if (presentation.query === "presentation_exchange" && !parts.has("query=pe"))
    issues.push("presentation_exchange needs query=pe");
  if (presentation.query === "dcql" && parts.has("query=pe"))
    issues.push("dcql must not carry query=pe");
  if (presentation.clientId === "x509_hash" && !parts.has("signer=x5c"))
    issues.push("an x509_hash client id needs signer=x5c");
  if (presentation.clientId === "did" && parts.has("signer=x5c"))
    issues.push("a did client id must not carry signer=x5c: without a signer the service signs with its DID");
  return issues;
}

export const WalletProfileSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    rails: z.array(z.enum(RAILS)).min(1),
    openid4vc: OpenId4VcSchema.optional(),
    didcomm: DidCommSchema.optional(),
    builds: z.array(BuildSchema).min(1),
    quirks: QuirksSchema,
  })
  .superRefine((profile, ctx) => {
    const issue = (message: string, p: (string | number)[] = []) =>
      ctx.addIssue({ code: "custom", message, path: p });
    if (profile.rails.includes("openid4vc-sdjwt") && !profile.openid4vc)
      issue("openid4vc-sdjwt rail needs an openid4vc block", ["openid4vc"]);
    if (profile.rails.includes("anoncreds") && !profile.didcomm)
      issue("anoncreds rail needs a didcomm block", ["didcomm"]);
    if (profile.openid4vc)
      for (const m of demoParamsIssues(profile.openid4vc.presentation, profile.openid4vc.demoParams))
        issue(m, ["openid4vc", "demoParams"]);
    const listed = profile.builds.filter((b) => b.listed);
    if (listed.length !== 1) issue(`exactly one build must be listed, found ${listed.length}`, ["builds"]);
    profile.builds.forEach((build, i) => {
      const at = (...p: (string | number)[]) => ["builds", i, ...p];
      for (const platform of build.presumptive ?? [])
        if (!build.platforms.includes(platform)) issue(`presumptive platform ${platform} is not declared`, at("presumptive"));
      if (build.kind === "browser" && !build.identity.url) issue("a browser build needs identity.url", at("identity"));
      if (build.kind !== "browser" && build.platforms.includes("android") && !build.identity.package)
        issue("an android build needs identity.package", at("identity"));
      if (build.kind !== "browser" && build.platforms.includes("android") && !build.device)
        issue("an android build needs a device block", at("device"));
      if (build.kind === "browser" && build.device) issue("a browser build has no device block", at("device"));
      if (build.kind === "fork") {
        const { repo, ref } = build.identity;
        if (!repo || !ref) issue("a fork build needs identity.repo and identity.ref (a commit or a tag)", at("identity"));
        else if (BRANCH_LIKE.test(ref)) issue(`identity.ref ${ref} looks like a branch; name a commit or a tag`, at("identity", "ref"));
      }
      const presentation = build.presentation ?? profile.openid4vc?.presentation;
      const demoParams = build.demoParams ?? profile.openid4vc?.demoParams;
      if (presentation && demoParams !== undefined)
        for (const m of demoParamsIssues(presentation, demoParams)) issue(m, at("demoParams"));
    });
  });

export type WalletProfile = z.infer<typeof WalletProfileSchema>;
export type WalletBuild = WalletProfile["builds"][number];
export type WalletPresentation = z.infer<typeof PresentationSchema>;

export const DEFAULT_PROFILES_DIR = path.join(process.cwd(), "conformance", "profiles");

export function listWalletProfiles(dir: string = DEFAULT_PROFILES_DIR): WalletProfile[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .map((file) => {
      const raw = yaml.load(fs.readFileSync(path.join(dir, file), "utf8"), { schema: yaml.JSON_SCHEMA });
      const parsed = WalletProfileSchema.safeParse(raw);
      if (!parsed.success) throw new Error(`${file}: ${parsed.error.message}`);
      if (`${parsed.data.id}.yaml` !== file) throw new Error(`${file}: file name must be ${parsed.data.id}.yaml`);
      return parsed.data;
    });
}

export function getWalletProfile(id: string, dir: string = DEFAULT_PROFILES_DIR): WalletProfile | undefined {
  return listWalletProfiles(dir).find((p) => p.id === id);
}

export function listedBuild(profile: WalletProfile): WalletBuild {
  const build = profile.builds.find((b) => b.listed);
  if (!build) throw new Error(`${profile.id}: no listed build`);
  return build;
}

export function effectivePresentation(profile: WalletProfile, build: WalletBuild): WalletPresentation | undefined {
  return build.presentation ?? profile.openid4vc?.presentation;
}

export function effectiveDemoParams(profile: WalletProfile, build: WalletBuild): string {
  return build.demoParams ?? profile.openid4vc?.demoParams ?? profile.didcomm?.demoParams ?? "";
}
