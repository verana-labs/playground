import { CheckCircle2, ShieldX, XCircle } from "lucide-react";

// The six DemoCredential scenarios of spec §4 — one verdict line each, in the
// [UW-POT-2]/[UW-POT-3] wording. Shown as the placeholder "expected in the
// wallet" rendering until the wallet submits its per-scenario captures.
export type ExpectedRenderingKind =
  | "issue-accredited"
  | "issue-unaccredited"
  | "issue-untrusted"
  | "present-accredited"
  | "present-unaccredited"
  | "present-untrusted";

const LINES: Record<
  ExpectedRenderingKind,
  { icon: typeof CheckCircle2; tone: string; text: string }
> = {
  "issue-accredited": {
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-700",
    text: "✅ Accredited Issuer (demo) is an authorized issuer of DemoCredential in Playground Ecosystem (demo) — accept the offer.",
  },
  "issue-unaccredited": {
    icon: XCircle,
    tone: "bg-red-50 text-red-600",
    text: "❌ Unaccredited Issuer (demo) is not an authorized issuer of DemoCredential — accepting is blocked.",
  },
  "issue-untrusted": {
    icon: ShieldX,
    tone: "bg-red-50 text-red-600",
    text: "❌ Untrusted Service (demo) fails trust resolution — the connection is refused before any offer.",
  },
  "present-accredited": {
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-700",
    text: "✅ Accredited Verifier (demo) is an authorized verifier of DemoCredential in Playground Ecosystem (demo) — share to log in.",
  },
  "present-unaccredited": {
    icon: XCircle,
    tone: "bg-red-50 text-red-600",
    text: "❌ Unaccredited Verifier (demo) is not an authorized verifier of DemoCredential — sharing is blocked.",
  },
  "present-untrusted": {
    icon: ShieldX,
    tone: "bg-red-50 text-red-600",
    text: "❌ Untrusted Service (demo) fails trust resolution — the connection is refused before any request.",
  },
};

export function ExpectedRendering({ kind }: { kind: ExpectedRenderingKind }) {
  const { icon: Icon, tone, text } = LINES[kind];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Expected in the wallet
      </p>
      <div
        className={`mt-3 inline-flex items-start gap-2 rounded-full px-3 py-2 text-sm font-medium ${tone}`}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{text}</span>
      </div>
    </div>
  );
}
