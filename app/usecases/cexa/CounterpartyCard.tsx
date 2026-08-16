"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, BadgeCheck, TriangleAlert } from "lucide-react";
import LiveTrustCard from "../../components/LiveTrustCard";
import { Chip } from "../../components/ui";
import { CEXA_CAST } from "../../lib/cexa-cast";

// The Travel Rule counterparty check, live: read a member's
// CEXA-VerifiedCounterparty credential straight from its DID document
// (Linked VP) - no session, no fee, no directory. The resolver payload
// does not itemize custom linked VPs, so this card fetches the VP itself
// and renders the credential the check is about; the Proof-of-Trust card
// below carries the member's overall verdict.

type Member = { id: "aurum" | "borealis" | "novara"; label: string; host: string };

const MEMBERS: Member[] = [
  { id: "aurum", label: "Aurum Exchange (demo)", host: CEXA_CAST.aurum.host },
  { id: "borealis", label: "Borealis Markets (demo)", host: CEXA_CAST.borealis.host },
  { id: "novara", label: "Novara Bank (demo)", host: CEXA_CAST.novara.host },
];

type Counterparty = {
  issuerDid: string;
  claims: Record<string, string>;
};

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; data: Counterparty };

const CLAIM_ROWS: { key: string; label: string }[] = [
  { key: "legalName", label: "Legal name" },
  { key: "lei", label: "LEI" },
  { key: "licensingAuthority", label: "Licensing authority" },
  { key: "licenseIdentifier", label: "License identifier" },
  { key: "vaspCategory", label: "Category" },
  { key: "complianceContact", label: "Compliance contact" },
];

async function readCounterparty(host: string): Promise<Counterparty> {
  const didDoc = await fetch(`https://${host}/.well-known/did.json`).then((r) => {
    if (!r.ok) throw new Error(`did.json ${r.status}`);
    return r.json();
  });
  const services: { id?: string; type?: string; serviceEndpoint?: string | string[] }[] =
    didDoc?.service ?? [];
  const vpService = services.find(
    (s) =>
      s.type === "LinkedVerifiablePresentation" &&
      s.id?.endsWith("cexa-verified-counterparty-c-vp"),
  );
  const endpoint = Array.isArray(vpService?.serviceEndpoint)
    ? vpService?.serviceEndpoint[0]
    : vpService?.serviceEndpoint;
  if (!endpoint) throw new Error("no CEXA-VerifiedCounterparty linked VP");
  const vp = await fetch(endpoint).then((r) => {
    if (!r.ok) throw new Error(`linked VP ${r.status}`);
    return r.json();
  });
  const vc = Array.isArray(vp?.verifiableCredential)
    ? vp.verifiableCredential[0]
    : vp?.verifiableCredential;
  const issuer = typeof vc?.issuer === "string" ? vc.issuer : vc?.issuer?.id;
  const subject = vc?.credentialSubject ?? {};
  if (!issuer) throw new Error("credential has no issuer");
  const claims: Record<string, string> = {};
  for (const { key } of CLAIM_ROWS) {
    if (typeof subject[key] === "string" && subject[key]) claims[key] = subject[key];
  }
  return { issuerDid: issuer, claims };
}

export default function CounterpartyCard() {
  const [member, setMember] = useState<Member>(MEMBERS[2]);
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    readCounterparty(member.host)
      .then((data) => alive && setState({ status: "ok", data }))
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [member]);

  const issuedByAssociation =
    state.status === "ok" && state.data.issuerDid === CEXA_CAST.association.did;

  return (
    <div className="mx-auto mt-6 max-w-md space-y-6">
      {/* Member selector: the counterparty being verified */}
      <div className="flex flex-wrap justify-center gap-2">
        {MEMBERS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMember(m)}
            aria-pressed={member.id === m.id}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              member.id === m.id
                ? "border-violet-500 bg-violet-50 text-violet-700 ring-2 ring-violet-100"
                : "border-gray-200 bg-white text-gray-500 hover:border-violet-300 hover:text-violet-700"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* The credential the check is about, read from the DID document */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <ArrowLeftRight className="h-4 w-4 text-violet-600" aria-hidden />
            CEXA-VerifiedCounterparty
          </div>
          <Chip tone="verified">free read · no session</Chip>
        </div>

        {state.status === "loading" ? (
          <div className="mt-4 space-y-2.5">
            {[62, 44, 55].map((w, i) => (
              <div
                key={i}
                className="h-3.5 rounded-full bg-violet-100/80"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : state.status === "error" ? (
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-gray-600">
            <TriangleAlert
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              aria-hidden
            />
            Could not read the linked VP from {member.host} right now - try
            again in a moment.
          </p>
        ) : (
          <>
            <dl className="mt-4 space-y-2">
              {CLAIM_ROWS.filter(({ key }) => state.data.claims[key]).map(
                ({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between gap-4 text-sm"
                  >
                    <dt className="shrink-0 text-gray-500">{label}</dt>
                    <dd className="break-all text-right font-mono text-[13px] font-semibold text-gray-900">
                      {state.data.claims[key]}
                    </dd>
                  </div>
                ),
              )}
            </dl>
            <p className="mt-4 flex items-start gap-2 border-t border-violet-100 pt-3 text-xs leading-relaxed text-gray-500">
              {issuedByAssociation ? (
                <>
                  <BadgeCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                  <span>
                    Issued by the Crypto Exchange Association (demo) - read
                    straight from the member&apos;s DID document, revoked on
                    license loss.
                  </span>
                </>
              ) : (
                <>
                  <TriangleAlert
                    className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                    aria-hidden
                  />
                  <span>
                    Issuer is NOT the Association&apos;s DID - this credential
                    would be refused.
                  </span>
                </>
              )}
            </p>
          </>
        )}
      </div>

      {/* The member's overall verdict (resolver Proof-of-Trust) */}
      <LiveTrustCard serviceId={member.id} />
    </div>
  );
}
