import { NextResponse } from "next/server";
import { getDemoService, serviceDid } from "@/app/lib/demo-services";
import { resolveTrust } from "@/app/lib/resolver";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const { serviceId } = await params;
  const service = getDemoService(serviceId);
  if (!service) return NextResponse.json({ error: "unknown service" }, { status: 404 });
  const did = await serviceDid(service.host);
  const pot = did ? await resolveTrust(did) : null;
  return NextResponse.json({ service, did, pot });
}
