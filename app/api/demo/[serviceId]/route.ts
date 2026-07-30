import { NextResponse } from "next/server";
import { getDemoService } from "@/app/lib/demo-services";

// Live demo-action link for a Playground cast service (spec §4): what the
// wallet actually scans. Issuers mint an OOB CREDENTIAL OFFER and verifiers
// an OOB PRESENTATION REQUEST via their in-cluster vs-agent admin APIs — the
// wallet lands directly on the offer/request consent screen (with its
// Q2/Q3 verdict), not in a DIDComm chat. The untrusted service keeps a plain
// connection invitation: its lesson (Q1) happens before any exchange exists.

export const dynamic = "force-dynamic";

const CAST =
  process.env.CAST_BASE_DOMAIN ?? "playground.testnet.verana.network";
// Admin API of a cast vs-agent — in-cluster service DNS by default; {id} is
// replaced by the service id (= Helm release = k8s Service name).
const ADMIN_TEMPLATE =
  process.env.DEMO_ADMIN_BASE_TEMPLATE ?? "http://{id}:3000";
// The ecosystem VTJSC of the DemoCredential, published by the anchor.
const VTJSC_URL =
  process.env.DEMO_VTJSC_URL ??
  `https://playground-demo.${CAST}/vt/schemas-demo-credential-jsc.json`;

const TIMEOUT_MS = 15_000;

const adminBase = (id: string) => ADMIN_TEMPLATE.replace("{id}", id);

async function adminJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

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

function oobUrl(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const { shortUrl, url } = body as { shortUrl?: unknown; url?: unknown };
  if (typeof shortUrl === "string") return shortUrl;
  return typeof url === "string" ? url : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const { serviceId } = await params;
  const service = getDemoService(serviceId);
  if (!service)
    return NextResponse.json({ error: "unknown service" }, { status: 404 });

  // Only the Playground cast has reachable admin APIs; anything else (and
  // the untrusted service, by design) gets its plain connection invitation.
  const isCast = service.host.endsWith(CAST);
  if (!isCast || service.role === "untrusted" || service.role === "anchor") {
    return NextResponse.json({
      kind: "invitation",
      url: service.appUrl ?? null,
    });
  }

  const admin = adminBase(serviceId);
  try {
    if (service.role === "issuer") {
      const credentialDefinitionId = await demoCredDefId(admin);
      if (!credentialDefinitionId)
        return NextResponse.json(
          { error: "no DemoCredential credential type on this issuer" },
          { status: 503 },
        );
      const offer = await adminJson(`${admin}/v1/invitation/credential-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialDefinitionId,
          claims: [
            { name: "name", value: "Playground Visitor" },
            { name: "demoId", value: `demo-${crypto.randomUUID().slice(0, 8)}` },
          ],
        }),
      });
      return NextResponse.json({ kind: "credential-offer", url: oobUrl(offer) });
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
    });
  } catch {
    return NextResponse.json(
      { error: "demo service unreachable" },
      { status: 503 },
    );
  }
}
