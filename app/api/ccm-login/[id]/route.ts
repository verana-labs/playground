import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import { didHost } from "@/app/lib/did";
import { issuerDidFromRecord, toClaims, type Claim } from "@/app/lib/presentation";
import { CCM_CAST } from "@/app/lib/ccm-cast";

// Status + access decision for the CCM corporate-access presentation
// (chapter-4 demo). Once the wallet presents, the bank decides from the
// credential ISSUER's chain:
//   - issuer is the CCM DID and the credential is current -> corporate
//     account access (company name from the presented claims)
//   - issuer is the CCM DID but validUntil is past       -> expired: ask
//     the representative to renew from the CCM portal
//   - anything else                                      -> denied
// One rule covers every company of the register, executed against the
// chamber's DID. Same decision contract as the Bolivia login.

export const dynamic = "force-dynamic";

const PORTAL = "bancolombia";

const claim = (claims: Claim[], name: string) =>
  claims.find((c) => c.name === name)?.value;

/** AnonCreds fallback when the record carries no resolvable issuer DID: the
 *  demo claim set is recognizable by its chamber-stamped values. */
function fallbackIssuerDid(claims: Claim[]): string | null {
  return claim(claims, "companyRegistryId")?.startsWith("CCM-MAT") ||
    claim(claims, "issuingChamber")?.startsWith("Cámara de Comercio de Medellín")
    ? CCM_CAST.camara.did
    : null;
}

/** validUntil travels as YYYYMMDD; an empty value means unbounded. */
function isExpired(claims: Claim[]): boolean {
  const raw = claim(claims, "validUntil");
  if (!raw || !/^\d{8}$/.test(raw)) return false;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return raw < today;
}

function decide(
  issuerDid: string | null,
  claims: Claim[],
): {
  decision: "empresa" | "expirada" | "denegado";
  name?: string;
  company?: string;
} {
  if (!issuerDid) return { decision: "denegado" };
  const host = didHost(issuerDid);
  if (
    issuerDid === CCM_CAST.camara.did ||
    (host !== null && host === CCM_CAST.camara.host)
  ) {
    if (isExpired(claims)) return { decision: "expirada" };
    return {
      decision: "empresa",
      name: claim(claims, "representativeName"),
      company: claim(claims, "companyName"),
    };
  }
  return { decision: "denegado" };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const search = new URL(req.url).searchParams;
  const rail = search.get("rail") ?? "didcomm";
  if (!getDemoService(PORTAL))
    return NextResponse.json({ error: "unknown portal" }, { status: 404 });
  const admin = adminBase(PORTAL);

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
          : (issuerDidFromRecord(record) ?? fallbackIssuerDid(claims));
      // A credential the plugin did not accept (unbound key, untrusted or
      // unauthorized issuer) never grants access, whatever DID it claims.
      const decision =
        record.accepted === true
          ? decide(issuerDid, claims)
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
      (record.verified === true ? fallbackIssuerDid(claims) : null);
    const decision = decide(issuerDid, claims);
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
