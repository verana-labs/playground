// V4: the VTJSC of a credential schema, found at run time.
//
// On Verana V4 the Ecosystem controller (the agent whose DID is Ecosystem.did)
// publishes one LinkedVerifiablePresentation "#vpr-schemas-<id>-vtjsc-vp" for
// each schema of its Ecosystem, and names the VTJSC after the numeric schema
// id. The app cannot know that id at build time, so it reads the DID document
// of the controller and picks the schema by its JSON Schema title.

import { ENDPOINTS } from "./site";

const TIMEOUT_MS = 15_000;
const CACHE_MS = 10 * 60_000;

const cache = new Map<string, { id: string; at: number }>();

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

/** The JSON Schema title of a CredentialSchema entry, from the indexer. */
async function schemaTitle(credentialSchemaId: string): Promise<string | undefined> {
  const body = (await getJson(
    `${ENDPOINTS.indexer}/v4/credential-schema/get/${credentialSchemaId}`,
  )) as { schema?: { json_schema?: unknown } };
  const raw = body.schema?.json_schema;
  try {
    const parsed = (typeof raw === "string" ? JSON.parse(raw) : raw) as { title?: unknown };
    return typeof parsed?.title === "string" ? parsed.title : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The VTJSC id of the schema titled `title` in the Ecosystem that the agent at
 * `controllerHost` controls. Throws when the controller publishes no such VTJSC.
 */
export async function vtjscIdFor(controllerHost: string, title: string): Promise<string> {
  const key = `${controllerHost}|${title}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.id;

  const doc = (await getJson(`https://${controllerHost}/.well-known/did.json`)) as {
    service?: { id?: string; type?: string; serviceEndpoint?: unknown }[];
  };
  for (const service of doc.service ?? []) {
    const match = service.id?.match(/#vpr-schemas-(\d+)-vtjsc-vp$/);
    if (!match || service.type !== "LinkedVerifiablePresentation") continue;
    if (typeof service.serviceEndpoint !== "string") continue;
    if ((await schemaTitle(match[1])) !== title) continue;

    const presentation = (await getJson(service.serviceEndpoint)) as {
      verifiableCredential?: { id?: unknown }[];
    };
    const id = presentation.verifiableCredential?.[0]?.id;
    if (typeof id !== "string") break;
    cache.set(key, { id, at: Date.now() });
    return id;
  }
  throw new Error(`${controllerHost} publishes no VTJSC for the schema '${title}'`);
}
