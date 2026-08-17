"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, BadgeCheck, TriangleAlert, X } from "lucide-react";
import LiveTrustCard from "../../components/LiveTrustCard";
import { Chip } from "../../components/ui";
import { ENDPOINTS } from "../../lib/site";
import { CEXA_CAST, CEXA_KYC_SCHEMA_ID } from "../../lib/cexa-cast";

// The Travel Rule counterparty check, live: read an exchange's
// CEXA-VerifiedCounterparty credential straight from its DID document
// (Linked VP) and its VERIFIER accreditation straight from the indexer -
// no session, no fee, no directory. Members show both in green; DarkPool,
// a real and verifiable exchange outside the Association, shows both in
// red - which is the lesson. The Proof-of-Trust card below carries the
// overall verdict (DarkPool's is green: trust is not membership).

type Member = {
  id: "aurum" | "borealis" | "novara" | "darkpool";
  label: string;
  host: string;
  did: string;
};

const MEMBERS: Member[] = [
  { id: "aurum", label: "Aurum Exchange (demo)", host: CEXA_CAST.aurum.host, did: CEXA_CAST.aurum.did },
  { id: "borealis", label: "Borealis Markets (demo)", host: CEXA_CAST.borealis.host, did: CEXA_CAST.borealis.did },
  { id: "novara", label: "Novara Bank (demo)", host: CEXA_CAST.novara.host, did: CEXA_CAST.novara.did },
  { id: "darkpool", label: "DarkPool Exchange (demo)", host: CEXA_CAST.darkpool.host, did: CEXA_CAST.darkpool.did },
];

type Membership =
  | { kind: "member"; issuerDid: string; claims: Record<string, string> }
  | { kind: "outsider" };

type FetchState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; membership: Membership; accreditedVerifier: boolean | null };

const CLAIM_ROWS: { key: string; label: string }[] = [
  { key: "legalName", label: "Legal name" },
  { key: "lei", label: "LEI" },
  { key: "licensingAuthority", label: "Licensing authority" },
  { key: "licenseIdentifier", label: "License identifier" },
  { key: "vaspCategory", label: "Category" },
  { key: "complianceContact", label: "Compliance contact" },
];

async function readMembership(host: string): Promise<Membership> {
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
  // The DID document resolved fine and simply carries no counterparty
  // credential: the definitive not-a-member answer, not an error.
  if (!endpoint) return { kind: "outsider" };
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
  return { kind: "member", issuerDid: issuer, claims };
}

/** Live check against the indexer: does this DID hold an ACTIVE VERIFIER
 *  permission on the CEXA-Kyc schema? Returns null when the indexer is
 *  unreachable (shown as "could not check", never as a verdict). */
async function readVerifierAccreditation(did: string): Promise<boolean | null> {
  try {
    const body = await fetch(
      `${ENDPOINTS.indexer}/verana/perm/v1/list?schema_id=${CEXA_KYC_SCHEMA_ID}`,
    ).then((r) => {
      if (!r.ok) throw new Error(`${r.status}`);
      return r.json();
    });
    const perms: { type?: string; did?: string; perm_state?: string }[] =
      body?.permissions ?? [];
    return perms.some(
      (p) => p.type === "VERIFIER" && p.did === did && p.perm_state === "ACTIVE",
    );
  } catch {
    return null;
  }
}

function RedLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm font-medium leading-relaxed text-red-700">
      <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export default function CounterpartyCard() {
  const [member, setMember] = useState<Member>(MEMBERS[2]);
  const [state, setState] = useState<FetchState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    Promise.all([readMembership(member.host), readVerifierAccreditation(member.did)])
      .then(
        ([membership, accreditedVerifier]) =>
          alive && setState({ status: "ok", membership, accreditedVerifier }),
      )
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, [member]);

  const issuedByAssociation =
    state.status === "ok" &&
    state.membership.kind === "member" &&
    state.membership.issuerDid === CEXA_CAST.association.did;

  return (
    <div className="mx-auto mt-6 max-w-md space-y-6">
      {/* Counterparty selector: three members and the outsider */}
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
      <div
        className={`rounded-2xl border p-5 ${
          state.status === "ok" && state.membership.kind === "outsider"
            ? "border-red-200 bg-red-50/40"
            : "border-violet-200 bg-violet-50/40"
        }`}
      >
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
            Could not read {member.host} right now - try again in a moment.
          </p>
        ) : state.membership.kind === "outsider" ? (
          <div className="mt-4 space-y-2.5">
            <RedLine>
              No CEXA-VerifiedCounterparty on this DID - not a member of the
              Association. A Travel Rule desk stops here.
            </RedLine>
            <RedLine>
              Not accredited as a VERIFIER of CEXA-Kyc - its presentation
              requests must be refused by every wallet.
            </RedLine>
            <p className="border-t border-red-100 pt-3 text-xs leading-relaxed text-gray-500">
              And still: the Proof-of-Trust below is green. DarkPool is a real,
              verifiable company - trust is not membership, and membership is
              not authorization.
            </p>
          </div>
        ) : (
          <>
            <dl className="mt-4 space-y-2">
              {CLAIM_ROWS.filter(
                ({ key }) =>
                  state.membership.kind === "member" &&
                  state.membership.claims[key],
              ).map(({ key, label }) => (
                <div
                  key={key}
                  className="flex items-baseline justify-between gap-4 text-sm"
                >
                  <dt className="shrink-0 text-gray-500">{label}</dt>
                  <dd className="break-all text-right font-mono text-[13px] font-semibold text-gray-900">
                    {state.membership.kind === "member"
                      ? state.membership.claims[key]
                      : null}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 space-y-2 border-t border-violet-100 pt-3">
              <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                {issuedByAssociation ? (
                  <>
                    <BadgeCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                    <span>
                      Issued by the Crypto Exchange Association (demo) - read
                      straight from the DID document, revoked on license loss.
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
              <p className="flex items-start gap-2 text-xs leading-relaxed text-gray-500">
                {state.accreditedVerifier === true ? (
                  <>
                    <BadgeCheck
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                    <span>
                      Accredited VERIFIER of CEXA-Kyc - live from the public
                      participant registry.
                    </span>
                  </>
                ) : state.accreditedVerifier === false ? (
                  <>
                    <X
                      className="mt-0.5 h-4 w-4 shrink-0 text-red-500"
                      aria-hidden
                    />
                    <span className="font-medium text-red-700">
                      Not accredited as a VERIFIER of CEXA-Kyc.
                    </span>
                  </>
                ) : (
                  <>
                    <TriangleAlert
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
                      aria-hidden
                    />
                    <span>Could not check the accreditation right now.</span>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>

      {/* The overall verdict (resolver Proof-of-Trust) - green for DarkPool
          too, which is exactly the point */}
      <LiveTrustCard serviceId={member.id} />
    </div>
  );
}
