import { NextResponse } from "next/server";
import { ENDPOINTS } from "../../lib/site";

export const revalidate = 60;

// Network status for the persistent chip: ping the public resolver.
export async function GET() {
  let resolver: "ok" | "down" = "down";
  try {
    const res = await fetch(`${ENDPOINTS.resolver}/docs`, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 },
    });
    if (res.ok) resolver = "ok";
  } catch {
    /* down */
  }
  return NextResponse.json({ network: "testnet", resolver });
}
