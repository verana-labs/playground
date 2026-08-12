import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import { didHost } from "@/app/lib/did";
import { issuerDidFromRecord, toClaims, type Claim } from "@/app/lib/presentation";
import { VERANDIA_CAST } from "@/app/lib/verandia-cast";

// Status + access decision for a Verandia login presentation (chapter-4 demos
// 3 and 4). Once the wallet presents, the relying party decides from the
// credential ISSUER's chain:
//   - mode citizen: issuer is the National Civil Registry DID  -> citizen
//   - mode company: issuer is the National Business Registry DID -> company
//     space (company name from the presented claims)
//   - anything else                                            -> denied
// This is the login policy of the story (spec: playground/verandia §3.5 - one
// rule per credential covers the whole Republic), executed against the
// issuing registries' DIDs.

export const dynamic = "force-dynamic";

const PORTALS = new Set(["tax-buro", "meridian-bank"]);

const claim = (claims: Claim[], name: string) =>
  claims.find((c) => c.name === name)?.value;

/** AnonCreds fallback when the record carries no resolvable issuer DID: the
 *  demo claim sets are recognizable by their registry-stamped values. */
function fallbackIssuerDid(mode: string, claims: Claim[]): string | null {
  if (mode === "company") {
    return claim(claims, "companyRegistryId")?.startsWith("VD-REG")
      ? VERANDIA_CAST.businessRegistry.did
      : null;
  }
  return claim(claims, "issuingAuthority")?.startsWith(
    "National Civil Registry",
  ) || claim(claims, "personalIdentifier")?.startsWith("VD-")
    ? VERANDIA_CAST.civilRegistry.did
    : null;
}

function decide(
  mode: string,
  issuerDid: string | null,
  claims: Claim[],
): { decision: "citizen" | "company" | "denied"; name?: string; company?: string } {
  if (!issuerDid) return { decision: "denied" };
  const host = didHost(issuerDid);
  if (mode === "company") {
    if (
      issuerDid === VERANDIA_CAST.businessRegistry.did ||
      (host !== null && host === VERANDIA_CAST.businessRegistry.host)
    ) {
      return {
        decision: "company",
        name: claim(claims, "representativeName"),
        company: claim(claims, "companyName"),
      };
    }
    return { decision: "denied" };
  }
  if (
    issuerDid === VERANDIA_CAST.civilRegistry.did ||
    (host !== null && host === VERANDIA_CAST.civilRegistry.host)
  ) {
    const name = [claim(claims, "givenName"), claim(claims, "familyName")]
      .filter(Boolean)
      .join(" ");
    return { decision: "citizen", name: name || undefined };
  }
  return { decision: "denied" };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const search = new URL(req.url).searchParams;
  const portal = search.get("portal") ?? "tax-buro";
  const mode = search.get("mode") === "company" ? "company" : "citizen";
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
          : { decision: "denied" as const };
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
