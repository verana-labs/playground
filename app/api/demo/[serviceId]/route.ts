import { NextResponse } from "next/server";
import { getDemoService } from "@/app/lib/demo-services";
import { adminBase, adminJson, CAST_DOMAIN, VTJSC_URL } from "@/app/lib/demo-admin";
import {
  BADGE_CREDENTIAL_TYPE_NAME,
  badgeDemoClaims,
  badgeOid4vcClaims,
} from "@/app/lib/demo-badge";
import {
  citizenDemoClaims,
  citizenOid4vcClaims,
  legalRepDemoClaims,
  legalRepOid4vcClaims,
} from "@/app/lib/demo-verandia";
import {
  VERANDIA_CITIZEN_ID_JSC,
  VERANDIA_CITIZEN_ID_NAME,
  VERANDIA_LEGAL_REP_JSC,
  VERANDIA_LEGAL_REP_NAME,
} from "@/app/lib/verandia-cast";
import { VESTA_CAST } from "@/app/lib/vesta-cast";

// Live demo-action link for a Playground cast service (spec §4): what the
// wallet actually scans. Issuers mint an OOB CREDENTIAL OFFER and verifiers
// an OOB PRESENTATION REQUEST via their in-cluster vs-agent admin APIs - the
// wallet lands directly on the offer/request consent screen (with its
// Q2/Q3 verdict), not in a DIDComm chat. The untrusted service keeps a plain
// connection invitation: its lesson (Q1) happens before any exchange exists.
//
// The `credential` query selects WHICH credential the action is about - the
// DemoCredential (default), the Vesta ECS-Badge, or the Verandia credentials -
// via the registry below; the service id selects WHO mints it.

export const dynamic = "force-dynamic";

type Claim = { name: string; value: string };

type CredentialKind = {
  /** Human noun for error messages. */
  label: string;
  /** vs-agent credential-type name for the DIDComm cred-def lookup;
   *  null = the DemoCredential (matched by VTJSC, falling back to name). */
  credDefName: string | null;
  /** OID4VC issuance configuration / verification policy ids on the agents. */
  oid4vcConfig: string;
  oid4vcPolicy: string;
  /** VTJSC the DIDComm presentation request asks for. */
  jscUrl: string;
  claims: (serviceId: string) => Claim[];
  oid4vcClaims: (serviceId: string) => Record<string, string>;
};

const CREDENTIALS: Record<string, CredentialKind> = {
  "demo-credential": {
    label: "DemoCredential",
    credDefName: null,
    oid4vcConfig: process.env.DEMO_OID4VC_CRED_CONFIG ?? "demo-credential",
    oid4vcPolicy: process.env.DEMO_OID4VC_POLICY ?? "demo-credential",
    jscUrl: VTJSC_URL,
    claims: () => [
      { name: "name", value: "Playground Visitor" },
      { name: "demoId", value: `demo-${crypto.randomUUID().slice(0, 8)}` },
    ],
    oid4vcClaims: () => ({
      name: "Playground Visitor",
      demoId: `demo-${crypto.randomUUID().slice(0, 8)}`,
    }),
  },
  "ecs-badge": {
    label: "ECS-Badge",
    credDefName: BADGE_CREDENTIAL_TYPE_NAME,
    oid4vcConfig: process.env.DEMO_OID4VC_BADGE_CONFIG ?? "ecs-badge",
    oid4vcPolicy: process.env.DEMO_OID4VC_BADGE_POLICY ?? "ecs-badge",
    jscUrl: `https://${VESTA_CAST.vesta.host}/vt/schemas-badge-jsc.json`,
    claims: badgeDemoClaims,
    oid4vcClaims: badgeOid4vcClaims,
  },
  "verandia-citizen-id": {
    label: "Verandia Citizen ID",
    credDefName: VERANDIA_CITIZEN_ID_NAME,
    oid4vcConfig:
      process.env.DEMO_OID4VC_CITIZEN_CONFIG ?? "verandia-citizen-id",
    oid4vcPolicy: process.env.DEMO_OID4VC_CITIZEN_POLICY ?? "verandia-citizen-id",
    jscUrl: VERANDIA_CITIZEN_ID_JSC,
    claims: () => citizenDemoClaims(),
    oid4vcClaims: () => citizenOid4vcClaims(),
  },
  "verandia-legal-rep": {
    label: "Legal Representative credential",
    credDefName: VERANDIA_LEGAL_REP_NAME,
    oid4vcConfig:
      process.env.DEMO_OID4VC_LEGAL_REP_CONFIG ?? "verandia-legal-rep",
    oid4vcPolicy:
      process.env.DEMO_OID4VC_LEGAL_REP_POLICY ?? "verandia-legal-rep",
    jscUrl: VERANDIA_LEGAL_REP_JSC,
    claims: () => legalRepDemoClaims(),
    oid4vcClaims: () => legalRepOid4vcClaims(),
  },
};

async function credDefId(
  admin: string,
  kind: CredentialKind,
): Promise<string | null> {
  const types = await adminJson(`${admin}/v1/credential-types`);
  if (!Array.isArray(types)) return null;
  const match = kind.credDefName
    ? types.find(
        (t) =>
          t && typeof t === "object" &&
          (t as { name?: unknown }).name === kind.credDefName,
      )
    : (types.find(
        (t) =>
          t && typeof t === "object" &&
          (t as { relatedJsonSchemaCredentialId?: unknown })
            .relatedJsonSchemaCredentialId === VTJSC_URL,
      ) ??
      types.find(
        (t) =>
          t && typeof t === "object" &&
          (t as { name?: unknown }).name === "DemoCredential",
      ));
  const id = (match as { id?: unknown } | undefined)?.id;
  return typeof id === "string" ? id : null;
}

function str(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

const oobUrl = (body: unknown) => str(body, "shortUrl") ?? str(body, "url");

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const { serviceId } = await params;
  const search = new URL(req.url).searchParams;
  const format = search.get("format") ?? "anoncreds";
  // Which credential the action is about (see the registry above).
  const credentialId = search.get("credential") ?? "demo-credential";
  // OpenID4VP v1 replaced Presentation Exchange with DCQL, and wallets that predate DCQL reject a
  // v1 request outright. ?query=pe mints the same request on the last draft that still admits a
  // presentation_definition, which is what Altme needs.
  const queryLanguage =
    search.get("query") === "pe" ? "presentation_exchange" : undefined;
  // The EUDI reference wallet resolves no DIDs; ?signer=x5c mints the request
  // signed under the development certificate instead, an x509_hash client_id
  // its stack accepts, and the wallet-side check binds that cert back to the
  // DID it names in its URI SAN.
  const requestSigner = search.get("signer") === "x5c" ? "x5c" : undefined;
  const kind = CREDENTIALS[credentialId];
  const isBadge = credentialId === "ecs-badge";
  const service = getDemoService(serviceId);
  if (!service || !kind)
    return NextResponse.json({ error: "unknown service" }, { status: 404 });

  // The unprovisioned-but-minting pair (spec §4): untrusted on Q1, yet they
  // DO mint real OID4VC artifacts, so a Track-B wallet can receive an offer
  // or request from a service it cannot trust-resolve and refuse it.
  const UNTRUSTED_MINTERS: Record<string, "issuer" | "verifier"> = {
    "demo-issuer-untrusted": "issuer",
    "demo-verifier-untrusted": "verifier",
  };
  const wantsOid4vc = format === "openid4vc-sdjwt" || format === "oid4vc";
  // Umbra, the badge impostor, mints badge offers despite its untrusted role.
  const mintRole =
    service.role === "untrusted"
      ? (UNTRUSTED_MINTERS[serviceId] ?? (isBadge ? "issuer" : undefined))
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
  // authorization request via the agents' OID4VC plugin endpoints. On agents
  // without the plugin configuration this degrades to {kind: "unsupported"}
  // and the page shows a coming-soon placeholder.
  if (wantsOid4vc) {
    try {
      if (mintRole === "issuer") {
        const offer = await adminJson(`${admin}/v1/oid4vc/offers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            credentialConfigurationId: kind.oid4vcConfig,
            claims: kind.oid4vcClaims(serviceId),
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
        body: JSON.stringify({
          policyId: kind.oid4vcPolicy,
          ...(queryLanguage ? { queryLanguage } : {}),
          ...(requestSigner ? { requestSigner } : {}),
        }),
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
      const credentialDefinitionId = await credDefId(admin, kind);
      if (!credentialDefinitionId)
        return NextResponse.json(
          { error: `no ${kind.label} credential type on this issuer` },
          { status: 503 },
        );
      const offer = await adminJson(`${admin}/v1/invitation/credential-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialDefinitionId,
          claims: kind.claims(serviceId),
        }),
      });
      return NextResponse.json({
        kind: "credential-offer",
        url: oobUrl(offer),
        credentialExchangeId: str(offer, "credentialExchangeId"),
      });
    }

    // verifier: OOB presentation request for the selected credential
    const request = await adminJson(
      `${admin}/v1/invitation/presentation-request`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestedCredentials: [{ jsonSchemaCredentialId: kind.jscUrl }],
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
