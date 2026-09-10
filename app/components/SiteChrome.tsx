"use client";

import { usePathname } from "next/navigation";

// The playground header and footer, except on the routes that impersonate
// a real-world site (the events demo: the Taquilla broker and the event
// landings bring their own chrome and must not read as playground pages).
// usePathname is known at server render time, so nothing flashes.
const STANDALONE_PREFIXES = ["/eventos"];

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const standalone = STANDALONE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (standalone) return null;
  return <>{children}</>;
}
