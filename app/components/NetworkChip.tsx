"use client";

import { useEffect, useState } from "react";

// Persistent network status chip: `TESTNET · resolver OK` (spec §2).
// Status comes from /api/status; real or absent, never faked.
export default function NetworkChip() {
  const [resolver, setResolver] = useState<"ok" | "down" | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => {
        if (alive) setResolver(d.resolver === "ok" ? "ok" : "down");
      })
      .catch(() => {
        if (alive) setResolver("down");
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
      title="Everything on this site runs against the Verana testnet"
    >
      TESTNET
      {resolver === null ? null : (
        <>
          <span aria-hidden>·</span>
          <span className={resolver === "ok" ? "text-emerald-600" : "text-red-500"}>
            resolver {resolver === "ok" ? "OK" : "down"}
          </span>
        </>
      )}
    </span>
  );
}
