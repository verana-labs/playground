import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { resolveTrust } from "@/app/lib/resolver";
import { SCHEMA_IDS, VESTA_CAST, type VestaCastMember } from "@/app/lib/vesta-cast";
import { didHost } from "@/app/lib/did";
import { issuerDidFromRecord, toClaims, type Claim } from "@/app/lib/presentation";
import { ENDPOINTS } from "@/app/lib/site";
import { PROTOCOL } from "@/app/lib/network";
import { serviceDid } from "@/app/lib/demo-services";
import { holdsAuthorizedRepairerV4 } from "../authorized-repairer";

// Status + access decision for a portal-login presentation (chapter-4 demo
// 2). Once the wallet presents an ECS-Badge, the portal decides from the
// badge ISSUER's chain:
//   - issuer is the Vesta anchor DID            -> employee, welcome
//   - issuer resolves TRUSTED and presents a
//     valid Authorized Repairer credential      -> partner, welcome + company
//   - anything else                             -> access denied
// This is the login policy of the story ([spec] portal: two rules cover the
// whole network), executed against the live resolver.
//
// V4 (vs-agent v2): the agent reads the presentations at /v2/openid4vc and
// /v2/didcomm, and the indexer gives the trust resolution and the
// presentations of the issuer (holdsAuthorizedRepairerV4).

export const dynamic = "force-dynamic";

const PORTAL_ID = "vesta-portal";

/** The DID of a cast member: the known DID, else (V4) the did:web alias of
 *  its host. decide() finds the canonical did:webvh from the host. */
const memberDid = (m: VestaCastMember) => m.did ?? `did:web:${m.host}`;

/** Extract the badge issuer DID. Preferred: the credential definition id of
 *  the presented credential (its prefix IS the issuer DID on the did:webvh
 *  AnonCreds registry). Fallback: the demo badge numbers are prefixed by
 *  their issuer (VESTA- / ZENITH- / UMBRA-). The V4 DIDComm record has no
 *  credential definition id, so it always uses the fallback. */
function extractIssuerDid(record: unknown, claims: Claim[]): string | null {
  const fromRecord = issuerDidFromRecord(record);
  if (fromRecord) return fromRecord;

  const badgeNumber = claims.find((c) => c.name === "badgeNumber")?.value ?? "";
  if (badgeNumber.startsWith("VESTA-")) return memberDid(VESTA_CAST.vesta);
  if (badgeNumber.startsWith("ZENITH-")) return memberDid(VESTA_CAST.zenith);
  if (badgeNumber.startsWith("UMBRA-")) return memberDid(VESTA_CAST.umbra);
  return null;
}

const RESOLVER = process.env.RESOLVER_URL ?? ENDPOINTS.resolver;

const fetchJson = async (url: string): Promise<unknown> => {
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000), cache: "no-store" });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
};

const first = (value: unknown): unknown =>
  Array.isArray(value) ? value[0] : value;

/** True when the org behind `host` presents an Authorized Repairer
 *  credential that verifies down the chain: the linked VP on its DID
 *  document, subject = itself, credentialSchema anchored to the Authorized
 *  Repairer VPR schema, and the credential's issuer holding an ACTIVE
 *  ISSUER permission for it on-chain (resolver issuer-authorization). The
 *  network resolver does not surface non-ECS credentials in its
 *  resolution result, so the membership rule walks the chain itself. */
async function holdsAuthorizedRepairer(host: string): Promise<boolean> {
  // The schema id is known on testnet (V3) only.
  const arSchemaId = SCHEMA_IDS.authorizedRepairer;
  if (arSchemaId === undefined) return false;
  try {
    const doc = (await fetchJson(`https://${host}/.well-known/did.json`)) as {
      service?: Array<{ id?: string; type?: string; serviceEndpoint?: unknown }>;
    };
    const entry = doc.service?.find(
      (svc) =>
        svc.type === "LinkedVerifiablePresentation" &&
        typeof svc.id === "string" &&
        svc.id.includes("authorized-repairer"),
    );
    const vpUrl = first(entry?.serviceEndpoint);
    if (typeof vpUrl !== "string") return false;

    const vp = (await fetchJson(vpUrl)) as { verifiableCredential?: unknown };
    const vc = first(vp.verifiableCredential) as
      | {
          issuer?: unknown;
          credentialSubject?: unknown;
          credentialSchema?: unknown;
        }
      | undefined;
    if (!vc) return false;

    const subject = first(vc.credentialSubject) as { id?: unknown } | undefined;
    if (typeof subject?.id !== "string" || didHost(subject.id) !== host)
      return false;

    const credentialSchema = first(vc.credentialSchema) as
      | { id?: unknown }
      | undefined;
    const jscId = credentialSchema?.id;
    if (typeof jscId !== "string") return false;

    const jsc = (await fetchJson(jscId)) as { credentialSubject?: unknown };
    const jscSubject = first(jsc.credentialSubject) as
      | { jsonSchema?: { $ref?: unknown } }
      | undefined;
    const ref = jscSubject?.jsonSchema?.$ref;
    if (
      typeof ref !== "string" ||
      !ref.endsWith(`/js/${arSchemaId}`)
    )
      return false;

    const arIssuer =
      typeof vc.issuer === "string" ? vc.issuer : (first(vc.issuer) as { id?: string } | undefined)?.id;
    if (typeof arIssuer !== "string") return false;

    const auth = (await fetchJson(
      `${RESOLVER}/v1/trust/issuer-authorization?did=${encodeURIComponent(arIssuer)}&vtjscId=${encodeURIComponent(jscId)}`,
    )) as { authorized?: unknown };
    return auth.authorized === true;
  } catch {
    return false;
  }
}

async function decide(issuerDid: string | null): Promise<{
  decision: "employee" | "partner" | "denied";
  company?: string;
}> {
  if (!issuerDid) return { decision: "denied" };
  // Robust across did:web / did:webvh alias forms: match cast members by
  // host, and resolve the canonical (webvh) DID.
  const host = didHost(issuerDid);
  if (
    issuerDid === VESTA_CAST.vesta.did ||
    (host !== null && host === VESTA_CAST.vesta.host)
  )
    return { decision: "employee" };
  if (!host) return { decision: "denied" };

  const known: string | undefined = Object.values(VESTA_CAST).find(
    (m: VestaCastMember) => m.host === host,
  )?.did;
  // V4: the indexer knows the did:webvh only, so find it from the host when
  // the issuer DID is another form (the did:web alias).
  const canonical =
    known ??
    (PROTOCOL === "v4" && !issuerDid.startsWith("did:webvh:")
      ? ((await serviceDid(host)) ?? issuerDid)
      : issuerDid);
  const [pot, isAuthorizedRepairer] = await Promise.all([
    resolveTrust(canonical),
    PROTOCOL === "v4"
      ? holdsAuthorizedRepairerV4(canonical, VESTA_CAST.repairNetwork.host)
      : holdsAuthorizedRepairer(host),
  ]);
  if (pot.state === "TRUSTED" && isAuthorizedRepairer) {
    const org = pot.credentials.find((c) => c.ecsType === "ECS-ORG");
    const company =
      typeof org?.claims.name === "string" ? org.claims.name : undefined;
    return { decision: "partner", company };
  }
  return { decision: "denied" };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rail = new URL(req.url).searchParams.get("rail") ?? "didcomm";
  const admin = adminBase(PORTAL_ID);

  try {
    if (rail === "oid4vc") {
      // Completed-session shape (plugin-openid4vc VerifierService.getResult):
      // { state: "ResponseVerified", cryptographicVerified, accepted,
      //   trust: { verdict, evidence: { did, trustStatus, authorized, … } },
      //   credential: { vct, disclosedClaims } }
      // `accepted` is the plugin's own Q2 verdict on the badge (issuer
      // TRUSTED_AUTHORIZED for the badge schema); the issuer DID comes from
      // the trust evidence.
      // V4 (/v2/openid4vc/presentations/{id}) has the same fields.
      const body = await adminJson(
        PROTOCOL === "v4"
          ? `${admin}/v2/openid4vc/presentations/${encodeURIComponent(id)}`
          : `${admin}/v1/oid4vc/verifier/sessions/${encodeURIComponent(id)}`,
      );
      const record = (body ?? {}) as {
        state?: unknown;
        cryptographicVerified?: unknown;
        accepted?: unknown;
        trust?: { verdict?: unknown; evidence?: { did?: unknown; note?: unknown } };
        credential?: { disclosedClaims?: unknown };
      };
      const state = typeof record.state === "string" ? record.state : null;
      const done = state === "ResponseVerified" || record.accepted === true;
      if (!done) return NextResponse.json({ done: false, state });
      const claims = toClaims(record.credential?.disclosedClaims);
      const evidenceDid = record.trust?.evidence?.did;
      const issuerDid =
        typeof evidenceDid === "string" && evidenceDid
          ? evidenceDid
          : extractIssuerDid(record, claims);
      // A badge the plugin did not accept (unpinned certificate, unbound
      // key, untrusted or unauthorized issuer) never grants access,
      // whatever DID it claims.
      const decision =
        record.accepted === true ? await decide(issuerDid) : { decision: "denied" as const };
      return NextResponse.json({
        done: true,
        verified: record.cryptographicVerified === true,
        claims,
        issuerDid,
        trustVerdict:
          typeof record.trust?.verdict === "string" ? record.trust.verdict : null,
        trustNote:
          typeof record.trust?.evidence?.note === "string"
            ? record.trust.evidence.note
            : null,
        ...decision,
      });
    }

    // V4: /v2/didcomm/presentations/{id} gives { state, claims, verified }.
    const body = await adminJson(
      PROTOCOL === "v4"
        ? `${admin}/v2/didcomm/presentations/${encodeURIComponent(id)}`
        : `${admin}/v1/presentations/${encodeURIComponent(id)}`,
    );
    const record = (body ?? {}) as Record<string, unknown>;
    const state = typeof record.state === "string" ? record.state : null;
    // V4: the agent stops the exchange (abandoned) when the presented badge
    // fails its trust decision. That badge never grants access.
    if (PROTOCOL === "v4" && (state === "abandoned" || state === "declined")) {
      const claims = toClaims(record.claims);
      return NextResponse.json({
        done: true,
        verified: false,
        claims,
        issuerDid: extractIssuerDid(record, claims),
        decision: "denied",
      });
    }
    if (state !== "done") return NextResponse.json({ done: false, state });
    const claims = toClaims(record.claims);
    const issuerDid = extractIssuerDid(record, claims);
    const decision = await decide(issuerDid);
    return NextResponse.json({
      done: true,
      verified: record.verified === true,
      claims,
      issuerDid,
      ...decision,
    });
  } catch {
    return NextResponse.json({ done: false, state: null }, { status: 200 });
  }
}
