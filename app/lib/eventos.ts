// The events demo: the Spanish ticket-broker flow at /eventos (Taquilla,
// demo) and the three event landings at /eventos/<slug>. Shared event data,
// the sponsors, the organizer and the exact values minted into the boletos.
// Plain data, safe for server and client modules alike.

import { EVENTOS_CAST } from "./eventos-cast";

export type EventoSlug = "costa-rica" | "guatemala" | "panama";
export type Rol = "asistente" | "patrocinador";

export const EVENTOS_ORDEN: EventoSlug[] = ["costa-rica", "guatemala", "panama"];

export const isEventoSlug = (value: unknown): value is EventoSlug =>
  typeof value === "string" && (EVENTOS_ORDEN as string[]).includes(value);

export const isRol = (value: unknown): value is Rol =>
  value === "asistente" || value === "patrocinador";

/** The one event, held three times: the title of the partner's deck. */
export const EVENTO_TITULO = "Revolución del contenido empresarial";
export const EVENTO_SUBTITULO =
  "Alfresco, Gestión Inteligente de Contenidos y Procesos, Biometría e IA";
/** Value of the `evento` claim - the same on the three boletos, which is why
 *  a landing tells its own boletos apart by `pais`. */
export const EVENTO_CLAIM = `${EVENTO_TITULO}: ${EVENTO_SUBTITULO}`;
export const HORARIO = "9:00 a 11:00 a.m.";
export const ORGANIZADOR = "INTEXUS";
/** Value of the `patrocinadores` claim. */
export const PATROCINADORES_CLAIM = "B-TECH, INTEXUS, HYLAND";

export type Patrocinador = {
  id: "btech" | "intexus" | "hyland";
  nombre: string;
  /** Logo for light backgrounds. */
  logo: string;
  /** Logo for dark backgrounds (the boleto, the heroes). */
  logoBlanco: string;
  /** Tagline, as printed on the sponsor's own brand assets. */
  lema: string;
  /** Rendered logo height, since the three marks have different aspect ratios. */
  alto: number;
};

export const PATROCINADORES: Patrocinador[] = [
  {
    id: "btech",
    nombre: "B-TECH",
    logo: "/images/eventos/btech.png",
    logoBlanco: "/images/eventos/btech-white.png",
    lema: "We make it easy",
    alto: 14,
  },
  {
    id: "intexus",
    nombre: "INTEXUS",
    logo: "/images/eventos/intexus.png",
    logoBlanco: "/images/eventos/intexus-white.png",
    lema: "Beyond the content",
    alto: 22,
  },
  {
    id: "hyland",
    nombre: "HYLAND",
    logo: "/images/eventos/hyland.svg",
    logoBlanco: "/images/eventos/hyland-white.svg",
    lema: "",
    alto: 22,
  },
];

export type Evento = {
  slug: EventoSlug;
  pais: string;
  ciudad: string;
  /** ISO date, for machines. */
  fecha: string;
  /** The `fecha` claim and every printed date. */
  fechaTexto: string;
  dia: string;
  mes: string;
  horario: string;
  sede: string;
  /** /api/demo service id (= Helm release = in-cluster admin address). */
  serviceId: string;
  host: string;
  arte: "volcan" | "templo" | "skyline";
  /** Accent color of the landing (hex, used inline). */
  acento: string;
  acentoSuave: string;
  descripcion: string;
};

export const EVENTOS: Record<EventoSlug, Evento> = {
  "costa-rica": {
    slug: "costa-rica",
    pais: "Costa Rica",
    ciudad: "San José",
    fecha: "2026-09-17",
    fechaTexto: "17 de septiembre de 2026",
    dia: "17",
    mes: "septiembre",
    horario: HORARIO,
    sede: "Centro de convenciones, San José (sede por confirmar)",
    serviceId: "evento-costa-rica",
    host: EVENTOS_CAST.costaRica.host,
    arte: "volcan",
    acento: "#10b981",
    acentoSuave: "#d1fae5",
    descripcion:
      "La primera parada de la gira centroamericana: una mañana para descubrir cómo la gestión inteligente de contenidos, la biometría y la IA transforman los procesos de las empresas costarricenses.",
  },
  guatemala: {
    slug: "guatemala",
    pais: "Guatemala",
    ciudad: "Ciudad de Guatemala",
    fecha: "2026-09-22",
    fechaTexto: "22 de septiembre de 2026",
    dia: "22",
    mes: "septiembre",
    horario: HORARIO,
    sede: "Centro de convenciones, Ciudad de Guatemala (sede por confirmar)",
    serviceId: "evento-guatemala",
    host: EVENTOS_CAST.guatemala.host,
    arte: "templo",
    acento: "#f59e0b",
    acentoSuave: "#fef3c7",
    descripcion:
      "La gira llega a Guatemala: casos reales de automatización documental con Alfresco, biometría para la verificación de identidad e IA aplicada a los procesos del negocio.",
  },
  panama: {
    slug: "panama",
    pais: "Panamá",
    ciudad: "Ciudad de Panamá",
    fecha: "2026-09-24",
    fechaTexto: "24 de septiembre de 2026",
    dia: "24",
    mes: "septiembre",
    horario: HORARIO,
    sede: "Centro de convenciones, Ciudad de Panamá (sede por confirmar)",
    serviceId: "evento-panama",
    host: EVENTOS_CAST.panama.host,
    arte: "skyline",
    acento: "#38bdf8",
    acentoSuave: "#e0f2fe",
    descripcion:
      "El cierre de la gira en el hub logístico y financiero de la región: contenido empresarial inteligente, biometría e IA para bancos, logística y sector público.",
  },
};

/** The fictional ticket broker (the issuer of every boleto). */
export const TAQUILLA = {
  nombre: "Taquilla",
  etiqueta: "Taquilla (demo)",
  lema: "Tu boleto vive en tu wallet",
  serviceId: "taquilla",
  host: EVENTOS_CAST.taquilla.host,
} as const;

/** The programme, the same at the three stops, as agreed with INTEXUS
 *  (2026-09-13): each talk is presented by a sponsor, no speakers are named. */
export const AGENDA: { hora: string; titulo: string; detalle: string; a_cargo?: string }[] = [
  {
    hora: "8:30",
    titulo: "Registro y bienvenida",
    detalle: "Accede a tu boleto desde la wallet web, sin descargar aplicaciones ni imprimir.",
  },
  {
    hora: "9:00",
    titulo: "La revolución del contenido empresarial",
    detalle: "Cómo el contenido impulsa experiencias y decisiones más inteligentes en la empresa.",
    a_cargo: "HYLAND",
  },
  {
    hora: "9:35",
    titulo: "Gestión inteligente de contenidos y procesos con Alfresco",
    detalle: "Automatización documental y flujos de trabajo que conectan la información con la operación.",
    a_cargo: "B-TECH",
  },
  {
    hora: "10:10",
    titulo: "Identidad digital: la confianza que transforma los procesos",
    detalle: "Identidad digital y credenciales verificables. Interacciones más seguras y simples.",
    a_cargo: "INTEXUS",
  },
  {
    hora: "10:40",
    titulo: "Networking y cierre",
    detalle: "Café, demostraciones y conversación con los expertos.",
  },
];
