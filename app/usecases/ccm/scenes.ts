// The progressive scene graph of the CCM story (chapter 3): the Camara de
// Comercio de Medellin (demo), its ecosystem and its bank verifier as scene
// nodes, revealed and transformed stage by stage. Institutional actors only
// - by design this story features NO named individuals; the legal
// representative appears as a generic role. No DIDs: trust cards carry
// story data until the cast is deployed (the live cards are in chapter 4).

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
  // ---- la cámara (la fuente de verdad)
  {
    id: "camara",
    x: 300,
    y: 300,
    r: 28,
    icon: "landmark",
    tone: "gray",
    appears: "3.0",
    label: "CCM (demo)",
    sub: "registro mercantil de Antioquia",
    operator: "Cámara de Comercio de Medellín para Antioquia (demo)",
    serviceType: "Servicio de registro mercantil",
    verifiedAt: "3.1",
    toneByStage: { "3.1": "violet" },
    labelByStage: {
      "3.2": { sub: "emisora acreditada de ECS-Organization" },
      "3.3": { sub: "gobierna el Ecosistema Cámara de Comercio" },
    },
  },
  {
    id: "confecamaras",
    x: 120,
    y: 440,
    r: 20,
    icon: "network",
    tone: "gray",
    appears: "3.0",
    dashed: true,
    label: "Confecámaras",
    sub: "federa las 57 cámaras (contexto)",
  },
  // ---- roles genéricos (sin personas con nombre)
  {
    id: "empresa",
    x: 640,
    y: 480,
    icon: "building",
    tone: "gray",
    appears: "3.0",
    label: "Una empresa matriculada (demo)",
    sub: "extractos y certificados PDF",
    toneByStage: { "3.4": "emerald" },
    labelByStage: {
      "3.4": { sub: "ECS-Organization emitida por la CCM" },
    },
  },
  {
    id: "repLegal",
    x: 890,
    y: 510,
    icon: "user",
    tone: "amber",
    appears: "3.0",
    person: true,
    label: "Representante legal",
    sub: "prueba su cargo con un certificado impreso",
    toneByStage: { "3.5": "emerald" },
    labelByStage: {
      "3.5": { sub: "credencial de Representación Legal en su wallet" },
    },
  },
  // ---- el banco verificador
  {
    id: "bancolombia",
    x: 900,
    y: 240,
    icon: "bank",
    tone: "gray",
    appears: "3.0",
    label: "Bancolombia (demo)",
    sub: "exige certificados de menos de 30 días",
    operator: "Bancolombia S.A. (demo)",
    serviceType: "Banca empresarial",
    verifiedAt: "3.6",
    toneByStage: { "3.6": "blue" },
    labelByStage: {
      "3.6": { sub: "verificador registrado ante la cámara" },
    },
  },
  // ---- el mundo rojo
  {
    id: "certPdf",
    x: 720,
    y: 340,
    icon: "ghost",
    tone: "red",
    appears: "3.0",
    until: "3.7",
    dashed: true,
    label: "El certificado PDF",
    sub: "una instantánea que envejece",
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
    x: 90,
    y: 190,
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
    id: "camaraEco",
    x: 540,
    y: 90,
    icon: "network",
    tone: "blue",
    appears: "3.3",
    noteAlways: true,
    label: "Ecosistema Cámara de Comercio (demo)",
    sub: "emisión y verificación gobernadas, tarifas on-chain",
    verifiedAt: "3.3",
  },
];

const EDGES: SceneEdge[] = [
  // 3.0 - el mundo de hoy
  { id: "e-conf-camara", from: "confecamaras", to: "camara", appears: "3.0", label: "red de 57 cámaras", tone: "gray", dashed: true, width: 0.7, labelT: 0.5 },
  { id: "e-camara-emp", from: "camara", to: "empresa", appears: "3.0", until: "3.4", label: "matrícula y certificados en papel", tone: "gray", dashed: true, curve: 25, labelT: 0.45 },
  { id: "e-emp-cert", from: "empresa", to: "certPdf", appears: "3.0", tone: "gray", dashed: true, width: 0.7 },
  { id: "e-cert-banco", from: "certPdf", to: "bancolombia", appears: "3.0", label: "de hace 40 días: ¿aún es verdad?", tone: "red", dashed: true, curve: -20, labelT: 0.5 },
  { id: "e-rep-banco-hoy", from: "repLegal", to: "bancolombia", appears: "3.0", until: "3.7", label: "certificado impreso + fila", tone: "gray", dashed: true, curve: 35, labelT: 0.45 },
  // Necesidad 1 - la cámara verificable
  { id: "e-helvetia-camara", from: "helvetia", to: "camara", appears: "3.1", label: "emite ECS-Org (KYB)", tone: "emerald", curve: -25, labelT: 0.45 },
  { id: "e-ecs-helvetia", from: "ecs", to: "helvetia", appears: "3.1", label: "acredita", tone: "violet" },
  { id: "e-ecs-camara", from: "ecs", to: "camara", appears: "3.2", label: "acredita como emisora ECS-Org", tone: "violet", labelT: 0.55 },
  // Necesidad 2 - el ecosistema de la cámara
  { id: "e-camara-eco", from: "camara", to: "camaraEco", appears: "3.3", label: "crea y gobierna: tarifas publicadas", tone: "blue", labelT: 0.5 },
  // Necesidad 3 - empresas verificables
  { id: "e-camara-emp-ok", from: "camara", to: "empresa", appears: "3.4", label: "emite ECS-Organization", tone: "emerald", curve: 25, labelT: 0.45 },
  // Necesidad 4 - la credencial de representación legal
  { id: "e-camara-rep", from: "camara", to: "repLegal", appears: "3.5", label: "emite desde el portal (QR)", tone: "emerald", curve: 45, labelT: 0.55 },
  // Necesidad 5 - el banco verifica, la cámara cobra
  { id: "e-camara-banco-org", from: "camara", to: "bancolombia", appears: "3.6", label: "emite ECS-Org al banco", tone: "emerald", curve: -30, labelT: 0.5 },
  { id: "e-banco-eco", from: "bancolombia", to: "camaraEco", appears: "3.6", label: "se registra: COP 2.000 por verificación", tone: "blue", curve: -15, labelT: 0.5 },
  { id: "e-rep-banco-ok", from: "repLegal", to: "bancolombia", appears: "3.7", label: "presenta en la sucursal: acceso corporativo", tone: "emerald", curve: 35, labelT: 0.5 },
  { id: "e-camara-banco-rev", from: "camara", to: "bancolombia", appears: "3.8", label: "revocación: conocida al instante", tone: "red", dashed: true, curve: -55, labelT: 0.45 },
];

const BADGES: SceneBadge[] = [
  { id: "b-question", node: "bancolombia", dx: 44, dy: -24, text: "?", tone: "red", appears: "3.0", until: "3.6" },
  { id: "b-fees", node: "camaraEco", dx: 0, dy: -40, text: "tarifas on-chain", tone: "emerald", appears: "3.3" },
  { id: "b-cred", node: "repLegal", dx: 0, dy: -40, text: "Representación Legal", tone: "emerald", appears: "3.5" },
  { id: "b-verifier", node: "bancolombia", dx: 40, dy: -26, text: "VERIFIER", tone: "emerald", appears: "3.6" },
  { id: "b-revocable", node: "repLegal", dx: 8, dy: 42, text: "revocable el día que cesa", tone: "red", appears: "3.8" },
];

export const CCM_SCENES: SceneGraph = {
  stages: STAGES,
  title: "La representación legal, verificable",
  defaultViewBox: "18 38 1162 620",
  nodes: NODES,
  edges: EDGES,
  badges: BADGES,
  credentials: {
    camara: [
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
    empresa: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "emitida por la CCM (demo)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.4",
        note: "La cámara emite la credencial de organización de las empresas de su registro: el registro ES la fuente de verdad.",
      },
    ],
    repLegal: [
      {
        name: "Representación Legal",
        tone: "violet",
        issuedBy: "emitida por la CCM (demo)",
        ecosystem: "Ecosistema Cámara de Comercio (demo)",
        appears: "3.5",
      },
    ],
    bancolombia: [
      {
        name: "ECS-Organization",
        tone: "emerald",
        issuedBy: "emitida por la CCM (demo)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.6",
      },
      {
        name: "ECS-Service",
        tone: "blue",
        issuedBy: "auto-emitida (patrón ECS)",
        ecosystem: "Ecosistema ECS de Verana",
        appears: "3.6",
      },
    ],
  },
  accreditations: {
    camara: [
      {
        role: "ISSUER",
        schema: "ECS-Organization",
        context: "Ecosistema ECS de Verana",
        appears: "3.2",
      },
      {
        role: "ISSUER",
        schema: "RepresentacionLegal",
        context: "Ecosistema Cámara de Comercio (demo)",
        appears: "3.3",
      },
    ],
    bancolombia: [
      {
        role: "VERIFIER",
        schema: "RepresentacionLegal",
        context: "Ecosistema Cámara de Comercio (demo)",
        appears: "3.6",
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
    camaraEco: "El ecosistema de la credencial de Representación Legal, gobernado por la CCM (demo): solo la cámara emite, y solo los verificadores registrados ante la cámara pueden pedirla, a COP 2.000 por verificación. En el despliegue objetivo lo gobernaría Confecámaras, con las 57 cámaras como emisoras acreditadas.",
    confecamaras: "La Confederación de Cámaras de Comercio federa a las 57 cámaras del país y opera el RUES. En el despliegue objetivo gobernaría el ecosistema y sería ISSUER GRANTOR de ECS-Organization: aparece aquí como contexto, no como servicio de la maqueta.",
    certPdf: "El certificado de existencia y representación legal, hoy: verdad el día que se expide, envejece desde entonces, y su código de verificación muere a los 60 días.",
    repLegal: "Sin nombres en esta historia: cualquier representante legal, con la wallet compatible que elija. Su KYC ante el banco es presencial, con la cédula física.",
    empresa: "Cualquier empresa matriculada en la CCM (demo): su matrícula se vuelve una credencial que ningún PDF puede imitar.",
  },
  stageView: {
    "3.1": { only: ["ecs", "helvetia", "camara", "confecamaras"], viewBox: "30 30 620 520" },
    "3.2": { only: ["ecs", "helvetia", "camara", "confecamaras"], viewBox: "30 30 620 520" },
    "3.3": { only: ["ecs", "camara", "camaraEco"], viewBox: "120 30 640 400" },
    "3.4": { only: ["camara", "camaraEco", "empresa"], viewBox: "180 30 640 560" },
    "3.5": { only: ["camara", "camaraEco", "repLegal"], viewBox: "180 30 890 590" },
    "3.6": {
      only: ["camara", "camaraEco", "bancolombia"],
      viewBox: "180 30 890 400",
    },
    "3.7": {
      only: ["camara", "camaraEco", "bancolombia", "repLegal", "empresa"],
      viewBox: "150 38 1010 580",
    },
    "3.8": {
      only: ["camara", "camaraEco", "bancolombia", "repLegal"],
      viewBox: "150 38 1010 580",
    },
  },
  stageChanges: {
    "3.1": { nodes: ["camara"], note: "el primer check verde de la cámara" },
    "3.2": {
      nodes: ["camara"],
      note: "la cámara se vuelve emisora acreditada de ECS-Organization",
    },
    "3.3": {
      nodes: ["camaraEco"],
      note: "el ecosistema y sus tarifas quedan publicados en el registro público",
    },
    "3.6": {
      nodes: ["bancolombia"],
      note: "el banco, registrado como verificador que paga por verificación",
    },
  },
  verifiedNote:
    "Datos ilustrativos hasta que la maqueta esté desplegada en la testnet: las tarjetas de confianza en vivo están en el capítulo 4.",
};
