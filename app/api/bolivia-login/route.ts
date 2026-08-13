import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import {
  BOLIVIA_CEDULA_JSC,
  BOLIVIA_LEGAL_REP_JSC,
} from "@/app/lib/bolivia-cast";

// Mint a credential presentation request from one of the Bolivia relying
// parties (chapter-4 demos: the SIAT-style portal of Impuestos Nacionales
// and the Banco Unión window). Two modes per portal:
//   - ciudadano: request the Cédula Digital (personal space / KYC)
//   - empresa: request the Representante Legal credential (company space /
//     corporate account access)
// Same two-rail contract as /api/verandia-login; the access decision happens
// after presentation, on the credential ISSUER's chain - see
// /api/bolivia-login/[id].

export const dynamic = "force-dynamic";

const PORTALS = new Set(["impuestos", "banco-union"]);

const CEDULA_ATTRIBUTES = [
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

const CEDULA_POLICY =
  process.env.DEMO_OID4VC_CEDULA_POLICY ?? "cedula-digital";
const LEGAL_REP_POLICY =
  process.env.DEMO_OID4VC_BO_LEGAL_REP_POLICY ?? "bolivia-legal-rep";

function str(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export async function GET(req: Request) {
  const search = new URL(req.url).searchParams;
  const portal = search.get("portal") ?? "impuestos";
  const mode = search.get("mode") === "empresa" ? "empresa" : "ciudadano";
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
          policyId: mode === "empresa" ? LEGAL_REP_POLICY : CEDULA_POLICY,
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
          ref: `bolivia-login-${portal}-${mode}`,
          requestedCredentials: [
            mode === "empresa"
              ? {
                  jsonSchemaCredentialId: BOLIVIA_LEGAL_REP_JSC,
                  attributes: LEGAL_REP_ATTRIBUTES,
                }
              : {
                  jsonSchemaCredentialId: BOLIVIA_CEDULA_JSC,
                  attributes: CEDULA_ATTRIBUTES,
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
