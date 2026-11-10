import { NextResponse } from "next/server";
import { DIRECTORY_QUERIES, runDirectoryQuery } from "@/app/lib/trust-graph";

// A directory query of a use-case story, answered live by the Verana Graph
// (the trust graph). The query id names one of the fixed queries of
// app/lib/trust-graph.ts: the visitor chooses a query, never its filters.

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ queryId: string }> },
) {
  const { queryId } = await params;
  if (!Object.hasOwn(DIRECTORY_QUERIES, queryId)) {
    return NextResponse.json({ error: `unknown directory query '${queryId}'` }, { status: 404 });
  }
  try {
    return NextResponse.json(await runDirectoryQuery(queryId));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "the trust graph did not answer" },
      { status: 502 },
    );
  }
}
