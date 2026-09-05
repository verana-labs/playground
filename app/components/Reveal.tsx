"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Site-wide reveal-on-scroll observer: adds .is-visible to .reveal and
// .reveal-stagger elements as they enter the viewport (verana.io pattern).
// Mounted once in the layout, so it must re-scan on every route change AND
// on DOM mutations: client-side navigation swaps the page content without
// remounting the layout, and interactive flows (the applicant-journey
// wizard) mount reveal elements on click with no navigation at all -
// freshly rendered elements would otherwise stay at opacity 0.
export default function Reveal() {
  const pathname = usePathname();

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    // Elements already handed to an IntersectionObserver, so mutation-driven
    // re-scans do not observe the same node twice while it waits to scroll
    // into view.
    const seen = new WeakSet<Element>();

    const scan = () => {
      const els = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".reveal:not(.is-visible), .reveal-stagger:not(.is-visible)",
        ),
      ).filter((el) => !seen.has(el));
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
      els.forEach((el) => {
        seen.add(el);
        io.observe(el);
      });
      observers.push(io);
    };

    // The new page's DOM is committed when this effect runs; scan again on
    // the next frame to catch streamed/suspended content that mounts late.
    scan();
    let raf = requestAnimationFrame(scan);

    // Content mounted without a route change (conditional wizard steps,
    // suspended subtrees resolving) still needs observing: re-scan on
    // childList mutations, debounced to one scan per frame. Attribute
    // changes are not observed, so adding .is-visible cannot loop.
    let pending = false;
    const mutations = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      raf = requestAnimationFrame(() => {
        pending = false;
        scan();
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mutations.disconnect();
      observers.forEach((io) => io.disconnect());
    };
  }, [pathname]);

  return null;
}
