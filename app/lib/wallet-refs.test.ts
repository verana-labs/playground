import { describe, expect, it } from "vitest";
import { knownTags, mutableLinkProblem, parseGitHubLink } from "./wallet-refs";

const SHA = "e6992fccc6540ae297e20082ccc80e0c8cda0e5d";

describe("parseGitHubLink", () => {
  it("reads the repository, the kind and the ref", () => {
    expect(parseGitHubLink("https://github.com/AirKyzzZ/Wallet")).toEqual({ repo: "airkyzzz/wallet", kind: "root" });
    expect(parseGitHubLink("https://github.com/a/w/releases")?.kind).toBe("releases");
    expect(parseGitHubLink("https://github.com/a/w/releases/latest/download/app.apk")?.kind).toBe("releases");
    expect(parseGitHubLink("https://github.com/a/w/releases/download/v1.2/app.apk")).toEqual({ repo: "a/w", kind: "release-asset", ref: "v1.2" });
    expect(parseGitHubLink("https://github.com/a/w/releases/tag/Wallet/Demo_Version%3D2026.07.39")).toEqual({ repo: "a/w", kind: "release", ref: "Wallet/Demo_Version=2026.07.39" });
    expect(parseGitHubLink("https://github.com/a/w/tree/feat/verana-trust")).toEqual({ repo: "a/w", kind: "tree", ref: "feat/verana-trust" });
    expect(parseGitHubLink(`https://github.com/a/w/commit/${SHA}`)).toEqual({ repo: "a/w", kind: "commit", ref: SHA });
    expect(parseGitHubLink("https://play.google.com/store/apps/details?id=a")).toBeNull();
  });
});

describe("mutableLinkProblem", () => {
  const tags = knownTags(["https://github.com/a/w/releases/download/verana-2026-10-02/app.apk"]);

  it("accepts releases, full commits and the tags a release proves", () => {
    for (const url of [
      "https://github.com/a/w/releases/download/verana-2026-10-02/app.apk",
      "https://github.com/a/w/releases/tag/v1",
      `https://github.com/a/w/commit/${SHA}`,
      `https://github.com/a/w/tree/${SHA}`,
      "https://github.com/a/w/tree/verana-2026-10-02",
      "https://github.com/A/W/blob/verana-2026-10-02/README.md",
    ])
      expect(mutableLinkProblem(url, "build", tags), url).toBeNull();
  });

  it("rejects branches, short shas, releases indexes and, for a build, the repository root", () => {
    expect(mutableLinkProblem("https://github.com/a/w/tree/feat/verana-trust", "source", tags)).toMatch(/feat\/verana-trust/);
    expect(mutableLinkProblem("https://github.com/b/w/tree/verana-2026-10-02", "source", tags)).toMatch(/neither/);
    expect(mutableLinkProblem(`https://github.com/a/w/tree/${SHA.slice(0, 12)}`, "source", tags)).not.toBeNull();
    expect(mutableLinkProblem(`https://github.com/a/w/commit/${SHA.slice(0, 12)}`, "build", tags)).toMatch(/40-char/);
    expect(mutableLinkProblem("https://github.com/a/w/releases", "build", tags)).toMatch(/releases index/);
    expect(mutableLinkProblem("https://github.com/a/w", "build", tags)).toMatch(/root/);
    expect(mutableLinkProblem("https://github.com/a/w", "source", tags)).toBeNull();
    expect(mutableLinkProblem("https://github.com/a/w/pull/5", "source", tags)).not.toBeNull();
    expect(mutableLinkProblem("https://example.org/app.apk", "build", tags)).toBeNull();
  });
});
