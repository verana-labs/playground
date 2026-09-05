"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Check,
  ChevronRight,
  QrCode,
  RotateCcw,
} from "lucide-react";
import type { PersonalWallet } from "../../lib/wallets";
import { BADGE_DEMO_AVATAR } from "../../lib/demo-badge";
import { ServiceQr, type ServiceQrOutcome } from "../../components/ServiceQr";
import LiveTrustCard from "../../components/LiveTrustCard";
import { Chip } from "../../components/ui";
import { WalletChooser, useSelectedWallet } from "../vesta/DemoWalletFlow";
import { SubHeading } from "../story-blocks";
import { WIZARD } from "./content";

// The applicant journey (chapter 4), as one progressive page: every section
// sits below the previous one, and creating the applicant is the single
// gate that reveals the rest. Editing the name later re-mints the identity
// credential QR (debounced - each mint is a real single-use offer on the
// cast). Every QR is a live action minted by the deployed cast; ServiceQr's
// onSettled callbacks drive the ticks, with manual buttons as fallback.

type Claim = { name: string; value: string };
type JobId = "meridian" | "halcyon";

const STORAGE_KEY = "bhi-journey-v2";

type SavedState = {
  first: string;
  last: string;
  created: boolean;
  ticks: Record<string, number>;
  applied: Record<JobId, boolean>;
};

const DEFAULTS: SavedState = {
  first: "Alex",
  last: "Chen",
  created: false,
  ticks: {},
  applied: { meridian: false, halcyon: false },
};

function loadSaved(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    return {
      ...DEFAULTS,
      ...parsed,
      applied: { ...DEFAULTS.applied, ...(parsed.applied ?? {}) },
      ticks: parsed.ticks ?? {},
    };
  } catch {
    return null;
  }
}

// AnonCreds first (Hologram's native rail), SD-JWT otherwise - the same
// choice the Verandia cards make.
const walletFormat = (wallet: PersonalWallet) =>
  wallet.formats.includes("anoncreds")
    ? "anoncreds"
    : wallet.formats.includes("openid4vc-sdjwt")
      ? "openid4vc-sdjwt"
      : null;

const joinParams = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join("&") || undefined;

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="btn-gradient inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
      <ChevronRight className="h-4 w-4" aria-hidden />
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-violet-300 hover:text-violet-700"
    >
      {icon}
      {children}
    </button>
  );
}

/** Numbered section heading of the journey page. */
function JourneyHeading({ n, children }: { n: number; children: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
        {n}
      </span>
      <SubHeading>{children}</SubHeading>
    </div>
  );
}

export default function BhiWizard({ wallets }: { wallets: PersonalWallet[] }) {
  const { wallet } = useSelectedWallet(wallets);
  const [state, setState] = useState<SavedState>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);
  // Which job ad's application is expanded under the board; session-only.
  const [job, setJob] = useState<JobId | null>(null);
  // Claims echoed back by the verifier per answered request; session-only.
  const [received, setReceived] = useState<Record<string, Claim[]>>({});
  const walletSectionRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) setState(saved);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // per-viewer convenience only - the journey works without persistence
    }
  }, [state, hydrated]);

  const patch = (p: Partial<SavedState>) => setState((s) => ({ ...s, ...p }));
  const tick = (id: string) =>
    setState((s) => ({ ...s, ticks: { ...s.ticks, [id]: (s.ticks[id] ?? 0) + 1 } }));

  // The name used for QR minting trails the inputs by a moment: every
  // change re-mints the open identity offer, and each mint is a real
  // single-use offer on the agent - not one per keystroke.
  const [mintName, setMintName] = useState({ first: DEFAULTS.first, last: DEFAULTS.last });
  useEffect(() => {
    const t = setTimeout(
      () => setMintName({ first: state.first, last: state.last }),
      600,
    );
    return () => clearTimeout(t);
  }, [state.first, state.last]);

  const format = wallet ? walletFormat(wallet) : null;
  const nameParams = `firstName=${encodeURIComponent(mintName.first)}&surname=${encodeURIComponent(mintName.last)}`;
  const fullName = `${state.first} ${state.last}`.trim();

  const create = () => {
    patch({ created: true });
    // Scroll once the newly revealed sections have committed.
    setTimeout(() => {
      walletSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const restart = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nothing to clear
    }
    setReceived({});
    setJob(null);
    setState(DEFAULTS);
    setTimeout(() => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  if (!wallet) return null;

  return (
    <div id="applicant-journey" ref={rootRef} className="mt-10 scroll-mt-24">
      <ApplicantSection
        first={state.first}
        last={state.last}
        created={state.created}
        onChange={(first, last) => patch({ first, last })}
        onCreate={create}
      />

      {state.created ? (
        <>
          <div ref={walletSectionRef} className="mt-14 scroll-mt-24">
            <JourneyHeading n={2}>{WIZARD.wallet.title}</JourneyHeading>
            <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
              {WIZARD.wallet.intro}
            </p>
            <WalletChooser wallets={wallets} />
            {!format ? (
              <p className="mt-3 text-xs text-gray-500">
                This journey does not support {wallet.name}&apos;s credential
                formats yet - pick another wallet above.
              </p>
            ) : null}
          </div>

          {format ? (
            <>
              <CollectSection
                format={format}
                wallet={wallet}
                nameParams={nameParams}
                fullName={fullName}
                ticks={state.ticks}
                onTick={tick}
              />

              <JobsSection
                format={format}
                wallet={wallet}
                applied={state.applied}
                job={job}
                onOpen={setJob}
                received={received}
                onReceived={(credential, claims) =>
                  setReceived((r) => ({ ...r, [credential]: claims }))
                }
                onApplied={(id) =>
                  setState((s) => ({
                    ...s,
                    applied: { ...s.applied, [id]: true },
                  }))
                }
              />

              {state.applied.meridian && state.applied.halcyon ? (
                <DebriefSection onRestart={restart} />
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function ApplicantSection({
  first,
  last,
  created,
  onChange,
  onCreate,
}: {
  first: string;
  last: string;
  created: boolean;
  onChange: (first: string, last: string) => void;
  onCreate: () => void;
}) {
  const a = WIZARD.applicant;
  return (
    <div>
      <JourneyHeading n={1}>{a.title}</JourneyHeading>
      <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
        {a.intro}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- generated data: URI avatar */}
            <img
              src={BADGE_DEMO_AVATAR}
              alt=""
              className="h-16 w-16 rounded-full border border-gray-200"
            />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold text-gray-900">
                {`${first} ${last}`.trim() || "Your applicant"}
              </div>
              <div className="text-xs text-gray-500">Applicant (demo)</div>
            </div>
            {created ? <Chip tone="verified">{a.createdChip}</Chip> : null}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-gray-600">
              {a.firstNameLabel}
              <input
                type="text"
                value={first}
                maxLength={40}
                onChange={(e) => onChange(e.target.value, last)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-violet-400 focus:outline-none"
              />
            </label>
            <label className="block text-xs font-semibold text-gray-600">
              {a.surnameLabel}
              <input
                type="text"
                value={last}
                maxLength={40}
                onChange={(e) => onChange(first, e.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-normal text-gray-900 focus:border-violet-400 focus:outline-none"
              />
            </label>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-gray-400">
            {a.privacyNote}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h3 className="text-sm font-bold text-gray-900">{a.backstoryTitle}</h3>
          <ul className="mt-3 space-y-2.5">
            {a.backstory.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-gray-600">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-8">
        {created ? (
          <p className="max-w-3xl text-xs leading-relaxed text-gray-500">
            {a.createdNote}
          </p>
        ) : (
          <PrimaryButton onClick={onCreate}>{a.cta}</PrimaryButton>
        )}
      </div>
    </div>
  );
}

function CollectSection({
  format,
  wallet,
  nameParams,
  fullName,
  ticks,
  onTick,
}: {
  format: string;
  wallet: PersonalWallet;
  nameParams: string;
  fullName: string;
  ticks: Record<string, number>;
  onTick: (id: string) => void;
}) {
  const c = WIZARD.collect;
  // One QR at a time (the Verandia offer-card pattern): revealing an item
  // mints its offer and hides any other open QR.
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="mt-14 scroll-mt-24">
      <JourneyHeading n={3}>
        {c.title.replace("{name}", fullName || "Alex Chen")}
      </JourneyHeading>
      <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
        {c.intro}
      </p>
      <div className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2">
        {c.items.map((item) => {
          const count = ticks[item.id] ?? 0;
          return (
            <div
              key={item.id}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                {count > 0 ? (
                  <Chip tone="verified">
                    {c.doneChip}
                    {item.repeat && count > 1 ? ` ×${count}` : ""}
                  </Chip>
                ) : null}
              </div>
              <div className="mt-0.5 text-xs text-gray-500">{item.org}</div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                {item.desc}
                {item.named ? (
                  <span className="mt-1 block text-xs text-violet-600">
                    Issued to {fullName || "Alex Chen"} (demo)
                  </span>
                ) : null}
              </p>
              <div className="mt-4 border-t border-gray-100 pt-4">
                {active === item.id ? (
                  <>
                    <ServiceQr
                      serviceId={item.serviceId}
                      label={item.org}
                      format={format}
                      credential={item.credential}
                      demoParams={joinParams(
                        wallet.demoParams,
                        item.named ? nameParams : undefined,
                      )}
                      bare
                      onSettled={(o: ServiceQrOutcome) => {
                        if (o.kind === "delivered") onTick(item.id);
                      }}
                    />
                    {count === 0 ? (
                      <div className="mt-3 text-center">
                        <GhostButton onClick={() => onTick(item.id)}>
                          {c.manualTick}
                        </GhostButton>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActive(item.id)}
                    className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-6 text-gray-400 transition-colors hover:border-violet-300 hover:text-violet-600"
                  >
                    <QrCode className="h-10 w-10" aria-hidden />
                    <span className="text-xs font-medium">
                      {count > 0 && item.repeat
                        ? "Click to scan again"
                        : "Click to reveal the QR code"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-gray-500">{c.skipNote}</p>
    </div>
  );
}

function JobsSection({
  format,
  wallet,
  applied,
  job,
  onOpen,
  received,
  onReceived,
  onApplied,
}: {
  format: string;
  wallet: PersonalWallet;
  applied: Record<JobId, boolean>;
  job: JobId | null;
  onOpen: (job: JobId | null) => void;
  received: Record<string, Claim[]>;
  onReceived: (credential: string, claims: Claim[]) => void;
  onApplied: (id: JobId) => void;
}) {
  const j = WIZARD.jobs;
  const both = applied.meridian && applied.halcyon;
  const flowRef = useRef<HTMLDivElement | null>(null);
  const open = (id: JobId) => {
    onOpen(id);
    setTimeout(() => {
      flowRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };
  return (
    <div className="mt-14 scroll-mt-24">
      <JourneyHeading n={4}>{j.title}</JourneyHeading>
      <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
        {j.intro}
      </p>
      <div className="reveal-stagger mt-6 grid gap-4 sm:grid-cols-2">
        {j.ads.map((ad) => {
          const id = ad.id as JobId;
          return (
            <div
              key={ad.id}
              className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                job === id ? "border-violet-300" : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <Briefcase className="h-5 w-5" aria-hidden />
                </span>
                {applied[id] ? (
                  <Chip tone="verified">{j.appliedChip}</Chip>
                ) : null}
              </div>
              <h3 className="mt-3 text-lg font-bold text-gray-900">{ad.role}</h3>
              <div className="text-sm text-gray-500">{ad.company}</div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">
                {ad.blurb}
              </p>
              <div className="mt-5">
                {job === id ? (
                  <GhostButton
                    onClick={() => onOpen(null)}
                    icon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}
                  >
                    {j.closeCta}
                  </GhostButton>
                ) : (
                  <PrimaryButton onClick={() => open(id)}>{ad.cta}</PrimaryButton>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {!both && job === null ? (
        <p className="mt-6 text-xs text-gray-500">{j.bothNote}</p>
      ) : null}

      {/* The chosen application expands here, below the board. */}
      {job !== null ? (
        <div ref={flowRef} className="mt-8 scroll-mt-24 border-t border-gray-100 pt-8">
          {job === "meridian" ? (
            <MeridianFlow
              format={format}
              wallet={wallet}
              received={received}
              onReceived={onReceived}
              onApplied={() => onApplied("meridian")}
              onBack={() => onOpen(null)}
            />
          ) : (
            <HalcyonFlow
              format={format}
              wallet={wallet}
              onDone={() => {
                onApplied("halcyon");
                onOpen(null);
              }}
              onBack={() => onOpen(null)}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function MeridianFlow({
  format,
  wallet,
  received,
  onReceived,
  onApplied,
  onBack,
}: {
  format: string;
  wallet: PersonalWallet;
  received: Record<string, Claim[]>;
  onReceived: (credential: string, claims: Claim[]) => void;
  onApplied: () => void;
  onBack: () => void;
}) {
  const m = WIZARD.meridian;
  const [done, setDone] = useState<boolean[]>(m.requests.map(() => false));
  const [active, setActive] = useState(0);
  const finished = done.every(Boolean);

  const complete = (idx: number) => {
    setDone((d) => {
      if (d[idx]) return d;
      const next = [...d];
      next[idx] = true;
      if (next.every(Boolean)) onApplied();
      return next;
    });
    setActive((a) => (idx === a && idx < m.requests.length - 1 ? idx + 1 : a));
  };

  const request = m.requests[active];
  return (
    <div>
      <SubHeading>{m.title}</SubHeading>
      <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
        {m.intro}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          {finished ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <div className="flex items-center gap-2 text-emerald-700">
                <BadgeCheck className="h-5 w-5 shrink-0" aria-hidden />
                <h3 className="font-bold">{m.successTitle}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-emerald-800/80">
                {m.successBody}
              </p>
              <ReceivedClaims received={received} />
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Chip>
                  {m.progressLabel} {active + 1} of {m.requests.length}
                </Chip>
                {m.requests.map((r, i) => (
                  <span
                    key={r.credential}
                    className={`h-1.5 w-6 rounded-full ${
                      done[i]
                        ? "bg-emerald-400"
                        : i === active
                          ? "bg-violet-400"
                          : "bg-gray-200"
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
              <h3 className="mt-3 font-semibold text-gray-900">{request.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {request.ask}
              </p>
              <div className="mt-4">
                <ServiceQr
                  key={request.credential}
                  serviceId="meridian-tech"
                  label="Meridian Technologies (demo)"
                  format={format}
                  credential={request.credential}
                  demoParams={wallet.demoParams}
                  bare
                  onSettled={(o: ServiceQrOutcome) => {
                    if (o.kind === "presented") {
                      onReceived(request.credential, o.claims);
                      complete(active);
                    }
                  }}
                />
                <div className="mt-3 text-center">
                  <GhostButton onClick={() => complete(active)}>
                    {m.confirmManual}
                  </GhostButton>
                </div>
              </div>
            </div>
          )}
        </div>
        <div>
          <LiveTrustCard serviceId="meridian-tech" />
        </div>
      </div>
      <div className="mt-6">
        <GhostButton onClick={onBack} icon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}>
          {m.backCta}
        </GhostButton>
      </div>
    </div>
  );
}

function ReceivedClaims({ received }: { received: Record<string, Claim[]> }) {
  const entries = Object.entries(received).filter(([, claims]) => claims.length);
  if (!entries.length) return null;
  const m = WIZARD.meridian;
  return (
    <div className="mt-4 rounded-xl border border-emerald-200/60 bg-white/60 p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700/80">
        {m.receivedTitle}
      </h4>
      <dl className="mt-2 space-y-1.5">
        {entries.flatMap(([credential, claims]) =>
          claims
            .filter((c) => c.name !== "id" && c.value !== "-")
            .map((c) => (
              <div
                key={`${credential}-${c.name}`}
                className="flex items-baseline justify-between gap-4"
              >
                <dt className="text-xs font-semibold text-emerald-700/70">
                  {c.name}
                </dt>
                <dd className="break-all text-right font-mono text-xs text-emerald-900">
                  {c.value}
                </dd>
              </div>
            )),
        )}
      </dl>
    </div>
  );
}

function HalcyonFlow({
  format,
  wallet,
  onDone,
  onBack,
}: {
  format: string;
  wallet: PersonalWallet;
  onDone: () => void;
  onBack: () => void;
}) {
  const h = WIZARD.halcyon;
  const expect =
    h.expectByRail[format as keyof typeof h.expectByRail] ??
    h.expectByRail.anoncreds;
  return (
    <div>
      <SubHeading>{h.title}</SubHeading>
      <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
        {h.intro}
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-gray-900">Halcyon Talent (demo)</h3>
            <Chip tone="verified">TRUSTED</Chip>
            <Chip>no Verified Employer credential</Chip>
          </div>
          <p className="mt-2 flex items-start gap-2 text-sm leading-relaxed text-red-600">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {expect}
          </p>
          <div className="mt-4">
            <ServiceQr
              serviceId="halcyon"
              label="Halcyon Talent (demo)"
              format={format}
              credential="bhi-right-to-work"
              demoParams={wallet.demoParams}
              bare
            />
          </div>
          <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
            <h4 className="text-sm font-semibold text-gray-900">
              {h.outcomeTitle}
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              {h.outcomeBody}
            </p>
          </div>
          <div className="mt-5">
            <PrimaryButton onClick={onDone}>{h.doneCta}</PrimaryButton>
          </div>
        </div>
        <div>
          <LiveTrustCard serviceId="halcyon" />
        </div>
      </div>
      <div className="mt-6">
        <GhostButton onClick={onBack} icon={<ArrowLeft className="h-3.5 w-3.5" aria-hidden />}>
          {h.backCta}
        </GhostButton>
      </div>
    </div>
  );
}

function DebriefSection({ onRestart }: { onRestart: () => void }) {
  const d = WIZARD.debrief;
  return (
    <div className="mt-14 scroll-mt-24">
      <JourneyHeading n={5}>{d.title}</JourneyHeading>
      <p className="mt-3 max-w-3xl text-[1.02rem] leading-relaxed text-gray-600">
        {d.intro}
      </p>
      <ol className="mt-6 max-w-3xl space-y-0">
        {d.timeline.map((t, i) => (
          <li key={t} className="relative flex gap-4 pb-6 last:pb-0">
            {i < d.timeline.length - 1 ? (
              <span
                aria-hidden
                className="absolute left-[13px] top-7 h-full w-px bg-violet-100"
              />
            ) : null}
            <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-violet-700">
              {i + 1}
            </span>
            <p className="pt-1 text-sm leading-relaxed text-gray-600">{t}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8">
        <GhostButton
          onClick={onRestart}
          icon={<RotateCcw className="h-3.5 w-3.5" aria-hidden />}
        >
          {d.restartCta}
        </GhostButton>
      </div>
    </div>
  );
}
