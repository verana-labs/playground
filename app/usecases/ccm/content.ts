// El caso de uso CCM (Cámara de Comercio de Medellín), en cuatro
// capítulos - contenido completo en español de Colombia. Basado en la
// estructura del caso Bolivia, con las mismas dos reglas: (1)
// instituciones REALES con sus nombres y logos oficiales, siempre
// marcadas "(demo)" cuando actúan como servicios de la maqueta; (2)
// NINGUNA persona con nombre: el representante legal aparece como un rol
// genérico. La maqueta (ccm-cast.ts, workflows ccm-*) alimenta las demos
// del capítulo 4, que se activan solas cuando cada agente esté desplegado.

import type { Stage } from "./scenes";
import type {
  JourneyNeed as GenericJourneyNeed,
  SubStep as GenericSubStep,
} from "../story-blocks";

export type SubStep = GenericSubStep<Stage>;
export type JourneyNeed = GenericJourneyNeed<Stage>;

/** Logos oficiales (public/images/ccm/). */
export const CCM_ASSETS = {
  ccm: "/images/ccm/ccm.webp",
  bancolombia: "/images/ccm/bancolombia.webp",
  confecamaras: "/images/ccm/confecamaras.webp",
};

// ---------------------------- §1 · La cámara y el certificado de hoy

export const CAMARA = {
  name: "Cámara de Comercio de Medellín para Antioquia",
  tagline: "Conectados para Crecer",
  meta: [
    "Fundada en 1904",
    "Registro mercantil de Medellín y decenas de municipios de Antioquia",
    "Una de las 57 cámaras de comercio de Colombia (red Confecámaras)",
    "Trámites virtuales en tramites.camaramedellin.com.co",
  ],
  intro:
    "La cámara ya es la fuente de verdad: sabe qué empresas existen, quién las representa y con qué facultades. Su producto más usado, el certificado de existencia y representación legal, prueba exactamente eso. El problema no es el registro: es el formato en el que viaja la prueba.",
  certTitle: "El certificado de existencia y representación legal, hoy",
  cert: {
    what: "Un PDF o un papel que certifica que la empresa existe en el registro mercantil y quién puede firmar por ella: razón social, NIT, matrícula, actividad, domicilio, representantes legales y sus facultades.",
    facts: [
      { k: "Precio 2026", v: "1 UVB = COP 12.100, tarifa uniforme nacional" },
      { k: "Verificación", v: "código en certificadoscamara.com o rues.org.co" },
      { k: "Vigencia del código", v: "60 días calendario desde la expedición" },
      { k: "Regla de los bancos", v: "exigen certificados de menos de 30 días" },
      { k: "Volumen nacional", v: "millones de certificados al año en las 57 cámaras" },
      { k: "Base legal", v: "e-CER con firma digital, Ley 527 de 1999" },
    ],
  },
  problemsTitle: "Lo que el PDF no puede hacer",
  problems: [
    {
      icon: "clock",
      title: "Una foto que envejece",
      desc: "El certificado es una instantánea: es verdad el día que se expide y nadie avisa cuando deja de serlo. Si el representante legal es removido mañana, el banco que archivó el PDF no se entera.",
    },
    {
      icon: "repeat",
      title: "La regla de los 30 días",
      desc: "Como la instantánea envejece, cada banco y cada notaría exige un certificado reciente. La empresa compra el mismo certificado una y otra vez, para cada contraparte.",
    },
    {
      icon: "files",
      title: "Sobre-exposición de datos",
      desc: "Para probar un solo hecho (quién representa a la empresa) se entrega el expediente completo: actividad, domicilio, capital, junta. Todo, a todos.",
    },
    {
      icon: "key",
      title: "Verificación manual que caduca",
      desc: "Verificar exige teclear un código en un sitio web, y a los 60 días el código muere. Después, el PDF que circula por correo ya no puede comprobarse.",
    },
    {
      icon: "stamp",
      title: "PDFs que cualquiera edita",
      desc: "Un PDF reenviado se falsifica con un editor. La firma digital protege el original, no las copias impresas ni las capturas que de verdad circulan.",
    },
  ],
  consequence:
    "El resultado: los bancos cargan el riesgo de decidir con información vieja, las empresas pagan el mismo certificado muchas veces, y la cámara no participa en el momento donde su registro genera más valor: la verificación.",
  rootCause:
    "La representación legal cambia en el registro en tiempo real, pero se prueba con un documento congelado. Esa brecha es el caso de uso.",
};

// ---------------------------- §2 · La solución

export const SOLUTION = {
  title: "La solución: la representación legal como credencial",
  intro:
    "La cámara emite la prueba de representación legal como credencial verificable, directamente al celular del representante, desde el portal donde ya está autenticado. El banco la verifica en un escaneo contra el registro público de Verana, la revocación se conoce al instante, y cada verificación deja una tarifa a la cámara. Ningún trámite nuevo: el mismo servicio registral, en un formato que no envejece.",
  needsTitle: "Lo que la cámara necesita",
  needsIntro: "La lista es corta:",
  needs: [
    {
      need: 1,
      tag: "ECS-Organization",
      title: "Una cámara verificable",
      desc: "Antes de dar fe de nadie, la cámara se prueba a sí misma: su servicio en línea presenta credenciales de organización y de servicio, verificables por cualquier wallet.",
    },
    {
      need: 2,
      tag: "Ecosistema propio",
      title: "El Ecosistema Cámara de Comercio",
      desc: "Un registro público que gobierna la credencial de Representación Legal: quién la emite (solo la cámara) y quién puede pedirla (solo verificadores registrados).",
    },
    {
      need: 3,
      tag: "Representación Legal",
      title: "La credencial que reemplaza al certificado",
      desc: "Empresa, NIT, matrícula, representante, cédula, calidad y vigencia: emitida desde el portal, revocable el día que el poder cesa.",
    },
    {
      need: 4,
      tag: "VERIFIER",
      title: "Verificadores registrados y que pagan",
      desc: "La verificación es gobernada: cada banco se registra como verificador ante la cámara y paga COP 2.000 por verificación. El registro de partes confiantes, con modelo de negocio.",
    },
    {
      need: 5,
      tag: "Revocación",
      title: "Revocación y renovación",
      desc: "Si el representante cambia, la cámara revoca y el banco lo sabe en la siguiente verificación. Si la credencial expira, el banco pide la renovación desde su propio portal.",
    },
  ],
  // El despliegue objetivo vs la maqueta: quién gobierna qué.
  deployment: {
    title: "El despliegue objetivo, y lo que simplifica la maqueta",
    target: {
      label: "Despliegue objetivo (nacional)",
      points: [
        "Confecámaras gobierna un Ecosistema Cámara de Comercio dedicado y acredita como emisoras de la credencial de Representación Legal a las 57 cámaras del país.",
        "Cada cámara recibe además una entrada de VERIFIER GRANTOR: puede registrar (y cobrar a) los verificadores de su jurisdicción.",
        "Para las credenciales de organización: el Verana Council acredita a Confecámaras como ISSUER GRANTOR de ECS-Organization, y Confecámaras selecciona a sus emisoras, las 57 cámaras. La matrícula mercantil se vuelve una credencial reconocida por toda wallet compatible.",
      ],
    },
    demo: {
      label: "La maqueta CCM (esta demo)",
      points: [
        "Para simplificar, la CCM (demo) controla directamente el Ecosistema Cámara de Comercio y es la única emisora.",
        "El ecosistema ECS de Verana (que en producción gobernaría el Verana Council vía Confecámaras) acredita a la CCM (demo) como ISSUER de ECS-Organization.",
        "Dos agentes en vivo: la cámara emisora y el banco verificador. El patrón escala a las 57 cámaras sin cambiar una línea de la arquitectura.",
      ],
    },
  },
  businessTitle: "El modelo de negocio",
  businessIntro:
    "El usuario sigue pagando por obtener su credencial, como hoy paga el certificado. Lo nuevo: cada verificación del banco deja COP 2.000 a la cámara. Tres ganadores:",
  business: [
    {
      icon: "bank",
      who: "Mejor para el banco",
      desc: "Notificación instantánea de cambios de representante legal: nunca más decidir con un certificado de hace 29 días. Verificar cuesta COP 2.000 y tarda segundos, sin pedirle papeles frescos al cliente.",
    },
    {
      icon: "user",
      who: "Mejor para el usuario",
      desc: "Una sola credencial en su wallet sirve ante todos los bancos, y solo revela la representación: nada de entregar el expediente completo. Todo con preservación de la privacidad.",
    },
    {
      icon: "landmark",
      who: "Mejor para la cámara",
      desc: "Más ingresos por el mismo certificado: la emisión se paga como hoy, y la verificación, que hoy es gratis e invisible, se vuelve un servicio con tarifa.",
    },
  ],
  expiryTitle: "Por qué la expiración garantiza ingresos recurrentes",
  expiry: [
    "Hoy la cámara cobra COP 12.100 una vez, y cada verificación posterior del PDF es gratis. La credencial convierte esa venta única en dos flujos recurrentes.",
    "Primero: la fecha de expiración hace la renovación estructural, no opcional. El titular debe renovar (y pagar) en un ciclo predecible, alineado con la renovación anual de la matrícula mercantil, en lugar de re-comprar cuando algún banco lo exija.",
    "Segundo: cada expiración invalida la credencial ante TODOS los bancos a la vez, así que cada ciclo de renovación obliga a cada verificador a una verificación nueva, pagada, para aceptar la credencial renovada.",
    "Y como verificar es instantáneo y barato, los bancos verifican mucho más de lo que jamás compraron certificados: apertura de cuenta, renovación de crédito, validación de firma, refresco periódico de KYC. El volumen de verificaciones supera por mucho al de certificados, y cada revocación suma re-emisión y re-verificaciones.",
  ],
  feesTitle: "Las tarifas, publicadas en el registro",
  fees: [
    { concept: "Emisión de la credencial (paga el titular)", amount: "como el certificado de hoy, ~COP 12.100" },
    { concept: "Verificación (paga el banco, por evento)", amount: "COP 2.000" },
    { concept: "Consultar el registro público de Verana", amount: "gratis" },
  ],
  feesNote:
    "En la maqueta, las tarifas se publican con el permiso raíz del esquema en el registro de Verana (unidades simbólicas): el modelo de negocio queda auditable on-chain. El cobro en vivo no forma parte de esta demo.",
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
    "Sin personas con nombre y sin ficción institucional: la Cámara de Comercio de Medellín (demo) y su banco verificador, volviéndose verificables sobre la testnet de Verana. Cada paso replica un patrón que ya corre en vivo en este playground.",
  outro:
    "Ocho pasos, cero silos nuevos. La credencial la emite la institución que ya era su fuente de verdad, el banco decide con información en tiempo real, y cada verificación deja una tarifa a la cámara.",
  needs: [
    {
      id: "need-1",
      n: 1,
      title: "Una cámara verificable",
      tag: "ECS-Organization",
      intro:
        "Antes de dar fe de nadie, la cámara se prueba a sí misma.",
      steps: [
        {
          id: "s-3-1",
          stage: "3.1",
          title: "La CCM se vuelve un Servicio Verificable",
          kind: "watch",
          story:
            "La CCM (demo) despliega un vs-agent, la Business Wallet de código abierto integrada nativamente con Verana. Se genera un DID para la cámara; un emisor KYB acreditado del ecosistema ECS (en la testnet, Helvetia Trust (demo)) verifica a la institución y emite su credencial ECS-Organization. La cámara auto-emite su ECS-Service: su primer check verde.",
          points: [
            "Un vs-agent por institución: software libre, desplegable en la infraestructura de la propia cámara.",
            "El DID se publica bajo el dominio de la cámara: la prueba y el dominio quedan atados.",
            "El mismo flujo exacto de los casos Vesta y Bolivia: el patrón se replica entre países y sectores.",
          ],
          underHood: [
            "El vs-agent genera el DID (se recomienda did:webvh) y publica su DID Document con un endpoint DIDComm en https://<host>/.well-known/did.json.",
            "La resolución de confianza (Q1) verifica ECS-Service + ECS-Organization contra el registro público de Verana.",
          ],
        },
        {
          id: "s-3-2",
          stage: "3.2",
          title: "El ecosistema ECS acredita a la CCM como emisora",
          kind: "watch",
          story:
            "El ecosistema ECS de Verana acredita a la CCM (demo) como emisora de credenciales ECS-Organization. Desde este momento, el KYB de una empresa antioqueña deja de ser papeleo: el registro que YA es la fuente de verdad emite la credencial directamente. En el despliegue objetivo, este paso lo haría el Verana Council acreditando a Confecámaras como ISSUER GRANTOR, y Confecámaras a las 57 cámaras.",
          points: [
            "La acreditación es un permiso público en el registro de Verana: cualquiera puede auditarla.",
            "La cámara no cambia de rol: hace en digital lo que el Código de Comercio ya le encarga en papel.",
          ],
        },
      ],
    },
    {
      id: "need-2",
      n: 2,
      title: "El Ecosistema Cámara de Comercio",
      tag: "emisión y verificación gobernadas",
      intro:
        "El registro público que gobierna la credencial, con el modelo de negocio publicado.",
      steps: [
        {
          id: "s-3-3",
          stage: "3.3",
          title: "La CCM crea su ecosistema y publica las tarifas",
          kind: "watch",
          story:
            "La CCM (demo) crea el Ecosistema Cámara de Comercio (demo) con un esquema: la credencial de Representación Legal. Emisión gobernada: solo la cámara emite. Verificación gobernada: un banco debe registrarse como verificador ante la cámara antes de que ninguna wallet comparta la credencial. Y las tarifas (emisión ~COP 12.100, verificación COP 2.000) se publican con el permiso raíz: el modelo de negocio es auditable on-chain.",
          points: [
            "La verificación gobernada es el registro de partes confiantes de eIDAS 2, hecho estructura, y aquí además con tarifa.",
            "En el despliegue objetivo, el ecosistema lo gobierna Confecámaras y las 57 cámaras son sus emisoras acreditadas.",
          ],
          underHood: [
            "El ecosistema se publica como Trust Registry en el registro público de Verana; el esquema se crea con modos ECOSYSTEM para emisor Y verificador, y el permiso raíz declara issuance/verification fees.",
          ],
        },
      ],
    },
    {
      id: "need-3",
      n: 3,
      title: "Empresas verificables",
      tag: "Business ID",
      intro: "La matrícula mercantil, como credencial que ningún PDF puede imitar.",
      steps: [
        {
          id: "s-3-4",
          stage: "3.4",
          title: "Una empresa matriculada obtiene su ECS-Organization",
          kind: "watch",
          story:
            "Una empresa matriculada (demo) solicita su credencial a la CCM (demo). Como la cámara es el registro, la emisión es una consulta a su propia base: matrícula, razón social, NIT. La credencial se ancla a la Business Wallet de la empresa y sus servicios en línea la presentan automáticamente.",
          points: [
            "El extracto en PDF muere: la prueba es criptográfica y siempre está al día.",
            "Todo banco, notaría o contraparte verifica en segundos contra el registro público.",
          ],
        },
      ],
    },
    {
      id: "need-4",
      n: 4,
      title: "La credencial de Representación Legal",
      tag: "desde el portal",
      intro:
        "El corazón del caso: la prueba de representación, emitida donde el usuario ya está.",
      steps: [
        {
          id: "s-3-5",
          stage: "3.5",
          title: "El representante recibe su credencial desde el portal CCM",
          kind: "watch",
          story:
            "El representante legal (un rol, no un nombre: esta historia no necesita personajes) entra al portal de servicios virtuales de la CCM (demo), donde ya está autenticado como representante de su empresa. Desde el acceso de la empresa, el portal le presenta un código QR del emisor CCM: lo escanea con la wallet que elija y recibe su credencial personal: empresa, NIT, matrícula, su nombre, su cédula, calidad y vigencia. Paga la emisión como hoy paga el certificado.",
          points: [
            "Cero trámites nuevos: la emisión vive dentro del portal que la cámara ya opera.",
            "La wallet verifica al emisor ANTES de aceptar: solo la CCM real, con su check verde, puede emitir esta credencial.",
            "Doble riel: AnonCreds/DIDComm y OpenID4VC SD-JWT, el riel compatible con eIDAS 2.",
          ],
        },
      ],
    },
    {
      id: "need-5",
      n: 5,
      title: "El banco verifica, la cámara cobra",
      tag: "VERIFIER + revocación",
      intro:
        "El pago de todo lo anterior: el banco decide con información en tiempo real, y cada verificación deja una tarifa.",
      steps: [
        {
          id: "s-3-6",
          stage: "3.6",
          title: "Bancolombia se registra como verificador",
          kind: "watch",
          story:
            "Bancolombia (demo) se vuelve Servicio Verificable (su ECS-Organization la emite la CCM (demo): el registro da fe del banco que opera en su jurisdicción) y se registra como VERIFIER de la Representación Legal ante la cámara. Ese registro es la puerta del modelo de negocio: cada verificación que haga pagará COP 2.000 a la cámara.",
          points: [
            "Sin registro de verificador, ninguna wallet conforme comparte la credencial: pedir datos requiere permiso.",
            "El permiso VERIFIER es público en el registro de Verana: cualquiera puede auditar quién verifica.",
          ],
        },
        {
          id: "s-3-7",
          stage: "3.7",
          title: "En la sucursal: cédula física + credencial, y acceso corporativo",
          kind: "watch",
          story:
            "El representante va al banco a abrir la cuenta de su empresa. El KYC personal es presencial, con su cédula de ciudadanía física. Para probar que representa a la empresa, ya no trae un certificado impreso: el empleado del banco le muestra un QR y él presenta su credencial de Representación Legal. El banco coteja el nombre y la cédula de la credencial con el documento físico, verifica al emisor contra el registro, y le da acceso a la cuenta corporativa.",
          points: [
            "El banco no re-hace el KYB: confía en la credencial de la cámara, que ES el registro.",
            "La credencial revela solo la representación: el expediente completo de la empresa nunca sale del registro.",
          ],
        },
        {
          id: "s-3-8",
          stage: "3.8",
          title: "Revocación instantánea y renovación desde el portal",
          kind: "story",
          story:
            "El día que el representante es removido, la cámara actualiza su registro Y revoca la credencial: la siguiente verificación del banco falla, al instante, sin que nadie llame a nadie. Y cuando la credencial expira con la renovación anual de la matrícula (o el representante cambia), el banco simplemente solicita la credencial actualizada desde su propio portal: el titular la renueva en el portal CCM y la presenta de nuevo. La revocación funciona en ambos rieles (registros de revocación AnonCreds en DIDComm, status lists en OpenID4VC); la maqueta aún no la implementa, y este capítulo lo dice explícitamente.",
          points: [
            "La brecha del certificado congelado se cierra: la prueba tiene estado en tiempo real.",
            "Cada expiración fuerza renovación (paga el titular) y re-verificación en cada banco (paga el verificador): el ingreso recurrente de la cámara.",
            "Estado en la maqueta: la revocación está en la historia y en la arquitectura, todavía no en la demo en vivo.",
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
    "Nada de lo anterior es una promesa: la maqueta corre sobre la testnet pública de Verana, con un vs-agent real por institución (demo), el ecosistema y sus permisos publicados en el registro. Wallets reales, resolución de confianza real.",
  verifyRule:
    "La regla de todas las demos: antes de aceptar una oferta o presentar una credencial, su wallet VERIFICA al servicio (identidad probada y permisos vigentes) y se lo muestra. Usted decide viendo checks, no logos.",
  chooseWallet: {
    title: "Elija una wallet",
    intro:
      "Cualquier wallet compatible sirve: las mismas de la página de wallets personales del playground. Hologram habla AnonCreds/DIDComm; las wallets OID4VC usan SD-JWT, el riel compatible con eIDAS 2.",
  },
  portal: {
    title: "Demo 1 · Obtenga la credencial desde el portal CCM",
    intro:
      "La ventana simulada del portal de servicios virtuales de la CCM (demo): usted ya está autenticado como representante legal de una empresa matriculada (demo). Desde el acceso de la empresa, el portal le presenta el QR del emisor: escanéelo y reciba su credencial de Representación Legal con datos de demostración.",
    serviceId: "camara-medellin",
    credential: "ccm-legal-rep",
  },
  banco: {
    title: "Demo 2 · Acceso corporativo en Bancolombia",
    intro:
      "La ventanilla (demo): el KYC personal ya ocurrió, presencial, con la cédula física. Presente su credencial de Representación Legal; el banco decide en vivo sobre la cadena del emisor: solo una credencial emitida por la CCM (demo) abre el acceso corporativo.",
  },
  revocation: {
    title: "Revocación y renovación: cómo funciona (y qué falta en la maqueta)",
    body: "Si el representante cesa, la cámara revoca la credencial y la siguiente verificación del banco falla al instante: registros de revocación AnonCreds en el riel DIDComm, status lists en el riel OpenID4VC. Si la credencial expiró, el banco la rechaza por la fecha y solicita la actualizada desde su portal. La maqueta todavía no implementa la revocación en vivo: esta tarjeta existe para decirlo sin letra pequeña.",
  },
  boliviaTitle: "El mismo patrón, en el caso Bolivia",
  boliviaNote:
    "La misma arquitectura corre también en el caso Bolivia (en español), con el registro de comercio y la cédula digital del Estado: útil como segunda referencia en vivo.",
  boliviaHref: "/usecases/bolivia",
  directoryTitle: "Y al final: el directorio de la cámara",
  directory:
    "Todo lo publicado se vuelve consultable. El directorio de servicios verificables de la jurisdicción: busque cualquier empresa matriculada, vea sus credenciales, sus permisos y quién la opera, desde cualquier wallet o navegador. Gratis, público, sin registro.",
  directoryQueries: [
    "¿Quién representa legalmente a esta empresa, ahora mismo?",
    "¿Este portal bancario que me pide la credencial está registrado como verificador?",
    "¿Qué empresas con matrícula vigente operan servicios en línea verificados?",
  ],
};

export const CLOSING = {
  title: "Un registro que puede probar lo que certifica",
  body: "Las competencias no cambian: la cámara sigue llevando el registro mercantil, el banco sigue haciendo su KYC, Confecámaras sigue federando a las 57 cámaras. Lo que cambia es el formato de la prueba: de un PDF que envejece a una credencial con estado en tiempo real, que preserva la privacidad del titular, le ahorra riesgo al banco y le genera a la cámara un ingreso recurrente sobre el servicio que ya presta.",
  cta: "Ver también el caso Bolivia",
  ctaHref: "/usecases/bolivia",
};
