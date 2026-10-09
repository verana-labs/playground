// Server-side access to the Playground cast vs-agents' admin APIs (spec §4
// OOB demo flows). The site runs in the same k8s namespace as the cast, so
// the default reaches each agent via its in-cluster Service DNS.

import { PROTOCOL, networkHost } from "./network";

export const CAST_DOMAIN =
  process.env.CAST_BASE_DOMAIN ?? networkHost("playground");

// Admin API of a cast vs-agent - {id} is replaced by the service id
// (= Helm release = k8s Service name).
const ADMIN_TEMPLATE =
  process.env.DEMO_ADMIN_BASE_TEMPLATE ?? "http://{id}:3000";

// The ecosystem VTJSC of the DemoCredential, published by the anchor. On V4
// the agent names the VTJSC after the numeric schema id, so demoVtjscUrl()
// reads it from the DID document of the anchor at run time.
export const VTJSC_URL =
  process.env.DEMO_VTJSC_URL ??
  `https://playground-demo.${CAST_DOMAIN}/vt/schemas-demo-credential-jsc.json`;

let discoveredVtjscUrl: string | null = null;

/** The DemoCredential VTJSC URL. On V4, the anchor publishes one
 *  LinkedVerifiablePresentation "#vpr-schemas-<id>-vtjsc-vp" for each schema
 *  of its Ecosystem, and the DemoCredential is its only schema. */
export async function demoVtjscUrl(): Promise<string> {
  if (PROTOCOL !== "v4" || process.env.DEMO_VTJSC_URL) return VTJSC_URL;
  if (discoveredVtjscUrl) return discoveredVtjscUrl;
  const base = `https://playground-demo.${CAST_DOMAIN}`;
  const doc = (await adminJson(`${base}/.well-known/did.json`)) as {
    service?: { id?: string; type?: string; serviceEndpoint?: unknown }[];
  };
  const vp = doc.service?.find(
    (s) =>
      s.type === "LinkedVerifiablePresentation" &&
      typeof s.id === "string" &&
      /#vpr-schemas-\d+-vtjsc-vp$/.test(s.id),
  );
  if (typeof vp?.serviceEndpoint !== "string")
    throw new Error(`${base} publishes no VTJSC`);
  const presentation = (await adminJson(vp.serviceEndpoint)) as {
    verifiableCredential?: { id?: unknown }[];
  };
  const id = presentation.verifiableCredential?.[0]?.id;
  if (typeof id !== "string") throw new Error(`no VTJSC id in ${vp.serviceEndpoint}`);
  discoveredVtjscUrl = id;
  return id;
}

const TIMEOUT_MS = 15_000;

export const adminBase = (id: string) => ADMIN_TEMPLATE.replace("{id}", id);

// The DIDComm version of the Out-of-Band invitations that the agents make for
// presentation requests and credential offers. vs-agent enables v1 and v2 and
// makes v2 invitations when a request does not set the version.
export const DIDCOMM_INVITATION_VERSION = "v1";

export async function adminJson(
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}
