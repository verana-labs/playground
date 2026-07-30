import { NextResponse } from "next/server";
import { getDemoService } from "@/app/lib/demo-services";
import { adminBase, adminJson, CAST_DOMAIN } from "@/app/lib/demo-admin";

// Status of a presentation flow started from a verifier demo card (spec §4):
// the page polls this to swap the QR for the PRESENTED CREDENTIAL once the
// wallet has shared it. Proxies the verifier vs-agent's admin API.

export const dynamic = "force-dynamic";

type Claim = { name: string; value: string };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string; proofExchangeId: string }> },
) {
  const { serviceId, proofExchangeId } = await params;
  const service = getDemoService(serviceId);
  if (
    !service ||
    service.role !== "verifier" ||
    !service.host.endsWith(CAST_DOMAIN)
  )
    return NextResponse.json({ error: "unknown service" }, { status: 404 });

  try {
    const body = await adminJson(
      `${adminBase(serviceId)}/v1/presentations/${encodeURIComponent(proofExchangeId)}`,
    );
    const record = (body ?? {}) as {
      state?: unknown;
      verified?: unknown;
      claims?: unknown;
    };
    const claims: Claim[] = Array.isArray(record.claims)
      ? record.claims.flatMap((c) =>
          c && typeof c === "object" &&
          typeof (c as Claim).name === "string" &&
          typeof (c as Claim).value === "string"
            ? [{ name: (c as Claim).name, value: (c as Claim).value }]
            : [],
        )
      : [];
    return NextResponse.json({
      state: typeof record.state === "string" ? record.state : null,
      verified: record.verified === true,
      claims,
    });
  } catch {
    return NextResponse.json(
      { error: "demo service unreachable" },
      { status: 503 },
    );
  }
}
