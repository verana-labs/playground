import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { VESTA_CAST } from "@/app/lib/vesta-cast";

// Mint a badge presentation request from the Vesta Portal (chapter-4 demo 2:
// the mimicked portal login window). DIDComm rail: an attributes-only OOB
// presentation request - no credentialDefinitionId restriction, so a badge
// from ANY issuer (Vesta, Zenith, Umbra) satisfies it; the portal's decision
// happens after presentation, on the badge issuer's chain. OID4VC rail: an
// OID4VP authorization request from the portal's ecs-badge policy.

export const dynamic = "force-dynamic";

const PORTAL_ID = "vesta-portal";
const BADGE_POLICY = process.env.DEMO_OID4VC_BADGE_POLICY ?? "ecs-badge";
const BADGE_ATTRIBUTES = ["badgeNumber", "name", "title", "department"];

function str(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get("format") ?? "anoncreds";
  const admin = adminBase(PORTAL_ID);

  try {
    if (format === "openid4vc-sdjwt" || format === "oid4vc") {
      const request = await adminJson(`${admin}/v1/oid4vc/verifier/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: BADGE_POLICY }),
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

    const mintDidcomm = (requestedCredential: Record<string, unknown>) =>
      adminJson(`${admin}/v1/invitation/presentation-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: "portal-login",
          requestedCredentials: [
            { ...requestedCredential, attributes: BADGE_ATTRIBUTES },
          ],
        }),
      });

    // Preferred: request by schemaName (vs-agent #550) - a badge from ANY
    // issuer (Vesta, Zenith, Umbra) satisfies it, so all three login
    // outcomes are demonstrable. Until the portal image ships that
    // selector, fall back to the canonical badge VTJSC on the Vesta
    // anchor - which restricts matching to Vesta-issued badges (the
    // employee path only).
    let request: unknown;
    try {
      request = await mintDidcomm({
        schemaName: "ECS-Badge",
        schemaVersion: "1.0",
      });
    } catch {
      request = await mintDidcomm({
        jsonSchemaCredentialId: `https://${VESTA_CAST.vesta.host}/vt/schemas-badge-jsc.json`,
      });
    }
    const url = str(request, "shortUrl") ?? str(request, "url");
    if (!url) throw new Error("no url in response");
    return NextResponse.json({
      rail: "didcomm",
      url,
      id: str(request, "proofExchangeId"),
    });
  } catch {
    return NextResponse.json(
      { error: "portal unreachable" },
      { status: 503 },
    );
  }
}
