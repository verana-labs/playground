// Server-side access to the Playground cast vs-agents' admin APIs (spec §4
// OOB demo flows). The site runs in the same k8s namespace as the cast, so
// the default reaches each agent via its in-cluster Service DNS.

export const CAST_DOMAIN =
  process.env.CAST_BASE_DOMAIN ?? "playground.testnet.verana.network";

// Admin API of a cast vs-agent - {id} is replaced by the service id
// (= Helm release = k8s Service name).
const ADMIN_TEMPLATE =
  process.env.DEMO_ADMIN_BASE_TEMPLATE ?? "http://{id}:3000";

// The ecosystem VTJSC of the DemoCredential, published by the anchor.
export const VTJSC_URL =
  process.env.DEMO_VTJSC_URL ??
  `https://playground-demo.${CAST_DOMAIN}/vt/schemas-demo-credential-jsc.json`;

const TIMEOUT_MS = 15_000;

export const adminBase = (id: string) => ADMIN_TEMPLATE.replace("{id}", id);

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
