import { ArrowRight, Coins, TrendingDown, Wallet } from "lucide-react";
import { Chip } from "../../components/ui";
import type { MoneyFlowData, MoneyLeg } from "./content";

// The money panels of the CEXA story: one card per flow (dues, issuance,
// reuse) showing who pays what to whom, plus the trust-score panel. Data
// comes from content.ts (the EGF fee schedule); the leg rows are shaped
// like the protocol's beneficiary query so the panels can switch from the
// simulated preview to live chain data without a redesign.

/** 5,000 → "5,000" · 0.855 → "0.855" · 0.05 → "0.05" */
const fmt = (n: number) =>
  n >= 1000
    ? n.toLocaleString("en-US")
    : Number(n.toFixed(3)).toString();

function AmountChips({ leg }: { leg: MoneyLeg }) {
  return (
    <span className="flex flex-wrap items-center justify-end gap-1.5">
      {leg.usdc != null ? (
        <span
          className={`rounded-md px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${
            leg.offchain
              ? "bg-gray-100 text-gray-600"
              : "bg-violet-50 text-violet-700"
          }`}
        >
          {fmt(leg.usdc)} USDC{leg.offchain ? " · off-chain" : ""}
        </span>
      ) : null}
      {leg.vna != null ? (
        <span className="rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-blue-700">
          {fmt(leg.vna)} VNA-eq
        </span>
      ) : null}
      {leg.tuWorth != null ? (
        <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-xs font-semibold tabular-nums text-amber-700">
          TU worth {fmt(leg.tuWorth)}
        </span>
      ) : null}
      {leg.usdc == null && leg.vna == null && leg.tuWorth == null ? (
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
          receipt only
        </span>
      ) : null}
    </span>
  );
}

export function MoneyFlowCard({
  flow,
  simulatedChip,
}: {
  flow: MoneyFlowData;
  simulatedChip: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold text-gray-900">{flow.title}</h4>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            {flow.when}
          </p>
        </div>
        <Chip tone="pending">{simulatedChip}</Chip>
      </div>

      <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2 font-semibold text-gray-900">
            <Wallet className="h-4 w-4 text-violet-600" aria-hidden />
            {flow.payer}
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums text-violet-700">
            pays {flow.payerOut}
          </span>
        </div>
        {flow.payerTuWorth != null ? (
          <p className="mt-1.5 text-xs text-gray-500">
            The payer&apos;s own trust deposit grows too: trust units worth{" "}
            <span className="font-mono font-semibold tabular-nums">
              {fmt(flow.payerTuWorth)}
            </span>{" "}
            minted on this payment.
          </p>
        ) : null}
      </div>

      <ul className="mt-4 divide-y divide-gray-100">
        {flow.legs.map((leg) => (
          <li
            key={leg.to}
            className="flex items-start justify-between gap-4 py-3"
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <ArrowRight
                className="mt-0.5 h-4 w-4 shrink-0 text-gray-300"
                aria-hidden
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">
                  {leg.to}
                </span>
                <span className="block text-xs leading-relaxed text-gray-500">
                  {leg.detail}
                </span>
              </span>
            </span>
            <AmountChips leg={leg} />
          </li>
        ))}
      </ul>

      {flow.footnote ? (
        <p className="mt-3 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-400">
          {flow.footnote}
        </p>
      ) : null}
    </div>
  );
}

export function TrustScorePanel({
  data,
}: {
  data: {
    title: string;
    intro: string;
    points: string[];
    trajectories: { who: string; activity: string; perYear: string }[];
    trajectoriesNote: string;
  };
}) {
  return (
    <div className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-6">
      <h4 className="flex items-center gap-2 text-lg font-bold text-gray-900">
        <Coins className="h-5 w-5 text-amber-600" aria-hidden />
        {data.title}
      </h4>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-600">
        {data.intro}
      </p>
      <ul className="mt-4 max-w-3xl space-y-2.5">
        {data.points.map((p) => (
          <li
            key={p}
            className="flex gap-3 text-sm leading-relaxed text-gray-600"
          >
            <span
              aria-hidden
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            />
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-6 overflow-x-auto rounded-xl border border-amber-200/70 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3 font-semibold">Member</th>
              <th className="px-4 py-3 font-semibold">Activity</th>
              <th className="px-4 py-3 text-right font-semibold">
                TU minted / year
              </th>
            </tr>
          </thead>
          <tbody>
            {data.trajectories.map((t) => (
              <tr key={t.who} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-semibold text-gray-900">
                  {t.who}
                </td>
                <td className="px-4 py-3 text-gray-500">{t.activity}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-amber-700">
                  {t.perYear}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2.5 flex items-start gap-2 text-xs leading-relaxed text-gray-400">
        <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {data.trajectoriesNote}
      </p>
    </div>
  );
}
