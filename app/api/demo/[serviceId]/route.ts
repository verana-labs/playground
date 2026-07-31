import { NextResponse } from "next/server";
import { getDemoService } from "@/app/lib/demo-services";
import { adminBase, adminJson, CAST_DOMAIN, VTJSC_URL } from "@/app/lib/demo-admin";
import {
  BADGE_CREDENTIAL_TYPE_NAME,
  badgeDemoClaims,
} from "@/app/lib/demo-badge";

// Live demo-action link for a Playground cast service (spec §4): what the
// wallet actually scans. Issuers mint an OOB CREDENTIAL OFFER and verifiers
// an OOB PRESENTATION REQUEST via their in-cluster vs-agent admin APIs - the
// wallet lands directly on the offer/request consent screen (with its
// Q2/Q3 verdict), not in a DIDComm chat. The untrusted service keeps a plain
// connection invitation: its lesson (Q1) happens before any exchange exists.

export const dynamic = "force-dynamic";

async function demoCredDefId(admin: string): Promise<string | null> {
  const types = await adminJson(`${admin}/v1/credential-types`);
  if (!Array.isArray(types)) return null;
  const match =
    types.find(
      (t) =>
        t && typeof t === "object" &&
        (t as { relatedJsonSchemaCredentialId?: unknown })
          .relatedJsonSchemaCredentialId === VTJSC_URL,
    ) ??
    types.find(
      (t) =>
        t && typeof t === "object" &&
        (t as { name?: unknown }).name === "DemoCredential",
    );
  const id = (match as { id?: unknown } | undefined)?.id;
  return typeof id === "string" ? id : null;
}

// The ECS-Badge credential type provisioned on the badge issuers (Vesta,
// Zenith) by the vesta-* workflows - matched by name.
async function badgeCredDefId(admin: string): Promise<string | null> {
  const types = await adminJson(`${admin}/v1/credential-types`);
  if (!Array.isArray(types)) return null;
  const match = types.find(
    (t) =>
      t && typeof t === "object" &&
      (t as { name?: unknown }).name === BADGE_CREDENTIAL_TYPE_NAME,
  );
  const id = (match as { id?: unknown } | undefined)?.id;
  return typeof id === "string" ? id : null;
}

function str(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

const oobUrl = (body: unknown) => str(body, "shortUrl") ?? str(body, "url");

// OID4VC identifiers configured on the demo cast agents (OID4VC plugin).
const OID4VC_CRED_CONFIG =
  process.env.DEMO_OID4VC_CRED_CONFIG ?? "demo-credential";
const OID4VC_POLICY = process.env.DEMO_OID4VC_POLICY ?? "demo-credential";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const { serviceId } = await params;
  const search = new URL(req.url).searchParams;
  const format = search.get("format") ?? "anoncreds";
  // "demo-credential" (default) or "ecs-badge" (the Vesta chapter-4 demo).
  const credential = search.get("credential") ?? "demo-credential";
  const isBadge = credential === "ecs-badge";
  const service = getDemoService(serviceId);
  if (!service)
    return NextResponse.json({ error: "unknown service" }, { status: 404 });

  // The unprovisioned-but-minting pair (spec §4): untrusted on Q1, yet they
  // DO mint real OID4VC artifacts, so a Track-B wallet can receive an offer
  // or request from a service it cannot trust-resolve and refuse it.
  const UNTRUSTED_MINTERS: Record<string, "issuer" | "verifier"> = {
    "demo-issuer-untrusted": "issuer",
    "demo-verifier-untrusted": "verifier",
  };
  const wantsOid4vc = format === "openid4vc-sdjwt" || format === "oid4vc";
  const mintRole =
    service.role === "untrusted"
      ? UNTRUSTED_MINTERS[serviceId]
      : service.role === "issuer" || service.role === "verifier"
        ? service.role
        : undefined;

  // Only the Playground cast has reachable admin APIs; anything else (and,
  // outside the badge demo and the OID4VC minting pair above, the untrusted
  // services) gets its plain connection invitation - on AnonCreds the Q1
  // refusal happens at connect, so the invitation IS the demo. For the badge
  // demo the untrusted impostor DOES mint offers: the wallet flags them red,
  // and the portal refuses the badge at login.
  const isCast = service.host.endsWith(CAST_DOMAIN);
  if (
    !isCast ||
    service.role === "anchor" ||
    (service.role === "untrusted" && !isBadge && !(wantsOid4vc && mintRole))
  ) {
    return NextResponse.json({
      kind: "invitation",
      url: service.appUrl ?? null,
    });
  }

  const admin = adminBase(serviceId);

  // OpenID4VC SD-JWT rail: mint an OID4VCI credential offer / OID4VP
  // authorization request via the agents' OID4VC plugin endpoints. Until the
  // cast agents carry the plugin configuration, this degrades to
  // {kind: "unsupported"} and the page shows a coming-soon placeholder.
  // The ECS-Badge runs on the AnonCreds/DIDComm rail today.
  if (credential === "ecs-badge" && format !== "anoncreds") {
    return NextResponse.json({ kind: "unsupported", format, credential });
  }

  if (wantsOid4vc) {
    try {
      if (mintRole === "issuer") {
        const offer = await adminJson(`${admin}/v1/oid4vc/offers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credentialConfigurationId: OID4VC_CRED_CONFIG,
            claims: {
              name: "Playground Visitor",
              demoId: `demo-${crypto.randomUUID().slice(0, 8)}`,
            },
          }),
        });
        const url =
          str(offer, "credentialOffer") ?? str(offer, "credentialOfferUri");
        if (!url) throw new Error("no credentialOffer in response");
        return NextResponse.json({
          kind: "oid4vc-credential-offer",
          url,
          issuanceSessionId: str(offer, "issuanceSessionId"),
        });
      }
      const request = await adminJson(`${admin}/v1/oid4vc/verifier/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: OID4VC_POLICY }),
      });
      const url =
        str(request, "authorizationRequest") ??
        str(request, "authorizationRequestUri");
      if (!url) throw new Error("no authorizationRequest in response");
      return NextResponse.json({
        kind: "oid4vc-presentation-request",
        url,
        verificationSessionId: str(request, "verificationSessionId"),
      });
    } catch {
      return NextResponse.json({ kind: "unsupported", format });
    }
  }

  try {
    if (service.role === "issuer" || (isBadge && service.role === "untrusted")) {
      const credentialDefinitionId = isBadge
        ? await badgeCredDefId(admin)
        : await demoCredDefId(admin);
      if (!credentialDefinitionId)
        return NextResponse.json(
          { error: `no ${isBadge ? "ECS-Badge" : "DemoCredential"} credential type on this issuer` },
          { status: 503 },
        );
      const claims = isBadge
        ? badgeDemoClaims(serviceId)
        : [
            { name: "name", value: "Playground Visitor" },
            { name: "demoId", value: `demo-${crypto.randomUUID().slice(0, 8)}` },
          ];
      const offer = await adminJson(`${admin}/v1/invitation/credential-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentialDefinitionId, claims }),
      });
      return NextResponse.json({
        kind: "credential-offer",
        url: oobUrl(offer),
        credentialExchangeId: str(offer, "credentialExchangeId"),
      });
    }

    // verifier: OOB presentation request for the DemoCredential
    const request = await adminJson(
      `${admin}/v1/invitation/presentation-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedCredentials: [{ jsonSchemaCredentialId: VTJSC_URL }],
        }),
      },
    );
    return NextResponse.json({
      kind: "presentation-request",
      url: oobUrl(request),
      proofExchangeId: str(request, "proofExchangeId"),
    });
  } catch {
    // Admin API unreachable (e.g. local dev outside the cluster): degrade to
    // the public connection invitation so the QR still renders. In-cluster
    // deployments serve the full OOB offer/request flows.
    return NextResponse.json({
      kind: "invitation",
      url: service.appUrl ?? null,
      fallback: true,
    });
  }
}
