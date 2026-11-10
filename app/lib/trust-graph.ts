// The directory queries of the use-case stories, answered live by the Verana
// Graph (the trust graph): POST {graph}/v4/graph/search on the `Did` surface.
// Spec: verana-labs/verana-spec → v4/verana-graph/spec.md ([TG-FCT-1..7]).
//
// The graph lists only trusted DIDs by default ([TG-FCT-2]), so every result
// here is a service whose trust the network resolved, not a self-declared
// listing.
//
// A query filters on Participant entries of a credential schema. The numeric
// schema ids are not known at build time: each one is found at run time from
// the Ecosystem controller that publishes the schema (app/lib/vtjsc.ts).

import { AUTHORIZED_REPAIRER_TITLE } from "../api/portal-login/authorized-repairer";
import { ENDPOINTS } from "./site";
import {
  VERANDIA_CAST,
  VERANDIA_CITIZEN_ID_TITLE,
  VERANDIA_LEGAL_REP_TITLE,
} from "./verandia-cast";
import { VESTA_CAST } from "./vesta-cast";
import { schemaIdFor } from "./vtjsc";

const TIMEOUT_MS = 20_000;
/** One page is enough for a demo cast; `truncated` says when it was not. */
const PAGE_LIMIT = 100;

const ISO_9001_TITLE = "ISO9001DemoCredential";
/** ISO 3166-1 user-assigned code of the fictional Republic of Verandia. */
const VERANDIA_COUNTRY_CODE = "VD";

export type GraphFilters = Record<string, unknown>;

/** The request body sent to the graph, shown to the visitor as is. */
export type GraphRequest = {
  surface: "Did";
  filters: GraphFilters;
  limit: number;
};

export type DirectoryEntry = {
  did: string;
  /** Host of the service (the last segment of its did:webvh). */
  host: string;
  /** Service name and type, from its ECS Service credential. */
  name: string;
  type: string | null;
  /** The organization (or persona) that operates the service. */
  operator: string | null;
  countryCode: string | null;
  lastObservedAtTime: string | null;
};

export type DirectoryStep = {
  /** What this request asks, in words. */
  label: string;
  request: GraphRequest;
  /** Hits the graph counts for the request. */
  total: number;
};

export type DirectoryResult = {
  steps: DirectoryStep[];
  entries: DirectoryEntry[];
  /** True when a request had more hits than one page holds. */
  truncated: boolean;
  /** How the hits became the answer, when they are not the answer as is. */
  note: string | null;
};

type StepDef = { label: string; filters: GraphFilters };

type DirectoryQueryDef = {
  steps: () => Promise<StepDef[]>;
  /** How the hits of the steps become the answer:
   *  - "intersect": services present in every step (a logical AND across
   *    schemas, which one request cannot express: a filter field takes one
   *    value or an `in` list, and `in` is an OR);
   *  - "latest-per-host": one step, keeping for each host the DID observed
   *    last. A redeployed did:webvh service gets a new DID on the same host,
   *    and the graph keeps the earlier one. */
  combine: "intersect" | "latest-per-host";
};

const holderOf = (schemaId: number): GraphFilters => ({
  "Participant.credentialSchemaId": schemaId,
  "Participant.role": "HOLDER",
});

const authorizedRepairerSchema = () =>
  schemaIdFor(VESTA_CAST.repairNetwork.host, AUTHORIZED_REPAIRER_TITLE);

export const DIRECTORY_QUERIES: Record<string, DirectoryQueryDef> = {
  "vesta-authorized-repairers": {
    combine: "intersect",
    steps: async () => [
      {
        label: "Services with an active HOLDER entry on the Authorized Repairer schema",
        filters: holderOf(await authorizedRepairerSchema()),
      },
    ],
  },
  "vesta-repairers-iso9001": {
    combine: "intersect",
    steps: async () => {
      const [repairer, iso] = await Promise.all([
        authorizedRepairerSchema(),
        schemaIdFor(VESTA_CAST.iso.host, ISO_9001_TITLE),
      ]);
      return [
        {
          label: "Services with an active HOLDER entry on the Authorized Repairer schema",
          filters: holderOf(repairer),
        },
        {
          label: "Services with an active HOLDER entry on the ISO 9001 schema",
          filters: holderOf(iso),
        },
      ];
    },
  },
  "verandia-businesses": {
    combine: "latest-per-host",
    steps: async () => [
      {
        label: "Services operated by an organization whose Organization credential is registered in Verandia",
        filters: { "OrganizationCredential.countryCode": VERANDIA_COUNTRY_CODE },
      },
    ],
  },
  "verandia-citizen-id-verifiers": {
    combine: "intersect",
    steps: async () => [
      {
        label: "Services with an active VERIFIER entry on the Verandia Citizen ID schema",
        filters: {
          "Participant.credentialSchemaId": await schemaIdFor(
            VERANDIA_CAST.civilRegistry.host,
            VERANDIA_CITIZEN_ID_TITLE,
          ),
          "Participant.role": "VERIFIER",
        },
      },
    ],
  },
  "verandia-issuers": {
    combine: "intersect",
    steps: async () => {
      const [citizenId, legalRep] = await Promise.all([
        schemaIdFor(VERANDIA_CAST.civilRegistry.host, VERANDIA_CITIZEN_ID_TITLE),
        schemaIdFor(VERANDIA_CAST.businessRegistry.host, VERANDIA_LEGAL_REP_TITLE),
      ]);
      return [
        {
          label:
            "Services with an active ISSUER entry on the Verandia Citizen ID schema or the Legal Representative schema",
          filters: {
            "Participant.credentialSchemaId": { in: [citizenId, legalRep] },
            "Participant.role": "ISSUER",
          },
        },
      ];
    },
  },
};

export type DirectoryQueryId = keyof typeof DIRECTORY_QUERIES;

type RawHit = {
  id?: unknown;
  snippet?: {
    lastObservedAtTime?: unknown;
    service?: { name?: unknown; type?: unknown };
    operator?: { name?: unknown; countryCode?: unknown };
  };
};

const text = (value: unknown): string | null =>
  typeof value === "string" && value.length > 0 ? value : null;

function toEntry(hit: RawHit): DirectoryEntry | null {
  const did = text(hit.id);
  if (!did) return null;
  const host = did.split(":").pop() ?? did;
  return {
    did,
    host,
    name: text(hit.snippet?.service?.name) ?? host,
    type: text(hit.snippet?.service?.type),
    operator: text(hit.snippet?.operator?.name),
    countryCode: text(hit.snippet?.operator?.countryCode),
    lastObservedAtTime: text(hit.snippet?.lastObservedAtTime),
  };
}

/** One search request on the `Did` surface. */
export async function searchDids(
  filters: GraphFilters,
): Promise<{ request: GraphRequest; total: number; entries: DirectoryEntry[] }> {
  const request: GraphRequest = { surface: "Did", filters, limit: PAGE_LIMIT };
  const url = `${ENDPOINTS.graph}/v4/graph/search`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...request, snippet: { service: true, operator: true } }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const body = (await res.json()) as { totalCount?: unknown; hits?: unknown };
  const hits = Array.isArray(body.hits) ? (body.hits as RawHit[]) : [];
  const entries = hits.map(toEntry).filter((e): e is DirectoryEntry => e !== null);
  return {
    request,
    total: typeof body.totalCount === "number" ? body.totalCount : entries.length,
    entries,
  };
}

/** The entries present in every list, in the order of the first one. */
export function intersect(lists: DirectoryEntry[][]): DirectoryEntry[] {
  const [first, ...rest] = lists;
  if (!first) return [];
  const others = rest.map((list) => new Set(list.map((e) => e.did)));
  return first.filter((e) => others.every((dids) => dids.has(e.did)));
}

/** For each host, the entry the graph observed last. */
export function latestPerHost(entries: DirectoryEntry[]): DirectoryEntry[] {
  const byHost = new Map<string, DirectoryEntry>();
  for (const entry of entries) {
    const kept = byHost.get(entry.host);
    if (!kept || (entry.lastObservedAtTime ?? "") > (kept.lastObservedAtTime ?? "")) {
      byHost.set(entry.host, entry);
    }
  }
  return [...byHost.values()];
}

/** Runs a directory query against the trust graph. */
export async function runDirectoryQuery(id: DirectoryQueryId): Promise<DirectoryResult> {
  const def = DIRECTORY_QUERIES[id];
  const stepDefs = await def.steps();
  const answers = await Promise.all(stepDefs.map((s) => searchDids(s.filters)));
  const lists = answers.map((a) => a.entries);
  const combined =
    def.combine === "latest-per-host" ? latestPerHost(lists.flat()) : intersect(lists);
  return {
    steps: stepDefs.map((s, i) => ({
      label: s.label,
      request: answers[i].request,
      total: answers[i].total,
    })),
    entries: [...combined].sort((a, b) => a.name.localeCompare(b.name)),
    truncated: answers.some((a) => a.total > a.entries.length),
    note:
      def.combine === "latest-per-host"
        ? "A redeployed service gets a new DID on the same host, and the graph still lists the earlier ones. The answer keeps, for each host, the DID observed last."
        : stepDefs.length > 1
          ? "The answer is the services present in every search."
          : null,
  };
}
