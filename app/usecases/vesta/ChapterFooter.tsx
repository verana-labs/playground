import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container, Section } from "../../components/ui";
import { CHAPTERS_NAV } from "./chapters";

export default function ChapterFooter({ current }: { current: number }) {
  const prev = CHAPTERS_NAV.find((c) => c.n === current - 1);
  const next = CHAPTERS_NAV.find((c) => c.n === current + 1);
  return (
    <Section className="border-t border-[#efeef6] bg-white">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {prev ? (
            <Link
              href={prev.href}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d9d7ea] bg-white px-5 py-3 text-sm font-semibold text-[#4c5065] transition-colors hover:border-violet-300 hover:text-violet-700"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {prev.n} · {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={next.href}
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              Continue: {next.n} · {next.title}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <Link
              href="/#personal-wallets"
              className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold"
            >
              Explore the integrated wallets
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </div>
      </Container>
    </Section>
  );
}
