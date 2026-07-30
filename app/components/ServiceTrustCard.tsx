"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, ShieldX, Building2, Server } from "lucide-react";

// Compact Proof-of-Trust for one demo service: trust status, the service
// identity (ECS-Service claims), and the organization operating it (ECS-Org
// claims) - resolved live against the network resolver via
// /api/pot/[serviceId]. First live instance of the uniform Proof-of-Trust
// pattern (personal-wallet guideline §5).

type Pot = {
  did: string;
  trustStatus: string;
  service: {
    name: string | null;
    type: string | null;
    description: string | null;
  } | null;
  org: {
    name: string | null;
    countryCode: string | null;
    registryId: string | null;
    address: string | null;
  } | null;
};

// Shape of /api/pot/[serviceId]: the resolution lives under `pot`, and the
// ECS claims inside pot.credentials - not at the top level.
type PotApiResponse = {
  did?: string | null;
  pot?: {
    trustStatus?: string;
    state?: string;
    credentials?: { ecsType?: string; claims?: Record<string, unknown> }[];
  } | null;
};

const text = (v: unknown): string | null =>
  typeof v === "string" && v ? v : null;

function toPot(body: PotApiResponse | null): Pot | null {
  if (!body?.did || !body.pot) return null;
  const state = body.pot.trustStatus ?? body.pot.state;
  // UNVERIFIED (resolver unreachable) is "could not verify", not untrusted.
  if (!state || state === "UNVERIFIED") return null;
  const creds = body.pot.credentials ?? [];
  const svc = creds.find((c) => c.ecsType === "ECS-SERVICE")?.claims;
  const org = creds.find(
    (c) => c.ecsType === "ECS-ORG" || c.ecsType === "ECS-PERSONA",
  )?.claims;
  return {
    did: body.did,
    trustStatus: state,
    service: svc
      ? {
          name: text(svc.name),
          type: text(svc.type),
          description: text(svc.description),
        }
      : null,
    org: org
      ? {
          name: text(org.name),
          countryCode: text(org.countryCode),
          registryId: text(org.registryId),
          address: text(org.address),
        }
      : null,
  };
}

/** ISO 3166-1 alpha-2 country code as an emoji flag (e.g. "CH" -> 🇨🇭). */
function countryFlag(code: string): string | null {
  if (!/^[A-Za-z]{2}$/.test(code)) return null;
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)),
  );
}

function shortDid(did: string, max = 40): string {
  if (did.length <= max) return did;
  const head = Math.ceil((max - 3) * 0.55);
  const tail = max - 3 - head;
  return `${did.slice(0, head)}...${did.slice(-tail)}`;
}

export default function ServiceTrustCard({ serviceId }: { serviceId: string }) {
  // undefined = loading, null = unavailable
  const [pot, setPot] = useState<Pot | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/pot/${serviceId}`)
      .then((res) => (res.ok ? (res.json() as Promise<PotApiResponse>) : null))
      .then((body) => setPot(toPot(body)))
      .catch(() => setPot(null));
  }, [serviceId]);

  if (pot === undefined) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Resolving Proof-of-Trust against the network...
      </div>
    );
  }

  if (pot === null) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Proof-of-Trust unavailable right now.
      </div>
    );
  }

  const trusted = pot.trustStatus === "TRUSTED";
  const flag = pot.org?.countryCode ? countryFlag(pot.org.countryCode) : null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      {/* Status band */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2">
        {trusted ? (
          <span className="pot-verified inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            <ShieldCheck className="h-3 w-3" />
            Trusted
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
            <ShieldX className="h-3 w-3" />
            Untrusted
          </span>
        )}
        <span
          className="truncate font-mono text-[10px] text-gray-600"
          title={pot.did}
        >
          {shortDid(pot.did)}
        </span>
      </div>

      <div className="grid gap-4 px-4 py-3 sm:grid-cols-2">
        {/* The service */}
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            <Server className="h-3 w-3" />
            Service
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {pot.service?.name ?? "Unnamed service"}
          </p>
          {pot.service?.type ? (
            <p className="mt-0.5 font-mono text-[10px] text-gray-600">
              {pot.service.type}
            </p>
          ) : null}
          {pot.service?.description ? (
            <p className="mt-1 text-xs text-gray-500">
              {pot.service.description}
            </p>
          ) : null}
        </div>

        {/* The operator */}
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
            <Building2 className="h-3 w-3" />
            Operated by
          </p>
          {pot.org ? (
            <>
              <p className="text-sm font-semibold text-gray-900">
                {flag ? (
                  <span
                    role="img"
                    aria-label={`Country: ${pot.org.countryCode}`}
                    title={pot.org.countryCode ?? undefined}
                    className="mr-1"
                  >
                    {flag}
                  </span>
                ) : null}
                {pot.org.name ?? "Unnamed organization"}
              </p>
              {pot.org.registryId ? (
                <p className="mt-0.5 font-mono text-[10px] text-gray-600">
                  {pot.org.registryId}
                </p>
              ) : null}
              {pot.org.address ? (
                <p className="mt-1 text-xs text-gray-500">{pot.org.address}</p>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-gray-500">
              No organization credential presented.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
