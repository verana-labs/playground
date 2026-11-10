import { z } from "zod";
import type { CastService } from "./cast-services";
import { fetchJson } from "./http";
import type { Network } from "./network";

export type Rail = "anoncreds" | "openid4vc-sdjwt";
export type Mint = { rail: "oid4vc" | "didcomm"; kind: string; url: string; id: string | null };

const DemoMintSchema = z.looseObject({
  kind: z.string(),
  url: z.string().nullable().optional(),
  fallback: z.boolean().optional(),
  issuanceSessionId: z.string().nullable().optional(),
  credentialExchangeId: z.string().nullable().optional(),
  verificationSessionId: z.string().nullable().optional(),
  proofExchangeId: z.string().nullable().optional(),
});

const IssuanceStateSchema = z.looseObject({ state: z.string().nullable(), done: z.boolean(), declined: z.boolean() });
const ProofStateSchema = z.looseObject({ state: z.string().nullable().optional(), verified: z.boolean().optional(), claims: z.unknown().optional() });

function playground(network: Network): string {
  if (!network.playground) throw new Error(`${network.id} has no playground`);
  return network.playground;
}

function withParams(base: string, params: Record<string, string | undefined>, demoParams: string): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) search.set(k, v);
  const extra = demoParams.split("&").filter(Boolean);
  const query = [search.toString(), ...extra].filter(Boolean).join("&");
  return `${base}?${query}`;
}

function fromDemo(body: unknown, format: Rail): Mint {
  const mint = DemoMintSchema.parse(body);
  if (mint.kind === "unsupported" || mint.fallback || !mint.url)
    throw new Error(`mint degraded for ${format}: ${JSON.stringify(body)}`);
  const rail = mint.kind.startsWith("oid4vc") ? "oid4vc" : "didcomm";
  const id = mint.issuanceSessionId ?? mint.credentialExchangeId ?? mint.verificationSessionId ?? mint.proofExchangeId ?? null;
  return { rail, kind: mint.kind, url: mint.url, id };
}

export async function mintIssuance(
  network: Network,
  service: CastService,
  opts: { format: Rail; demoParams: string; credential?: string; params?: Record<string, string> },
): Promise<Mint> {
  const url = withParams(`${playground(network)}/api/demo/${service.id}`, { format: opts.format, credential: opts.credential, ...opts.params }, opts.demoParams);
  return fromDemo(await fetchJson(url, { timeoutMs: 40_000 }), opts.format);
}

export async function mintPresentation(
  network: Network,
  service: CastService,
  opts: { format: Rail; demoParams: string; credential?: string },
): Promise<Mint> {
  const url = withParams(`${playground(network)}/api/demo/${service.id}`, { format: opts.format, credential: opts.credential }, opts.demoParams);
  return fromDemo(await fetchJson(url, { timeoutMs: 40_000 }), opts.format);
}

export async function issuanceState(network: Network, service: CastService, mint: Mint): Promise<z.infer<typeof IssuanceStateSchema>> {
  if (!mint.id) throw new Error("a plain invitation has no exchange to poll");
  return IssuanceStateSchema.parse(await fetchJson(`${playground(network)}/api/demo/${service.id}/credential/${encodeURIComponent(mint.id)}?rail=${mint.rail}`));
}

export async function presentationState(
  network: Network,
  service: CastService,
  mint: Mint,
): Promise<{ done: boolean; state: string | null; verified: boolean; claims?: unknown }> {
  if (!mint.id) throw new Error("a plain invitation has no exchange to poll");
  const body = ProofStateSchema.parse(await fetchJson(`${playground(network)}/api/demo/${service.id}/proof/${encodeURIComponent(mint.id)}?rail=${mint.rail}`));
  return { done: body.state === "done", state: body.state ?? null, verified: body.verified === true, claims: body.claims };
}
