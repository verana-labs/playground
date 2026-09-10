// Events demo claim sets: the values Taquilla (demo) mints into a visitor's
// boleto (Asistente) or sponsor credential (Patrocinador). Same conventions
// as demo-bhi.ts: AnonCreds claims carry every schema attribute the demo
// sets (the /api/demo attr-fill covers the rest); the SD-JWT rail drops
// empty placeholders. Unlike the story casts, every claim the visitor can
// see comes from the broker form: the event they picked, the name they
// typed (or their organization and tagline), sanitized before it reaches a
// real testnet credential.

import {
  EVENTO_CLAIM,
  EVENTOS,
  isEventoSlug,
  PATROCINADORES_CLAIM,
  type EventoSlug,
} from "./eventos";

type Claim = { name: string; value: string };

export type EventosMint = {
  evento: EventoSlug;
  nombre: string;
  organizacion: string;
  lema: string;
};

export const DEFAULT_NOMBRE = "Asistente de Demostración";
export const DEFAULT_ORGANIZACION = "Patrocinador de Demostración";
export const DEFAULT_LEMA = "Patrocinador del evento";

/** Visitor-supplied text reaches a real testnet credential: keep it short
 *  and name-shaped (letters, digits, spaces and light punctuation), falling
 *  back to the default when nothing usable is left. */
export function sanitizeTexto(
  value: string | null | undefined,
  max: number,
  fallback: string,
): string {
  const cleaned = (value ?? "")
    .replace(/[^\p{L}\p{M}\p{N}&' .,-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
  return cleaned || fallback;
}

export function eventosMintFromParams(params: URLSearchParams): EventosMint {
  const raw = params.get("evento");
  return {
    // The first stop of the tour when the caller names no event.
    evento: isEventoSlug(raw) ? raw : "costa-rica",
    nombre: sanitizeTexto(params.get("nombre"), 40, DEFAULT_NOMBRE),
    organizacion: sanitizeTexto(
      params.get("organizacion"),
      60,
      DEFAULT_ORGANIZACION,
    ),
    lema: sanitizeTexto(params.get("lema"), 80, DEFAULT_LEMA),
  };
}

/** One boleto per attendee and event: the attendee's own name plus the
 *  event block printed on the mockup's card. */
export function asistenteDemoClaims(mint: EventosMint): Claim[] {
  const evento = EVENTOS[mint.evento];
  return [
    { name: "nombre", value: mint.nombre },
    { name: "tipo", value: "Asistente" },
    { name: "evento", value: EVENTO_CLAIM },
    { name: "pais", value: evento.pais },
    { name: "fecha", value: evento.fechaTexto },
    { name: "horario", value: evento.horario },
    { name: "patrocinadores", value: PATROCINADORES_CLAIM },
  ];
}

/** One credential per sponsoring organization and event. */
export function patrocinadorDemoClaims(mint: EventosMint): Claim[] {
  const evento = EVENTOS[mint.evento];
  return [
    { name: "organizacion", value: mint.organizacion },
    { name: "lema", value: mint.lema },
    { name: "tipo", value: "Patrocinador" },
    { name: "evento", value: EVENTO_CLAIM },
    { name: "pais", value: evento.pais },
    { name: "fecha", value: evento.fechaTexto },
    { name: "horario", value: evento.horario },
  ];
}

const toOid4vc = (claims: Claim[]) =>
  Object.fromEntries(
    claims.filter((c) => c.value !== "").map((c) => [c.name, c.value]),
  );

export const asistenteOid4vcClaims = (mint: EventosMint) =>
  toOid4vc(asistenteDemoClaims(mint));
export const patrocinadorOid4vcClaims = (mint: EventosMint) =>
  toOid4vc(patrocinadorDemoClaims(mint));
