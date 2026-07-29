"use client";

import { ChevronDown } from "lucide-react";

// The reusable Verana trust card, "chain" design: DID → Service check →
// Operated-by check → verdict, then collapsed "Also presents" and
// "Accreditations". The TRUSTED badge renders only when both identity
// checks verify. Used as the diagram click-panel and anywhere a service's
// presented credentials must be shown.

export type TrustCardCredential = {
  name: string;
  issuedBy: string;
  ecosystem?: string;
  note?: string;
  /** Inherited from the parent service's DID (Verifiable Trust spec). */
  inherited?: boolean;
};

export type TrustCardData = {
  name: string;
  did?: string;
  /** true = a service (chain + verdict); false = a person/wallet. */
  isService: boolean;
  serviceType?: string;
  /** The ECS-Service credential, when presented. */
  service?: TrustCardCredential;
  /** The ECS-Organization credential, when presented. */
  organization?: TrustCardCredential & { orgName: string };
  trusted: boolean;
  impostor?: boolean;
  others: TrustCardCredential[];
  /** Credentials held (person/wallet variant). */
  holds?: TrustCardCredential[];
  accreditations: { role: "ISSUER" | "VERIFIER"; schema: string; context: string }[];
  note?: string;
  resolvedNote?: string;
};

function VeranaMark({ size = 15 }: { size?: number }) {
  const id = "vg-trustcard";
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#763EF0" />
          <stop offset="100%" stopColor="#9F7AEA" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="12" fill={`url(#${id})`} />
      <g transform="translate(12.3 13.1) scale(0.7407)">
        <path
          d="M26.9932 51.6972L5.805 11.0977L2.91263 16.2161L0 10.6048L5.98725 0L26.9932 40.2483L47.9993 0L54 10.6217L51.0773 16.2161L48.1849 11.0977L26.9932 51.6972Z"
          fill="white"
        />
        <path d="M13.696 0L26.9935 25.4637L39.9367 0H13.696Z" fill="white" />
      </g>
    </svg>
  );
}

function Tick({ ok }: { ok: boolean }) {
  return (
    <span
      className={`absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
        ok
          ? "border-emerald-600 bg-emerald-50 text-emerald-600"
          : "border-red-300 bg-red-50 text-red-500"
      }`}
      aria-hidden
    >
      {ok ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12 5 5L20 7" />
        </svg>
      ) : (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      )}
    </span>
  );
}

function CredMeta({ cred }: { cred: TrustCardCredential }) {
  return (
    <div className="text-xs text-gray-500">
      {cred.issuedBy}
      {cred.ecosystem ? <> · {cred.ecosystem}</> : null}
    </div>
  );
}

export default function TrustCard({
  data,
  onClose,
}: {
  data: TrustCardData;
  onClose?: () => void;
}) {
  const d = data;
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm sm:p-5">
      {/* DID row */}
      <div className="flex items-center gap-2">
        <span
          className={`h-[7px] w-[7px] shrink-0 rounded-full ${
            d.trusted
              ? "bg-emerald-600 shadow-[0_0_0_3px_#ecfdf5]"
              : d.impostor
                ? "bg-red-500 shadow-[0_0_0_3px_#fef2f2]"
                : "bg-gray-300 shadow-[0_0_0_3px_#f9fafb]"
          }`}
          aria-hidden
        />
        {d.did ? (
          <code className="min-w-0 flex-1 truncate font-mono text-[10.5px] text-gray-500" title={d.did}>
            {d.did}
          </code>
        ) : (
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900">
            {d.name}
          </span>
        )}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full px-2 py-0.5 text-xs text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close details"
          >
            ✕
          </button>
        ) : null}
      </div>

      {d.isService ? (
        <>
          {/* Verification chain */}
          <ol className="relative mt-4 list-none p-0">
            <span
              className={`absolute bottom-6 left-[13px] top-2 w-[2px] ${
                d.trusted
                  ? "bg-gradient-to-b from-emerald-200 to-emerald-400"
                  : "bg-gray-200"
              }`}
              aria-hidden
            />
            <li className="relative pb-4 pl-10">
              <Tick ok={!!d.service} />
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Service · ECS-Service
              </div>
              {d.service ? (
                <>
                  <div className="text-sm font-bold text-gray-900">{d.name}</div>
                  <div className="text-xs text-gray-500">
                    {d.serviceType ? <>{d.serviceType} · </> : null}
                    {d.service.issuedBy}
                    {d.service.ecosystem ? <> · {d.service.ecosystem}</> : null}
                  </div>
                </>
              ) : (
                <div className="text-xs text-red-500">
                  No ECS-Service credential presented.
                </div>
              )}
            </li>
            <li className="relative pb-4 pl-10">
              <Tick ok={!!d.organization} />
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Operated by · ECS-Organization
                {d.organization?.inherited ? (
                  <span className="rounded bg-violet-50 px-1.5 py-px text-[9px] font-bold normal-case tracking-normal text-violet-700">
                    inherited from parent
                  </span>
                ) : null}
              </div>
              {d.organization ? (
                <>
                  <div className="text-sm font-bold text-gray-900">
                    {d.organization.orgName}
                  </div>
                  <CredMeta cred={d.organization} />
                  {d.organization.note ? (
                    <div className="mt-0.5 text-[11px] text-gray-400">
                      {d.organization.note}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-xs text-red-500">
                  No ECS-Organization credential presented.
                </div>
              )}
            </li>
          </ol>

          {/* Verdict */}
          <div className="pl-10">
            {d.trusted ? (
              <>
                <span className="inline-flex items-center gap-2 rounded-xl border-2 border-emerald-600 bg-white px-4 py-1.5 text-sm font-extrabold tracking-wide text-emerald-600 shadow-[0_4px_14px_rgb(5,150,105,0.25)]">
                  <VeranaMark /> TRUSTED
                </span>
                {d.resolvedNote ? (
                  <div className="mt-1.5 text-[11px] text-gray-400">
                    {d.resolvedNote}
                  </div>
                ) : null}
              </>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-xl border-2 border-red-300 bg-white px-4 py-1.5 text-sm font-extrabold tracking-wide text-red-500">
                UNVERIFIABLE
              </span>
            )}
          </div>
        </>
      ) : null}

      {/* Person / wallet: held credentials */}
      {!d.isService && d.holds?.length ? (
        <ul className="mt-3 space-y-2">
          {d.holds.map((c) => (
            <li key={c.name} className="rounded-xl border border-emerald-200 bg-white p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {c.name}
                </span>
                <span className="ml-auto text-[11px] font-semibold text-emerald-600">
                  ✓ verified
                </span>
              </div>
              <div className="mt-1.5 text-[11px] text-gray-500">
                Issued by {c.issuedBy}
                {c.ecosystem ? <> · {c.ecosystem}</> : null}
              </div>
              {c.note ? (
                <div className="mt-0.5 text-[11px] text-gray-400">{c.note}</div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {/* Also presents */}
      {d.others.length > 0 ? (
        <details className="group/tc mt-3 border-t border-gray-200 pt-2.5">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-amber-700 [&::-webkit-details-marker]:hidden">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
            Also presents: {d.others.map((o) => o.name).join(" · ")}
            <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-open/tc:rotate-180" aria-hidden />
          </summary>
          <ul className="mt-2 space-y-1.5 pl-6">
            {d.others.map((o) => (
              <li key={o.name} className="text-xs text-gray-600">
                <b className="text-gray-900">{o.name}</b>
                {o.inherited ? (
                  <span className="ml-1.5 rounded bg-violet-50 px-1.5 py-px text-[9px] font-bold text-violet-700">
                    inherited from parent
                  </span>
                ) : null}{" "}
                · issued by {o.issuedBy}
                {o.ecosystem ? <> · {o.ecosystem}</> : null}{" "}
                <span className="font-semibold text-emerald-600">✓ verified</span>
                {o.note ? (
                  <div className="text-[11px] text-gray-400">{o.note}</div>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {/* Accreditations - collapsed by default */}
      {d.accreditations.length > 0 ? (
        <details className="group/ac mt-2.5 border-t border-gray-200 pt-2.5">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 [&::-webkit-details-marker]:hidden">
            Accreditations
            <span className="rounded-full bg-violet-50 px-2 py-px text-[10px] font-bold text-violet-700">
              {d.accreditations.length}
            </span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform group-open/ac:rotate-180" aria-hidden />
          </summary>
          <ul className="mt-2 space-y-1.5">
            {d.accreditations.map((a) => (
              <li key={a.role + a.schema} className="flex flex-wrap items-baseline gap-2 text-xs">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase tracking-wider ${
                    a.role === "ISSUER"
                      ? "bg-violet-50 text-violet-700"
                      : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {a.role}
                </span>
                <span className="font-bold text-gray-900">{a.schema}</span>
                <span className="text-[11px] text-gray-500">{a.context}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {d.note ? (
        <p
          className={`mt-2.5 text-xs leading-relaxed ${
            d.impostor ? "text-red-600" : "text-gray-500"
          }`}
        >
          {d.note}
        </p>
      ) : null}
    </div>
  );
}
