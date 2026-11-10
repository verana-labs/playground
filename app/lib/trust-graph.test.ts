import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./vtjsc", () => ({
  schemaIdFor: vi.fn(async (_host: string, title: string) =>
    ({
      AuthorizedRepairerCredential: 43,
      ISO9001DemoCredential: 42,
      VerandiaCitizenIDCredential: 46,
      LegalRepresentativeCredential: 45,
    })[title],
  ),
}));

import {
  DIRECTORY_QUERIES,
  intersect,
  latestPerHost,
  runDirectoryQuery,
  type DirectoryEntry,
} from "./trust-graph";

afterEach(() => vi.unstubAllGlobals());

const entry = (did: string, name: string, lastObservedAtTime: string | null = null): DirectoryEntry => ({
  did,
  host: did.split(":").pop() ?? did,
  name,
  type: null,
  operator: null,
  countryCode: null,
  lastObservedAtTime,
});

const hit = (did: string, name: string, observed = "2026-11-04T00:00:00.000Z") => ({
  type: "Did",
  id: did,
  snippet: {
    lastObservedAtTime: observed,
    service: { name, type: "IssuerService" },
    operator: { name: `${name} operator`, countryCode: "VD" },
  },
});

/** A graph that answers each request from its filters. */
function stubGraph(answer: (filters: Record<string, unknown>) => unknown[]) {
  const fetchMock = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { filters: Record<string, unknown> };
    const hits = answer(body.filters);
    return new Response(JSON.stringify({ totalCount: hits.length, hits }));
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("intersect", () => {
  it("keeps the entries present in every list", () => {
    const a = entry("did:webvh:a:one.example", "One");
    const b = entry("did:webvh:b:two.example", "Two");
    expect(intersect([[a, b], [b]])).toEqual([b]);
    expect(intersect([[a, b]])).toEqual([a, b]);
    expect(intersect([[a], [b]])).toEqual([]);
    expect(intersect([])).toEqual([]);
  });
});

describe("latestPerHost", () => {
  it("keeps, for a redeployed host, the DID observed last", () => {
    const old = entry("did:webvh:old:shop.example", "Shop", "2026-10-15T00:00:00.000Z");
    const current = entry("did:webvh:new:shop.example", "Shop", "2026-11-04T00:00:00.000Z");
    const other = entry("did:webvh:x:bank.example", "Bank", "2026-10-20T00:00:00.000Z");
    expect(latestPerHost([old, other, current])).toEqual([current, other]);
  });
});

describe("runDirectoryQuery", () => {
  it("asks for the HOLDER entries of the Authorized Repairer schema, on the Did surface", async () => {
    const fetchMock = stubGraph(() => [hit("did:webvh:z:zenith.example", "Zenith Repairs (demo)")]);

    const result = await runDirectoryQuery("vesta-authorized-repairers");

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://graph.testnet.verana.network/v4/graph/search",
    );
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      surface: "Did",
      filters: { "Participant.credentialSchemaId": 43, "Participant.role": "HOLDER" },
      limit: 100,
      snippet: { service: true, operator: true },
    });
    expect(result.entries).toEqual([
      {
        did: "did:webvh:z:zenith.example",
        host: "zenith.example",
        name: "Zenith Repairs (demo)",
        type: "IssuerService",
        operator: "Zenith Repairs (demo) operator",
        countryCode: "VD",
        lastObservedAtTime: "2026-11-04T00:00:00.000Z",
      },
    ]);
    expect(result.steps[0]?.total).toBe(1);
    expect(result.truncated).toBe(false);
    expect(result.note).toBeNull();
  });

  it("answers an AND across two schemas with the services present in both searches", async () => {
    const both = hit("did:webvh:b:both.example", "Both (demo)");
    stubGraph((filters) =>
      filters["Participant.credentialSchemaId"] === 43
        ? [hit("did:webvh:z:zenith.example", "Zenith Repairs (demo)"), both]
        : [both, hit("did:webvh:v:vesta.example", "Vesta Appliances (demo)")],
    );

    const result = await runDirectoryQuery("vesta-repairers-iso9001");

    expect(result.steps.map((s) => s.total)).toEqual([2, 2]);
    expect(result.entries.map((e) => e.name)).toEqual(["Both (demo)"]);
    expect(result.note).toBe("The answer is the services present in every search.");
  });

  it("returns no entry, and both counts, when no service holds both credentials", async () => {
    stubGraph((filters) =>
      filters["Participant.credentialSchemaId"] === 43
        ? [hit("did:webvh:z:zenith.example", "Zenith Repairs (demo)")]
        : [hit("did:webvh:v:vesta.example", "Vesta Appliances (demo)")],
    );

    const result = await runDirectoryQuery("vesta-repairers-iso9001");

    expect(result.entries).toEqual([]);
    expect(result.steps.map((s) => s.total)).toEqual([1, 1]);
  });

  it("lists a redeployed Verandian service once, sorted by name", async () => {
    const fetchMock = stubGraph(() => [
      hit("did:webvh:old:tax-buro.example", "Tax Buro (demo)", "2026-10-15T00:00:00.000Z"),
      hit("did:webvh:new:tax-buro.example", "Tax Buro (demo)", "2026-11-04T00:00:00.000Z"),
      hit("did:webvh:m:meridian-bank.example", "Meridian Bank (demo)"),
    ]);

    const result = await runDirectoryQuery("verandia-businesses");

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).filters).toEqual({
      "OrganizationCredential.countryCode": "VD",
    });
    expect(result.entries.map((e) => e.did)).toEqual([
      "did:webvh:m:meridian-bank.example",
      "did:webvh:new:tax-buro.example",
    ]);
    expect(result.steps[0]?.total).toBe(3);
    expect(result.note).toMatch(/for each host, the DID observed last/);
  });

  it("asks for the VERIFIER entries of the Citizen ID schema and the ISSUER entries of both Verandia schemas", async () => {
    const fetchMock = stubGraph(() => []);

    await runDirectoryQuery("verandia-citizen-id-verifiers");
    await runDirectoryQuery("verandia-issuers");

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).filters).toEqual({
      "Participant.credentialSchemaId": 46,
      "Participant.role": "VERIFIER",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)).filters).toEqual({
      "Participant.credentialSchemaId": { in: [46, 45] },
      "Participant.role": "ISSUER",
    });
  });

  it("fails when the graph does not answer", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    await expect(runDirectoryQuery("vesta-authorized-repairers")).rejects.toThrow(/HTTP 503/);
  });

  it("flags a query whose hits do not fit one page", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ totalCount: 250, hits: [hit("did:webvh:a:a.example", "A")] })),
      ),
    );
    expect((await runDirectoryQuery("vesta-authorized-repairers")).truncated).toBe(true);
  });
});

describe("the story content", () => {
  it("names only queries that exist", async () => {
    const { DEMOS: vesta } = await import("../usecases/vesta/content");
    const { DEMOS: verandia } = await import("../usecases/verandia/content");
    const ids = [...vesta.directory.queries, ...verandia.directory.queries].map((q) => q.id);
    expect(ids).toHaveLength(5);
    for (const id of ids) expect(Object.hasOwn(DIRECTORY_QUERIES, id)).toBe(true);
  });
});
