import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { getDemoService } from "@/app/lib/demo-services";
import { didHost } from "@/app/lib/did";
import { issuerDidFromRecord, toClaims, type Claim } from "@/app/lib/presentation";
import { EVENTO_CLAIM, EVENTOS, isEventoSlug, isRol } from "@/app/lib/eventos";
import { EVENTOS_CAST } from "@/app/lib/eventos-cast";

// Status + access decision for an event landing's presentation. Once the
// wallet presents, the event decides from the credential ISSUER's chain and
// the boleto's own event block:
//   - issued by Taquilla (demo) and `pais` is this event's -> acceso: the
//     personal space (attendee) or the sponsor space opens
//   - issued by Taquilla (demo) for another stop of the tour -> otro-evento:
//     the three boletos share a title, only `pais` tells them apart
//   - anything else                                        -> denegado
// Same decision contract as the CCM and Bolivia logins.

export const dynamic = "force-dynamic";

export type Decision = "acceso" | "otro-evento" | "denegado";

const claim = (claims: Claim[], name: string) =>
  claims.find((c) => c.name === name)?.value;

/** AnonCreds fallback when the record carries no resolvable issuer DID: the
 *  demo claim set is recognizable by the exact event title Taquilla mints. */
function fallbackIssuerDid(claims: Claim[]): string | null {
  return claim(claims, "evento") === EVENTO_CLAIM
    ? EVENTOS_CAST.taquilla.did
    : null;
}

function isTaquilla(issuerDid: string): boolean {
  const host = didHost(issuerDid);
  return (
    issuerDid === EVENTOS_CAST.taquilla.did ||
    (host !== null && host === EVENTOS_CAST.taquilla.host)
  );
}

function decide(
  issuerDid: string | null,
  claims: Claim[],
  pais: string,
): {
  decision: Decision;
  nombre?: string;
  organizacion?: string;
  lema?: string;
  paisCredencial?: string;
} {
  if (!issuerDid || !isTaquilla(issuerDid)) return { decision: "denegado" };
  const paisCredencial = claim(claims, "pais");
  const titular = {
    nombre: claim(claims, "nombre"),
    organizacion: claim(claims, "organizacion"),
    lema: claim(claims, "lema"),
  };
  if (paisCredencial && paisCredencial !== pais)
    return { decision: "otro-evento", paisCredencial, ...titular };
  return { decision: "acceso", ...titular };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const search = new URL(req.url).searchParams;
  const rail = search.get("rail") ?? "didcomm";
  const slug = search.get("evento");
  const rol = search.get("rol") ?? "asistente";
  if (!isEventoSlug(slug) || !isRol(rol))
    return NextResponse.json({ error: "unknown event or role" }, { status: 400 });
  const evento = EVENTOS[slug];
  if (!getDemoService(evento.serviceId))
    return NextResponse.json({ error: "unknown event service" }, { status: 404 });
  const admin = adminBase(evento.serviceId);

  try {
    if (rail === "oid4vc") {
      // Completed-session shape (plugin-openid4vc VerifierService.getResult):
      // `accepted` is the plugin's own Q2 verdict (issuer TRUSTED_AUTHORIZED
      // for the schema); the issuer DID comes from the trust evidence.
      const body = await adminJson(
        `${admin}/v1/oid4vc/verifier/sessions/${encodeURIComponent(id)}`,
      );
      const record = (body ?? {}) as {
        state?: unknown;
        cryptographicVerified?: unknown;
        accepted?: unknown;
        trust?: { verdict?: unknown; evidence?: { did?: unknown; note?: unknown } };
        credential?: { disclosedClaims?: unknown };
      };
      const state = typeof record.state === "string" ? record.state : null;
      const done = state === "ResponseVerified" || record.accepted === true;
      if (!done) return NextResponse.json({ done: false, state });
      const claims = toClaims(record.credential?.disclosedClaims);
      const evidenceDid = record.trust?.evidence?.did;
      const issuerDid =
        typeof evidenceDid === "string" && evidenceDid
          ? evidenceDid
          : (issuerDidFromRecord(record) ?? fallbackIssuerDid(claims));
      // A credential the plugin did not accept (unbound key, untrusted or
      // unauthorized issuer) never grants access, whatever DID it claims.
      const decision =
        record.accepted === true
          ? decide(issuerDid, claims, evento.pais)
          : { decision: "denegado" as const };
      return NextResponse.json({
        done: true,
        verified: record.cryptographicVerified === true,
        claims,
        issuerDid,
        trustVerdict:
          typeof record.trust?.verdict === "string" ? record.trust.verdict : null,
        trustNote:
          typeof record.trust?.evidence?.note === "string"
            ? record.trust.evidence.note
            : null,
        ...decision,
      });
    }

    const body = await adminJson(
      `${admin}/v1/presentations/${encodeURIComponent(id)}`,
    );
    const record = (body ?? {}) as Record<string, unknown>;
    const state = typeof record.state === "string" ? record.state : null;
    if (state !== "done") return NextResponse.json({ done: false, state });
    const claims = toClaims(record.claims);
    const issuerDid =
      issuerDidFromRecord(record) ??
      (record.verified === true ? fallbackIssuerDid(claims) : null);
    const decision = decide(issuerDid, claims, evento.pais);
    return NextResponse.json({
      done: true,
      verified: record.verified === true,
      claims,
      issuerDid,
      ...decision,
    });
  } catch {
    return NextResponse.json({ done: false, state: null }, { status: 200 });
  }
}
