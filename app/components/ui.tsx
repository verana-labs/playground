import Link from "next/link";

/** Centered max-width container. */
export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-6xl px-6 ${className}`}>{children}</div>
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
    <section id={id} className={`scroll-mt-20 py-16 sm:py-20 ${className}`}>
      {children}
    </section>
  );
}

/** Mono eyebrow label. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow mb-4">{children}</p>;
}

/** Section heading block. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  center = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`${center ? "text-center mx-auto max-w-2xl" : "max-w-3xl"}`}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="display text-3xl sm:text-4xl text-ink">{title}</h2>
      {intro ? (
        <p className="mt-4 text-lg text-muted leading-relaxed">{intro}</p>
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
  const cls = `btn ${variant === "primary" ? "btn-primary" : "btn-ghost"}`;
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

/** Mono status chip. */
export function Chip({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: "default" | "verified" | "pending";
}) {
  const extra =
    tone === "verified" ? "chip-verified" : tone === "pending" ? "chip-pending" : "";
  return <span className={`chip ${extra}`}>{children}</span>;
}

/** Breadcrumb: Playground › <section> › <page> (spec §4/§5 item 1). */
export function Breadcrumb({
  items,
}: {
  items: { label: string; href?: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="font-mono text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>›</span> : null}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink hover:underline">
                {it.label}
              </Link>
            ) : (
              <span className="text-ink">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Placeholder block for parts of the template that are specified but not
 *  wired yet — honest by design ("real or absent, never faked"). */
export function Placeholder({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-rule bg-surface-2 p-5">
      <div className="flex items-center gap-2">
        <Chip tone="pending">coming</Chip>
        <h3 className="font-semibold text-ink">{title}</h3>
      </div>
      {children ? <p className="mt-2 text-sm text-muted">{children}</p> : null}
    </div>
  );
}
