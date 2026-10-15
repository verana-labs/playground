// The data of the counterparty proof of a CEXA service (CounterpartyCard):
// the CEXA-VerifiedCounterparty credential that the DID document of the
// service links, and the VERIFIER entry of the service on CEXA-Kyc.
//
// V3 (testnet): the member links the credential as a Linked VP whose id ends
// with "cexa-verified-counterparty-c-vp". The indexer lists the permissions
// of the fixed CEXA-Kyc schema id (app/lib/cexa-cast.ts).
// V4 (devnet): the schema ids are known only at run time. The Association
// publishes one Linked VP "#vpr-schemas-<id>-vtjsc-vp" for each schema of its
// Ecosystem, and the indexer gives the JSON Schema title of each id (the same
// method as app/lib/vtjsc.ts). The member links the credential as the Linked
// VP "#vpr-schemas-<counterparty schema id>-vtc-vp".

import { ENDPOINTS } from "../../lib/site";
import {
  CEXA_CAST,
  CEXA_COUNTERPARTY_TITLE,
  CEXA_KYC_SCHEMA_ID,
  CEXA_KYC_TITLE,
} from "../../lib/cexa-cast";

const TIMEOUT_MS = 15_000;

export type DidService = { id?: string; type?: string; serviceEndpoint?: unknown };
export type DidDocument = { id?: unknown; alsoKnownAs?: unknown; service?: DidService[] };

/** The claims of the CEXA-VerifiedCounterparty credential that the card shows. */
export const COUNTERPARTY_CLAIM_KEYS = [
  "legalName",
  "lei",
  "licensingAuthority",
  "licenseIdentifier",
  "vaspCategory",
  "complianceContact",
] as const;

export type Membership =
  | { kind: "member"; issuerDid: string; claims: Record<string, string> }
  | { kind: "outsider" };

export type Counterparty = {
  membership: Membership;
  /** null when the check could not be done (shown as "could not check"). */
  accreditedVerifier: boolean | null;
  /** The DIDs of the Association. The credential is valid only when its
   *  issuer is one of them. */
  associationDids: string[];
};

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

const getDidDocument = (host: string) =>
  getJson(`https://${host}/.well-known/did.json`) as Promise<DidDocument>;

const endpointOf = (service: DidService | undefined): string | undefined => {
  const endpoint = Array.isArray(service?.serviceEndpoint)
    ? service?.serviceEndpoint[0]
    : service?.serviceEndpoint;
  return typeof endpoint === "string" ? endpoint : undefined;
};

/** The endpoint of the first Linked VP of a DID document whose id ends with `suffix`. */
export function linkedVpEndpoint(doc: DidDocument, suffix: string): string | undefined {
  const service = (doc.service ?? []).find(
    (s) => s.type === "LinkedVerifiablePresentation" && s.id?.endsWith(suffix),
  );
  return endpointOf(service);
}

/** V4: the ids of the schemas whose VTJSC a DID document links. */
export function vtjscSchemaIds(doc: DidDocument): string[] {
  const ids: string[] = [];
  for (const s of doc.service ?? []) {
    const match = s.id?.match(/#vpr-schemas-(\d+)-vtjsc-vp$/);
    if (match && s.type === "LinkedVerifiablePresentation") ids.push(match[1]);
  }
  return ids;
}

/** The DIDs of a DID document: its id and the items of its alsoKnownAs list. */
export function documentDids(doc: DidDocument): string[] {
  const aka = Array.isArray(doc.alsoKnownAs) ? doc.alsoKnownAs : [];
  return [doc.id, ...aka].filter((d): d is string => typeof d === "string" && d !== "");
}

/** The DID that the chain uses for a service: the did:webvh alias when the
 *  document has one, else the id of the document. */
export function chainDid(doc: DidDocument): string | undefined {
  const dids = documentDids(doc);
  return dids.find((d) => d.startsWith("did:webvh:")) ?? dids[0];
}

/** The issuer and the claims of the first credential of a presentation. */
export function membershipFromPresentation(vp: unknown): Membership {
  const raw = (vp as { verifiableCredential?: unknown })?.verifiableCredential;
  const vc = (Array.isArray(raw) ? raw[0] : raw) as
    | { issuer?: unknown; credentialSubject?: Record<string, unknown> }
    | undefined;
  const issuer =
    typeof vc?.issuer === "string"
      ? vc.issuer
      : (vc?.issuer as { id?: unknown } | undefined)?.id;
  if (typeof issuer !== "string" || !issuer) throw new Error("credential has no issuer");
  const subject = vc?.credentialSubject ?? {};
  const claims: Record<string, string> = {};
  for (const key of COUNTERPARTY_CLAIM_KEYS) {
    const value = subject[key];
    if (typeof value === "string" && value) claims[key] = value;
  }
  return { kind: "member", issuerDid: issuer, claims };
}

// ---------------------------------------------------------------- V3 (testnet)

async function readMembershipV3(host: string): Promise<Membership> {
  const endpoint = linkedVpEndpoint(
    await getDidDocument(host),
    "cexa-verified-counterparty-c-vp",
  );
  // The DID document resolved fine and simply carries no counterparty
  // credential: the definitive not-a-member answer, not an error.
  if (!endpoint) return { kind: "outsider" };
  return membershipFromPresentation(await getJson(endpoint));
}

/** Live check against the indexer: does this DID hold an ACTIVE VERIFIER
 *  permission on the CEXA-Kyc schema? Returns null when the indexer is
 *  unreachable (shown as "could not check", never as a verdict). */
async function readVerifierV3(did: string | undefined): Promise<boolean | null> {
  if (!did || CEXA_KYC_SCHEMA_ID === undefined) return null;
  try {
    const body = (await getJson(
      `${ENDPOINTS.indexer}/verana/perm/v1/list?schema_id=${CEXA_KYC_SCHEMA_ID}`,
    )) as { permissions?: { type?: string; did?: string; perm_state?: string }[] };
    return (body?.permissions ?? []).some(
      (p) => p.type === "VERIFIER" && p.did === did && p.perm_state === "ACTIVE",
    );
  } catch {
    return null;
  }
}

async function readCounterpartyV3(member: { host: string; did?: string }): Promise<Counterparty> {
  const [membership, accreditedVerifier] = await Promise.all([
    readMembershipV3(member.host),
    readVerifierV3(member.did),
  ]);
  const association = CEXA_CAST.association.did;
  return { membership, accreditedVerifier, associationDids: association ? [association] : [] };
}

// ----------------------------------------------------------------- V4 (devnet)

type CexaRegistry = {
  kycSchemaId: string;
  counterpartySchemaId: string;
  associationDids: string[];
};

/** The JSON Schema title of a credential schema, from the indexer. */
async function schemaTitle(schemaId: string): Promise<string | undefined> {
  const body = (await getJson(`${ENDPOINTS.indexer}/v4/credential-schema/get/${schemaId}`)) as {
    schema?: { json_schema?: unknown };
  };
  const raw = body.schema?.json_schema;
  try {
    const parsed = (typeof raw === "string" ? JSON.parse(raw) : raw) as { title?: unknown };
    return typeof parsed?.title === "string" ? parsed.title : undefined;
  } catch {
    return undefined;
  }
}

async function loadRegistry(): Promise<CexaRegistry> {
  const doc = await getDidDocument(CEXA_CAST.association.host);
  const ids = vtjscSchemaIds(doc);
  const titles = await Promise.all(ids.map((id) => schemaTitle(id).catch(() => undefined)));
  const idOf = (title: string) => ids.find((_, i) => titles[i] === title);
  const kycSchemaId = idOf(CEXA_KYC_TITLE);
  const counterpartySchemaId = idOf(CEXA_COUNTERPARTY_TITLE);
  if (!kycSchemaId || !counterpartySchemaId)
    throw new Error(`${CEXA_CAST.association.host} publishes no CEXA schemas`);
  return { kycSchemaId, counterpartySchemaId, associationDids: documentDids(doc) };
}

let registry: Promise<CexaRegistry> | undefined;

/** V4: the CEXA schema ids and the DIDs of the Association. The cards of one
 *  page share one lookup; a failed lookup is tried again on the next call. */
function cexaRegistry(): Promise<CexaRegistry> {
  registry ??= loadRegistry().catch((e: unknown) => {
    registry = undefined;
    throw e;
  });
  return registry;
}

/** V4: the presentation of the CEXA-VerifiedCounterparty credential of a
 *  member. The agent links it as "#vpr-schemas-<id>-vtc-vp". If no service has
 *  that id, the function also accepts another Linked VP of a credential whose
 *  credentialSchema is the VTJSC of the counterparty schema. */
async function counterpartyPresentation(
  doc: DidDocument,
  schemaId: string,
): Promise<unknown | undefined> {
  const exact = linkedVpEndpoint(doc, `#vpr-schemas-${schemaId}-vtc-vp`);
  if (exact) return getJson(exact);
  const others = (doc.service ?? []).filter(
    (s) =>
      s.type === "LinkedVerifiablePresentation" &&
      /#vpr-schemas-.+-vtc-vp$/.test(s.id ?? "") &&
      !/#vpr-schemas-(org|service)-vtc-vp$/.test(s.id ?? ""),
  );
  for (const service of others) {
    const endpoint = endpointOf(service);
    if (!endpoint) continue;
    const vp = (await getJson(endpoint).catch(() => undefined)) as
      | { verifiableCredential?: unknown }
      | undefined;
    const raw = vp?.verifiableCredential;
    const vc = (Array.isArray(raw) ? raw[0] : raw) as
      | { credentialSchema?: { id?: unknown } }
      | undefined;
    const schema = vc?.credentialSchema?.id;
    if (typeof schema === "string" && schema.endsWith(`/schemas-${schemaId}-jsc.json`)) return vp;
  }
  return undefined;
}

/** V4: does this DID hold an active VERIFIER entry on the CEXA-Kyc schema?
 *  Returns null when the indexer does not answer. */
async function readVerifierV4(kycSchemaId: string, did: string | undefined): Promise<boolean | null> {
  if (!did) return null;
  try {
    const body = (await getJson(
      `${ENDPOINTS.indexer}/v4/participant/list?schema_id=${kycSchemaId}&role=VERIFIER&did=${encodeURIComponent(did)}&participant_state=ACTIVE`,
    )) as { participants?: { did?: string; revoked?: unknown; slashed?: unknown }[] };
    return (body?.participants ?? []).some(
      (p) => p.did === did && p.revoked == null && p.slashed == null,
    );
  } catch {
    return null;
  }
}

async function readCounterpartyV4(host: string): Promise<Counterparty> {
  const [cexa, doc] = await Promise.all([cexaRegistry(), getDidDocument(host)]);
  const [vp, accreditedVerifier] = await Promise.all([
    counterpartyPresentation(doc, cexa.counterpartySchemaId),
    readVerifierV4(cexa.kycSchemaId, chainDid(doc)),
  ]);
  return {
    // The DID document resolved fine and links no counterparty credential:
    // the definitive not-a-member answer, not an error.
    membership: vp === undefined ? { kind: "outsider" } : membershipFromPresentation(vp),
    accreditedVerifier,
    associationDids: cexa.associationDids,
  };
}

/** The counterparty proof of a CEXA service, on the protocol of the network. */
export function readCounterparty(
  member: { host: string; did?: string },
  protocol: "v3" | "v4",
): Promise<Counterparty> {
  return protocol === "v4" ? readCounterpartyV4(member.host) : readCounterpartyV3(member);
}
