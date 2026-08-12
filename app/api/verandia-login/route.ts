import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import {
  VERANDIA_CITIZEN_ID_JSC,
  VERANDIA_LEGAL_REP_JSC,
} from "@/app/lib/verandia-cast";

// Mint a credential presentation request from one of the Verandia relying
// parties (chapter-4 demos 3 and 4: the Tax Buro portal and the Meridian
// Bank window). Two modes per portal:
//   - citizen: request the Verandia Citizen ID (personal space / KYC)
//   - company: request the Legal Representative credential (company space /
//     corporate account access)
// DIDComm rail: an OOB presentation request against the schema's VTJSC.
// OID4VC rail: an OID4VP authorization request from the portal's policy.
// The access decision happens after presentation, on the credential
// ISSUER's chain - see /api/verandia-login/[id].

export const dynamic = "force-dynamic";

const PORTALS = new Set(["tax-buro", "meridian-bank"]);

const CITIZEN_ATTRIBUTES = [
  "familyName",
  "givenName",
  "personalIdentifier",
  "portrait",
];
const LEGAL_REP_ATTRIBUTES = [
  "companyName",
  "companyRegistryId",
  "representativeName",
  "role",
  "powers",
];

const CITIZEN_POLICY =
  process.env.DEMO_OID4VC_CITIZEN_POLICY ?? "verandia-citizen-id";
const LEGAL_REP_POLICY =
  process.env.DEMO_OID4VC_LEGAL_REP_POLICY ?? "verandia-legal-rep";

function str(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export async function GET(req: Request) {
  const search = new URL(req.url).searchParams;
  const portal = search.get("portal") ?? "tax-buro";
  const mode = search.get("mode") === "company" ? "company" : "citizen";
  const format = search.get("format") ?? "anoncreds";
  if (!PORTALS.has(portal) || !getDemoService(portal))
    return NextResponse.json({ error: "unknown portal" }, { status: 404 });
  const admin = adminBase(portal);

  try {
    if (format === "openid4vc-sdjwt" || format === "oid4vc") {
      const request = await adminJson(`${admin}/v1/oid4vc/verifier/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: mode === "company" ? LEGAL_REP_POLICY : CITIZEN_POLICY,
        }),
      });
      const url =
        str(request, "authorizationRequest") ??
        str(request, "authorizationRequestUri");
      if (!url) throw new Error("no authorizationRequest in response");
      return NextResponse.json({
        rail: "oid4vc",
        url,
        id: str(request, "verificationSessionId"),
      });
    }

    const request = await adminJson(
      `${admin}/v1/invitation/presentation-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: `verandia-login-${portal}-${mode}`,
          requestedCredentials: [
            mode === "company"
              ? {
                  jsonSchemaCredentialId: VERANDIA_LEGAL_REP_JSC,
                  attributes: LEGAL_REP_ATTRIBUTES,
                }
              : {
                  jsonSchemaCredentialId: VERANDIA_CITIZEN_ID_JSC,
                  attributes: CITIZEN_ATTRIBUTES,
                },
          ],
        }),
      },
    );
    const url = str(request, "shortUrl") ?? str(request, "url");
    if (!url) throw new Error("no url in response");
    return NextResponse.json({
      rail: "didcomm",
      url,
      id: str(request, "proofExchangeId"),
    });
  } catch {
    return NextResponse.json({ error: "portal unreachable" }, { status: 503 });
  }
}
