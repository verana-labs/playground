"use client";
import { withBase } from "../lib/base-path";

import { useEffect, useState } from "react";

// Persistent network status chip: a glowing LED and the word "Testnet".
// The LED reflects the live resolver status from /api/status (green OK,
// red down, gray while checking); real or absent, never faked.
export default function NetworkChip() {
  const [resolver, setResolver] = useState<"ok" | "down" | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(withBase("/api/status"))
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
      title={`Everything on this site runs against the Verana testnet${
        resolver === "down" ? " (resolver unreachable right now)" : ""
      }`}
    >
      <span
        aria-hidden
        className={`led ${
          resolver === "ok"
            ? "led-green"
            : resolver === "down"
              ? "led-red"
              : "bg-gray-300"
        }`}
      />
      Testnet
    </span>
  );
}
