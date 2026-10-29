import { createHash } from "node:crypto";

const ALGORITHMS = ["sha256", "sha384", "sha512"] as const;
type Algorithm = (typeof ALGORITHMS)[number];

const isAlgorithm = (value: string): value is Algorithm => (ALGORITHMS as readonly string[]).includes(value);

export function integrityMatches(metadata: string, body: Uint8Array): boolean | null {
  const entries = metadata
    .trim()
    .split(/\s+/)
    .flatMap((token) => {
      const m = /^([a-z0-9]+)-([A-Za-z0-9+/]+={0,2})(\?.*)?$/.exec(token);
      const algorithm = m?.[1];
      const digest = m?.[2];
      return algorithm && digest && isAlgorithm(algorithm) ? [{ algorithm, digest }] : [];
    });
  if (entries.length === 0) return null;
  const strongest = Math.max(...entries.map((e) => ALGORITHMS.indexOf(e.algorithm)));
  return entries
    .filter((e) => ALGORITHMS.indexOf(e.algorithm) === strongest)
    .some((e) => createHash(e.algorithm).update(body).digest("base64") === e.digest);
}
