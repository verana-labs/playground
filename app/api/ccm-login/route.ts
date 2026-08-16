import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import { CCM_LEGAL_REP_JSC } from "@/app/lib/ccm-cast";

// Mint a credential presentation request from the CCM cast's relying party
// (chapter-4 demo: the Bancolombia (demo) corporate-access window). One
// mode only: the bank requests the credencial de Representación Legal —
// the personal KYC happens on-site with the physical cédula de ciudadanía,
// so no digital identity credential is involved. Same two-rail contract as
// /api/bolivia-login; the access decision happens after presentation, on
// the credential ISSUER's chain - see /api/ccm-login/[id].

export const dynamic = "force-dynamic";

const PORTAL = "bancolombia";

const LEGAL_REP_ATTRIBUTES = [
  "companyName",
  "nit",
  "companyRegistryId",
  "representativeName",
  "representativeId",
  "role",
  "validUntil",
];

const LEGAL_REP_POLICY =
  process.env.DEMO_OID4VC_CCM_LEGAL_REP_POLICY ?? "ccm-legal-rep";

function str(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export async function GET(req: Request) {
  const search = new URL(req.url).searchParams;
  const format = search.get("format") ?? "anoncreds";
  if (!getDemoService(PORTAL))
    return NextResponse.json({ error: "unknown portal" }, { status: 404 });
  const admin = adminBase(PORTAL);

  try {
    if (format === "openid4vc-sdjwt" || format === "oid4vc") {
      const request = await adminJson(`${admin}/v1/oid4vc/verifier/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: LEGAL_REP_POLICY }),
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
          ref: `ccm-login-${PORTAL}`,
          requestedCredentials: [
            {
              jsonSchemaCredentialId: CCM_LEGAL_REP_JSC,
              attributes: LEGAL_REP_ATTRIBUTES,
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
