# Wallet Profiles and Listing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every listed wallet one machine-readable profile that all conformance tiers read, narrow the public listing to the five maintained wallets, and make CI refuse a listing entry whose profile is missing or contradicts it.

**Architecture:** Profiles are YAML files under `conformance/profiles/`, validated by a zod schema in `app/lib/wallet-profiles.ts` that both the Next site and the harness import. A consistency test in the main vitest suite ties each profile to its `personal-wallets.yaml` entry (rails, listed build, mint parameters). The `conformance/` directory becomes a standalone npm package so the heavy Tier 2 dependencies never enter the site build; this plan scaffolds it and adds the network configuration that every later tier consumes.

**Tech Stack:** TypeScript 5.7 strict, zod 4, js-yaml 4, vitest 4, Node 22. No new runtime dependencies for the site.

**Spec:** `../../../verana-spec-conformance/playground/guidelines/wallet-conformance-testing.md` (PR verana-labs/verana-spec#92), sections 3 [CONF-PROF], 8 [CONF-NET], 10 [CONF-LIST]; `personal-wallet-integration.md` [PW-TEST] for scenario ids. Roadmap and verified facts: `2026-09-14-conformance-roadmap.md`.

## Global Constraints

- Work in the worktree `playground-eventos` on branch `feat/wallet-matrix-store-builds` (rebased on `origin/main` at `4f11e90`). Never touch the sibling `playground` checkout.
- TypeScript strict, never `any` (use `unknown` and narrow), named exports only, kebab-case file names.
- Zero code comments unless documenting a hidden constraint, a non-obvious invariant, an upstream workaround or surprising platform behaviour; one line if so.
- Conventional commits, subject only, lowercase after the colon. Commit after every task.
- Rails vocabulary is exactly `anoncreds` and `openid4vc-sdjwt` (matches `personal-wallets.yaml`).
- Build kinds are exactly `store`, `publisher`, `fork`, `browser` [CONF-PROF vocabulary].
- Outcomes are never a bare pass/fail; that vocabulary belongs to plan B and is not introduced here.
- The seven hidden wallets keep their entries, icons and captures. Nothing is deleted [CONF-LIST-3].
- `npm run lint && npm run typecheck && npm run validate:registry && npx vitest run && npm run build` must stay green at the root after every task.

---

### Task 1: Hide the seven paused wallets

**Files:**
- Modify: `personal-wallets.yaml` (entries `authbound`, `paradym`, `procivis`, `bcwallet`, `sphereon`, `talao`, `nl-wallet`)
- Modify: `app/lib/wallets.test.ts`

**Interfaces:**
- Consumes: `listPersonalWallets()` from `app/lib/wallets.ts`, which already filters `hidden` at line 131.
- Produces: the visible listing is exactly `inji, eudi, wwwallet, hologram, swiyu, intexus-wallet` (the last one scoped to `eventos`).

- [ ] **Step 1: Write the failing test**

Append to the first `describe` block in `app/lib/wallets.test.ts`:

```ts
  it("lists only the maintained wallets", () => {
    const ids = listPersonalWallets().map((w) => w.id).sort();
    expect(ids).toEqual(
      ["eudi", "hologram", "inji", "intexus-wallet", "swiyu", "wwwallet"].sort(),
    );
  });

  it("keeps the paused wallets in the file, hidden", () => {
    const raw = WalletsFileSchema.parse(
      yaml.load(
        fs.readFileSync(path.join(process.cwd(), "personal-wallets.yaml"), "utf8"),
      ),
    );
    const hidden = raw.wallets.filter((w) => w.hidden).map((w) => w.id).sort();
    expect(hidden).toEqual(
      ["authbound", "bcwallet", "nl-wallet", "paradym", "procivis", "sphereon", "talao"].sort(),
    );
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/lib/wallets.test.ts`
Expected: FAIL, the visible list contains twelve ids and the hidden list is empty.

- [ ] **Step 3: Set `hidden: true` on the seven entries**

In `personal-wallets.yaml`, add the line `    hidden: true` directly under `    vendor: …` for each of `authbound` (line 119), `paradym` (159), `procivis` (199), `bcwallet` (238), `sphereon` (346), `talao` (426), `nl-wallet` (467). Line numbers are as of the rebase; locate each by `- id:`.

Also document the flag in the header comment block of the file (lines 14–35 list every field): add one line `#   hidden: true          # keep the entry, icons and captures; drop it from the site until maintenance resumes`.

- [ ] **Step 4: Run the tests and the registry validator**

Run: `npx vitest run app/lib/wallets.test.ts && npm run validate:registry`
Expected: PASS; validator prints `ok personal-wallets.yaml (13 personal wallets)`.

- [ ] **Step 5: Check the pickers by building**

Run: `npm run build 2>&1 | tail -5`
Expected: build succeeds. `app/personal-wallets/page.tsx`, every `app/usecases/*/sections.tsx` and `app/page.tsx` call `listPersonalWallets()`, so the hidden wallets disappear from every picker without code changes.

- [ ] **Step 6: Commit**

```bash
git add personal-wallets.yaml app/lib/wallets.test.ts
git commit -m "chore: hide the seven paused wallets from the listing"
```

---

### Task 2: Profile schema and loader

**Files:**
- Create: `app/lib/wallet-profiles.ts`
- Create: `app/lib/wallet-profiles.test.ts`
- Create: `conformance/profiles/.gitkeep` (removed in Task 3)

**Interfaces:**
- Produces:
  - `WalletProfileSchema` (zod), `WalletProfile`, `WalletBuild`, `WalletPresentation` types
  - `listWalletProfiles(dir?: string): WalletProfile[]`
  - `getWalletProfile(id: string, dir?: string): WalletProfile | undefined`
  - `listedBuild(profile: WalletProfile): WalletBuild`
  - `effectivePresentation(profile, build): WalletPresentation | undefined`
  - `effectiveDemoParams(profile, build): string`
  - constants `RAILS`, `BUILD_KINDS`, `PLATFORMS`, `CONFORMANCE_SCENARIOS`
- Default profile directory is `path.join(process.cwd(), "conformance", "profiles")`, correct when the site or its tests run from the repository root; the harness always passes its own directory (`fileURLToPath(new URL("../profiles", import.meta.url))`) because its cwd is `conformance/`.
- `vciDrafts` is a list: a wallet whose library reads more than one OpenID4VCI draft (Inji: 11 and 13) names them all, and Tier 1 parses the metadata once per draft.
- Mint parameters follow the site API as it exists: `signer=x5c` selects an `x509_hash` client id; no signer selects the service's DID; `query=pe` selects Presentation Exchange. The schema refuses any other combination, so a wrong rail cannot be mistaken for a wallet bug.
- A fork build is identified by a commit or a tag (`identity.ref`), never a branch, so a result can name what it tested [CONF-OUT-2].

- [ ] **Step 1: Write the failing unit tests**

Create `app/lib/wallet-profiles.test.ts`:

```ts
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  effectiveDemoParams,
  effectivePresentation,
  listWalletProfiles,
  listedBuild,
  WalletProfileSchema,
} from "./wallet-profiles";

const device = { activity: ".Main", unlock: "passcode", secret: "123456", coldStart: false };

const valid = {
  id: "example",
  rails: ["openid4vc-sdjwt"],
  openid4vc: {
    library: "example lib",
    proxy: "@openid4vc/openid4vci",
    vciDrafts: ["v1"],
    offerSchemes: ["openid-credential-offer"],
    requestSchemes: ["openid4vp"],
    asDiscovery: ["oauth-authorization-server"],
    presentation: { query: "dcql", clientId: "x509_hash", responseMode: "direct_post.jwt" },
    demoParams: "signer=x5c",
  },
  builds: [
    {
      kind: "fork",
      listed: true,
      label: "fork apk",
      obtain: "https://example.org/app.apk",
      identity: { package: "org.example", version: "1.0.0", repo: "https://example.org/repo", ref: "verana-2026-09-01" },
      platforms: ["android"],
      promises: "everything",
      device,
    },
    {
      kind: "store",
      label: "store",
      obtain: "https://play.google.com/store/apps/details?id=org.example",
      identity: { package: "org.example", version: "2.0.0" },
      platforms: ["android", "ios"],
      presumptive: ["ios"],
      promises: "q1 only",
      presentation: { query: "dcql", clientId: "did", responseMode: "direct_post.jwt" },
      demoParams: "",
      device,
    },
  ],
  quirks: { actsOnLinkOnlyAtColdStart: false, locksOnBackground: false, viewTree: "readable" },
};

describe("WalletProfileSchema", () => {
  it("accepts a complete profile", () => {
    expect(() => WalletProfileSchema.parse(valid)).not.toThrow();
  });

  it("requires an openid4vc block for the openid4vc-sdjwt rail", () => {
    const { openid4vc: _omit, ...without } = valid;
    expect(WalletProfileSchema.safeParse(without).success).toBe(false);
  });

  it("requires a didcomm block for the anoncreds rail", () => {
    expect(WalletProfileSchema.safeParse({ ...valid, rails: ["anoncreds"] }).success).toBe(false);
  });

  it("requires exactly one listed build", () => {
    const none = { ...valid, builds: valid.builds.map((b) => ({ ...b, listed: false })) };
    expect(WalletProfileSchema.safeParse(none).success).toBe(false);
    const two = { ...valid, builds: valid.builds.map((b) => ({ ...b, listed: true })) };
    expect(WalletProfileSchema.safeParse(two).success).toBe(false);
  });

  it("rejects a presumptive platform that is not declared", () => {
    const bad = { ...valid, builds: [{ ...valid.builds[0], presumptive: ["ios"] }] };
    expect(WalletProfileSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects mint parameters that contradict the request rail", () => {
    const withPresentation = (presentation: Record<string, string>, demoParams: string) => ({
      ...valid,
      openid4vc: { ...valid.openid4vc, presentation, demoParams },
    });
    const pe = withPresentation({ query: "presentation_exchange", clientId: "did", responseMode: "direct_post" }, "signer=x5c");
    const peResult = WalletProfileSchema.safeParse(pe);
    expect(peResult.success).toBe(false);
    expect(JSON.stringify(peResult.error?.issues)).toContain("query=pe");
    const x5cWithoutSigner = withPresentation({ query: "dcql", clientId: "x509_hash", responseMode: "direct_post.jwt" }, "");
    expect(WalletProfileSchema.safeParse(x5cWithoutSigner).success).toBe(false);
    const didWithSigner = withPresentation({ query: "dcql", clientId: "did", responseMode: "direct_post.jwt" }, "signer=x5c");
    expect(WalletProfileSchema.safeParse(didWithSigner).success).toBe(false);
  });

  it("requires an android build to carry a package and a device block, and a browser build a url", () => {
    const noPackage = { ...valid, builds: [{ ...valid.builds[0], identity: { version: "1", repo: "https://example.org/repo", ref: "v1" } }] };
    expect(WalletProfileSchema.safeParse(noPackage).success).toBe(false);
    const storeWithoutDevice = { ...valid, builds: [valid.builds[0], { ...valid.builds[1], device: undefined }] };
    expect(WalletProfileSchema.safeParse(storeWithoutDevice).success).toBe(false);
    const browser = {
      ...valid,
      builds: [{ ...valid.builds[0], kind: "browser", platforms: ["web"], identity: { package: "x", version: "1" }, device: undefined }],
    };
    expect(WalletProfileSchema.safeParse(browser).success).toBe(false);
  });

  it("requires a fork to be identified by a commit or a tag, never a branch", () => {
    const branch = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: "feat/verana-trust" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(branch).success).toBe(false);
    const main = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: "main" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(main).success).toBe(false);
    const sha = { ...valid, builds: [{ ...valid.builds[0], identity: { ...valid.builds[0].identity, ref: "e6992fccc654" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(sha).success).toBe(true);
    const noRef = { ...valid, builds: [{ ...valid.builds[0], identity: { package: "org.example", version: "1.0.0" } }, valid.builds[1]] };
    expect(WalletProfileSchema.safeParse(noRef).success).toBe(false);
  });

  it("rejects an incompatibility that names an unknown scenario", () => {
    const bad = {
      ...valid,
      builds: [
        {
          ...valid.builds[0],
          incompatibilities: [{ cause: "x", scenarios: ["issue-nowhere"], verified: "2026-09-13" }],
        },
      ],
    };
    expect(WalletProfileSchema.safeParse(bad).success).toBe(false);
  });
});

describe("profile helpers", () => {
  const profile = WalletProfileSchema.parse(valid);

  it("finds the listed build", () => {
    expect(listedBuild(profile).kind).toBe("fork");
  });

  it("lets a build override the request rail and the mint parameters", () => {
    const store = profile.builds[1];
    expect(effectivePresentation(profile, store)?.clientId).toBe("did");
    expect(effectiveDemoParams(profile, store)).toBe("");
    expect(effectiveDemoParams(profile, profile.builds[0])).toBe("signer=x5c");
  });
});

describe("listWalletProfiles", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "profiles-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("loads every yaml file and sorts by id", () => {
    fs.writeFileSync(path.join(dir, "b.yaml"), JSON.stringify({ ...valid, id: "b" }));
    fs.writeFileSync(path.join(dir, "a.yaml"), JSON.stringify({ ...valid, id: "a" }));
    expect(listWalletProfiles(dir).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("refuses a file whose name does not match its id", () => {
    fs.writeFileSync(path.join(dir, "wrong.yaml"), JSON.stringify(valid));
    expect(() => listWalletProfiles(dir)).toThrow(/wrong\.yaml/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run app/lib/wallet-profiles.test.ts`
Expected: FAIL with "Cannot find module './wallet-profiles'".

- [ ] **Step 3: Write the schema and loader**

Create `app/lib/wallet-profiles.ts`:

```ts
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
```

- [ ] **Step 4: Create the empty profiles directory and run the tests**

Run: `mkdir -p conformance/profiles && touch conformance/profiles/.gitkeep && npx vitest run app/lib/wallet-profiles.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: clean. If `next lint` reports nothing for `app/lib/wallet-profiles.ts`, that is expected; the file is under `app/`.

- [ ] **Step 6: Commit**

```bash
git add app/lib/wallet-profiles.ts app/lib/wallet-profiles.test.ts conformance/profiles/.gitkeep
git commit -m "feat: wallet profile schema and loader"
```

---

### Task 3: The six profiles and the consistency test

**Files:**
- Create: `conformance/profiles/wwwallet.yaml`, `intexus-wallet.yaml`, `eudi.yaml`, `inji.yaml`, `hologram.yaml`, `swiyu.yaml`
- Delete: `conformance/profiles/.gitkeep`
- Modify: `app/lib/wallet-profiles.test.ts` (append the consistency block)

**Interfaces:**
- Consumes: `WalletsFileSchema` from `app/lib/wallets.ts` (exported), `listPersonalWallets()`.
- Produces: profiles that Tier 1 (plan B) reads for `vciDraft`, `offerSchemes`, `requestSchemes`, `asDiscovery`, `presentation`, `demoParams`, and that Tier 3 reads for `device`.

- [ ] **Step 1: Write the failing consistency test**

Append to `app/lib/wallet-profiles.test.ts`:

```ts
import yaml from "js-yaml";
import { WalletsFileSchema } from "./wallets";

describe("profiles match the listing", () => {
  const listing = WalletsFileSchema.parse(
    yaml.load(fs.readFileSync(path.join(process.cwd(), "personal-wallets.yaml"), "utf8")),
  ).wallets;
  const visible = listing.filter((w) => !w.hidden);
  const profiles = listWalletProfiles();
  const byId = new Map(profiles.map((p) => [p.id, p]));

  it("every visible wallet has a profile, whatever its scope", () => {
    expect(profiles.map((p) => p.id).sort()).toEqual(visible.map((w) => w.id).sort());
  });

  it("every profile names a wallet that exists in the listing", () => {
    for (const p of profiles) expect(listing.some((w) => w.id === p.id), p.id).toBe(true);
  });

  it("rails equal the listing formats", () => {
    for (const w of visible)
      expect([...(byId.get(w.id)?.rails ?? [])].sort(), w.id).toEqual([...w.formats].sort());
  });

  it("the listed build is the one the listing links to", () => {
    for (const w of visible) {
      const build = listedBuild(byId.get(w.id)!);
      expect(build.obtain, w.id).toBe(w.browser ? w.hosted : w.download);
    }
  });

  it("the listing mints with the listed build's parameters", () => {
    for (const w of visible) {
      const profile = byId.get(w.id)!;
      const expected = effectiveDemoParams(profile, listedBuild(profile)).split("&").filter(Boolean).sort();
      expect((w.demoParams ?? "").split("&").filter(Boolean).sort(), w.id).toEqual(expected);
    }
  });
});
```

Move the two import lines to the top of the file with the other imports. `visible` is taken from the raw file rather than `listPersonalWallets()` because the loader also drops scoped wallets (`intexus-wallet` carries `scope: eventos`) when called without a scope.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run app/lib/wallet-profiles.test.ts`
Expected: FAIL on "every visible wallet has a profile" (no profiles yet).

- [ ] **Step 3: Write `conformance/profiles/wwwallet.yaml`**

```yaml
id: wwwallet
rails: [openid4vc-sdjwt]
openid4vc:
  library: "wwWallet/wallet-frontend 0.6.x, hand-rolled TypeScript on @sd-jwt/core, dcql and jose"
  proxy: "@openid4vc/openid4vci, @openid4vc/openid4vp, @sd-jwt/core"
  vciDrafts: [v1]
  offerSchemes: [openid-credential-offer]
  requestSchemes: [openid4vp]
  asDiscovery: [oauth-authorization-server]
  presentation: { query: dcql, clientId: x509_hash, responseMode: direct_post.jwt }
  demoParams: signer=x5c
builds:
  - kind: browser
    listed: true
    label: "Hosted Verana fork, built from verana-labs/wallet-frontend master by .github/workflows/wwwallet.yml"
    obtain: https://wwwallet.playground.testnet.verana.network
    identity:
      url: https://wwwallet.playground.testnet.verana.network
      repo: https://github.com/verana-labs/wallet-frontend
    platforms: [web]
    promises: "Proof-of-Trust on both consent screens; accept and share are gated on Q2 and Q3"
quirks:
  actsOnLinkOnlyAtColdStart: false
  locksOnBackground: false
  viewTree: browser
  notes: "Links are handed over as the hosted URL plus the offer or request query string. Sign-in is WebAuthn only, so a device run needs a passkey already enrolled"
```

- [ ] **Step 4: Write `conformance/profiles/intexus-wallet.yaml`**

```yaml
id: intexus-wallet
rails: [openid4vc-sdjwt]
openid4vc:
  library: "wwWallet/wallet-frontend 0.6.x, hand-rolled TypeScript on @sd-jwt/core, dcql and jose"
  proxy: "@openid4vc/openid4vci, @openid4vc/openid4vp, @sd-jwt/core"
  vciDrafts: [v1]
  offerSchemes: [openid-credential-offer]
  requestSchemes: [openid4vp]
  asDiscovery: [oauth-authorization-server]
  presentation: { query: dcql, clientId: x509_hash, responseMode: direct_post.jwt }
  demoParams: signer=x5c
builds:
  - kind: browser
    listed: true
    label: "INTEXUS-branded hosted instance of the Verana fork, scoped to the events demo"
    obtain: https://intexus-wallet.eventos.playground.testnet.verana.network
    identity:
      url: https://intexus-wallet.eventos.playground.testnet.verana.network
      repo: https://github.com/verana-labs/wallet-frontend
    platforms: [web]
    promises: "Same code as wwwallet with the INTEXUS brand; the wallet the Colombian tour uses"
quirks:
  actsOnLinkOnlyAtColdStart: false
  locksOnBackground: false
  viewTree: browser
  notes: "Built by .github/workflows/wwwallet.yml with brand intexus. Do not change its deployment during the tour (17, 22 and 24 September 2026)"
```

- [ ] **Step 5: Write `conformance/profiles/eudi.yaml`**

```yaml
id: eudi
rails: [openid4vc-sdjwt]
openid4vc:
  library: "eudi-lib-jvm-openid4vci-kt 0.13.1, eudi-lib-jvm-openid4vp-kt 0.15.1 and eudi-lib-jvm-sdjwt-kt 0.20.0 through eudi-lib-android-wallet-core (Kotlin)"
  proxy: "@openid4vc/openid4vci, @openid4vc/openid4vp, @sd-jwt/sd-jwt-vc"
  vciDrafts: [v1]
  offerSchemes: [openid-credential-offer, haip-vci]
  requestSchemes: [openid4vp, eudi-openid4vp, haip]
  asDiscovery: [oauth-authorization-server, openid-configuration]
  presentation: { query: dcql, clientId: x509_hash, responseMode: direct_post.jwt }
  demoParams: signer=x5c
builds:
  - kind: fork
    listed: true
    label: "Verana fork APK, wallet-core 0.29.0, signed metadata off, trust policy INFORM"
    obtain: https://github.com/AirKyzzZ/eudi-app-android-wallet-ui/releases/download/verana-2026-08-06.1/eudi-wallet-verana-2026-08-06.1.apk
    identity:
      package: eu.europa.ec.euidi
      version: verana-2026-08-06.1
      repo: https://github.com/AirKyzzZ/eudi-app-android-wallet-ui
      ref: verana-2026-08-06.1
    platforms: [android]
    promises: "Q1 trust card with the service and operator blocks and a TESTNET chip. No Q2 or Q3 sentence, so an unauthorised verifier looks like an authorised one"
    device:
      activity: eu.europa.ec.assemblylogic.ui.MainActivity
      unlock: pinfield
      secret: "123456"
      coldStart: false
  - kind: publisher
    label: "Demo APK from the EU reference wallet releases"
    obtain: https://github.com/eu-digital-identity-wallet/eudi-app-android-wallet-ui/releases
    identity:
      package: eu.europa.ec.euidi
      version: "2026.07.39 and later"
    platforms: [android]
    promises: "Refuses any issuer whose metadata is not signed by a certificate anchored in the EU trusted list"
    policies: [signed-issuer-metadata, eu-trusted-list-anchor, no-did-issuers]
    incompatibilities:
      - cause: "TrustPolicy.Action.ENFORCE with requireSignedMetadata() is hard-coded in the dev and demo flavours. A demo issuer with a self-signed development certificate and a did:webvh identity is refused before any offer is shown, and there is no runtime toggle"
        reference: https://github.com/eu-digital-identity-wallet/eudi-app-android-wallet-ui/issues/659
        scenarios: all
        verified: "2026-09-13"
    device:
      activity: eu.europa.ec.assemblylogic.ui.MainActivity
      unlock: pinfield
      secret: "123456"
      coldStart: false
quirks:
  actsOnLinkOnlyAtColdStart: false
  locksOnBackground: false
  viewTree: readable
  notes: "wallet-core 0.29.0 requires key_attestations_required in the advertised jwt proof type; swiyu sends the same Accept header and must never receive that flag, so the server tells them apart per request"
```

- [ ] **Step 6: Write `conformance/profiles/inji.yaml`**

```yaml
id: inji
rails: [openid4vc-sdjwt]
openid4vc:
  library: "io.inji:inji-vci-client-aar 1.0.0-beta (OpenID4VCI drafts 11 and 13) and io.inji:inji-openid4vp-aar 1.0.0-beta (OpenID4VP drafts 21 and 23, presentation_definition, did client ids)"
  proxy: "@openid4vc/openid4vci draft-11 parser, @credo-ts/openid4vc holder for the presentation_exchange submission"
  vciDrafts: [draft11, draft13]
  offerSchemes: [openid-credential-offer]
  requestSchemes: [openid4vp]
  asDiscovery: [oauth-authorization-server, openid-configuration]
  presentation: { query: presentation_exchange, clientId: did, responseMode: direct_post }
  demoParams: query=pe
builds:
  - kind: fork
    listed: true
    label: "Verana fork APK"
    obtain: https://github.com/AirKyzzZ/inji-wallet/releases/download/verana-2026-08-08.2/Inji_arm64-v8a.apk
    identity:
      package: io.mosip.residentapp
      version: verana-2026-08-08.2
      repo: https://github.com/AirKyzzZ/inji-wallet
      ref: verana-2026-08-08.2
    platforms: [android]
    promises: "Q1 card plus the Q2 issuer sentence and the Q3 verifier sentence. The affirmative control stays drawn on a denial. An issuer host already trusted skips consent entirely"
    device:
      activity: .MainActivity
      unlock: passcode
      secret: "123456"
      coldStart: true
quirks:
  actsOnLinkOnlyAtColdStart: true
  locksOnBackground: false
  viewTree: readable
  notes: "Drops a VIEW intent when idle at home, so force-stop before delivering; the biometric prompt sometimes stops responding to taps. MOSIP publishes no APK and no store listing, so the fork is the only installable build. The device APK predates verana-labs/inji-wallet#2 (merged 2026-09-08)"
```

- [ ] **Step 7: Write `conformance/profiles/hologram.yaml`**

```yaml
id: hologram
rails: [anoncreds]
didcomm:
  library: "@credo-ts/didcomm and @credo-ts/anoncreds 0.7.1-pr-2704: DIDComm v1, AnonCreds over the v2 credential and proof protocols, mediator pickup, WebSocket outbound"
  proxy: "@credo-ts/didcomm and @credo-ts/anoncreds on the same 0.7.1-pr-2704 line, WebSocket outbound with return routing"
  invitationSchemes: [didcomm, https]
  demoParams: ""
builds:
  - kind: store
    listed: true
    label: "Hologram Messaging on Google Play"
    obtain: https://play.google.com/store/apps/details?id=io.twentysixty.mobileagent.m
    identity:
      package: io.twentysixty.mobileagent.m
      version: "2.0.0"
    platforms: [android, ios]
    presumptive: [ios]
    promises: "Q1 only. Renders the trust card, then reports Q1 as a safety verdict on offers with Accept enabled, even for an unaccredited issuer"
    device:
      activity: io.twentysixty.mobileagent.MainActivity
      unlock: device-credential
      secret: "132006"
      coldStart: false
      neverForceStop: true
  - kind: fork
    label: "Verana trust fork, staging build of hologram-app#514"
    obtain: https://github.com/AirKyzzZ/hologram-app/tree/feat/verana-trust
    identity:
      package: io.twentysixty.mobileagent.st
      version: e6992fccc654
      repo: https://github.com/AirKyzzZ/hologram-app
      ref: e6992fccc654
    platforms: [android]
    promises: "Q1, Q2 and Q3 with the guideline wording"
    device:
      activity: io.twentysixty.mobileagent.MainActivity
      unlock: device-credential
      secret: "132006"
      coldStart: false
      neverForceStop: true
quirks:
  actsOnLinkOnlyAtColdStart: false
  locksOnBackground: false
  viewTree: ocr
  notes: "React Native new architecture: uiautomator returns an empty tree, so screens are read by OCR. Cold start sits behind the system biometric prompt (tap Use PIN, then the phone PIN over adb), so deliver links while it is already open and never force-stop it"
```

- [ ] **Step 8: Write `conformance/profiles/swiyu.yaml`**

```yaml
id: swiyu
rails: [openid4vc-sdjwt]
openid4vc:
  library: "swiyu-admin-ch/eidch-android-wallet openid4vc module (Kotlin: nimbus-jose-jwt, ch.admin.swiyu didresolver 2.8.x, dcql-android), SD-JWT VC only"
  proxy: "@openid4vc/openid4vci, @openid4vc/openid4vp, @sd-jwt/sd-jwt-vc"
  vciDrafts: [v1]
  offerSchemes: [openid-credential-offer, swiyu]
  requestSchemes: [openid4vp, swiyu-verifier]
  asDiscovery: [oauth-authorization-server]
  presentation: { query: dcql, clientId: x509_hash, responseMode: direct_post.jwt }
  demoParams: signer=x5c
builds:
  - kind: fork
    listed: true
    label: "Verana trust fork, universal debug APK"
    obtain: https://github.com/AirKyzzZ/eidch-android-wallet-swiyu-probe-verana/releases/download/verana-2026-08-17/swiyu-verana-universal-debug.apk
    identity:
      package: ch.admin.foitt.swiyu.dev
      version: verana-2026-08-17
      repo: https://github.com/AirKyzzZ/eidch-android-wallet-swiyu-probe-verana
      ref: verana-2026-08-17
    platforms: [android]
    promises: "Q1, Q2 and Q3 rendered. The only wallet confirmed to hard-block Add on a Q2 denial. No TESTNET chip"
    device:
      activity: ch.admin.foitt.wallet.app.MainActivity
      unlock: password
      secret: playground1
      coldStart: true
  - kind: store
    label: "swiyu on Google Play"
    obtain: https://play.google.com/store/apps/details?id=ch.admin.foitt.swiyu
    identity:
      package: ch.admin.foitt.swiyu
      version: "1.18.0"
    platforms: [android]
    promises: "Swiss profile: verifiers identified by DID only, signed issuer metadata, strict did:webvh log replay"
    presentation: { query: dcql, clientId: did, responseMode: direct_post.jwt }
    demoParams: ""
    policies: [did-client-id-only, signed-issuer-metadata, strict-webvh-log]
    incompatibilities:
      - cause: "Its Rust resolver replays the did:webvh log from version 1 and rejects any DID whose history holds an entry signed with a bare did:key verification method. Services created before vs-agent fixed this on 2026-08-03 cannot be repaired by rolling the image"
        reference: https://github.com/swiyu-admin-ch/eidch-android-wallet
        scenarios: all
        services: [playground-demo, demo-untrusted]
        verified: "2026-09-08"
    device:
      activity: ch.admin.foitt.wallet.app.MainActivity
      unlock: password
      secret: playground1
      coldStart: true
quirks:
  actsOnLinkOnlyAtColdStart: true
  locksOnBackground: true
  viewTree: readable
  notes: "Locks on every backgrounding and a slow re-login lets the request expire. Asks again mid-flow before releasing a presentation. Never serve key_attestations_required: it then demands an attestation from attestations.trust-infra.swiyu.admin.ch that a test device cannot obtain"
```

- [ ] **Step 9: Remove the placeholder and run the tests**

Run: `rm conformance/profiles/.gitkeep && npx vitest run app/lib/wallet-profiles.test.ts app/lib/wallets.test.ts`
Expected: PASS. If "the listing mints with the listed build's parameters" fails for `hologram`, the listing has `demoParams` unset and the profile `""`; both normalise to `[]`, so that case passes. If it fails for another wallet, the listing is wrong, not the profile: fix the listing only if the profile's rail was verified in the roadmap facts.

- [ ] **Step 10: Commit**

```bash
git add conformance/profiles app/lib/wallet-profiles.test.ts
git commit -m "feat: conformance profiles for the six listed wallets"
```

---

### Task 4: Registry validator checks profiles exist

**Files:**
- Modify: `scripts/validate-registry.mjs:30-32`

**Interfaces:**
- Consumes: the `wallets/<id>/` directory check already in the loop.
- Produces: `npm run validate:registry` fails when a visible wallet has no `conformance/profiles/<id>.yaml`.

- [ ] **Step 1: Prove the gap**

Run: `mv conformance/profiles/swiyu.yaml /tmp/swiyu.yaml && npm run validate:registry; mv /tmp/swiyu.yaml conformance/profiles/swiyu.yaml`
Expected: the validator still prints `ok personal-wallets.yaml` with the profile missing.

- [ ] **Step 2: Add the check**

In `scripts/validate-registry.mjs`, directly after the `wallets/${w.id}/ directory missing` check inside the loop, add:

```js
    if (!w.hidden && !existsSync(join(process.cwd(), "conformance", "profiles", `${w.id}.yaml`)))
      throw new Error(`${w.id}: conformance/profiles/${w.id}.yaml missing (hidden wallets are exempt)`);
```

and extend the import on line 1 to `import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";`.

- [ ] **Step 3: Verify the check fires and passes**

Run: `mv conformance/profiles/swiyu.yaml /tmp/swiyu.yaml; npm run validate:registry; echo "exit $?"; mv /tmp/swiyu.yaml conformance/profiles/swiyu.yaml && npm run validate:registry`
Expected: first run prints `FAIL personal-wallets.yaml: swiyu: conformance/profiles/swiyu.yaml missing …` and `exit 1`; second run prints `ok personal-wallets.yaml (13 personal wallets)`.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-registry.mjs
git commit -m "chore: registry validation requires a conformance profile per visible wallet"
```

---

### Task 5: Conformance package scaffold and network configuration

**Files:**
- Create: `conformance/package.json`, `conformance/tsconfig.json`, `conformance/vitest.config.ts`, `conformance/.gitignore`, `conformance/README.md`
- Create: `conformance/networks.yaml`, `conformance/lib/network.ts`, `conformance/lib/network.test.ts`
- Modify: `tsconfig.json` (root, `exclude`)

**Interfaces:**
- Produces:
  - `Network` type: `{ id, vpr, protocol: "v3" | "v4", production, castToken, resolver, indexer, rpc, playground, vocabulary: { ecosystem, participant }, testable, reason? }`
  - `listNetworks(): Network[]`, `selectedNetworks(): Network[]` (honours `CONFORMANCE_NETWORK`), `testableNetworks()`, `untestableNetworks()`
  - npm scripts inside `conformance/`: `test`, `typecheck`

- [ ] **Step 1: Write the package manifest**

Create `conformance/package.json`:

```json
{
  "name": "verana-playground-conformance",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "license": "Apache-2.0",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "js-yaml": "^4.1.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@types/js-yaml": "^4.0.9",
    "@types/node": "^22.13.5",
    "typescript": "^5.7.3",
    "vitest": "^4.1.10"
  }
}
```

Create `conformance/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["**/*.ts", "../app/lib/wallet-profiles.ts"],
  "exclude": ["node_modules", "results"]
}
```

Create `conformance/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "results/**"],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
```

Create `conformance/.gitignore`:

```
node_modules/
results/
```

- [ ] **Step 2: Exclude the package from the root typecheck**

In the root `tsconfig.json`, change `"exclude": ["node_modules"]` to `"exclude": ["node_modules", "conformance"]`.

Run: `npm run typecheck`
Expected: clean (the root no longer sees `conformance/**/*.ts`).

- [ ] **Step 3: Install the package**

Run: `cd conformance && npm install && cd ..`
Expected: `conformance/package-lock.json` created, `conformance/node_modules/` present and ignored. These are the same versions the root already carries; nothing large is downloaded.

- [ ] **Step 4: Write the failing network tests**

Create `conformance/lib/network.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { listNetworks, selectedNetworks, testableNetworks, untestableNetworks } from "./network";

describe("networks.yaml", () => {
  afterEach(() => {
    delete process.env.CONFORMANCE_NETWORK;
  });

  it("declares testnet v3 as testable with a resolver and a playground", () => {
    const testnet = listNetworks().find((n) => n.id === "testnet-v3");
    expect(testnet?.testable).toBe(true);
    expect(testnet?.resolver).toBe("https://resolver.testnet.verana.network");
    expect(testnet?.playground).toBe("https://playground.testnet.verana.network");
    expect(testnet?.production).toBe(false);
    expect(testnet?.vocabulary).toEqual({ ecosystem: "Trust Registry", participant: "Permission" });
  });

  it("declares devnet v4 as not testable, with a reason", () => {
    const devnet = listNetworks().find((n) => n.id === "devnet-v4");
    expect(devnet?.testable).toBe(false);
    expect(devnet?.reason).toMatch(/resolver/);
    expect(devnet?.vocabulary).toEqual({ ecosystem: "Ecosystem", participant: "Participant" });
  });

  it("selects one network by env and rejects unknown ids", () => {
    process.env.CONFORMANCE_NETWORK = "testnet-v3";
    expect(selectedNetworks().map((n) => n.id)).toEqual(["testnet-v3"]);
    process.env.CONFORMANCE_NETWORK = "mainnet";
    expect(() => selectedNetworks()).toThrow(/unknown network mainnet/);
  });

  it("splits testable from untestable", () => {
    expect(testableNetworks().map((n) => n.id)).toEqual(["testnet-v3"]);
    expect(untestableNetworks().map((n) => n.id)).toEqual(["devnet-v4"]);
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `cd conformance && npx vitest run lib/network.test.ts; cd ..`
Expected: FAIL with "Cannot find module './network'".

- [ ] **Step 6: Write the network file and loader**

Create `conformance/networks.yaml`:

```yaml
networks:
  - id: testnet-v3
    vpr: vna-testnet-1
    protocol: v3
    production: false
    castToken: testnet
    resolver: https://resolver.testnet.verana.network
    indexer: https://idx.testnet.verana.network
    rpc: https://rpc.testnet.verana.network
    playground: https://playground.testnet.verana.network
    vocabulary: { ecosystem: Trust Registry, participant: Permission }
    testable: true
  - id: devnet-v4
    vpr: vna-devnet-1
    protocol: v4
    production: false
    castToken: devnet
    resolver: null
    indexer: null
    rpc: null
    playground: null
    vocabulary: { ecosystem: Ecosystem, participant: Participant }
    testable: false
    reason: "devnet serves an indexer documentation page only: no resolver and no deployed cast services"
```

Create `conformance/lib/network.ts`:

```ts
import fs from "node:fs";
import yaml from "js-yaml";
import { z } from "zod";

const NetworkSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  vpr: z.string().min(1),
  protocol: z.enum(["v3", "v4"]),
  production: z.boolean(),
  castToken: z.string().min(1),
  resolver: z.string().url().nullable(),
  indexer: z.string().url().nullable(),
  rpc: z.string().url().nullable(),
  playground: z.string().url().nullable(),
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
```

- [ ] **Step 7: Run the tests and typecheck**

Run: `cd conformance && npx vitest run && npm run typecheck; cd ..`
Expected: PASS (4 tests), typecheck clean.

- [ ] **Step 8: Write the README**

Create `conformance/README.md`:

```markdown
# Wallet conformance

Proves, on every change, which listed wallets work against the deployed playground. Implements the
[wallet conformance testing guideline](https://github.com/verana-labs/verana-spec/pull/92).

- `profiles/` one YAML per listed wallet: rails, builds, promises, quirks. Every tier reads it; nothing
  wallet-specific is hard-coded anywhere else. Validated by `app/lib/wallet-profiles.ts` in the main CI.
- `networks.yaml` the networks a run can target. `CONFORMANCE_NETWORK=testnet-v3` selects one; by
  default every testable network runs and the others are reported as not yet testable.
- `tier1/` contract checks: what a wallet fetches, asserted without running a wallet.
- `tier2/` headless flows with the wallets' libraries, asserting the resolver inputs of the verdict.
- `tier3/` device spot-checks: rendering and gating only.

This directory is its own npm package so that the Tier 2 native dependencies never enter the site build.

    cd conformance && npm ci && npm test

Hazards the checks encode, so nobody rediscovers them: the resolver caches a negative verdict for an
hour (refresh before asserting); a green workflow is not a deployment (the version actually serving is
read from the cluster); casts drift in version (every result names the tag it ran against); cast rolls
share one concurrency group and must be dispatched one at a time.
```

- [ ] **Step 9: Root checks still green**

Run: `npm run lint && npm run typecheck && npm run validate:registry && npx vitest run && npm run build 2>&1 | tail -3`
Expected: all green; the root vitest does not pick up `conformance/**` (its include is `app/**`).

- [ ] **Step 10: Commit**

```bash
git add conformance/package.json conformance/package-lock.json conformance/tsconfig.json conformance/vitest.config.ts conformance/.gitignore conformance/README.md conformance/networks.yaml conformance/lib tsconfig.json
git commit -m "feat: conformance package scaffold with network configuration"
```

---

### Task 6: Open the pull request

**Files:** none new.

- [ ] **Step 1: Push the branch**

Run: `git push -u origin feat/wallet-matrix-store-builds`
(Pushing and merging playground PRs was granted for this work. If the push is refused by the permission classifier, stop and report.)

- [ ] **Step 2: Open the PR**

Title: `feat: wallet profiles and the listing narrowed to five wallets`

Body (Maxime's voice, no headers):

```
Twice a client hit a wallet that was listed but no longer worked, and nobody could say from the repo which build had been proven against what. This adds one conformance profile per listed wallet (rails, builds with what each promises, known incompatibilities, device quirks) under `conformance/profiles/`, validated in CI against `personal-wallets.yaml` so the listing cannot drift from the profile.

The seven wallets nobody maintains right now are hidden rather than deleted: entries, icons and captures stay, re-listing is one line. The listing shows wwWallet, EUDI, Inji, Hologram, swiyu and the INTEXUS instance.

`conformance/` is scaffolded as its own package with the network configuration every tier reads, so the v3 to v4 move is a config change. Tier 1 contract checks come in the next PR. Also carries the wallet-matrix device scripts from the earlier work on this branch.

check-format, check-types, validate:registry, vitest and build all clean.
```

- [ ] **Step 3: Tell Maxime**

Report the PR URL, the six visible wallets, and the four findings from the roadmap (resolver `production: true`, empty `permissionChain`, demo cast tag overrides, swiyu store rail).
