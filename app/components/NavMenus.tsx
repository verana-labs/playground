"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";

// Stateful nav menus: the old <details> versions stayed open after choosing
// an entry. These close on link click, route change, outside click and
// Escape; the desktop one also opens on hover.

type Item = { href: string; label: string };

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);
  return ref;
}

function MenuList({
  items,
  onPick,
  className,
}: {
  items: Item[];
  onPick: () => void;
  className: string;
}) {
  return (
    <ul className={className}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            onClick={onPick}
            className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function UseCasesMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
      >
        Use Cases
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div className="absolute left-0 top-full pt-3">
          <MenuList
            items={items}
            onPick={() => setOpen(false)}
            className="w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
          />
        </div>
      ) : null}
    </div>
  );
}

export function MobileMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative lg:hidden">
      <button
        type="button"
        aria-label="Open section menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>
      {open ? (
        <MenuList
          items={items}
          onPick={() => setOpen(false)}
          className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
        />
      ) : null}
    </div>
  );
}
