"use client";
import { withBase } from "../lib/base-path";

import {
  Building2,
  CircleCheck,
  Copy,
  Layers,
  RefreshCw,
  Server,
  ShieldCheck,
  ShieldQuestion,
  ShieldX,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { PotCredential, PotResolution } from "@/app/lib/resolver";
import { NETWORK_NAME, NETWORK_PRODUCTION } from "@/app/lib/site";

const flag = (code?: unknown) =>
  typeof code === "string" && /^[A-Za-z]{2}$/.test(code)
    ? String.fromCodePoint(...[...code.toUpperCase()].map((c) => 127397 + c.charCodeAt(0)))
    : "";

const middle = (did: string) =>
  did.length > 40 ? `${did.slice(0, 22)}…${did.slice(-12)}` : did;

const text = (v: unknown) => (typeof v === "string" && v.length > 0 ? v : undefined);

const credentialName = (c: PotCredential) =>
  text(c.claims.name) ?? text(c.ecsType) ?? "Credential";

const chainRow = (entry: unknown) => {
  if (typeof entry === "string") return entry;
  if (typeof entry === "object" && entry !== null) {
    const e = entry as Record<string, unknown>;
    const parts = ["type", "id", "did", "grantee", "grantor", "schemaId"]
      .map((k) => e[k])
      .filter((v): v is string => typeof v === "string");
    if (parts.length > 0) return parts.join(" · ");
  }
  return JSON.stringify(entry);
};

function BlockLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600">
      {icon}
      {children}
    </p>
  );
}

function StatusBand({
  pot,
  did,
  label,
  onRetry,
}: {
  pot: PotResolution;
  did: string | null;
  label: string;
  onRetry?: () => void;
}) {
  const copyDid = () => {
    if (!did) return;
    try {
      void navigator.clipboard.writeText(did).catch(() => undefined);
    } catch {
      return;
    }
  };
  const pill =
    pot.state === "TRUSTED" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        <ShieldCheck className="h-3 w-3" />
        Trusted
      </span>
    ) : pot.state === "UNTRUSTED" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
        <ShieldX className="h-3 w-3" />
        Untrusted
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
        <ShieldQuestion className="h-3 w-3" />
        Could not verify
      </span>
    );
  return (
    <div className="border-b border-gray-100 px-4 py-2">
      <div className="flex flex-wrap items-center gap-2">
        {pill}
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
          {label}
        </span>
        {NETWORK_PRODUCTION ? null : (
          <span
            className="inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700"
            title="Resolved against the Verana testnet"
          >
            {NETWORK_NAME}
          </span>
        )}
        {onRetry || pot.state === "UNVERIFIED" ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-violet-300 hover:text-violet-700"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        ) : null}
      </div>
      {did ? (
        <div className="mt-2 flex min-w-0 items-center gap-1.5">
          <span className="truncate font-mono text-[10px] text-gray-600" title={did}>
            {middle(did)}
          </span>
          <button
            type="button"
            onClick={copyDid}
            aria-label="Copy DID"
            className="shrink-0 text-gray-500 transition-colors hover:text-violet-600"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      ) : null}
      {pot.evaluatedAtBlock !== undefined || pot.evaluatedAt ? (
        <p className="mt-1 text-[11px] text-gray-600">
          Evaluated
          {pot.evaluatedAtBlock !== undefined ? ` at block ${pot.evaluatedAtBlock}` : ""}
          {pot.evaluatedAt ? (
            <>
              {" · "}
              <time dateTime={pot.evaluatedAt} suppressHydrationWarning>
                {new Date(pot.evaluatedAt).toLocaleString()}
              </time>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

export function PotCard({
  pot,
  did,
  label,
  onRetry,
}: {
  pot: PotResolution;
  did: string | null;
  label: string;
  onRetry?: () => void;
}) {
  const [chainOpen, setChainOpen] = useState(false);
  const serviceCred = pot.credentials.find((c) => c.ecsType === "ECS-SERVICE");
  const orgCred = pot.credentials.find(
    (c) => c.ecsType === "ECS-ORG" || c.ecsType === "ECS-PERSONA",
  );
  const others = pot.credentials.filter((c) => c !== serviceCred && c !== orgCred);
  const failed = pot.failedCredentials ?? [];
  const flagEmoji = orgCred ? flag(orgCred.claims.countryCode) : "";

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${
        pot.state === "TRUSTED" ? "pot-verified" : ""
      }`}
    >
      <StatusBand pot={pot} did={did} label={label} onRetry={onRetry} />
      {pot.state === "UNVERIFIED" ? (
        <p className="px-4 py-3 text-xs leading-relaxed text-gray-500">
          The resolver could not be reached or this DID is not yet resolvable, so
          nothing is known about this service. Retry to query the network again.
        </p>
      ) : (
        <>
          <div className="grid gap-5 px-4 py-3 sm:grid-cols-2">
            <div className="min-w-0">
              <BlockLabel icon={<Server className="h-3 w-3" />}>
                Service
              </BlockLabel>
              {serviceCred ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">
                    {text(serviceCred.claims.name) ?? "Unnamed service"}
                  </p>
                  {text(serviceCred.claims.type) ? (
                    <p className="mt-0.5 font-mono text-[10px] text-gray-600">
                      {text(serviceCred.claims.type)}
                    </p>
                  ) : null}
                  {text(serviceCred.claims.description) ? (
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {text(serviceCred.claims.description)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-gray-500">No ECS-Service credential presented.</p>
              )}
            </div>
            <div className="min-w-0">
              <BlockLabel icon={<Building2 className="h-3 w-3" />}>
                Operated by
              </BlockLabel>
              {orgCred ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">
                    {flagEmoji ? (
                      <span
                        role="img"
                        aria-label={`Country: ${String(orgCred.claims.countryCode)}`}
                        className="mr-1"
                      >
                        {flagEmoji}
                      </span>
                    ) : null}
                    {text(orgCred.claims.name) ?? "Unnamed organization"}
                  </p>
                  {text(orgCred.claims.registryId) ? (
                    <p className="mt-0.5 font-mono text-[10px] text-gray-600">
                      {text(orgCred.claims.registryId)}
                    </p>
                  ) : null}
                  {text(orgCred.claims.address) ? (
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {text(orgCred.claims.address)}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-gray-500">
                  No ECS-Organization or ECS-Persona credential presented.
                </p>
              )}
            </div>
          </div>
          {others.length > 0 ? (
            <div className="border-t border-gray-100 px-4 py-3">
              <BlockLabel icon={<Layers className="h-3 w-3" />}>
                Other credentials
              </BlockLabel>
              <ul className="space-y-1.5">
                {others.map((c, i) => {
                  const issuedBy = text(c.issuedBy);
                  return (
                    <li
                      key={i}
                      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5"
                    >
                      <span className="text-xs font-medium text-gray-900">
                        {credentialName(c)}
                      </span>
                      {issuedBy ? (
                        <span
                          className="min-w-0 truncate font-mono text-[10px] text-gray-600"
                          title={issuedBy}
                        >
                          {middle(issuedBy)}
                        </span>
                      ) : null}
                      {c.result === "VALID" ? (
                        <CircleCheck
                          role="img"
                          aria-label="Valid"
                          className="ml-auto h-3 w-3 shrink-0 text-emerald-500"
                        />
                      ) : (
                        <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-amber-600">
                          <TriangleAlert className="h-3.5 w-3.5" />
                          {text(c.result) ?? "unknown"}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
          {pot.state === "UNTRUSTED" && failed.length > 0 ? (
            <div className="border-t border-red-100 bg-red-50/60 px-4 py-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-600">
                <TriangleAlert className="h-3 w-3" />
                Failed credentials
              </p>
              <ul className="space-y-1">
                {failed.map((f, i) => (
                  <li key={i} className="text-xs text-red-700">
                    <span className="font-mono">{text(f.id) ?? "credential"}</span> - {" "}
                    {text(f.error) ?? text(f.errorCode) ?? "verification failed"}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {pot.credentials.length > 0 || failed.length > 0 ? (
            <details
              className="border-t border-gray-100"
              onToggle={(e) => setChainOpen(e.currentTarget.open)}
            >
              <summary className="cursor-pointer select-none px-5 py-3 text-xs font-medium text-gray-500 transition-colors hover:text-violet-700">
                Trust chain &amp; failures
              </summary>
              {chainOpen ? (
                <div className="space-y-3 px-5 pb-4">
                  {pot.credentials.map((c, i) => (
                    <div key={i}>
                      <p className="text-xs font-semibold text-gray-700">
                        {credentialName(c)}
                      </p>
                      {Array.isArray(c.permissionChain) && c.permissionChain.length > 0 ? (
                        <ul className="mt-0.5 space-y-0.5">
                          {c.permissionChain.map((entry, j) => (
                            <li
                              key={j}
                              className="break-all font-mono text-[11px] text-gray-500"
                            >
                              {chainRow(entry)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-0.5 text-[11px] text-gray-600">
                          Chain data not returned by the resolver.
                        </p>
                      )}
                    </div>
                  ))}
                  {failed.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-red-600">
                        Failed credentials
                      </p>
                      <ul className="mt-0.5 space-y-0.5">
                        {failed.map((f, i) => (
                          <li key={i} className="text-[11px] text-red-600">
                            <span className="font-mono">{text(f.id) ?? "credential"}</span> - {" "}
                            {text(f.error) ?? text(f.errorCode) ?? "verification failed"}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </details>
          ) : null}
        </>
      )}
    </div>
  );
}

type PotApiResponse = {
  service?: { label?: string } | null;
  did?: string | null;
  pot?: PotResolution | null;
};

const UNRESOLVED: PotResolution = {
  state: "UNVERIFIED",
  did: "",
  credentials: [],
  failedCredentials: [],
};

export function ProofOfTrust({ serviceId, title }: { serviceId: string; title?: string }) {
  const [data, setData] = useState<PotApiResponse | null | undefined>(undefined);
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setData(undefined);
    fetch(withBase(`/api/pot/${serviceId}`))
      .then((res) => (res.ok ? (res.json() as Promise<PotApiResponse>) : null))
      .then((body) => {
        if (alive) setData(body);
      })
      .catch(() => {
        if (alive) setData(null);
      });
    return () => {
      alive = false;
    };
  }, [serviceId, attempt]);

  if (data === undefined) {
    return (
      <div className="animate-pulse rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-500">
        Resolving Proof-of-Trust against the network…
      </div>
    );
  }
  return (
    <PotCard
      pot={data?.pot ?? UNRESOLVED}
      did={data?.did ?? null}
      label={data?.service?.label ?? title ?? serviceId}
      onRetry={retry}
    />
  );
}
