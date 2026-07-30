"use client";

import { useEffect, useState } from "react";

// Sticky on-this-page navigation for the Vesta use case: highlights the
// section (and journey need) currently in view while scrolling.

export type PageNavItem = {
  id: string;
  label: string;
  children?: { id: string; label: string }[];
};

export default function PageNav({ items }: { items: PageNavItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    const ids = items.flatMap((it) => [
      it.id,
      ...(it.children?.map((c) => c.id) ?? []),
    ]);
    const targets = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const pick = () => {
      // The active anchor is the last one whose top has passed the header line.
      let current = targets[0].id;
      for (const el of targets) {
        if (el.getBoundingClientRect().top <= 120) current = el.id;
        else break;
      }
      setActive(current);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [items]);

  const parentOf = (id: string) =>
    items.find((it) => it.children?.some((c) => c.id === id))?.id;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#8a8da1]">
        On this page
      </p>
      <ul className="mt-3 space-y-0.5">
        {items.map((it) => {
          const isActive = active === it.id || parentOf(active) === it.id;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                className={`block border-l-2 py-1.5 pl-3 leading-snug transition-colors ${
                  isActive
                    ? "border-violet-600 font-bold text-violet-700"
                    : "border-[#ecebf4] text-[#4c5065] hover:border-violet-300 hover:text-violet-700"
                }`}
              >
                {it.label}
              </a>
              {it.children?.length ? (
                <ul className={isActive ? "" : "hidden"}>
                  {it.children.map((c) => (
                    <li key={c.id}>
                      <a
                        href={`#${c.id}`}
                        className={`block border-l-2 py-1 pl-6 text-[13px] leading-snug transition-colors ${
                          active === c.id
                            ? "border-violet-600 font-semibold text-violet-700"
                            : "border-[#ecebf4] text-[#8a8da1] hover:border-violet-300 hover:text-violet-700"
                        }`}
                      >
                        {c.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
