import { NextResponse } from "next/server";
import { getDemoService } from "@/app/lib/demo-services";
import { adminBase, adminJson, CAST_DOMAIN } from "@/app/lib/demo-admin";

// Status of an issuance flow started from an issuer demo card: the page
// polls this to swap the single-use QR for a delivered/declined message once
// the wallet has answered the offer. Proxies the issuer vs-agent's admin
// API (GET /v1/credential-exchanges/{id}). Untrusted minters (the badge
// impostor, the untrusted issuer) count too.

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  {
    params,
  }: {
    params: Promise<{ serviceId: string; credentialExchangeId: string }>;
  },
) {
  const { serviceId, credentialExchangeId } = await params;
  const service = getDemoService(serviceId);
  if (
    !service ||
    (service.role !== "issuer" && service.role !== "untrusted") ||
    !service.host.endsWith(CAST_DOMAIN)
  )
    return NextResponse.json({ error: "unknown service" }, { status: 404 });

  try {
    const body = await adminJson(
      `${adminBase(serviceId)}/v1/credential-exchanges/${encodeURIComponent(credentialExchangeId)}`,
    );
    const record = (body ?? {}) as { state?: unknown; error?: unknown };
    const state = typeof record.state === "string" ? record.state : null;
    return NextResponse.json({
      state,
      done: state === "done" || state === "credential-issued",
      declined: state === "abandoned" || state === "declined",
      error: typeof record.error === "string" ? record.error : null,
    });
  } catch {
    return NextResponse.json(
      { state: null, done: false, declined: false },
      { status: 200 },
    );
  }
}
