// V4: the membership rule of the Vesta portal. An organization is a member of
// the Vesta Repair Network when the indexer finds, on its DID document, an
// AuthorizedRepairerCredential whose subject has an active HOLDER entry and
// whose issuer has an active ISSUER entry on that schema.
//
// The Repair Network agent controls the Ecosystem of the schema. It publishes
// one LinkedVerifiablePresentation "#vpr-schemas-<id>-vtjsc-vp" for each
// schema of its Ecosystem, so the app finds the numeric schema id at run time.

import { ENDPOINTS } from "@/app/lib/site";

const INDEXER = process.env.INDEXER_URL ?? ENDPOINTS.indexer;
const TIMEOUT_MS = 10_000;
const CACHE_MS = 10 * 60_000;

export const AUTHORIZED_REPAIRER_TITLE = "AuthorizedRepairerCredential";

const schemaIds = new Map<string, { id: number; at: number }>();

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

/** The JSON Schema title of a CredentialSchema entry, from the indexer. */
async function schemaTitle(credentialSchemaId: number): Promise<string | undefined> {
  const body = (await getJson(
    `${INDEXER}/v4/credential-schema/get/${credentialSchemaId}`,
  )) as { schema?: { json_schema?: unknown } };
  const raw = body.schema?.json_schema;
  try {
    const parsed = (typeof raw === "string" ? JSON.parse(raw) : raw) as { title?: unknown };
    return typeof parsed?.title === "string" ? parsed.title : undefined;
  } catch {
    return undefined;
  }
}

/** The numeric id of the schema titled `title` in the Ecosystem that the
 *  agent at `controllerHost` controls. Throws when there is no such schema. */
export async function schemaIdFor(controllerHost: string, title: string): Promise<number> {
  const key = `${controllerHost}|${title}`;
  const hit = schemaIds.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.id;

  const doc = (await getJson(`https://${controllerHost}/.well-known/did.json`)) as {
    service?: { id?: string; type?: string }[];
  };
  for (const service of doc.service ?? []) {
    const match = service.id?.match(/#vpr-schemas-(\d+)-vtjsc-vp$/);
    if (!match || service.type !== "LinkedVerifiablePresentation") continue;
    const id = Number(match[1]);
    if ((await schemaTitle(id)) !== title) continue;
    schemaIds.set(key, { id, at: Date.now() });
    return id;
  }
  throw new Error(`${controllerHost} controls no schema '${title}'`);
}

type Participant = {
  did?: unknown;
  role?: unknown;
  revoked?: unknown;
  slashed?: unknown;
};

/** True when the Participant entry exists, has the role, and is not revoked
 *  or slashed. With `did`, the entry must also belong to that DID. */
async function activeParticipant(id: number, role: string, did?: string): Promise<boolean> {
  if (!id) return false;
  const body = (await getJson(`${INDEXER}/v4/participant/get/${id}`)) as {
    participant?: Participant;
  };
  const p = body.participant;
  if (!p || p.role !== role || p.revoked != null || p.slashed != null) return false;
  return did === undefined || p.did === did;
}

type VtcCredential = {
  credentialSchemaId?: unknown;
  participantId?: unknown;
  issuerParticipantId?: unknown;
};

/** True when `did` presents a valid Authorized Repairer credential (V4).
 *  `repairNetworkHost` is the host of the Ecosystem controller. */
export async function holdsAuthorizedRepairerV4(
  did: string,
  repairNetworkHost: string,
): Promise<boolean> {
  try {
    const schemaId = await schemaIdFor(repairNetworkHost, AUTHORIZED_REPAIRER_TITLE);
    const body = (await getJson(`${INDEXER}/v4/verifiable-trust/resolve`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ did, presentations: true }),
    })) as { did?: unknown; presentations?: { vtcCredentials?: VtcCredential[] }[] };
    if (body.did !== did) return false;

    const credentials = (body.presentations ?? []).flatMap((p) => p.vtcCredentials ?? []);
    for (const c of credentials) {
      if (c.credentialSchemaId !== schemaId) continue;
      const holder = typeof c.participantId === "number" ? c.participantId : 0;
      const issuer = typeof c.issuerParticipantId === "number" ? c.issuerParticipantId : 0;
      const [holderOk, issuerOk] = await Promise.all([
        activeParticipant(holder, "HOLDER", did),
        activeParticipant(issuer, "ISSUER"),
      ]);
      if (holderOk && issuerOk) return true;
    }
    return false;
  } catch {
    return false;
  }
}
