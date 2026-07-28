import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";
import NetworkChip from "./NetworkChip";

// Persistent header (spec §2): logo · What is Verana · Use Cases submenu ·
// wallet anchors · network chip · one CTA: "Add your wallet" → /integrate.
const NAV = [
  { href: "/#what-is-verana", label: "What is Verana" },
  { href: "/#user-wallets", label: "User wallets" },
  { href: "/#cloud-wallets", label: "Cloud wallets" },
];

const USE_CASES = [{ href: "/usecases/vesta", label: "Vesta Appliances" }];

function UseCasesMenu() {
  return (
    <details className="group relative">
      <summary className="flex list-none items-center gap-1 text-sm text-gray-500 transition-colors marker:hidden hover:text-gray-900 [&::-webkit-details-marker]:hidden">
        Use Cases
        <ChevronDown
          className="h-3.5 w-3.5 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="absolute left-0 top-full z-50 mt-3 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        {USE_CASES.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-gray-900"
      aria-label="Verana Playground home"
    >
      <svg width="20" height="20" viewBox="0 0 54 52" aria-hidden="true">
        <path
          fill="#7C3AED"
          d="M26.9932 51.6972L5.805 11.0977L2.91263 16.2161L0 10.6048L5.98725 0L26.9932 40.2483L47.9993 0L54 10.6217L51.0773 16.2161L48.1849 11.0977L26.9932 51.6972Z"
        />
        <path fill="#10B981" d="M13.696 0L26.9935 25.4637L39.9367 0H13.696Z" />
      </svg>
      <span className="hidden sm:inline">
        Verana <span className="text-violet-600">Playground</span>
      </span>
    </Link>
  );
}

// Below `lg` the four anchors move into a disclosure menu. A native
// <details>/<summary> keeps this JS-free — Nav stays a server component.
function MobileMenu() {
  return (
    <details className="relative lg:hidden">
      <summary
        aria-label="Open section menu"
        className="flex h-9 w-9 list-none items-center justify-center rounded-lg text-gray-500 marker:hidden hover:bg-gray-100 hover:text-gray-900 [&::-webkit-details-marker]:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </summary>
      <ul className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        {[NAV[0], ...USE_CASES, ...NAV.slice(1)].map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Logo />
        <ul className="ml-4 hidden items-center gap-5 lg:flex">
          <li>
            <Link
              href={NAV[0].href}
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              {NAV[0].label}
            </Link>
          </li>
          <li>
            <UseCasesMenu />
          </li>
          {NAV.slice(1).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="text-sm text-gray-500 transition-colors hover:text-gray-900"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <NetworkChip />
          <Link
            href="/integrate"
            className="inline-flex rounded-xl bg-violet-600 px-2.5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 sm:px-3.5"
          >
            <span className="sm:hidden">Add wallet</span>
            <span className="hidden sm:inline">Add your wallet</span>
          </Link>
          <MobileMenu />
        </div>
      </nav>
    </header>
  );
}
