import fs from "node:fs";
import yaml from "js-yaml";
import { z } from "zod";
import { obtainUrls, type WalletProfile } from "../../app/lib/wallet-profiles";
import { knownTags, mutableLinkProblem, type LinkRole } from "../../app/lib/wallet-refs";

export type Finding = { wallet: string; where: string; value: string; problem: string };

const LinkFieldSchema = z.union([z.string(), z.object({ url: z.string() })]).optional();

const LINK_FIELDS = {
  hosted: "build",
  download: "build",
  playstore: "build",
  appstore: "build",
  web: "build",
  fork: "source",
  repo: "source",
  website: "source",
} as const satisfies Record<string, LinkRole>;

const ListingWalletSchema = z.looseObject({
  id: z.string().min(1),
  status: z.enum(["recommended", "compatible", "testing"]).default("testing"),
  hidden: z.boolean().optional(),
  hosted: LinkFieldSchema,
  download: LinkFieldSchema,
  playstore: LinkFieldSchema,
  appstore: LinkFieldSchema,
  web: LinkFieldSchema,
  fork: LinkFieldSchema,
  repo: LinkFieldSchema,
  website: LinkFieldSchema,
});

export type ListingWallet = z.infer<typeof ListingWalletSchema>;

const ListingSchema = z.object({ wallets: z.array(ListingWalletSchema) });

export const ListingExceptionSchema = z.object({
  wallet: z.string().min(1),
  value: z.string().min(1),
  reason: z.string().min(1),
  expires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type ListingException = z.infer<typeof ListingExceptionSchema>;

const ExceptionsFileSchema = z.object({ exceptions: z.array(ListingExceptionSchema) });

const REPO_ROOT = new URL("../../", import.meta.url);

export const readListingText = (): string => fs.readFileSync(new URL("personal-wallets.yaml", REPO_ROOT), "utf8");

export const parseListing = (text: string): ListingWallet[] => ListingSchema.parse(yaml.load(text, { schema: yaml.JSON_SCHEMA })).wallets;

export const readExceptions = (): ListingException[] =>
  ExceptionsFileSchema.parse(yaml.load(fs.readFileSync(new URL("../listing-exceptions.yaml", import.meta.url), "utf8"), { schema: yaml.JSON_SCHEMA })).exceptions;

const urlOf = (field: z.infer<typeof LinkFieldSchema>): string | undefined => (typeof field === "string" ? field : field?.url);

export function linkFindings(wallets: ListingWallet[], profiles: WalletProfile[]): Finding[] {
  const links = wallets.flatMap((w) =>
    (Object.entries(LINK_FIELDS) as [keyof typeof LINK_FIELDS, LinkRole][]).flatMap(([field, role]) => {
      const url = urlOf(w[field]);
      return url ? [{ wallet: w.id, where: field, url, role }] : [];
    }),
  );
  const builds = profiles.flatMap((p) =>
    p.builds.flatMap((build, i) => [
      ...obtainUrls(build).map((url) => ({ wallet: p.id, where: `profile builds[${i}].obtain`, url, role: "build" as const })),
      ...(build.identity.repo ? [{ wallet: p.id, where: `profile builds[${i}].identity.repo`, url: build.identity.repo, role: "source" as const }] : []),
    ]),
  );
  const tags = knownTags([...links, ...builds].map((l) => l.url));
  return [...links, ...builds].flatMap(({ wallet, where, url, role }) => {
    const problem = mutableLinkProblem(url, role, tags);
    return problem ? [{ wallet, where, value: url, problem }] : [];
  });
}

export function unpinnedBuildFindings(profiles: WalletProfile[]): Finding[] {
  return profiles.flatMap((p) =>
    p.builds.flatMap((build, i): Finding[] => {
      const where = `profile builds[${i}].identity`;
      if (build.kind === "store")
        return build.identity.version ? [] : [{ wallet: p.id, where, value: obtainUrls(build)[0] ?? "", problem: "a store build names no identity.version" }];
      if (build.identity.repo && build.identity.ref) return [];
      const missing = build.identity.repo ? "identity.ref" : "identity.repo and identity.ref";
      return [{ wallet: p.id, where, value: build.identity.repo ?? obtainUrls(build)[0] ?? "", problem: `names no ${missing} to rebuild it from` }];
    }),
  );
}

export function triage(findings: Finding[], exceptions: ListingException[], today: string) {
  const covers = (e: ListingException, f: Finding) => e.wallet === f.wallet && e.value === f.value;
  return {
    open: findings.filter((f) => !exceptions.some((e) => covers(e, f))),
    stale: exceptions.filter((e) => !findings.some((f) => covers(e, f))),
    expired: exceptions.filter((e) => e.expires < today),
  };
}

export const describeFinding = (f: Finding): string => `${f.wallet} ${f.where}: ${f.value} ${f.problem}`;
