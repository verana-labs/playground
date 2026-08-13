import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import { didHost } from "@/app/lib/did";
import { issuerDidFromRecord, toClaims, type Claim } from "@/app/lib/presentation";
import { BOLIVIA_CAST } from "@/app/lib/bolivia-cast";

// Status + access decision for a Bolivia login presentation (chapter-4
// demos). Once the wallet presents, the relying party decides from the
// credential ISSUER's chain:
//   - mode ciudadano: issuer is the SEGIP DID   -> personal space
//   - mode empresa: issuer is the SEPREC DID    -> company space (company
//     name from the presented claims)
//   - anything else                             -> denied
// One rule per credential covers the whole State, executed against the
// issuing institutions' DIDs. Same decision contract as the Verandia login.

export const dynamic = "force-dynamic";

const PORTALS = new Set(["impuestos", "banco-union"]);

const claim = (claims: Claim[], name: string) =>
  claims.find((c) => c.name === name)?.value;

/** AnonCreds fallback when the record carries no resolvable issuer DID: the
 *  demo claim sets are recognizable by their registry-stamped values. */
function fallbackIssuerDid(mode: string, claims: Claim[]): string | null {
  if (mode === "empresa") {
    return claim(claims, "companyRegistryId")?.startsWith("BO-MAT")
      ? BOLIVIA_CAST.seprec.did
      : null;
  }
  return claim(claims, "issuingAuthority")?.startsWith("SEGIP") ||
    claim(claims, "personalIdentifier")?.startsWith("CI-")
    ? BOLIVIA_CAST.segip.did
    : null;
}

function decide(
  mode: string,
  issuerDid: string | null,
  claims: Claim[],
): {
  decision: "ciudadano" | "empresa" | "denegado";
  name?: string;
  company?: string;
} {
  if (!issuerDid) return { decision: "denegado" };
  const host = didHost(issuerDid);
  if (mode === "empresa") {
    if (
      issuerDid === BOLIVIA_CAST.seprec.did ||
      (host !== null && host === BOLIVIA_CAST.seprec.host)
    ) {
      return {
        decision: "empresa",
        name: claim(claims, "representativeName"),
        company: claim(claims, "companyName"),
      };
    }
    return { decision: "denegado" };
  }
  if (
    issuerDid === BOLIVIA_CAST.segip.did ||
    (host !== null && host === BOLIVIA_CAST.segip.host)
  ) {
    const name = [claim(claims, "givenName"), claim(claims, "familyName")]
      .filter(Boolean)
      .join(" ");
    return { decision: "ciudadano", name: name || undefined };
  }
  return { decision: "denegado" };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const search = new URL(req.url).searchParams;
  const portal = search.get("portal") ?? "impuestos";
  const mode = search.get("mode") === "empresa" ? "empresa" : "ciudadano";
  const rail = search.get("rail") ?? "didcomm";
  if (!PORTALS.has(portal) || !getDemoService(portal))
    return NextResponse.json({ error: "unknown portal" }, { status: 404 });
  const admin = adminBase(portal);

  try {
    if (rail === "oid4vc") {
      // Completed-session shape (plugin-openid4vc VerifierService.getResult):
      // `accepted` is the plugin's own Q2 verdict (issuer TRUSTED_AUTHORIZED
      // for the schema); the issuer DID comes from the trust evidence.
      const body = await adminJson(
        `${admin}/v1/oid4vc/verifier/sessions/${encodeURIComponent(id)}`,
      );
      const record = (body ?? {}) as {
        state?: unknown;
        cryptographicVerified?: unknown;
        accepted?: unknown;
        trust?: { verdict?: unknown; evidence?: { did?: unknown; note?: unknown } };
        credential?: { disclosedClaims?: unknown };
      };
      const state = typeof record.state === "string" ? record.state : null;
      const done = state === "ResponseVerified" || record.accepted === true;
      if (!done) return NextResponse.json({ done: false, state });
      const claims = toClaims(record.credential?.disclosedClaims);
      const evidenceDid = record.trust?.evidence?.did;
      const issuerDid =
        typeof evidenceDid === "string" && evidenceDid
          ? evidenceDid
          : (issuerDidFromRecord(record) ?? fallbackIssuerDid(mode, claims));
      // A credential the plugin did not accept (unbound key, untrusted or
      // unauthorized issuer) never grants access, whatever DID it claims.
      const decision =
        record.accepted === true
          ? decide(mode, issuerDid, claims)
          : { decision: "denegado" as const };
      return NextResponse.json({
        done: true,
        verified: record.cryptographicVerified === true,
        claims,
        issuerDid,
        trustVerdict:
          typeof record.trust?.verdict === "string" ? record.trust.verdict : null,
        trustNote:
          typeof record.trust?.evidence?.note === "string"
            ? record.trust.evidence.note
            : null,
        ...decision,
      });
    }

    const body = await adminJson(
      `${admin}/v1/presentations/${encodeURIComponent(id)}`,
    );
    const record = (body ?? {}) as Record<string, unknown>;
    const state = typeof record.state === "string" ? record.state : null;
    if (state !== "done") return NextResponse.json({ done: false, state });
    const claims = toClaims(record.claims);
    const issuerDid =
      issuerDidFromRecord(record) ??
      (record.verified === true ? fallbackIssuerDid(mode, claims) : null);
    const decision = decide(mode, issuerDid, claims);
    return NextResponse.json({
      done: true,
      verified: record.verified === true,
      claims,
      issuerDid,
      ...decision,
    });
  } catch {
    return NextResponse.json({ done: false, state: null }, { status: 200 });
  }
}
