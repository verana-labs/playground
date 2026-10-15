import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import { didHost } from "@/app/lib/did";
import { PROTOCOL } from "@/app/lib/network";
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
//
// V4 (vs-agent v2). The decision relies on the trust decision of the agent:
//   - OID4VC: `accepted` is true only for the verdict TRUSTED_AUTHORIZED: the
//     issuer holds an active ISSUER entry for the requested schema. The trust
//     evidence gives the issuer DID, and the host rule below applies to it.
//   - DIDComm: the presentation record has no issuer field. The agent
//     abandons a presentation when the credential is not of the requested
//     schema, or when its issuer holds no active ISSUER entry for that schema
//     ([VSA-VTI-FLOW-VERIFY]). The issuer mode of both Verandia schemas is
//     ECOSYSTEM, and only the registry that controls the schema holds an
//     ISSUER entry (.github/workflows/verandia/README.md). Thus a verified
//     presentation of the requested schema comes from that registry, and the
//     mode of the request gives the decision.

export const dynamic = "force-dynamic";

const PORTALS = new Set(["tax-buro", "meridian-bank"]);

type Decision = {
  decision: "citizen" | "company" | "denied";
  name?: string;
  company?: string;
};

const claim = (claims: Claim[], name: string) =>
  claims.find((c) => c.name === name)?.value;

/** AnonCreds fallback when the record carries no resolvable issuer DID: the
 *  demo claim sets are recognizable by their registry-stamped values. V3 only:
 *  the DIDs are known on testnet. */
function fallbackIssuerDid(mode: string, claims: Claim[]): string | null {
  if (mode === "company") {
    return claim(claims, "companyRegistryId")?.startsWith("VD-REG")
      ? (VERANDIA_CAST.businessRegistry.did ?? null)
      : null;
  }
  return claim(claims, "issuingAuthority")?.startsWith(
    "National Civil Registry",
  ) || claim(claims, "personalIdentifier")?.startsWith("VD-")
    ? (VERANDIA_CAST.civilRegistry.did ?? null)
    : null;
}

/** The space that a verified credential of the requested schema opens. */
function grant(mode: string, claims: Claim[]): Decision {
  if (mode === "company") {
    return {
      decision: "company",
      name: claim(claims, "representativeName"),
      company: claim(claims, "companyName"),
    };
  }
  const name = [claim(claims, "givenName"), claim(claims, "familyName")]
    .filter(Boolean)
    .join(" ");
  return { decision: "citizen", name: name || undefined };
}

function decide(mode: string, issuerDid: string | null, claims: Claim[]): Decision {
  if (!issuerDid) return { decision: "denied" };
  const host = didHost(issuerDid);
  const registry =
    mode === "company" ? VERANDIA_CAST.businessRegistry : VERANDIA_CAST.civilRegistry;
  const fromRegistry =
    (registry.did !== undefined && issuerDid === registry.did) ||
    (host !== null && host === registry.host);
  return fromRegistry ? grant(mode, claims) : { decision: "denied" };
}

/** V4 DIDComm: the trust verdict of an abandoned presentation, from the
 *  problem code at the start of its error message. */
function v4DidcommVerdict(errorMessage: unknown): string | null {
  if (typeof errorMessage !== "string") return null;
  if (errorMessage.startsWith("e.p.issuer-not-authorized")) return "TRUSTED_NOT_AUTHORIZED";
  if (errorMessage.startsWith("e.p.trust-resolution-unavailable")) return "RESOLVER_UNAVAILABLE";
  return null;
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
  const v4 = PROTOCOL === "v4";

  try {
    if (rail === "oid4vc") {
      // Completed-session shape (plugin-openid4vc VerifierService.getResult,
      // the same on v1 and v2): `accepted` is the plugin's own Q2 verdict
      // (issuer TRUSTED_AUTHORIZED for the schema); the issuer DID comes from
      // the trust evidence.
      const body = await adminJson(
        v4
          ? `${admin}/v2/openid4vc/presentations/${encodeURIComponent(id)}`
          : `${admin}/v1/oid4vc/verifier/sessions/${encodeURIComponent(id)}`,
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
          : v4
            ? null
            : (issuerDidFromRecord(record) ?? fallbackIssuerDid(mode, claims));
      // A credential the plugin did not accept (unbound key, untrusted or
      // unauthorized issuer) never grants access, whatever DID it claims.
      const decision: Decision =
        record.accepted === true
          ? decide(mode, issuerDid, claims)
          : { decision: "denied" };
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

    if (v4) {
      const body = await adminJson(
        `${admin}/v2/didcomm/presentations/${encodeURIComponent(id)}`,
      );
      const record = (body ?? {}) as Record<string, unknown>;
      const state = typeof record.state === "string" ? record.state : null;
      // "abandoned": the agent refused the presentation (see the header).
      if (state !== "done" && state !== "abandoned")
        return NextResponse.json({ done: false, state });
      const claims = toClaims(record.claims);
      const verified = state === "done" && record.verified === true;
      return NextResponse.json({
        done: true,
        verified,
        claims,
        issuerDid: null,
        trustVerdict: verified ? null : v4DidcommVerdict(record.errorMessage),
        trustNote:
          !verified && typeof record.errorMessage === "string"
            ? record.errorMessage
            : null,
        ...(verified ? grant(mode, claims) : { decision: "denied" as const }),
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
