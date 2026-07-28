import Link from "next/link";
import { ChevronDown } from "lucide-react";
import NetworkChip from "./NetworkChip";

// Persistent header (spec §2): logo · section links (Use Cases as a submenu)
// · network chip · one CTA: "Add your wallet" → /integrate.
const NAV = [
  { href: "/#what-is-verana", label: "What is Verana" },
  { href: "/#user-wallets", label: "User wallets" },
  { href: "/#cloud-wallets", label: "Cloud wallets" },
];

const USECASES = [{ href: "/usecases/vesta", label: "Vesta Appliances" }];

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
      <span>
        Verana <span className="text-violet-600">Playground</span>
      </span>
    </Link>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
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
          <li className="group relative">
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              Use Cases <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            </button>
            <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
              <ul className="w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
                {USECASES.map((u) => (
                  <li key={u.href}>
                    <Link
                      href={u.href}
                      className="block rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-violet-50 hover:text-violet-700"
                    >
                      {u.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline-flex">
            <NetworkChip />
          </span>
          <Link
            href="/integrate"
            className="hidden rounded-xl bg-violet-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700 sm:inline-flex"
          >
            Add your wallet
          </Link>
        </div>
      </nav>
    </header>
  );
}
