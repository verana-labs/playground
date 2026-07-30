import Link from "next/link";

/** Centered max-width container (tutorial rhythm: narrower by default). */
export function Container({
  children,
  className = "",
  wide = false,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={`mx-auto w-full ${wide ? "max-w-6xl" : "max-w-4xl"} px-6 ${className}`}
    >
      {children}
    </div>
  );
}

/** Vertical section rhythm. */
export function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-14 sm:py-16 ${className}`}>
      {children}
    </section>
  );
}

/** Numbered section heading - the verana-demos tutorial idiom:
 *  a violet number circle, bold title, gray subtitle. */
export function SectionHeading({
  number,
  title,
  subtitle,
}: {
  number?: number | string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      {number !== undefined ? (
        <div className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-700">
          Section {number}
        </div>
      ) : null}
      <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#0f1222] md:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-[#4c5065]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** Primary / ghost call-to-action button (internal or external). */
export function Button({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  external?: boolean;
}) {
  const cls =
    variant === "primary"
      ? "btn-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold"
      : "inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Rounded status chip. */
export function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "verified" | "pending";
}) {
  const cls =
    tone === "verified"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "pending"
        ? "bg-amber-50 text-amber-700"
        : "bg-gray-100 text-gray-600";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

/** Breadcrumb: Playground › <section> › <page> (spec §4/§5 item 1). */
export function Breadcrumb({
  items,
  onDark = false,
}: {
  items: { label: string; href?: string }[];
  /** Render on a gradient/dark header. */
  onDark?: boolean;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm ${onDark ? "text-white/90" : "text-gray-500"}`}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>›</span> : null}
            {it.href ? (
              <Link
                href={it.href}
                className={
                  onDark
                    ? "hover:text-white hover:underline"
                    : "hover:text-violet-700 hover:underline"
                }
              >
                {it.label}
              </Link>
            ) : (
              <span className={`font-medium ${onDark ? "text-white" : "text-gray-900"}`}>
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Placeholder block for specified-but-not-wired parts - honest by design. */
export function Placeholder({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-5">
      <div className="flex items-center gap-2">
        <Chip tone="pending">coming</Chip>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {children ? (
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{children}</p>
      ) : null}
    </div>
  );
}
