import { afterEach, describe, expect, it, vi } from "vitest";
import { CEXA_CAST } from "../../lib/cexa-cast";
import { ENDPOINTS } from "../../lib/site";
import {
  chainDid,
  documentDids,
  linkedVpEndpoint,
  membershipFromPresentation,
  vtjscSchemaIds,
} from "./counterparty";

afterEach(() => vi.unstubAllGlobals());

/** A new copy of the module: the V4 lookup of the Association is cached. */
async function readCounterparty(...args: Parameters<typeof import("./counterparty").readCounterparty>) {
  vi.resetModules();
  const mod = await import("./counterparty");
  return mod.readCounterparty(...args);
}

const vp = (id: string) => ({ id, type: "LinkedVerifiablePresentation", serviceEndpoint: `https://x/${id}.json` });

const ASSOCIATION = CEXA_CAST.association.host;
const ASSOCIATION_WEBVH = `did:webvh:QmAssoc:${ASSOCIATION}`;
const MEMBER = "aurum.example";
const MEMBER_WEBVH = "did:webvh:QmAurum:aurum.example";

/** Serve a map of URL -> JSON body; every other URL answers 404. */
function serve(routes: Record<string, unknown>) {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve(
      url in routes
        ? new Response(JSON.stringify(routes[url]), { status: 200 })
        : new Response("not found", { status: 404 }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

/** The DID document of the Association and the indexer titles of its schemas (V4). */
const registryRoutes = {
  [`https://${ASSOCIATION}/.well-known/did.json`]: {
    id: `did:web:${ASSOCIATION}`,
    alsoKnownAs: [ASSOCIATION_WEBVH],
    service: [vp(`did:web:${ASSOCIATION}#vpr-schemas-41-vtjsc-vp`), vp(`did:web:${ASSOCIATION}#vpr-schemas-42-vtjsc-vp`)],
  },
  [`${ENDPOINTS.indexer}/v4/credential-schema/get/41`]: {
    schema: { json_schema: JSON.stringify({ title: "CEXAKycCredential" }) },
  },
  [`${ENDPOINTS.indexer}/v4/credential-schema/get/42`]: {
    schema: { json_schema: JSON.stringify({ title: "CEXAVerifiedCounterpartyCredential" }) },
  },
};

const verifierUrl = (did: string) =>
  `${ENDPOINTS.indexer}/v4/participant/list?schema_id=41&role=VERIFIER&did=${encodeURIComponent(did)}&participant_state=ACTIVE`;

describe("DID document helpers", () => {
  const doc = {
    id: "did:web:a",
    alsoKnownAs: [42, "did:webvh:Qm:a"],
    service: [
      vp("did:web:a#vpr-schemas-7-vtjsc-vp"),
      vp("did:web:a#vpr-schemas-org-vtc-vp"),
      { id: "did:web:a#vpr-schemas-8-vtjsc-vp", type: "DIDCommMessaging", serviceEndpoint: "x" },
    ],
  };

  it("lists the schema ids of the linked VTJSCs only", () => {
    expect(vtjscSchemaIds(doc)).toEqual(["7"]);
  });

  it("finds a linked VP by the end of its id", () => {
    expect(linkedVpEndpoint(doc, "#vpr-schemas-org-vtc-vp")).toBe(
      "https://x/did:web:a#vpr-schemas-org-vtc-vp.json",
    );
    expect(linkedVpEndpoint(doc, "#vpr-schemas-9-vtc-vp")).toBeUndefined();
  });

  it("collects the string DIDs and prefers the did:webvh for the chain", () => {
    expect(documentDids(doc)).toEqual(["did:web:a", "did:webvh:Qm:a"]);
    expect(chainDid(doc)).toBe("did:webvh:Qm:a");
    expect(chainDid({ id: "did:web:b" })).toBe("did:web:b");
  });

  it("reads the issuer and the known claims of a presentation", () => {
    expect(
      membershipFromPresentation({
        verifiableCredential: [
          { issuer: { id: "did:x" }, credentialSubject: { legalName: "A", lei: "", other: "z" } },
        ],
      }),
    ).toEqual({ kind: "member", issuerDid: "did:x", claims: { legalName: "A" } });
    expect(() => membershipFromPresentation({ verifiableCredential: [{}] })).toThrow();
  });
});

describe("readCounterparty on V4", () => {
  it("shows a member: credential from the Association, active VERIFIER entry", async () => {
    const fetchMock = serve({
      ...registryRoutes,
      [`https://${MEMBER}/.well-known/did.json`]: {
        id: `did:web:${MEMBER}`,
        alsoKnownAs: [MEMBER_WEBVH],
        service: [vp(`did:web:${MEMBER}#vpr-schemas-42-vtc-vp`)],
      },
      [`https://x/did:web:${MEMBER}#vpr-schemas-42-vtc-vp.json`]: {
        verifiableCredential: [
          { issuer: ASSOCIATION_WEBVH, credentialSubject: { legalName: "Aurum AG", lei: "LEI1" } },
        ],
      },
      [verifierUrl(MEMBER_WEBVH)]: {
        participants: [{ id: 9, did: MEMBER_WEBVH, revoked: null, slashed: null }],
      },
    });

    const result = await readCounterparty({ host: MEMBER }, "v4");
    expect(result.membership).toEqual({
      kind: "member",
      issuerDid: ASSOCIATION_WEBVH,
      claims: { legalName: "Aurum AG", lei: "LEI1" },
    });
    expect(result.accreditedVerifier).toBe(true);
    expect(result.associationDids).toContain(ASSOCIATION_WEBVH);
    expect(fetchMock).toHaveBeenCalledWith(verifierUrl(MEMBER_WEBVH), expect.anything());
  });

  it("accepts a counterparty VP with another id when its schema is the counterparty VTJSC", async () => {
    serve({
      ...registryRoutes,
      [`https://${MEMBER}/.well-known/did.json`]: {
        id: MEMBER_WEBVH,
        service: [vp(`${MEMBER_WEBVH}#vpr-schemas-service-vtc-vp`), vp(`${MEMBER_WEBVH}#vpr-schemas-cp-vtc-vp`)],
      },
      [`https://x/${MEMBER_WEBVH}#vpr-schemas-cp-vtc-vp.json`]: {
        verifiableCredential: [
          {
            issuer: ASSOCIATION_WEBVH,
            credentialSchema: { id: `https://${ASSOCIATION}/vt/schemas-42-jsc.json` },
            credentialSubject: { legalName: "Aurum AG" },
          },
        ],
      },
      [verifierUrl(MEMBER_WEBVH)]: { participants: [] },
    });

    const result = await readCounterparty({ host: MEMBER }, "v4");
    expect(result.membership.kind).toBe("member");
    expect(result.accreditedVerifier).toBe(false);
  });

  it("shows an outsider: no counterparty VP, no VERIFIER entry", async () => {
    serve({
      ...registryRoutes,
      [`https://${MEMBER}/.well-known/did.json`]: {
        id: MEMBER_WEBVH,
        service: [vp(`${MEMBER_WEBVH}#vpr-schemas-org-vtc-vp`)],
      },
      [verifierUrl(MEMBER_WEBVH)]: { participants: [] },
    });

    const result = await readCounterparty({ host: MEMBER }, "v4");
    expect(result.membership).toEqual({ kind: "outsider" });
    expect(result.accreditedVerifier).toBe(false);
  });

  it("gives no verdict on the VERIFIER entry when the indexer does not answer", async () => {
    serve({
      ...registryRoutes,
      [`https://${MEMBER}/.well-known/did.json`]: { id: MEMBER_WEBVH, service: [] },
    });

    const result = await readCounterparty({ host: MEMBER }, "v4");
    expect(result.accreditedVerifier).toBeNull();
  });

  it("fails when the Association publishes no CEXA schemas", async () => {
    serve({
      [`https://${ASSOCIATION}/.well-known/did.json`]: { id: ASSOCIATION_WEBVH, service: [] },
      [`https://${MEMBER}/.well-known/did.json`]: { id: MEMBER_WEBVH, service: [] },
    });

    await expect(readCounterparty({ host: MEMBER }, "v4")).rejects.toThrow(/no CEXA schemas/);
  });
});

describe("readCounterparty on V3", () => {
  it("keeps the testnet perm query and the fixed Association DID", async () => {
    const did = "did:webvh:QmM:member";
    serve({
      [`https://${MEMBER}/.well-known/did.json`]: {
        id: did,
        service: [vp(`${did}#cexa-verified-counterparty-c-vp`)],
      },
      [`https://x/${did}#cexa-verified-counterparty-c-vp.json`]: {
        verifiableCredential: { issuer: CEXA_CAST.association.did, credentialSubject: {} },
      },
      [`${ENDPOINTS.indexer}/verana/perm/v1/list?schema_id=261`]: {
        permissions: [{ type: "VERIFIER", did, perm_state: "ACTIVE" }],
      },
    });

    const result = await readCounterparty({ host: MEMBER, did }, "v3");
    expect(result.membership).toEqual({ kind: "member", issuerDid: CEXA_CAST.association.did, claims: {} });
    expect(result.accreditedVerifier).toBe(true);
    expect(result.associationDids).toEqual([CEXA_CAST.association.did]);
  });
});
