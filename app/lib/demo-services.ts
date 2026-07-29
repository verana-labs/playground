const BASE = process.env.DEMOS_BASE_DOMAIN ?? "main.demos.testnet.verana.network";

export type DemoService = { id: string; label: string; host: string;
  appUrl?: string; did?: string; role: "anchor" | "issuer" | "verifier" };

export const DEMO_SERVICES: DemoService[] = [
  { id: "organization-vs", label: "Verana Example Organization (demo)", host: `organization-vs.${BASE}`, role: "anchor" },
  { id: "issuer-chatbot-vs", label: "Example Issuer Chatbot (demo)", host: `issuer-chatbot-vs.${BASE}`, role: "issuer" },
  { id: "issuer-web-vs", label: "Example Issuer Web App (demo)", host: `issuer-web-vs.${BASE}`, appUrl: `https://app.issuer-web-vs.${BASE}`, role: "issuer" },
  { id: "verifier-chatbot-vs", label: "Example Verifier Chatbot (demo)", host: `verifier-chatbot-vs.${BASE}`, role: "verifier" },
  { id: "verifier-web-vs", label: "Example Web Verifier (demo)", host: `verifier-web-vs.${BASE}`, appUrl: `https://app.verifier-web-vs.${BASE}`, role: "verifier" },
  // Hosted anchors of the integrated cloud stacks (spec §5.3). Not part of the
  // verana-demos cast, so they carry their own fully-qualified hosts.
  { id: "mosip-organization-vs", label: "MOSIP × Verana anchor", host: "organization-vs.mosip.testnet.verana.network", appUrl: "https://playground.mosip.testnet.verana.network", role: "anchor" },
  { id: "unfold-organization-vs", label: "Unfold × Verana anchor", host: "unfold-org.77.42.86.24.sslip.io", appUrl: "https://api.playground.france-identite.gouv.fr/verana/verana/", role: "anchor" },
];

function extraServices(): DemoService[] {
  const raw = process.env.DEMO_SERVICES_EXTRA;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s) => s && typeof s.id === "string" && typeof s.host === "string")
      : [];
  } catch {
    return [];
  }
}

export const allDemoServices = (): DemoService[] => [...DEMO_SERVICES, ...extraServices()];

export const getDemoService = (id: string) => allDemoServices().find((s) => s.id === id);

export async function serviceDid(host: string): Promise<string | null> {
  try {
    const res = await fetch(`https://${host}/.well-known/did.json`, {
      signal: AbortSignal.timeout(10_000), next: { revalidate: 600 } });
    if (!res.ok) return null;
    const doc = (await res.json()) as { id?: unknown; alsoKnownAs?: unknown };
    const aka = Array.isArray(doc.alsoKnownAs)
      ? doc.alsoKnownAs.find(
          (a): a is string => typeof a === "string" && a.startsWith("did:webvh:"),
        )
      : undefined;
    return aka ?? (typeof doc.id === "string" ? doc.id : null);
  } catch {
    return null;
  }
}

export async function serviceDidFor(s: DemoService): Promise<string | null> {
  if (s.did) return s.did;
  return serviceDid(s.host);
}
