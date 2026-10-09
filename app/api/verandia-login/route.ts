import { NextResponse } from "next/server";
import { adminBase, adminJson, DIDCOMM_INVITATION_VERSION } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import { PROTOCOL } from "@/app/lib/network";
import { vtjscIdFor } from "@/app/lib/vtjsc";
import {
  VERANDIA_CAST,
  VERANDIA_CITIZEN_ID_JSC,
  VERANDIA_CITIZEN_ID_TITLE,
  VERANDIA_LEGAL_REP_JSC,
  VERANDIA_LEGAL_REP_TITLE,
} from "@/app/lib/verandia-cast";

// Mint a credential presentation request from one of the Verandia relying
// parties (chapter-4 demos 3 and 4: the Tax Buro portal and the Meridian
// Bank window). Two modes per portal:
//   - citizen: request the Verandia Citizen ID (personal space / KYC)
//   - company: request the Legal Representative credential (company space /
//     corporate account access)
// DIDComm rail: an OOB presentation request against the schema's VTJSC.
// OID4VC rail: an OID4VP authorization request.
// The access decision happens after presentation, on the credential
// ISSUER's chain - see /api/verandia-login/[id].
//
// V3 (vs-agent v1): the OID4VC rail names the policy of the portal.
// V4 (vs-agent v2): both rails name the VTJSC, which the app finds by the
// registry host and the schema title. The honest relying parties ask for a
// subset of the claims on both rails. A request that names only the VTJSC
// asks for every claim: that is the QuickCash request (/api/demo).

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

/** V4: the VTJSC id and the requested claims of a mode. */
async function v4Request(mode: "citizen" | "company") {
  return mode === "company"
    ? {
        vtjsc: await vtjscIdFor(
          VERANDIA_CAST.businessRegistry.host,
          VERANDIA_LEGAL_REP_TITLE,
        ),
        claims: LEGAL_REP_ATTRIBUTES,
      }
    : {
        vtjsc: await vtjscIdFor(
          VERANDIA_CAST.civilRegistry.host,
          VERANDIA_CITIZEN_ID_TITLE,
        ),
        claims: CITIZEN_ATTRIBUTES,
      };
}

async function mintV4(
  admin: string,
  mode: "citizen" | "company",
  oid4vc: boolean,
) {
  const { vtjsc, claims } = await v4Request(mode);
  if (oid4vc) {
    const request = await adminJson(`${admin}/v2/openid4vc/presentation-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonSchemaCredentialId: vtjsc, requestedClaims: claims }),
    });
    const url = str(request, "url");
    if (!url) throw new Error("no url in response");
    return { rail: "oid4vc", url, id: str(request, "proofExchangeId") };
  }
  const request = await adminJson(`${admin}/v2/didcomm/presentation-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestedCredentials: [{ jsonSchemaCredentialId: vtjsc, attributes: claims }],
      // Without autoAccept the exchange stops at presentation-received.
      autoAccept: true,
      didcommVersion: DIDCOMM_INVITATION_VERSION,
    }),
  });
  const url = str(request, "shortUrl");
  if (!url) throw new Error("no shortUrl in response");
  return { rail: "didcomm", url, id: str(request, "proofExchangeId") };
}

export async function GET(req: Request) {
  const search = new URL(req.url).searchParams;
  const portal = search.get("portal") ?? "tax-buro";
  const mode = search.get("mode") === "company" ? "company" : "citizen";
  const format = search.get("format") ?? "anoncreds";
  if (!PORTALS.has(portal) || !getDemoService(portal))
    return NextResponse.json({ error: "unknown portal" }, { status: 404 });
  const admin = adminBase(portal);
  const oid4vc = format === "openid4vc-sdjwt" || format === "oid4vc";

  try {
    if (PROTOCOL === "v4")
      return NextResponse.json(await mintV4(admin, mode, oid4vc));

    if (oid4vc) {
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
