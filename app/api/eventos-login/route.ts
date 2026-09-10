import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import { EVENTOS, isEventoSlug, isRol } from "@/app/lib/eventos";
import {
  EVENTOS_ASISTENTE_JSC,
  EVENTOS_PATROCINADOR_JSC,
} from "@/app/lib/eventos-cast";

// Mint a presentation request from one event service of the events cast:
// the landing's "Entrar como Asistente / Patrocinador" gate. The event
// (?evento=) picks WHICH verifier agent mints, the role (?rol=) picks which
// Taquilla schema it asks for. Same two-rail contract as /api/ccm-login
// (?format=, plus the per-wallet ?query=pe / ?signer=x5c knobs of /api/demo);
// the access decision happens after presentation - see /api/eventos-login/[id].

export const dynamic = "force-dynamic";

const ASISTENTE_ATTRIBUTES = [
  "nombre",
  "tipo",
  "evento",
  "pais",
  "fecha",
  "horario",
  "patrocinadores",
];
const PATROCINADOR_ATTRIBUTES = [
  "organizacion",
  "lema",
  "tipo",
  "evento",
  "pais",
  "fecha",
  "horario",
];

const ASISTENTE_POLICY =
  process.env.DEMO_OID4VC_EVENTOS_ASISTENTE_POLICY ?? "eventos-asistente";
const PATROCINADOR_POLICY =
  process.env.DEMO_OID4VC_EVENTOS_PATROCINADOR_POLICY ?? "eventos-patrocinador";

function str(body: unknown, key: string): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export async function GET(req: Request) {
  const search = new URL(req.url).searchParams;
  const slug = search.get("evento");
  const rol = search.get("rol") ?? "asistente";
  if (!isEventoSlug(slug) || !isRol(rol))
    return NextResponse.json({ error: "unknown event or role" }, { status: 400 });
  const evento = EVENTOS[slug];
  if (!getDemoService(evento.serviceId))
    return NextResponse.json({ error: "unknown event service" }, { status: 404 });
  const admin = adminBase(evento.serviceId);

  const format = search.get("format") ?? "anoncreds";
  const queryLanguage =
    search.get("query") === "pe" ? "presentation_exchange" : undefined;
  const requestSigner = search.get("signer") === "x5c" ? "x5c" : undefined;
  const asistente = rol === "asistente";
  const jscUrl = asistente ? EVENTOS_ASISTENTE_JSC : EVENTOS_PATROCINADOR_JSC;
  const attributes = asistente ? ASISTENTE_ATTRIBUTES : PATROCINADOR_ATTRIBUTES;
  const policyId = asistente ? ASISTENTE_POLICY : PATROCINADOR_POLICY;

  try {
    if (format === "openid4vc-sdjwt" || format === "oid4vc") {
      const request = await adminJson(`${admin}/v1/oid4vc/verifier/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId,
          ...(queryLanguage ? { queryLanguage } : {}),
          ...(requestSigner ? { requestSigner } : {}),
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
          ref: `eventos-${slug}-${rol}`,
          requestedCredentials: [
            { jsonSchemaCredentialId: jscUrl, attributes },
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
    return NextResponse.json({ error: "event service unreachable" }, { status: 503 });
  }
}
