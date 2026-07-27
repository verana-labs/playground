const BASE = process.env.DEMOS_BASE_DOMAIN ?? "main.demos.testnet.verana.network";

export type DemoService = { id: string; label: string; host: string;
  appUrl?: string; role: "anchor" | "issuer" | "verifier" };

export const DEMO_SERVICES: DemoService[] = [
  { id: "organization-vs", label: "Verana Example Organization (demo)", host: `organization-vs.${BASE}`, role: "anchor" },
  { id: "issuer-chatbot-vs", label: "Example Issuer Chatbot (demo)", host: `issuer-chatbot-vs.${BASE}`, role: "issuer" },
  { id: "issuer-web-vs", label: "Example Issuer Web App (demo)", host: `issuer-web-vs.${BASE}`, appUrl: `https://app.issuer-web-vs.${BASE}`, role: "issuer" },
  { id: "verifier-chatbot-vs", label: "Example Verifier Chatbot (demo)", host: `verifier-chatbot-vs.${BASE}`, role: "verifier" },
  { id: "verifier-web-vs", label: "Example Web Verifier (demo)", host: `verifier-web-vs.${BASE}`, appUrl: `https://app.verifier-web-vs.${BASE}`, role: "verifier" },
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
    const doc = (await res.json()) as { id?: string; alsoKnownAs?: string[] };
    return doc.alsoKnownAs?.find((a) => a.startsWith("did:webvh:")) ?? doc.id ?? null;
  } catch {
    return null;
  }
}
