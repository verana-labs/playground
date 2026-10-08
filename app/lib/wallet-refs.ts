export type GitHubLink = {
  repo: string;
  kind: "root" | "releases" | "release" | "release-asset" | "tree" | "commit" | "other";
  ref?: string;
};

const COMMIT = /^[0-9a-f]{40}$/;

export const isCommit = (ref: string): boolean => COMMIT.test(ref);

export function parseGitHubLink(url: string): GitHubLink | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== "github.com") return null;
  const [owner, name, section, ...rest] = parsed.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (!owner || !name) return null;
  const repo = `${owner}/${name.replace(/\.git$/, "")}`.toLowerCase();
  if (!section) return { repo, kind: "root" };
  if (section === "releases") {
    const [sub, ...tail] = rest;
    if (!sub || sub === "latest") return { repo, kind: "releases" };
    if (sub === "tag" && tail.length) return { repo, kind: "release", ref: tail.join("/") };
    if (sub === "download" && tail.length > 1) return { repo, kind: "release-asset", ref: tail.slice(0, -1).join("/") };
    return { repo, kind: "other" };
  }
  if ((section === "tree" || section === "blob") && rest.length) return { repo, kind: "tree", ref: rest.join("/") };
  if (section === "commit" && rest[0]) return { repo, kind: "commit", ref: rest[0] };
  return { repo, kind: "other" };
}

export const releaseTag = (link: GitHubLink | null): string | undefined =>
  link && (link.kind === "release" || link.kind === "release-asset") ? link.ref : undefined;

export type LinkRole = "build" | "source";

export type KnownTags = ReadonlyMap<string, ReadonlySet<string>>;

export function knownTags(urls: Iterable<string>): KnownTags {
  const tags = new Map<string, Set<string>>();
  for (const url of urls) {
    const link = parseGitHubLink(url);
    const tag = releaseTag(link);
    if (link && tag) tags.set(link.repo, (tags.get(link.repo) ?? new Set()).add(tag));
  }
  return tags;
}

export function mutableLinkProblem(url: string, role: LinkRole, tags: KnownTags): string | null {
  const link = parseGitHubLink(url);
  if (!link) return null;
  const ref = link.ref ?? "";
  switch (link.kind) {
    case "release":
    case "release-asset":
      return null;
    case "root":
      return role === "source" ? null : "points at the repository root, not a release or a commit";
    case "releases":
      return "points at the releases index, which moves with every release";
    case "commit":
      return isCommit(ref) ? null : `names commit ${ref}, not a full 40-char sha`;
    case "tree": {
      const first = ref.split("/")[0] ?? "";
      const tagged = [...(tags.get(link.repo) ?? [])].some((tag) => ref === tag || ref.startsWith(`${tag}/`));
      return isCommit(first) || tagged ? null : `pins ${ref}, which is neither a 40-char commit nor a tag released from this repository`;
    }
    case "other":
      return "is neither a release, a tag nor a commit";
  }
}
