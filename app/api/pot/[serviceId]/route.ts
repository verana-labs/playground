import { NextResponse } from "next/server";
import {
  DEMOS_BASE_DOMAIN,
  isDemoServiceId,
  serviceDid,
  resolveDid,
  claimStr,
} from "../../../lib/verana";

export const dynamic = "force-dynamic";

// Proof-of-Trust summary for one demo service: trust-resolve its DID
// against the network resolver and extract the service (ECS-SERVICE) and
// operator (ECS-ORG / ECS-PERSONA) credential claims.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ serviceId: string }> },
) {
  const { serviceId } = await params;
  if (!isDemoServiceId(serviceId)) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  const did = await serviceDid(`${serviceId}.${DEMOS_BASE_DOMAIN}`);
  if (!did) {
    return NextResponse.json(
      { error: "Service DID unavailable" },
      { status: 502 },
    );
  }

  const result = await resolveDid(did);
  if (!result) {
    return NextResponse.json(
      { error: "Trust resolution unavailable" },
      { status: 502 },
    );
  }

  const service = result.credentials?.find((c) => c.ecsType === "ECS-SERVICE");
  const org = result.credentials?.find(
    (c) => c.ecsType === "ECS-ORG" || c.ecsType === "ECS-PERSONA",
  );

  return NextResponse.json({
    did,
    trustStatus: result.trustStatus ?? "UNTRUSTED",
    service: service
      ? {
          name: claimStr(service, "name"),
          type: claimStr(service, "type"),
          description: claimStr(service, "description"),
        }
      : null,
    org: org
      ? {
          name: claimStr(org, "name"),
          countryCode: claimStr(org, "countryCode"),
          registryId: claimStr(org, "registryId"),
          address: claimStr(org, "address"),
        }
      : null,
  });
}
