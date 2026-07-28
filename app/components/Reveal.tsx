"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Site-wide reveal-on-scroll observer: adds .is-visible to .reveal and
// .reveal-stagger elements as they enter the viewport (verana.io pattern).
// Mounted once in the layout, so it must re-scan on every route change:
// client-side navigation swaps the page content without remounting the
// layout, and freshly rendered elements would otherwise stay at opacity 0.
export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const scan = () => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".reveal:not(.is-visible), .reveal-stagger:not(.is-visible)",
        ),
      );
      if (els.length === 0) return;
      if (!("IntersectionObserver" in window)) {
        els.forEach((el) => el.classList.add("is-visible"));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io.unobserve(e.target);
            }
          }
        },
        { threshold: 0.15 },
      );
      els.forEach((el) => io.observe(el));
      observers.push(io);
    };

    // The new page's DOM is committed when this effect runs; scan again on
    // the next frame to catch streamed/suspended content that mounts late.
    scan();
    const raf = requestAnimationFrame(scan);

    return () => {
      cancelAnimationFrame(raf);
      observers.forEach((io) => io.disconnect());
    };
  }, [pathname]);

  return null;
}
