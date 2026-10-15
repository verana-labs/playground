import { afterEach, describe, expect, it, vi } from "vitest";
import { holdsAuthorizedRepairerV4 } from "./authorized-repairer";

// The helper caches the schema id per host, so each test uses its own host.
const hostFor = (schemaId: number) => `repair-network-${schemaId}.vesta.playground.devnet.verana.network`;
const ZENITH = "did:webvh:QmZenith:zenith.playground.devnet.verana.network";

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

type Participants = Record<number, { did: string; role: string; revoked?: string | null }>;

/** A fake of the Repair Network DID document and of the indexer. */
function stubNetwork(opts: {
  schemaId: number;
  vtc: { credentialSchemaId: number; participantId: number; issuerParticipantId: number }[];
  participants: Participants;
}) {
  const HOST = hostFor(opts.schemaId);
  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === `https://${HOST}/.well-known/did.json`)
      return json({
        service: [
          { id: `did:web:${HOST}#vpr-schemas-service-vtc-vp`, type: "LinkedVerifiablePresentation" },
          { id: `did:web:${HOST}#vpr-schemas-${opts.schemaId}-vtjsc-vp`, type: "LinkedVerifiablePresentation" },
        ],
      });
    const schema = url.match(/\/v4\/credential-schema\/get\/(\d+)$/);
    if (schema)
      return json({
        schema: {
          json_schema: JSON.stringify({
            title: Number(schema[1]) === opts.schemaId ? "AuthorizedRepairerCredential" : "Other",
          }),
        },
      });
    if (url.endsWith("/v4/verifiable-trust/resolve"))
      return json({ did: ZENITH, trusted: true, presentations: [{ vtcCredentials: opts.vtc }] });
    const participant = url.match(/\/v4\/participant\/get\/(\d+)$/);
    if (participant) {
      const p = opts.participants[Number(participant[1])];
      return p ? json({ participant: { revoked: null, slashed: null, ...p } }) : json({}, 404);
    }
    return json({}, 404);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("holdsAuthorizedRepairerV4", () => {
  it("accepts an Authorized Repairer credential with active HOLDER and ISSUER entries", async () => {
    stubNetwork({
      schemaId: 31,
      vtc: [{ credentialSchemaId: 31, participantId: 7, issuerParticipantId: 5 }],
      participants: { 7: { did: ZENITH, role: "HOLDER" }, 5: { did: "did:webvh:iberia", role: "ISSUER" } },
    });
    expect(await holdsAuthorizedRepairerV4(ZENITH, hostFor(31))).toBe(true);
  });

  it("refuses a credential of another schema", async () => {
    stubNetwork({
      schemaId: 32,
      vtc: [{ credentialSchemaId: 99, participantId: 7, issuerParticipantId: 5 }],
      participants: { 7: { did: ZENITH, role: "HOLDER" }, 5: { did: "did:webvh:iberia", role: "ISSUER" } },
    });
    expect(await holdsAuthorizedRepairerV4(ZENITH, hostFor(32))).toBe(false);
  });

  it("refuses when the HOLDER entry is revoked", async () => {
    stubNetwork({
      schemaId: 33,
      vtc: [{ credentialSchemaId: 33, participantId: 7, issuerParticipantId: 5 }],
      participants: {
        7: { did: ZENITH, role: "HOLDER", revoked: "2026-10-01T00:00:00Z" },
        5: { did: "did:webvh:iberia", role: "ISSUER" },
      },
    });
    expect(await holdsAuthorizedRepairerV4(ZENITH, hostFor(33))).toBe(false);
  });

  it("refuses when the issuer has no ISSUER entry", async () => {
    stubNetwork({
      schemaId: 34,
      vtc: [{ credentialSchemaId: 34, participantId: 7, issuerParticipantId: 0 }],
      participants: { 7: { did: ZENITH, role: "HOLDER" } },
    });
    expect(await holdsAuthorizedRepairerV4(ZENITH, hostFor(34))).toBe(false);
  });

  it("refuses when the HOLDER entry belongs to another DID", async () => {
    stubNetwork({
      schemaId: 35,
      vtc: [{ credentialSchemaId: 35, participantId: 7, issuerParticipantId: 5 }],
      participants: { 7: { did: "did:webvh:other", role: "HOLDER" }, 5: { did: "did:webvh:iberia", role: "ISSUER" } },
    });
    expect(await holdsAuthorizedRepairerV4(ZENITH, hostFor(35))).toBe(false);
  });

  it("refuses when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("boom"))));
    expect(await holdsAuthorizedRepairerV4(ZENITH, hostFor(0))).toBe(false);
  });
});
