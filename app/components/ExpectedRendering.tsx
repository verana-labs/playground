import { CheckCircle2, XCircle } from "lucide-react";

export type ExpectedRenderingKind =
  | "issue"
  | "present"
  | "issue-refused"
  | "present-refused";

const LINES: Record<
  ExpectedRenderingKind,
  { icon: typeof CheckCircle2; tone: string; text: string }
> = {
  issue: {
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-700",
    text: "✅ Example Issuer (demo) is an authorized issuer of ECS-Badge in the ECS Ecosystem.",
  },
  present: {
    icon: CheckCircle2,
    tone: "bg-emerald-50 text-emerald-700",
    text: "✅ Example Web Verifier (demo) is an authorized verifier of ECS-Badge in the ECS Ecosystem.",
  },
  "issue-refused": {
    icon: XCircle,
    tone: "bg-red-50 text-red-600",
    text: "❌ Umbra Corp (demo) is not an authorized issuer of ECS-Badge — accepting is blocked.",
  },
  "present-refused": {
    icon: XCircle,
    tone: "bg-red-50 text-red-600",
    text: "❌ Umbra Corp (demo) is not an authorized verifier of ECS-Badge — sharing is blocked.",
  },
};

export function ExpectedRendering({ kind }: { kind: ExpectedRenderingKind }) {
  const { icon: Icon, tone, text } = LINES[kind];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
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
