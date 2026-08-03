import { NextResponse } from "next/server";
import { adminBase, adminJson } from "@/app/lib/demo-admin";
import { resolveTrust } from "@/app/lib/resolver";
import { SCHEMA_IDS, VESTA_CAST } from "@/app/lib/vesta-cast";
import { didHost } from "@/app/lib/did";
import { ENDPOINTS } from "@/app/lib/site";

// Status + access decision for a portal-login presentation (chapter-4 demo
// 2). Once the wallet presents an ECS-Badge, the portal decides from the
// badge ISSUER's chain:
//   - issuer is the Vesta anchor DID            -> employee, welcome
//   - issuer resolves TRUSTED and presents a
//     valid Authorized Repairer credential      -> partner, welcome + company
//   - anything else                             -> access denied
// This is the login policy of the story ([spec] portal: two rules cover the
// whole network), executed against the live resolver.

export const dynamic = "force-dynamic";

const PORTAL_ID = "vesta-portal";

type Claim = { name: string; value: string };

function toClaims(value: unknown): Claim[] {
  if (Array.isArray(value)) {
    const named = value.flatMap((c) =>
      c && typeof c === "object" &&
      typeof (c as Claim).name === "string" &&
      typeof (c as Claim).value === "string"
        ? [{ name: (c as Claim).name, value: (c as Claim).value }]
        : [],
    );
    if (named.length) return named;
    return value.flatMap((c) =>
      c && typeof c === "object" && (c as { claims?: unknown }).claims
        ? toClaims((c as { claims?: unknown }).claims)
        : [],
    );
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([name, v]) =>
        typeof v === "string" || typeof v === "number" || typeof v === "boolean"
          ? [{ name, value: String(v) }]
          : [],
    );
  }
  return [];
}

/** Extract the badge issuer DID. Preferred: the credential definition id of
 *  the presented credential (its prefix IS the issuer DID on the did:webvh
 *  AnonCreds registry). Fallback: the demo badge numbers are prefixed by
 *  their issuer (VESTA- / ZENITH- / UMBRA-). */
function extractIssuerDid(record: unknown, claims: Claim[]): string | null {
  const texts: string[] = [];
  const walk = (v: unknown, depth: number) => {
    if (depth > 4 || !v) return;
    if (typeof v === "string") {
      texts.push(v);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((x) => walk(x, depth + 1));
      return;
    }
    if (typeof v === "object") {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (/credentialDefinition|credDef|issuer/i.test(k)) walk(x, depth + 1);
      }
    }
  };
  walk(record, 0);
  for (const t of texts) {
    const m = t.match(/^did:[a-z0-9]+:[^/?#]+/i);
    if (m) return m[0];
  }

  const badgeNumber = claims.find((c) => c.name === "badgeNumber")?.value ?? "";
  if (badgeNumber.startsWith("VESTA-")) return VESTA_CAST.vesta.did;
  if (badgeNumber.startsWith("ZENITH-")) return VESTA_CAST.zenith.did;
  if (badgeNumber.startsWith("UMBRA-")) return VESTA_CAST.umbra.did;
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
      !ref.endsWith(`/js/${SCHEMA_IDS.authorizedRepairer}`)
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

  const canonical =
    Object.values(VESTA_CAST).find((m) => m.host === host)?.did ?? issuerDid;
  const [pot, isAuthorizedRepairer] = await Promise.all([
    resolveTrust(canonical),
    holdsAuthorizedRepairer(host),
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
      const body = await adminJson(
        `${admin}/v1/oid4vc/verifier/sessions/${encodeURIComponent(id)}`,
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

    const body = await adminJson(
      `${admin}/v1/presentations/${encodeURIComponent(id)}`,
    );
    const record = (body ?? {}) as Record<string, unknown>;
    const state = typeof record.state === "string" ? record.state : null;
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
