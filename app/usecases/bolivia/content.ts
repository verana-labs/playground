// El caso de uso Bolivia, en cuatro capítulos - contenido completo en
// español. Basado en la estructura del caso Verandia, con dos reglas
// propias: (1) instituciones REALES con sus nombres y logos oficiales,
// siempre marcadas "(demo)" cuando actúan como servicios de la maqueta;
// (2) NINGUNA persona con nombre: la ciudadanía y los representantes
// aparecen como roles genéricos. La maqueta (bolivia-cast.ts, workflows
// bolivia-*) alimenta las demos del capítulo 4, que se activan solas
// cuando cada agente esté desplegado.

import type { Stage } from "./scenes";
import type {
  JourneyNeed as GenericJourneyNeed,
  SubStep as GenericSubStep,
} from "../story-blocks";

export type SubStep = GenericSubStep<Stage>;
export type JourneyNeed = GenericJourneyNeed<Stage>;

/** Logos oficiales de las instituciones (public/images/bolivia/). */
export const BOLIVIA_ASSETS = {
  segip: "/images/bolivia/segip.webp",
  seprec: "/images/bolivia/seprec.webp",
  sin: "/images/bolivia/sin.webp",
  agetic: "/images/bolivia/agetic.webp",
  bancoUnion: "/images/bolivia/banco-union.webp",
};

// ---------------------------- §1 · El Estado y sus instituciones

export const ESTADO = {
  name: "Estado Plurinacional de Bolivia",
  tagline: "Un país, volviéndose verificable",
  meta: [
    "~11,3 millones de habitantes",
    "Ciudadanía Digital desde 2018 (Ley 1080)",
    "Cédula digital reglamentada (DS 4861)",
    "~380.000 empresas con matrícula vigente",
  ],
  intro:
    "Bolivia ya tiene las fuentes de verdad: el SEGIP conoce a cada persona, el SEPREC a cada empresa, e Impuestos Nacionales a cada contribuyente. Las instituciones funcionan. Lo que falta es poder PROBAR, en línea, lo que ellas certifican.",
  institutions: [
    {
      id: "segip",
      logo: BOLIVIA_ASSETS.segip,
      name: "SEGIP",
      full: "Servicio General de Identificación Personal",
      desc: "La única entidad facultada para emitir la cédula de identidad y administrar el RUI (Ley 145). La fuente de verdad sobre las personas.",
      tuicion: "Ministerio de Gobierno",
    },
    {
      id: "seprec",
      logo: BOLIVIA_ASSETS.seprec,
      name: "SEPREC",
      full: "Servicio Plurinacional de Registro de Comercio",
      desc: "La matrícula de comercio, las empresas y sus representantes legales (Ley 1398, opera desde 2022). La fuente de verdad sobre los negocios.",
      tuicion: "Min. de Desarrollo Productivo y Economía Plural",
    },
    {
      id: "sin",
      logo: BOLIVIA_ASSETS.sin,
      name: "Impuestos Nacionales",
      full: "Servicio de Impuestos Nacionales",
      desc: "El NIT, los tributos y el portal SIAT: la ventanilla digital con la que toda persona y toda empresa tratan cada año.",
      tuicion: "Min. de Economía y Finanzas Públicas",
    },
  ],
  /** La capa transversal: no es un registro, integra a los demás. */
  agetic: {
    logo: BOLIVIA_ASSETS.agetic,
    name: "AGETIC",
    full: "Agencia de Gobierno Electrónico y Tecnologías de Información y Comunicación",
    desc: "Ciudadanía Digital (Ley 1080), interoperabilidad del Estado, gob.bo. No es un registro: es la capa transversal de integración digital, y el marco que las credenciales verificables extienden.",
    tuicion: "Ministerio de la Presidencia",
  },
  /** El matiz institucional que la versión simplificada no puede ignorar. */
  sereci: {
    name: "SERECI · Órgano Electoral Plurinacional",
    desc: "El registro cívico (nacimientos, matrimonios, defunciones) pertenece a un órgano independiente del Estado. Sus hechos vitales alimentan el RUI del SEGIP: aparece aquí como contexto, no como parte del ecosistema.",
  },
  normativa: {
    title: "Marco normativo",
    items: [
      { norm: "Ley 145 (2011)", what: "crea el SEGIP: cédula de identidad y RUI" },
      { norm: "DS 4861", what: "cédula de identidad digital bajo control del SEGIP" },
      { norm: "Ley 1398 + DS 4596 (2021)", what: "crean el SEPREC: registro de comercio estatal" },
      { norm: "DS 2514 (2015)", what: "crea la AGETIC: gobierno electrónico" },
      { norm: "Ley 1080 (2018)", what: "Ciudadanía Digital" },
      { norm: "Ley 164 (2011)", what: "telecomunicaciones y TIC, firma digital" },
    ],
    note: "Las competencias ya existen y las normas ya lo permiten: lo que se propone es infraestructura, no una reforma legal.",
  },
  problemsTitle: "Lo que hoy no se puede probar",
  problems: [
    {
      icon: "phone",
      title: "Phishing en nombre del Estado",
      desc: "Portales falsos de “devolución de impuestos” cada temporada. El portal real y el falso son, técnicamente, solo páginas web: indistinguibles.",
    },
    {
      icon: "lock",
      title: "Contraseñas por todas partes",
      desc: "Cada portal público tiene su propio login. Una contraseña robada ES una identidad, y las mesas de ayuda viven de los reseteos.",
    },
    {
      icon: "files",
      title: "Documentos que cualquiera edita",
      desc: "Las empresas prueban su existencia con extractos y testimonios en papel o PDF. Cada banco y cada notaría lo re-verifica todo, cada vez.",
    },
    {
      icon: "stamp",
      title: "¿Quién firma por esta empresa?",
      desc: "La representación legal se prueba con testimonios notariales que envejecen: el día que un gerente se va, nadie se entera.",
    },
    {
      icon: "queue",
      title: "Filas para probar lo que el Estado ya sabe",
      desc: "La gente hace fila por certificados sobre hechos que ya están en los registros: identidad, domicilio, cargos societarios.",
    },
  ],
  consequence:
    "El Estado paga dos veces: carga con la culpa de cada estafa cometida en su nombre, y con el costo de cada verificación que sus documentos no resisten.",
  rootCause:
    "En línea, la palabra del Estado se ve exactamente igual que la palabra de los estafadores. Nada puede probarse.",
};

// ---------------------------- §2 · La solución: un Estado verificable

export const SOLUTION = {
  title: "La solución: un Estado verificable",
  intro:
    "Todas las piezas ya existen. Wallets de código abierto, para personas y para organizaciones. Un marco legal que ya admite la cédula digital. Y una infraestructura pública de confianza donde anclar cada prueba: Verana. Lo que sigue no es una reforma, es un despliegue.",
  needsTitle: "Lo que el Estado necesita",
  needsIntro: "La lista es corta:",
  needs: [
    {
      need: 1,
      tag: "ECS-Organization",
      title: "Instituciones verificables",
      desc: "El Estado debe poder probarse a sí mismo antes de dar fe de nadie. Y su registro de comercio, el SEPREC, es el emisor natural de las credenciales de organización.",
    },
    {
      need: 2,
      tag: "Cédula Digital",
      title: "La cédula, como credencial verificable",
      desc: "La cédula de identidad en la wallet que cada quien elija, emitida solo por el SEGIP (Ley 145), compatible con eIDAS 2.",
    },
    {
      need: 3,
      tag: "Business ID",
      title: "Identidad verificable de empresas",
      desc: "La matrícula del SEPREC como credencial: las empresas prueban quiénes son sin extractos PDF.",
    },
    {
      need: 4,
      tag: "Representante Legal",
      title: "Poderes que no envejecen",
      desc: "Una credencial personal que vincula a una persona con la empresa por la que puede actuar, revocable el mismo día en que cesa.",
    },
    {
      need: 5,
      tag: "Q1 + Q2/Q3",
      title: "Autenticación sin contraseñas, que falla cerrada",
      desc: "El SIAT y los bancos verifican a la ciudadanía con un escaneo. Y solo los verificadores autorizados por el SEGIP pueden siquiera pedir la cédula.",
    },
  ],
  pillarsTitle: "Construyamos sobre Verana",
  pillarsIntro:
    "Verana es infraestructura pública que generaliza el uso de credenciales verificables, y provee de fábrica:",
  pillars: [
    {
      icon: "landmark",
      title: "Ecosistemas soberanos",
      desc: "Cada institución define sus esquemas, su gobernanza y sus permisos en un registro público: quién emite, quién verifica, bajo qué reglas.",
    },
    {
      icon: "badge",
      title: "Identidad verificable",
      desc: "Todo servicio prueba quién es su operador antes de cualquier intercambio. Los portales falsos no tienen nada que probar.",
    },
    {
      icon: "network",
      title: "Descubrimiento",
      desc: "Todo lo publicado se vuelve consultable: el directorio de servicios verificables del Estado, gratis, para cualquier wallet.",
    },
  ],
  ecosystemJoin: {
    name: "Ecosistema ECS de Verana",
    label: "Business IDs como credenciales ECS-Organization",
    about:
      "El registro compartido de credenciales de organización y servicio. El SEPREC se acredita como emisor: la matrícula de comercio se vuelve una credencial reconocida por toda wallet compatible, dentro y fuera del país. Y como el registro ES la fuente de verdad, el KYB deja de ser papeleo: es una consulta.",
    why: "Bolivia podría operar un ecosistema propio para las empresas. Unirse al ecosistema compartido significa que la credencial de una empresa boliviana se reconoce en todas partes: gana la interoperabilidad.",
  },
  ecosystemsBuild: [
    {
      icon: "id",
      logo: BOLIVIA_ASSETS.segip,
      operator: "SEGIP",
      name: "Red de Confianza SEGIP",
      label: "la Cédula Digital, gobernada de punta a punta",
      about:
        "Un esquema: la Cédula Digital (nombres, fecha de nacimiento, número de documento, fotografía). Emisión gobernada: solo el SEGIP emite, como manda la Ley 145. Verificación gobernada: un servicio debe registrarse como verificador autorizado ante el SEGIP antes de que ninguna wallet comparta la cédula. Es la regla de parte informante de eIDAS 2, hecha estructura, y es exactamente el servicio regulado de verificación que la Ley 145 ya prevé.",
      why: "el fraude de identidad muere cuando la cédula es criptográfica, y la sobre-recolección de datos muere cuando pedir datos requiere permiso.",
    },
    {
      icon: "network",
      logo: BOLIVIA_ASSETS.seprec,
      operator: "SEPREC",
      name: "Representación Legal",
      label: "quién puede actuar por una empresa, como prueba",
      about:
        "Un esquema: la credencial de Representante Legal (empresa, matrícula, persona, cargo, alcance, vigencia). Emisión gobernada: solo el SEPREC emite, tras identificar al solicitante con su Cédula Digital. Verificación abierta: consultar quién representa a una empresa es función pública del registro.",
      why: "el problema del testimonio notarial y el fax se vuelve un escaneo, y el representante que cesa queda revocado el mismo día.",
    },
  ],
  bridge:
    "AGETIC coordina la integración de los verificadores públicos: la Ciudadanía Digital (Ley 1080) no se reemplaza, se potencia. Y el SERECI sigue alimentando el RUI como siempre: nada cambia en las competencias, todo cambia en lo que se puede probar.",
};

// ---------------------------- §3 · La construcción, paso a paso

export const JOURNEY: {
  n: number;
  anchor: string;
  title: string;
  intro: string;
  outro: string;
  needs: JourneyNeed[];
} = {
  n: 3,
  anchor: "section-3",
  title: "La construcción, paso a paso",
  intro:
    "Sin personas con nombre y sin ficción institucional: las instituciones reales de Bolivia (demo), volviéndose verificables una a una sobre la testnet de Verana. Cada paso replica un patrón que ya corre en vivo en este playground.",
  outro:
    "Nueve pasos, cero contraseñas nuevas, cero silos nuevos. Cada credencial la emite la institución que ya era su fuente de verdad, y cada verificación falla cerrada.",
  needs: [
    {
      id: "need-1",
      n: 1,
      title: "Instituciones verificables",
      tag: "ECS-Organization",
      intro:
        "Antes de dar fe de nadie, el Estado se prueba a sí mismo. El SEPREC primero: registro de comercio y futuro emisor de las credenciales de organización.",
      steps: [
        {
          id: "s-3-1",
          stage: "3.1",
          title: "El SEPREC se vuelve un Servicio Verificable",
          kind: "watch",
          story:
            "El SEPREC (demo) despliega un vs-agent, la Business Wallet de código abierto integrada nativamente con Verana. Se genera un DID para el registro; un emisor KYB acreditado del ecosistema ECS (en la testnet, Helvetia Trust (demo)) verifica a la institución y emite su credencial ECS-Organization. El registro auto-emite su ECS-Service: el primer check verde del Estado.",
          points: [
            "Un vs-agent por institución: software libre, desplegable en la infraestructura del propio Estado.",
            "El DID se publica bajo el dominio de la institución: la prueba y el dominio quedan atados.",
            "El mismo flujo exacto del caso Vesta (3.1/3.2): el patrón se replica entre sectores, ese es el punto.",
          ],
          underHood: [
            "El vs-agent genera el DID (se recomienda did:webvh) y publica su DID Document con un endpoint DIDComm en https://<host>/.well-known/did.json.",
            "La resolución de confianza (Q1) verifica ECS-Service + ECS-Organization contra el registro público de Verana.",
          ],
        },
        {
          id: "s-3-2",
          stage: "3.2",
          title: "El ecosistema ECS acredita al SEPREC como emisor",
          kind: "watch",
          story:
            "El ecosistema ECS de Verana acredita al SEPREC (demo) como emisor de credenciales ECS-Organization. Desde este momento, el KYB de una empresa boliviana deja de ser papeleo: el registro que YA es la fuente de verdad emite la credencial directamente. Ningún tercero re-verifica lo que el registro certifica.",
          points: [
            "La acreditación es un permiso público en el registro de Verana: cualquiera puede auditarla.",
            "El SEPREC no cambia de rol: hace en digital lo que la Ley 1398 ya le encarga en papel.",
          ],
        },
      ],
    },
    {
      id: "need-2",
      n: 2,
      title: "La Cédula Digital",
      tag: "Red de Confianza SEGIP",
      intro:
        "La pieza central: la cédula de identidad como credencial verificable, gobernada por la única entidad que la ley faculta.",
      steps: [
        {
          id: "s-3-3",
          stage: "3.3",
          title: "El SEGIP crea la Red de Confianza SEGIP",
          kind: "watch",
          story:
            "El SEGIP (demo) se vuelve Servicio Verificable (su ECS-Organization la emite el SEPREC (demo): una institución del Estado da fe de la otra, con el registro como fuente de verdad). Luego crea su ecosistema: la Red de Confianza SEGIP, con un esquema, la Cédula Digital. Emisión gobernada: solo el SEGIP. Verificación gobernada: solo verificadores autorizados por el SEGIP pueden pedir la cédula. AGETIC coordina la integración de las entidades públicas.",
          points: [
            "La regla de la Ley 145 (solo el SEGIP emite cédulas) se vuelve una regla criptográfica, no solo administrativa.",
            "La verificación gobernada es el análogo estructural del registro de partes informantes de eIDAS 2.",
            "Compatible con la Ciudadanía Digital (Ley 1080): la extiende, no la reemplaza.",
          ],
          underHood: [
            "El ecosistema se publica como Trust Registry en el registro público de Verana, con permisos ISSUER y VERIFIER sobre el esquema de la Cédula Digital.",
            "El DS 4861 ya reglamenta la cédula digital bajo control del SEGIP: la credencial verificable es su proyección interoperable.",
          ],
        },
        {
          id: "s-3-4",
          stage: "3.4",
          title: "La ciudadanía obtiene su Cédula Digital",
          kind: "watch",
          story:
            "Cualquier persona, con la wallet compatible que elija (las hay de código abierto, y cualquiera puede personalizarse para Bolivia), escanea un QR del SEGIP (demo), se identifica, y recibe su Cédula Digital. La wallet verifica al emisor ANTES de aceptar: solo el SEGIP real, con su check verde, puede emitir una cédula que las wallets acepten.",
          points: [
            "Doble riel: AnonCreds/DIDComm y OpenID4VC SD-JWT, el riel compatible con eIDAS 2.",
            "La fecha de nacimiento viaja como dateint: la wallet puede probar “mayor de 18” sin revelar la fecha.",
            "Sin app estatal obligatoria: estándares abiertos, wallet a elección.",
          ],
        },
      ],
    },
    {
      id: "need-3",
      n: 3,
      title: "Identidad verificable de empresas",
      tag: "Business ID",
      intro: "La matrícula de comercio, como credencial que ningún PDF puede imitar.",
      steps: [
        {
          id: "s-3-5",
          stage: "3.5",
          title: "Una empresa obtiene su ECS-Organization del SEPREC",
          kind: "watch",
          story:
            "Una empresa registrada (demo) solicita su credencial al SEPREC (demo). Como el SEPREC es el registro, la emisión es una consulta a su propia base: matrícula, razón social, NIT. La credencial se ancla a la Business Wallet de la empresa y sus servicios en línea la presentan automáticamente: cada web de la empresa puede probar quién la opera.",
          points: [
            "El extracto PDF muere: la prueba es criptográfica y siempre está al día.",
            "Todo banco, notaría o contraparte verifica gratis, en segundos, contra el registro público.",
          ],
        },
      ],
    },
    {
      id: "need-4",
      n: 4,
      title: "Poderes que no envejecen",
      tag: "Representante Legal",
      intro: "Quién puede actuar por una empresa, como credencial personal revocable.",
      steps: [
        {
          id: "s-3-6",
          stage: "3.6",
          title: "El SEPREC emite la credencial de Representante Legal",
          kind: "watch",
          story:
            "El representante legal de la empresa (un rol, no un nombre: esta historia no necesita personajes) se identifica ante el SEPREC (demo) con su Cédula Digital y recibe una credencial personal: empresa, matrícula, cargo, alcance del poder, vigencia. El día que el poder cesa, el SEPREC lo revoca y ninguna verificación posterior lo acepta.",
          points: [
            "El testimonio notarial que envejecía en un cajón se vuelve una prueba con estado en tiempo real.",
            "La emisión exige la Cédula Digital del solicitante: las dos redes de confianza se componen.",
          ],
        },
      ],
    },
    {
      id: "need-5",
      n: 5,
      title: "Autenticación sin contraseñas, que falla cerrada",
      tag: "Q1 + Q2/Q3",
      intro:
        "El pago de todo lo anterior: iniciar sesión es un escaneo, y pedir datos requiere permiso.",
      steps: [
        {
          id: "s-3-7",
          stage: "3.7",
          title: "Impuestos Nacionales y Banco Unión: sesión con un escaneo",
          kind: "watch",
          story:
            "Impuestos Nacionales (demo) se registra ante el SEGIP como verificador autorizado y el SIAT deja atrás las contraseñas: la ciudadanía inicia sesión presentando su Cédula Digital. Banco Unión (demo) hace lo mismo: KYC personal en un escaneo, y acceso corporativo presentando la credencial de Representante Legal. Antes de compartir nada, la wallet verifica a AMBOS: identidad probada y permiso VERIFIER vigente.",
          points: [
            "Sin contraseñas: nada que phishear, nada que resetear, nada que compartir.",
            "El banco no re-hace el KYB: confía en la credencial del SEPREC, que es el registro.",
            "La wallet muestra el Proof-of-Trust del verificador ANTES del consentimiento: la persona decide viendo checks, no logos.",
          ],
        },
        {
          id: "s-3-8",
          stage: "3.8",
          title: "Los rechazos: verificadores no autorizados y portales falsos",
          kind: "story",
          story:
            "Un prestamista en línea (simulado) es un servicio verificable con identidad probada, pero NO está autorizado como verificador de la Cédula Digital. Cuando la pide, la wallet muestra la solicitud en rojo: sin permiso VERIFIER, no hay datos. Y el portal falso de devoluciones, que antes era indistinguible del real, ahora no tiene nada que probar: falla la resolución de confianza y la wallet lo bloquea. El sistema falla cerrado.",
          points: [
            "Identidad probada no es permiso para pedir datos: son dos verificaciones distintas (Q1 y Q3).",
            "La sobre-recolección de datos deja de ser una política para volverse una imposibilidad técnica.",
            "El phishing en nombre del Estado muere donde nace: en la imposibilidad de probar.",
          ],
        },
      ],
    },
  ],
};

// ---------------------------- §4 · La demo en vivo

export const DEMOS = {
  title: "La demo en vivo",
  intro:
    "Nada de lo anterior es una promesa: la maqueta boliviana corre sobre la testnet pública de Verana, con un vs-agent real por institución (demo), los dos ecosistemas y sus permisos publicados en el registro. Wallets reales, resolución de confianza real. Nada simulado, salvo el prestamista.",
  verifyRule:
    "La regla de todas las demos: antes de aceptar una oferta o presentar una credencial, su wallet VERIFICA al servicio (identidad probada y permisos vigentes) y se lo muestra. Usted decide viendo checks, no logos.",
  chooseWallet: {
    title: "Elija una wallet",
    intro:
      "Cualquier wallet compatible sirve: las mismas de la página de wallets personales del playground. Hologram habla AnonCreds/DIDComm; las wallets OID4VC usan SD-JWT, el riel compatible con eIDAS 2.",
  },
  cedula: {
    title: "Demo 1 · Obtenga su Cédula Digital",
    intro:
      "El SEGIP (demo) le emite una Cédula Digital con datos de demostración (titular genérico, identificador por escaneo). Su wallet verifica al emisor antes de aceptar.",
    offer: {
      org: "SEGIP (demo)",
      serviceId: "segip",
      credential: "bolivia-cedula",
      expect:
        "Emisión gobernada: solo el SEGIP (demo) puede emitir esta credencial, y su wallet lo comprueba contra el registro público.",
      tone: "emerald" as const,
    },
  },
  legalRep: {
    title: "Demo 2 · Obtenga una credencial de Representante Legal",
    intro:
      "El SEPREC (demo) emite el poder verificable de una empresa registrada (demo): empresa, matrícula, cargo, alcance, vigencia. En el flujo real, el solicitante se identifica primero con su Cédula Digital.",
    offer: {
      org: "SEPREC (demo)",
      serviceId: "seprec",
      credential: "bolivia-legal-rep",
      expect:
        "Un rol, no una persona: el poder queda atado a la matrícula de la empresa y es revocable el mismo día en que cesa.",
      tone: "emerald" as const,
    },
  },
  taxLogin: {
    title: "Demo 3 · Inicie sesión en Impuestos Nacionales",
    intro:
      "La oficina virtual (demo) sin contraseñas: presente su Cédula Digital para el espacio personal, o su credencial de Representante Legal para el espacio de la empresa. La decisión se toma en vivo sobre la cadena del emisor.",
  },
  banco: {
    title: "Demo 4 · Abra una cuenta en Banco Unión",
    intro:
      "KYC en un escaneo con la Cédula Digital, y acceso corporativo presentando el poder del SEPREC (demo). El banco no re-verifica a la empresa: confía en el registro, que ES la fuente de verdad.",
  },
  prestamista: {
    title: "Demo 5 · El verificador que pide de más",
    intro:
      "El prestamista (simulado) es un servicio verificable y confiable (Q1 verde), pero NUNCA se registró como verificador de la Cédula Digital. Su solicitud es muy real; su permiso no existe: la wallet la muestra en rojo y usted la rechaza.",
    expect:
      "Pide la Cédula completa (fotografía incluida) sin permiso VERIFIER: toda wallet conforme se niega a presentar. Identidad probada no es autorización.",
    serviceId: "prestamista",
    credential: "bolivia-cedula",
  },
  verandiaTitle: "El mismo patrón, en el caso Verandia",
  verandiaNote:
    "La misma arquitectura corre también en el caso Verandia (en inglés), con una república ficticia: útil como segunda referencia en vivo.",
  verandiaHref: "/usecases/verandia/demos",
  directoryTitle: "Y al final: el directorio del Estado",
  directory:
    "Todo lo publicado se vuelve consultable. El directorio de servicios verificables de Bolivia: busque cualquier institución o empresa, vea sus credenciales, sus permisos y quién la opera, desde cualquier wallet o navegador. Gratis, público, sin registro.",
  directoryQueries: [
    "¿Cuáles son los servicios verificables del Estado?",
    "¿Quién opera este portal que me pide la cédula?",
    "¿Qué empresas con matrícula vigente operan servicios en línea verificados?",
  ],
};

export const CLOSING = {
  title: "Un país que puede probar lo que dice",
  body: "Las competencias no cambian: el SEGIP sigue siendo el único emisor de cédulas, el SEPREC sigue siendo el registro de comercio, Impuestos Nacionales sigue recaudando, AGETIC sigue integrando. Lo que cambia es que, por primera vez, todo eso se puede PROBAR en línea: por cualquier persona, ante cualquier servicio, con estándares abiertos y sin un solo silo nuevo.",
  cta: "Ver la demo en vivo (caso Verandia)",
  ctaHref: "/usecases/verandia/demos",
};
