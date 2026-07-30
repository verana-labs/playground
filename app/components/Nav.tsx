import Link from "next/link";
import NetworkChip from "./NetworkChip";
import { MobileMenu, UseCasesMenu } from "./NavMenus";

// Persistent header (spec §2): logo · What is Verana · Use Cases submenu ·
// wallet anchors · network chip · one CTA: "Add your wallet" → /integrate.
const NAV = [
  { href: "/#what-is-verana", label: "What is Verana" },
  { href: "/personal-wallets", label: "Personal wallets" },
  { href: "/business-wallets", label: "Business wallets" },
];

const USE_CASES = [{ href: "/usecases/vesta", label: "Vesta Appliances" }];

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

export default function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#efeef6] bg-white/70 backdrop-blur-md">
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
            <UseCasesMenu items={USE_CASES} />
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
          <MobileMenu items={[NAV[0], ...USE_CASES, ...NAV.slice(1)]} />
        </div>
      </nav>
    </header>
  );
}
