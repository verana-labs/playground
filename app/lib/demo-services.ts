import { VESTA_CAST } from "./vesta-cast";

const BASE = process.env.DEMOS_BASE_DOMAIN ?? "main.demos.testnet.verana.network";
const CAST = process.env.CAST_BASE_DOMAIN ?? "playground.testnet.verana.network";

export type DemoService = { id: string; label: string; host: string;
  appUrl?: string; did?: string; role: "anchor" | "issuer" | "verifier" | "untrusted" };

// appUrl is a vs-agent's DIDComm out-of-band invitation link, set on the
// services a personal wallet connects to.
const invite = (host: string) => `https://${host}/invitation`;
const castInvite = (slug: string) => `https://${slug}.${CAST}/invitation`;

// The live Vesta cast (spec §5): one vs-agent per participant, deployed by
// .github/workflows/vesta-*.
export const DEMO_SERVICES: DemoService[] = [
  // Vesta is the organization anchor AND an ECS-Badge issuer; role "issuer"
  // lets /api/demo mint badge offers from it.
  { id: "vesta", label: "Vesta Appliances (demo)", host: VESTA_CAST.vesta.host, did: VESTA_CAST.vesta.did, appUrl: invite(VESTA_CAST.vesta.host), role: "issuer" },
  { id: "helvetia-trust", label: "Helvetia Trust Services (demo)", host: VESTA_CAST.helvetia.host, did: VESTA_CAST.helvetia.did, role: "issuer" },
  { id: "vesta-portal", label: "Vesta Portal (demo)", host: VESTA_CAST.portal.host, did: VESTA_CAST.portal.did, appUrl: invite(VESTA_CAST.portal.host), role: "verifier" },
  { id: "vesta-repair-network", label: "Vesta Repair Network (demo)", host: VESTA_CAST.repairNetwork.host, did: VESTA_CAST.repairNetwork.did, role: "anchor" },
  { id: "iso-certification", label: "ISO Certification Ecosystem (demo)", host: VESTA_CAST.iso.host, did: VESTA_CAST.iso.did, role: "anchor" },
  { id: "normacert", label: "NormaCert (demo)", host: VESTA_CAST.normacert.host, did: VESTA_CAST.normacert.did, role: "issuer" },
  { id: "vesta-iberia", label: "Vesta Iberia (demo)", host: VESTA_CAST.iberia.host, did: VESTA_CAST.iberia.did, role: "issuer" },
  { id: "vesta-nordics", label: "Vesta Nordics (demo)", host: VESTA_CAST.nordics.host, did: VESTA_CAST.nordics.did, role: "issuer" },
  { id: "zenith", label: "Zenith Repairs (demo)", host: VESTA_CAST.zenith.host, did: VESTA_CAST.zenith.did, appUrl: invite(VESTA_CAST.zenith.host), role: "issuer" },
  { id: "umbra", label: "Umbra Repairs", host: VESTA_CAST.umbra.host, did: VESTA_CAST.umbra.did, appUrl: invite(VESTA_CAST.umbra.host), role: "untrusted" },
  // Planned personal-wallet demo cast (spec §4/§6) still referenced by the
  // personal-wallets playground page; remap those flows onto the Vesta cast
  // (badge issuers, portal login, Umbra) in a follow-up, then retire these.
  { id: "playground-demo", label: "Playground Demo", host: `playground-demo.${CAST}`, role: "anchor" },
  { id: "demo-issuer-accredited", label: "Accredited Issuer (demo)", host: `demo-issuer-accredited.${CAST}`, appUrl: castInvite("demo-issuer-accredited"), role: "issuer" },
  { id: "demo-issuer-unaccredited", label: "Unaccredited Issuer (demo)", host: `demo-issuer-unaccredited.${CAST}`, appUrl: castInvite("demo-issuer-unaccredited"), role: "issuer" },
  { id: "demo-verifier-accredited", label: "Accredited Verifier (demo)", host: `demo-verifier-accredited.${CAST}`, appUrl: castInvite("demo-verifier-accredited"), role: "verifier" },
  { id: "demo-verifier-unaccredited", label: "Unaccredited Verifier (demo)", host: `demo-verifier-unaccredited.${CAST}`, appUrl: castInvite("demo-verifier-unaccredited"), role: "verifier" },
  { id: "demo-untrusted", label: "Untrusted Service (demo)", host: `demo-untrusted.${CAST}`, appUrl: castInvite("demo-untrusted"), role: "untrusted" },
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
