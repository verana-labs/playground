import { describe, expect, it } from "vitest";
import { listWalletProfiles, obtainUrls } from "../../app/lib/wallet-profiles";
import { isCommit, parseGitHubLink, parseStoreLink } from "../../app/lib/wallet-refs";
import { parseListing, readExceptions, readListingText } from "./listing-gate";
import { profilesDir } from "./profiles-dir";

const profiles = listWalletProfiles(profilesDir());
const listing = parseListing(readListingText());

const listingUrls = listing.flatMap((w) =>
  [w.hosted, w.download, w.playstore, w.appstore, w.web, w.fork, w.repo].flatMap((f) => (typeof f === "string" ? [f] : f ? [f.url] : [])),
);
const buildUrls = profiles.flatMap((p) => p.builds.flatMap(obtainUrls));

const excepted = new Set(readExceptions().map((e) => e.value));
const pins = new Map<string, { repo: string; ref: string }>();
for (const url of [...listingUrls, ...buildUrls].filter((u) => !excepted.has(u))) {
  const link = parseGitHubLink(url);
  if (link?.ref && link.kind !== "other") pins.set(`${link.repo}@${link.ref}`, { repo: link.repo, ref: link.ref });
}
for (const build of profiles.flatMap((p) => p.builds)) {
  const repo = build.identity.repo ? parseGitHubLink(build.identity.repo)?.repo : undefined;
  if (repo && build.identity.ref) pins.set(`${repo}@${build.identity.ref}`, { repo, ref: build.identity.ref });
}

const github = (path: string): Promise<Response> =>
  fetch(`https://api.github.com/repos/${path}`, {
    headers: { accept: "application/vnd.github+json", ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) },
  });

const segments = (ref: string): string => ref.split("/").map(encodeURIComponent).join("/");

describe("every pinned GitHub ref is a tag or a commit, never a branch", () => {
  for (const { repo, ref } of pins.values())
    it(`${repo}@${ref}`, async () => {
      if (isCommit(ref)) {
        expect((await github(`${repo}/commits/${ref}`)).status).toBe(200);
        return;
      }
      expect((await github(`${repo}/git/ref/tags/${segments(ref)}`)).status, "tag").toBe(200);
      expect((await github(`${repo}/branches/${segments(ref)}`)).status, "a branch of the same name").toBe(404);
    });
});

describe("every store link names the app the profile declares", () => {
  for (const build of profiles.flatMap((p) => p.builds))
    for (const url of obtainUrls(build)) {
      const store = parseStoreLink(url);
      if (!store?.id) continue;
      it(url, async () => {
        if (store.store === "play") {
          expect((await fetch(url, { headers: { "accept-language": "en" } })).status).toBe(200);
          return;
        }
        const lookup = (await (await fetch(`https://itunes.apple.com/lookup?id=${store.id}`)).json()) as { results: { bundleId: string }[] };
        expect(lookup.results[0]?.bundleId).toBe(build.identity.bundle);
      });
    }
});
