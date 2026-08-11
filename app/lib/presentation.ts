// Shared helpers for reading a vs-agent presentation record (DIDComm proof
// exchange or OID4VP verification session) in the login-demo API routes.

export type Claim = { name: string; value: string };

/** Normalize the presented data to a flat name/value list. Accepts the
 *  agent's claim-array shape, arrays of credential-shaped objects carrying a
 *  claims object each, and plain objects. */
export function toClaims(value: unknown): Claim[] {
  if (Array.isArray(value)) {
    const named = value.flatMap((c) =>
      c && typeof c === "object" &&
      typeof (c as Claim).name === "string" &&
      typeof (c as Claim).value === "string"
        ? [{ name: (c as Claim).name, value: (c as Claim).value }]
        : [],
    );
    if (named.length) return named;
    return value.flatMap((c) =>
      c && typeof c === "object" && (c as { claims?: unknown }).claims
        ? toClaims((c as { claims?: unknown }).claims)
        : [],
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([name, v]) =>
        typeof v === "string" || typeof v === "number" || typeof v === "boolean"
          ? [{ name, value: String(v) }]
          : [],
    );
  }
  return [];
}

/** Extract the issuer DID of the presented credential from the exchange
 *  record: walk credentialDefinition / credDef / issuer shaped keys (the
 *  cred-def id's prefix IS the issuer DID on the did:webvh AnonCreds
 *  registry) and return the first DID found. */
export function issuerDidFromRecord(record: unknown): string | null {
  const texts: string[] = [];
  const walk = (v: unknown, depth: number) => {
    if (depth > 4 || !v) return;
    if (typeof v === "string") {
      texts.push(v);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((x) => walk(x, depth + 1));
      return;
    }
    if (typeof v === "object") {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (/credentialDefinition|credDef|issuer/i.test(k)) walk(x, depth + 1);
      }
    }
  };
  walk(record, 0);
  for (const t of texts) {
    const m = t.match(/^did:[a-z0-9]+:[^/?#]+/i);
    if (m) return m[0];
  }
  return null;
}
