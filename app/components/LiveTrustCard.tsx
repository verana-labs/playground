"use client";

import { useEffect, useState } from "react";
import TrustCard, { type TrustCardData, type TrustCardCredential } from "./TrustCard";

// The Vesta-journey trust card ("chain" design: DID → Service check →
// Operated-by check → verdict), fed with LIVE resolution data from
// /api/pot/[serviceId] and rendered with every section expanded. This is
// the Proof-of-Trust format of the personal-wallet demo cards.

type PotApiResponse = {
  did?: string | null;
  pot?: {
    trustStatus?: string;
    state?: string;
    evaluatedAt?: string;
    credentials?: {
      ecsType?: string;
      issuedBy?: string;
      claims?: Record<string, unknown>;
    }[];
  } | null;
};

const text = (v: unknown): string | null =>
  typeof v === "string" && v ? v : null;

/** Human-ish issuer label from a did:web(vh) - its host part. */
const didHost = (did?: string | null) =>
  did?.split(":").pop() ?? "unknown issuer";

function toTrustCardData(
  body: PotApiResponse | null,
  accreditations: TrustCardData["accreditations"],
): TrustCardData | null {
  if (!body?.did || !body.pot) return null;
  const state = body.pot.trustStatus ?? body.pot.state;
  // UNVERIFIED (resolver unreachable) is "could not verify", not a verdict.
  if (!state || state === "UNVERIFIED") return null;

  const creds = body.pot.credentials ?? [];
  const svc = creds.find((c) => c.ecsType === "ECS-SERVICE");
  const org = creds.find(
    (c) => c.ecsType === "ECS-ORG" || c.ecsType === "ECS-PERSONA",
  );
  const others: TrustCardCredential[] = creds
    .filter((c) => c !== svc && c !== org)
    .map((c) => ({
      name: text(c.claims?.name) ?? c.ecsType ?? "Credential",
      issuedBy: didHost(c.issuedBy),
    }));

  const trusted = state === "TRUSTED";
  return {
    name: text(svc?.claims?.name) ?? didHost(body.did),
    did: body.did,
    isService: true,
    serviceType: text(svc?.claims?.type) ?? undefined,
    // Green bubbles only when the chain verdict is TRUSTED: the resolver
    // reports even an untrusted service's self-issued credentials as
    // signature-VALID, so per-credential results alone can't be trusted.
    service: svc
      ? {
          name: "ECS-Service",
          issuedBy: `issued by ${didHost(svc.issuedBy)}`,
          verified: trusted,
        }
      : undefined,
    organization: org
      ? {
          name: "ECS-Organization",
          orgName: text(org.claims?.name) ?? "Unnamed organization",
          issuedBy: `issued by ${didHost(org.issuedBy)}`,
          verified: trusted,
        }
      : undefined,
    trusted,
    impostor: !trusted,
    others,
    accreditations,
    resolvedNote: body.pot.evaluatedAt
      ? `Resolved live against the testnet · ${body.pot.evaluatedAt}`
      : "Resolved live against the testnet",
  };
}

export default function LiveTrustCard({
  serviceId,
  accreditations = [],
}: {
  serviceId: string;
  /** The service's known DemoCredential accreditations (from the scenario). */
  accreditations?: TrustCardData["accreditations"];
}) {
  // undefined = loading, null = unavailable
  const [data, setData] = useState<TrustCardData | null | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/pot/${serviceId}`)
      .then((res) => (res.ok ? (res.json() as Promise<PotApiResponse>) : null))
      .then((body) => setData(toTrustCardData(body, accreditations)))
      .catch(() => setData(null));
    // accreditations is static per scenario definition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  if (data === undefined) {
    return (
      <div className="animate-pulse rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Resolving Proof-of-Trust against the network...
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Proof-of-Trust unavailable right now.
      </div>
    );
  }

  return <TrustCard data={data} expanded />;
}
