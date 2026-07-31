// DID display helpers - a plain module so both data files (scenes) and
// components can use them.

/** Shorten a DID's self-certifying id segment (the did:webvh SCID) to its
 *  first 4 + "..." + last 4 characters:
 *  did:webvh:QmVdceDZTiP34oz168Yjtm7PHFLb7g9hbWgQEFzfmV8r7S:vesta.example
 *  → did:webvh:QmVd...8r7S:vesta.example */
export function shortDid(did: string): string {
  return did
    .split(":")
    .map((part) =>
      /^[1-9A-HJ-NP-Za-km-z]{16,}$/.test(part)
        ? `${part.slice(0, 4)}...${part.slice(-4)}`
        : part,
    )
    .join(":");
}

/** The web host behind a did:web / did:webvh, when the last segment is one. */
export function didHost(did: string): string | null {
  const last = did.split(":").pop() ?? "";
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(last) ? last : null;
}
