import { NextResponse } from "next/server";
import { getDemoService } from "@/app/lib/demo-services";
import { adminBase, adminJson, CAST_DOMAIN } from "@/app/lib/demo-admin";

// Status of a presentation flow started from a verifier demo card (spec §4):
// the page polls this to swap the QR for the PRESENTED CREDENTIAL once the
// wallet has shared it. Proxies the verifier vs-agent's admin API on either
// rail: DIDComm proof exchanges (default) or OID4VP verification sessions
// (?rail=oid4vc). Both are normalized to the same
// { state, verified, claims } contract, with "done" as the settled state.

export const dynamic = "force-dynamic";

type Claim = { name: string; value: string };

function toClaims(value: unknown): Claim[] {
  if (Array.isArray(value)) {
    const named = value.flatMap((c) =>
      c && typeof c === "object" &&
      typeof (c as Claim).name === "string" &&
      typeof (c as Claim).value === "string"
        ? [{ name: (c as Claim).name, value: (c as Claim).value }]
        : [],
    );
    if (named.length) return named;
    // Array of credential-shaped objects carrying a claims object each.
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

// The OID4VP session exposes the presented data under implementation-defined
// keys; probe the plausible containers in order. vs-agent nests them one level
// deeper, as `credential.disclosedClaims`.
function sessionClaims(record: Record<string, unknown>): Claim[] {
  const credential = record.credential;
  if (credential && typeof credential === "object") {
    const disclosed = toClaims(
      (credential as { disclosedClaims?: unknown }).disclosedClaims,
    );
    if (disclosed.length) return disclosed;
  }
  for (const key of ["claims", "presentedClaims", "presented", "credentials"]) {
    const claims = toClaims(record[key]);
    if (claims.length) return claims;
  }
  return [];
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serviceId: string; proofExchangeId: string }> },
) {
  const { serviceId, proofExchangeId } = await params;
  const rail = new URL(req.url).searchParams.get("rail") ?? "didcomm";
  const service = getDemoService(serviceId);
  if (
    !service ||
    (service.role !== "verifier" && service.role !== "untrusted") ||
    !service.host.endsWith(CAST_DOMAIN)
  )
    return NextResponse.json({ error: "unknown service" }, { status: 404 });

  try {
    if (rail === "oid4vc") {
      const body = await adminJson(
        `${adminBase(serviceId)}/v1/oid4vc/verifier/sessions/${encodeURIComponent(proofExchangeId)}`,
      );
      const record = (body ?? {}) as Record<string, unknown>;
      const state = typeof record.state === "string" ? record.state : null;
      const done = state === "ResponseVerified" || record.accepted === true;
      return NextResponse.json({
        state: done ? "done" : state,
        verified:
          record.cryptographicVerified === true || record.accepted === true,
        claims: sessionClaims(record),
      });
    }

    const body = await adminJson(
      `${adminBase(serviceId)}/v1/presentations/${encodeURIComponent(proofExchangeId)}`,
    );
    const record = (body ?? {}) as {
      state?: unknown;
      verified?: unknown;
      claims?: unknown;
    };
    return NextResponse.json({
      state: typeof record.state === "string" ? record.state : null,
      verified: record.verified === true,
      claims: toClaims(record.claims),
    });
  } catch {
    return NextResponse.json(
      { error: "demo service unreachable" },
      { status: 503 },
    );
  }
}
