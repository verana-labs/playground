// The progressive scene graph of the Bolivia story (chapter 3): the real
// institutions of the Estado Plurinacional as scene nodes, revealed and
// transformed stage by stage. Institutional actors only - by design this
// story features NO named individuals; citizens and representatives appear
// as generic roles. No DIDs: the Bolivian cast is not deployed (the live
// pattern runs in the Verandia cast), so trust cards carry story data.

import type { SceneGraph, SceneNode, SceneEdge, SceneBadge } from "../../components/scene-graph";

export const STAGES = [
  "3.0",
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "3.5",
  "3.6",
  "3.7",
  "3.8",
] as const;

export type Stage = (typeof STAGES)[number];

const NODES: SceneNode[] = [
  // ---- las instituciones (fuentes de verdad)
  {
    id: "seprec",
    x: 260,
    y: 300,
    r: 28,
    icon: "landmark",
    tone: "gray",
    appears: "3.0",
    label: "SEPREC (demo)",
    sub: "Registro de Comercio",
    operator: "Servicio Plurinacional de Registro de Comercio (demo)",
    serviceType: "Servicio de registro mercantil",
    verifiedAt: "3.1",
    toneByStage: { "3.1": "violet" },
    labelByStage: {
      "3.2": { sub: "emisor acreditado de ECS-Organization" },
    },
  },
  {
    id: "segip",
    x: 470,
    y: 300,
    r: 24,
    icon: "id",
    tone: "gray",
    appears: "3.0",
    label: "SEGIP (demo)",
    sub: "cédulas de identidad y RUI (Ley 145)",
    operator: "Servicio General de Identificación Personal (demo)",
    serviceType: "Servicio de identificación personal",
    verifiedAt: "3.3",
    toneByStage: { "3.3": "blue" },
    labelByStage: {
      "3.3": { sub: "rector de la Red de Confianza SEGIP" },
    },
  },
  {
    id: "sereci",
    x: 600,
    y: 195,
    r: 18,
    icon: "stamp",
    tone: "gray",
    appears: "3.0",
    label: "SERECI · OEP",
    sub: "hechos vitales (órgano independiente)",
  },
  {
    id: "sin",
    x: 140,
    y: 470,
    icon: "key",
    tone: "gray",
    appears: "3.0",
    label: "Impuestos Nacionales (demo)",
    sub: "NIT, tributos, portal SIAT",
    operator: "Servicio de Impuestos Nacionales (demo)",
    serviceType: "Portal tributario",
    verifiedAt: "3.7",
    toneByStage: { "3.7": "blue" },
    labelByStage: {
      "3.7": { sub: "verificador autorizado de la Cédula Digital" },
    },
  },
  {
    id: "agetic",
    x: 330,
    y: 585,
    r: 20,
    icon: "network",
    tone: "gray",
    appears: "3.0",
    label: "AGETIC",
    sub: "gobierno electrónico · Ciudadanía Digital",
  },
  // ---- roles genéricos (sin personas con nombre)
  {
    id: "ciudadania",
    x: 830,
    y: 380,
    r: 24,
    icon: "user",
    tone: "amber",
    appears: "3.0",
    person: true,
    label: "Ciudadanía",
    sub: "filas, contraseñas, papel",
    toneByStage: { "3.4": "emerald" },
    labelByStage: {
      "3.4": { sub: "la Cédula Digital, en la wallet que cada quien elija" },
    },
  },
  {
    id: "empresa",
    x: 700,
    y: 500,
    icon: "building",
    tone: "gray",
    appears: "3.0",
    label: "Una empresa (demo)",
    sub: "extractos PDF, trámites presenciales",
    toneByStage: { "3.5": "emerald" },
    labelByStage: {
      "3.5": { sub: "ECS-Organization emitida por el SEPREC" },
    },
  },
  {
    id: "repLegal",
    x: 900,
    y: 540,
    icon: "user",
    tone: "amber",
    appears: "3.6",
    person: true,
    label: "Representante legal",
    sub: "poder verificable, revocable el mismo día",
  },
  // ---- verificadores privados
  {
    id: "bancoUnion",
    x: 860,
    y: 240,
    icon: "bank",
    tone: "blue",
    appears: "3.7",
    label: "Banco Unión (demo)",
    sub: "KYC en un escaneo",
    operator: "Banco Unión S.A. (demo)",
    serviceType: "Banca en línea",
    verifiedAt: "3.7",
  },
  {
    id: "prestamista",
    x: 650,
    y: 330,
    icon: "building",
    tone: "blue",
    appears: "3.8",
    noteAlways: true,
    label: "Prestamista en línea (simulado)",
    sub: "verificable, pero no autorizado",
    serviceType: "Préstamos de consumo (simulado)",
    operator: "Prestamista en línea (simulado)",
    verifiedAt: "3.8",
  },
  // ---- el mundo rojo
  {
    id: "fakePortal",
    x: 690,
    y: 105,
    icon: "ghost",
    tone: "red",
    appears: "3.0",
    dashed: true,
    label: "Portal falso de devoluciones",
    sub: "dice ser “Impuestos Nacionales”",
  },
  // ---- la capa de confianza
  {
    id: "ecs",
    x: 250,
    y: 90,
    icon: "network",
    tone: "violet",
    appears: "3.1",
    noteAlways: true,
    label: "Ecosistema ECS de Verana",
    sub: "credenciales de organización y servicio",
  },
  {
    id: "helvetia",
    x: 100,
    y: 195,
    icon: "stamp",
    tone: "emerald",
    appears: "3.1",
    label: "Helvetia Trust (demo)",
    sub: "emisor KYB acreditado",
    serviceType: "Servicio de emisión KYB",
    operator: "Helvetia Trust Services (demo)",
    verifiedAt: "3.1",
  },
  {
    id: "cedulaEco",
    x: 470,
    y: 90,
    icon: "network",
    tone: "blue",
    appears: "3.3",
    noteAlways: true,
    label: "Red de Confianza SEGIP",
    sub: "emisión y verificación gobernadas",
    verifiedAt: "3.3",
  },
  {
    id: "repEco",
    x: 660,
    y: 90,
    icon: "network",
    tone: "violet",
    appears: "3.6",
    noteAlways: true,
    label: "Representación Legal",
    sub: "gobernado por el SEPREC",
    verifiedAt: "3.6",
  },
];

const EDGES: SceneEdge[] = [
  // 3.0 - el mundo de hoy
  { id: "e-seprec-segip", from: "seprec", to: "segip", appears: "3.0", label: "las instituciones del Estado", tone: "gray", labelT: 0.5 },
  { id: "e-seprec-sin", from: "seprec", to: "sin", appears: "3.0", tone: "gray" },
  { id: "e-sereci-segip", from: "sereci", to: "segip", appears: "3.0", label: "hechos vitales", tone: "gray", dashed: true, curve: -15, labelT: 0.45 },
  { id: "e-agetic-segip", from: "agetic", to: "segip", appears: "3.0", tone: "gray", dashed: true, width: 0.7 },
  { id: "e-agetic-seprec", from: "agetic", to: "seprec", appears: "3.0", tone: "gray", dashed: true, width: 0.7, label: "interoperabilidad estatal", labelT: 0.6 },
  { id: "e-agetic-sin", from: "agetic", to: "sin", appears: "3.0", tone: "gray", dashed: true, width: 0.7 },
  { id: "e-ciud-sin", from: "ciudadania", to: "sin", appears: "3.0", until: "3.7", label: "contraseñas y filas", tone: "gray", dashed: true, curve: 45, labelT: 0.45 },
  { id: "e-emp-sin", from: "empresa", to: "sin", appears: "3.0", until: "3.7", label: "trámites con extractos PDF", tone: "gray", dashed: true, curve: 25, labelT: 0.4 },
  { id: "e-ciud-fake", from: "ciudadania", to: "fakePortal", appears: "3.0", until: "3.8", label: "¿una devolución? imposible distinguir", tone: "red", dashed: true, curve: -25, labelT: 0.4 },
  // Necesidad 1 - instituciones verificables
  { id: "e-helvetia-seprec", from: "helvetia", to: "seprec", appears: "3.1", label: "emite ECS-Org (KYB)", tone: "emerald", curve: -30, labelT: 0.45 },
  { id: "e-ecs-helvetia", from: "ecs", to: "helvetia", appears: "3.1", label: "acredita", tone: "violet" },
  { id: "e-ecs-seprec", from: "ecs", to: "seprec", appears: "3.2", label: "acredita como emisor ECS-Org", tone: "violet", labelT: 0.55 },
  // Necesidad 2 - la Cédula Digital
  { id: "e-segip-eco", from: "segip", to: "cedulaEco", appears: "3.3", label: "crea y gobierna", tone: "blue", labelT: 0.5 },
  { id: "e-seprec-segip-org", from: "seprec", to: "segip", appears: "3.3", label: "emite ECS-Org al SEGIP", tone: "emerald", curve: 30, labelT: 0.5 },
  { id: "e-agetic-eco", from: "agetic", to: "cedulaEco", appears: "3.3", label: "coordina la integración estatal", tone: "gray", dashed: true, curve: 40, labelT: 0.35, width: 0.7 },
  { id: "e-segip-ciud", from: "segip", to: "ciudadania", appears: "3.4", label: "emite la Cédula Digital", tone: "emerald", curve: -20, labelT: 0.5 },
  // Necesidad 3 - Business ID
  { id: "e-seprec-emp", from: "seprec", to: "empresa", appears: "3.5", label: "emite ECS-Organization", tone: "emerald", curve: 35, labelT: 0.45 },
  // Necesidad 4 - representación legal
  { id: "e-seprec-repeco", from: "seprec", to: "repEco", appears: "3.6", label: "crea y gobierna", tone: "violet", curve: -40, labelT: 0.35 },
  { id: "e-seprec-rep", from: "seprec", to: "repLegal", appears: "3.6", label: "emite Representante Legal", tone: "emerald", curve: 45, labelT: 0.55 },
  // Necesidad 5 - autenticación sin contraseñas
  { id: "e-ciud-sin-ok", from: "ciudadania", to: "sin", appears: "3.7", label: "inicia sesión con un escaneo", tone: "emerald", curve: 45, labelT: 0.45 },
  { id: "e-ciud-banco", from: "ciudadania", to: "bancoUnion", appears: "3.7", label: "KYC en un escaneo", tone: "emerald", curve: -15, labelT: 0.5 },
  { id: "e-rep-banco", from: "repLegal", to: "bancoUnion", appears: "3.7", label: "Representante Legal → cuenta corporativa", tone: "emerald", curve: -35, labelT: 0.5 },
  // El contraejemplo
  { id: "e-prest-ciud", from: "prestamista", to: "ciudadania", appears: "3.8", label: "pide la Cédula: rechazado", tone: "red", dashed: true, curve: 25, labelT: 0.5 },
  { id: "e-prest-eco", from: "prestamista", to: "cedulaEco", appears: "3.8", label: "sin permiso VERIFIER: rojo", tone: "red", dashed: true, curve: -25, labelT: 0.45 },
  { id: "e-fake-ciud", from: "fakePortal", to: "ciudadania", appears: "3.8", label: "falla Q1: nada que probar, rechazado", tone: "red", dashed: true, curve: -30, labelT: 0.4 },
];

const BADGES: SceneBadge[] = [
  { id: "b-question", node: "ciudadania", dx: 44, dy: -24, text: "?", tone: "red", appears: "3.0", until: "3.7" },
  { id: "b-cedula", node: "ciudadania", dx: 0, dy: -40, text: "Cédula Digital", tone: "emerald", appears: "3.4" },
  { id: "b-sin-verifier", node: "sin", dx: 30, dy: -26, text: "VERIFIER", tone: "emerald", appears: "3.7" },
  { id: "b-no-prest", node: "prestamista", dx: 38, dy: -24, text: "✗ no autorizado", tone: "red", appears: "3.8" },
  { id: "b-no-fake", node: "fakePortal", dx: 34, dy: -24, text: "✗", tone: "red", appears: "3.8" },
];

export const BOLIVIA_SCENES: SceneGraph = {
  stages: STAGES,
  title: "Bolivia verificable",
  defaultViewBox: "18 38 1162 648",
  nodes: NODES,
  edges: EDGES,
  badges: BADGES,
  credentials: {
    seprec: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "emitida por Helvetia Trust (demo)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.1",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "auto-emitida (patrón ECS)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.1",
      },
    ],
    segip: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "emitida por el SEPREC (demo)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.3",
        note: "El registro nacional emite la credencial de organización de otra institución del Estado: el registro ES la fuente de verdad.",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "auto-emitida (patrón ECS)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.3",
      },
    ],
    sin: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "emitida por el SEPREC (demo)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.7",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "auto-emitida (patrón ECS)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.7",
      },
    ],
    bancoUnion: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "emitida por el SEPREC (demo)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.7",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "auto-emitida (patrón ECS)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.7",
      },
    ],
    prestamista: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "emitida por el SEPREC (demo)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.8",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "auto-emitida (patrón ECS)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.8",
      },
    ],
    empresa: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "emitida por el SEPREC (demo)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.5",
      },
    ],
    ciudadania: [
      {
        name: "Cédula Digital",
        tone: "blue",
        issuedBy: "emitida por el SEGIP (demo)",
        ecosystem: "Red de Confianza SEGIP",
        appears: "3.4",
      },
    ],
    repLegal: [
      {
        name: "Cédula Digital",
        tone: "blue",
        issuedBy: "emitida por el SEGIP (demo)",
        ecosystem: "Red de Confianza SEGIP",
        appears: "3.6",
      },
      {
        name: "Representante Legal",
        tone: "violet",
        issuedBy: "emitida por el SEPREC (demo)",
        ecosystem: "Representación Legal · SEPREC",
        appears: "3.6",
      },
    ],
  },
  accreditations: {
    seprec: [
      {
        role: "ISSUER",
        schema: "ECS-Organization",
        context: "Ecosistema ECS de Verana",
        appears: "3.2",
      },
      {
        role: "ISSUER",
        schema: "RepresentanteLegal",
        context: "Representación Legal · SEPREC",
        appears: "3.6",
      },
    ],
    segip: [
      {
        role: "ISSUER",
        schema: "CedulaDigital",
        context: "Red de Confianza SEGIP",
        appears: "3.3",
      },
    ],
    sin: [
      {
        role: "VERIFIER",
        schema: "CedulaDigital",
        context: "Red de Confianza SEGIP",
        appears: "3.7",
      },
      {
        role: "VERIFIER",
        schema: "RepresentanteLegal",
        context: "Representación Legal · SEPREC",
        appears: "3.7",
      },
    ],
    bancoUnion: [
      {
        role: "VERIFIER",
        schema: "CedulaDigital",
        context: "Red de Confianza SEGIP",
        appears: "3.7",
      },
      {
        role: "VERIFIER",
        schema: "RepresentanteLegal",
        context: "Representación Legal · SEPREC",
        appears: "3.7",
      },
    ],
    helvetia: [
      {
        role: "ISSUER",
        schema: "ECS-Organization",
        context: "Ecosistema ECS de Verana",
        appears: "3.1",
      },
    ],
  },
  nodeNotes: {
    ecs: "El ecosistema compartido de credenciales de organización y servicio de Verana: una credencial reconocida por toda wallet y todo servicio compatibles.",
    cedulaEco: "El ecosistema de la Cédula Digital, gobernado por el SEGIP (Ley 145): solo el SEGIP emite, y solo los verificadores que el SEGIP autoriza pueden pedirla. Es la regla de parte informante de eIDAS 2, hecha estructura.",
    repEco: "El ecosistema de la credencial de Representante Legal, gobernado por el SEPREC: emisión solo del registro, verificación abierta (consultar quién representa a una empresa es función pública del registro).",
    agetic: "La Agencia de Gobierno Electrónico y TIC (DS 2514): Ciudadanía Digital (Ley 1080), interoperabilidad del Estado. No es un registro: es la capa transversal que integra a los verificadores públicos.",
    sereci: "El Servicio de Registro Cívico, dependiente del Órgano Electoral Plurinacional: registra los hechos vitales que alimentan al RUI del SEGIP. Órgano independiente: aparece como contexto, no como servicio del ecosistema.",
    fakePortal: "No presenta credenciales. Antes: una web idéntica a la real. Ahora: nada que probar, la wallet la marca en rojo.",
    prestamista: "Servicio verificable con identidad probada, pero SIN permiso VERIFIER sobre la Cédula Digital: la wallet muestra en rojo la solicitud y la ciudadanía la rechaza. Verificación gobernada = fallar cerrado.",
    ciudadania: "Sin nombres en esta historia: cualquier persona, con la wallet compatible que elija.",
    empresa: "Cualquier empresa registrada en el SEPREC (demo): su matrícula se vuelve una credencial que ningún PDF puede imitar.",
  },
  stageView: {
    "3.1": { only: ["ecs", "helvetia", "seprec", "segip", "sin", "agetic"], viewBox: "30 30 640 620" },
    "3.2": { only: ["ecs", "helvetia", "seprec", "segip", "agetic"], viewBox: "30 30 640 420" },
    "3.3": { only: ["ecs", "seprec", "segip", "sereci", "cedulaEco", "agetic"], viewBox: "150 30 620 620" },
    "3.4": { only: ["segip", "cedulaEco", "ciudadania"], viewBox: "330 30 620 430" },
    "3.5": { only: ["ecs", "seprec", "empresa"], viewBox: "120 30 680 550" },
    "3.6": { only: ["seprec", "repEco", "repLegal", "segip"], viewBox: "150 30 830 610" },
    "3.7": {
      only: ["cedulaEco", "repEco", "sin", "bancoUnion", "ciudadania", "repLegal", "segip", "seprec"],
      viewBox: "80 38 1040 610",
    },
    "3.8": {
      only: ["cedulaEco", "ciudadania", "prestamista", "fakePortal"],
      viewBox: "380 40 580 420",
      maxWidth: "max-w-3xl",
    },
  },
  stageChanges: {
    "3.1": { nodes: ["seprec"], note: "el primer check verde del Estado" },
    "3.2": {
      nodes: ["seprec"],
      note: "el registro nacional se vuelve emisor acreditado de ECS-Organization",
    },
    "3.3": {
      nodes: ["segip", "cedulaEco"],
      note: "la Red de Confianza SEGIP queda publicada en el registro público",
    },
    "3.7": {
      nodes: ["sin"],
      note: "Impuestos Nacionales, registrado como verificador autorizado",
    },
  },
  verifiedNote:
    "Datos ilustrativos: la maqueta boliviana aún no está desplegada en la testnet. El mismo patrón corre en vivo en el caso Verandia.",
};
