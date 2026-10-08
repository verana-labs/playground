import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { PROTOCOL } from "@/app/lib/network";
import { VESTA_CAST } from "@/app/lib/vesta-cast";
import { vtjscIdFor } from "@/app/lib/vtjsc";

// Mint a badge presentation request from the Vesta Portal (chapter-4 demo 2:
// the mimicked portal login window). DIDComm rail: an attributes-only OOB
// presentation request - no credentialDefinitionId restriction, so a badge
// from ANY issuer (Vesta, Zenith, Umbra) satisfies it; the portal's decision
// happens after presentation, on the badge issuer's chain. OID4VC rail: an
// OID4VP authorization request from the portal's ecs-badge policy.
//
// V4 (vs-agent v2): both rails name the badge VTJSC, which the ECS Ecosystem
// controller publishes for its BadgeCredential schema. The request asks for
// every attribute of the schema, and any authorized issuer of the badge
// satisfies it. The portal decides after the presentation, as on V3.

export const dynamic = "force-dynamic";

const PORTAL_ID = "vesta-portal";
const BADGE_POLICY = process.env.DEMO_OID4VC_BADGE_POLICY ?? "ecs-badge";
const BADGE_ATTRIBUTES = ["badgeNumber", "name", "title", "department"];

function str(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

/** V4: the title of the ECS Badge schema in the ECS Ecosystem. */
const BADGE_SCHEMA_TITLE = "BadgeCredential";

async function requestV4(admin: string, oid4vc: boolean) {
  const jsonSchemaCredentialId = await vtjscIdFor(VESTA_CAST.ecs.host, BADGE_SCHEMA_TITLE);
  if (oid4vc) {
    const request = await adminJson(`${admin}/v2/openid4vc/presentation-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonSchemaCredentialId }),
    });
    const url = str(request, "url");
    if (!url) throw new Error("no url in response");
    return NextResponse.json({ rail: "oid4vc", url, id: str(request, "proofExchangeId") });
  }
  const request = await adminJson(`${admin}/v2/didcomm/presentation-request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestedCredentials: [{ jsonSchemaCredentialId }],
      // Without autoAccept the exchange stops at presentation-received.
      autoAccept: true,
    }),
  });
  const url = str(request, "shortUrl") ?? str(request, "url");
  if (!url) throw new Error("no url in response");
  return NextResponse.json({ rail: "didcomm", url, id: str(request, "proofExchangeId") });
}

export async function GET(req: Request) {
  const format = new URL(req.url).searchParams.get("format") ?? "anoncreds";
  const admin = adminBase(PORTAL_ID);
  const oid4vc = format === "openid4vc-sdjwt" || format === "oid4vc";

  try {
    if (PROTOCOL === "v4") return await requestV4(admin, oid4vc);

    if (oid4vc) {
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

    // Request badges by the canonical badge VTJSC on the Vesta anchor. On
    // current vs-agent images this restricts matching to Vesta-issued
    // badges (employee path only over DIDComm); with vs-agent #550 the
    // same request matches ANY accredited issuer of the VTJSC (Vesta,
    // Zenith, Umbra) - all three login outcomes, no change needed here.
    const request = await adminJson(
      `${admin}/v1/invitation/presentation-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref: "portal-login",
          requestedCredentials: [
            {
              jsonSchemaCredentialId: `https://${VESTA_CAST.vesta.host}/vt/schemas-badge-jsc.json`,
              attributes: BADGE_ATTRIBUTES,
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
    return NextResponse.json(
      { error: "portal unreachable" },
      { status: 503 },
    );
  }
}
