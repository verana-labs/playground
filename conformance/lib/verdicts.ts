import fs from "node:fs";
import yaml from "js-yaml";
import { z } from "zod";
import {
  CLIENT_ID_PREFIXES,
  DIDCOMM_VERSIONS,
  RAILS,
  SUPPORT,
  VC_FORMATS,
  VCI_GRANTS,
  VCI_PROOF_TYPES,
  VP_QUERY_LANGUAGES,
  VP_RESPONSE_MODES,
  effectivePresentation,
  listedBuilds,
  type WalletBuild,
  type WalletProfile,
  type WalletRail,
} from "../../app/lib/wallet-profiles";

const OpenId4VcOfferSchema = z.strictObject({
  grants: z.array(z.enum(VCI_GRANTS)),
  proofTypes: z.array(z.enum(VCI_PROOF_TYPES)),
  formats: z.array(z.enum(VC_FORMATS)),
  queryLanguages: z.array(z.enum(VP_QUERY_LANGUAGES)),
  clientIdPrefixes: z.array(z.enum(CLIENT_ID_PREFIXES)),
  responseModes: z.array(z.enum(VP_RESPONSE_MODES)),
});

type OpenId4VcDimension = keyof z.infer<typeof OpenId4VcOfferSchema>;
const OPENID4VC_DIMENSIONS = Object.keys(OpenId4VcOfferSchema.shape) as OpenId4VcDimension[];
const FLAGS = ["sendsWalletAttestation", "requiresMetadataKid"] as const;

const GapSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  rail: z.enum(RAILS),
  blocks: OpenId4VcOfferSchema.partial()
    .extend({
      didcommVersions: z.array(z.enum(DIDCOMM_VERSIONS)).optional(),
      sendsWalletAttestation: z.literal("yes").optional(),
      requiresMetadataKid: z.literal("yes").optional(),
    })
    .strict()
    .optional(),
  cause: z.string().min(1),
  until: z.string().min(1),
  reference: z.url().optional(),
  expires: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const ServicesSchema = z.strictObject({
  network: z.string().min(1),
  offer: z.strictObject({
    openid4vc: OpenId4VcOfferSchema,
    anoncreds: z.strictObject({ didcommVersions: z.array(z.enum(DIDCOMM_VERSIONS)) }),
  }),
  gaps: z.array(GapSchema),
});

export type Services = z.infer<typeof ServicesSchema>;
export type ServiceGap = Services["gaps"][number];

export const readDevnetServices = (): Services =>
  ServicesSchema.parse(yaml.load(fs.readFileSync(new URL("../devnet-services.yaml", import.meta.url), "utf8"), { schema: yaml.JSON_SCHEMA }));

export const VERDICTS = ["works", "works with known issues", "unknown", "will not work"] as const;
export type Verdict = (typeof VERDICTS)[number];

export type WalletVerdict = { wallet: string; build: string; rail: WalletRail; verdict: Verdict; reasons: string[] };

type Outcome = { verdict: Verdict; reason: string };
type Support = (typeof SUPPORT)[number];

const gapReason = (gap: ServiceGap): string => `known gap ${gap.id}`;

function negotiate(
  dimension: string,
  offered: readonly string[],
  support: Partial<Record<string, Support>>,
  blockers: ServiceGap[],
  blocked: (gap: ServiceGap) => readonly string[] | undefined,
): Outcome | null {
  const takes = offered.filter((v) => support[v] === "yes");
  if (takes.some((v) => !blockers.some((g) => blocked(g)?.includes(v)))) return null;
  const gap = blockers.find((g) => takes.some((v) => blocked(g)?.includes(v)));
  if (gap) return { verdict: "will not work", reason: gapReason(gap) };
  if (offered.some((v) => (support[v] ?? "unknown") === "unknown"))
    return { verdict: "unknown", reason: `${dimension}: whether it takes ${offered.join(" or ")} is not established` };
  const known = Object.entries(support).flatMap(([v, s]) => (s === "yes" ? [v] : []));
  return { verdict: "will not work", reason: `${dimension}: it takes ${known.join(", ") || "nothing known"}, devnet offers ${offered.join(", ") || "none of it"}` };
}

function openId4VcOutcomes(profile: WalletProfile, build: WalletBuild, services: Services, gaps: ServiceGap[]): Outcome[] {
  const caps = profile.capabilities.openid4vc;
  if (!caps) return [{ verdict: "unknown", reason: "no openid4vc capabilities declared" }];
  const minted = effectivePresentation(profile, build)?.query;
  const outcomes = OPENID4VC_DIMENSIONS.map((d) => {
    const offer: readonly string[] = services.offer.openid4vc[d];
    const offered = d === "queryLanguages" && minted ? offer.filter((q) => q === minted) : offer;
    return negotiate(d, offered, caps[d], gaps, (g) => g.blocks?.[d]);
  });
  for (const flag of FLAGS) {
    const gap = gaps.find((g) => g.blocks?.[flag] === "yes");
    if (gap && caps[flag] === "yes") outcomes.push({ verdict: "will not work", reason: gapReason(gap) });
    if (gap && caps[flag] === "unknown") outcomes.push({ verdict: "unknown", reason: `${flag} is not established: ${gap.cause}` });
  }
  return outcomes.filter((o): o is Outcome => o !== null);
}

function anonCredsOutcomes(profile: WalletProfile, services: Services, gaps: ServiceGap[]): Outcome[] {
  const caps = profile.capabilities.didcomm;
  if (!caps) return [{ verdict: "unknown", reason: "no didcomm capabilities declared" }];
  const outcome = negotiate("didcomm", services.offer.anoncreds.didcommVersions, caps.versions, gaps, (g) => g.blocks?.didcommVersions);
  return outcome ? [outcome] : [];
}

const rank = (v: Verdict): number => VERDICTS.indexOf(v);

export function walletVerdicts(profiles: WalletProfile[], services: Services): WalletVerdict[] {
  return profiles.flatMap((profile) =>
    listedBuilds(profile).flatMap((build) =>
      profile.rails.map((rail) => {
        const gaps = services.gaps.filter((g) => g.rail === rail);
        const outcomes = [
          ...(rail === "anoncreds" ? anonCredsOutcomes(profile, services, gaps) : openId4VcOutcomes(profile, build, services, gaps)),
          ...gaps.filter((g) => !g.blocks).map((g) => ({ verdict: "works with known issues" as const, reason: gapReason(g) })),
        ];
        const verdict = outcomes.reduce<Verdict>((worst, o) => (rank(o.verdict) > rank(worst) ? o.verdict : worst), "works");
        return { wallet: profile.id, build: build.label, rail, verdict, reasons: outcomes.filter((o) => o.verdict === verdict).map((o) => o.reason) };
      }),
    ),
  );
}

const cell = (s: string): string => s.replaceAll("|", "\\|").replaceAll("\n", " ");

export function renderVerdicts(services: Services, rows: (WalletVerdict & { status: string })[]): string {
  const lines = [
    `## Listed wallets on ${services.network}`,
    "",
    "Static verdict: the capabilities each profile declares against what the devnet services offer and their known gaps (`conformance/devnet-services.yaml`).",
    "",
    "| wallet | status | rail | verdict | why |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((r) => `| ${cell(r.wallet)} | ${r.status} | ${r.rail} | ${r.verdict} | ${cell(r.reasons.join("; "))} |`),
    "",
    "| known gap | cause | until | re-check by |",
    "| --- | --- | --- | --- |",
    ...services.gaps.map((g) => `| ${g.id} | ${cell(g.cause)} | ${cell(g.until)} | ${g.expires} |`),
    "",
  ];
  return lines.join("\n");
}
