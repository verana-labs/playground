import path from "node:path";
import { afterAll, describe, inject, it } from "vitest";
import { effectiveDemoParams, getWalletProfile, networkBuild, type WalletBuild } from "../../app/lib/wallet-profiles";
import { inScope, listCastServices, type CastService } from "../lib/cast-services";
import { describeScreen, hostedWalletUrl, openWwWallet, type Control, type Screen, type WwWallet } from "../lib/holder/wwwallet";
import { mintsEnabled } from "../lib/mints";
import type { Network } from "../lib/network";
import {
  issuanceState,
  mintIssuance,
  mintPortalLogin,
  mintPresentation,
  portalLoginState,
  presentationState,
  type Mint,
  type PortalLogin,
} from "../lib/playground-client";
import { check, type Verdict } from "../lib/report";
import { profilesDir } from "../lib/profiles-dir";
import { describeNetworks } from "../lib/suite";

const RAIL = "openid4vc-sdjwt";
const WALLET = "wwwallet";
const STEP_TIMEOUT_MS = 600_000;
const REFUSAL_SETTLE_MS = 3_000;

type Step = {
  scenario: string;
  service: string;
  kind: "offer" | "request" | "login";
  expect: "accept" | "refuse";
  credential?: string;
  params?: Record<string, string>;
  login?: PortalLogin & { decision: string };
  needs?: string;
};
type Journey = { cast: string; steps: Step[] };

const offer = (service: string, credential: string, params?: Record<string, string>): Step => ({ scenario: `${credential}-offer`, service, kind: "offer", expect: "accept", credential, params });
const request = (service: string, credential: string, expect: Step["expect"], needs: string, params?: Record<string, string>): Step => ({
  scenario: `${credential}-request`,
  service,
  kind: "request",
  expect,
  credential,
  params,
  needs,
});
const verandiaLogin = (portal: string, mode: "citizen" | "company"): Step => {
  const credential = mode === "citizen" ? "verandia-citizen-id" : "verandia-legal-rep";
  return {
    scenario: `${credential}-login`,
    service: portal,
    kind: "login",
    expect: "accept",
    login: { route: "verandia-login", params: { portal, mode }, decision: mode },
    needs: `${mode === "citizen" ? "civil-registry" : "business-registry"}/${credential}-offer`,
  };
};

const JOURNEYS: Journey[] = [
  {
    cast: "vesta",
    steps: [
      offer("vesta", "ecs-badge"),
      { scenario: "ecs-badge-login", service: "vesta-portal", kind: "login", expect: "accept", login: { route: "portal-login", params: {}, decision: "employee" }, needs: "vesta/ecs-badge-offer" },
      offer("zenith", "ecs-badge"),
      offer("umbra", "ecs-badge"),
    ],
  },
  {
    cast: "verandia",
    steps: [
      offer("civil-registry", "verandia-citizen-id"),
      offer("business-registry", "verandia-legal-rep"),
      verandiaLogin("tax-buro", "citizen"),
      verandiaLogin("tax-buro", "company"),
      verandiaLogin("meridian-bank", "citizen"),
      verandiaLogin("meridian-bank", "company"),
      request("quickcash", "verandia-citizen-id", "refuse", "civil-registry/verandia-citizen-id-offer"),
    ],
  },
  {
    cast: "cexa",
    steps: [
      offer("aurum", "cexa-kyc"),
      request("borealis", "cexa-kyc", "accept", "aurum/cexa-kyc-offer", { action: "request" }),
      request("novara", "cexa-kyc", "accept", "aurum/cexa-kyc-offer", { action: "request" }),
      request("darkpool", "cexa-kyc", "refuse", "aurum/cexa-kyc-offer", { action: "request" }),
    ],
  },
  {
    cast: "bhi",
    steps: [
      offer("northbank", "bhi-right-to-work", { firstName: "Alex", surname: "Chen" }),
      offer("northbank", "bhi-employment"),
      offer("caledonian", "bhi-qualification"),
      offer("cirrus", "bhi-qualification"),
      request("meridian-tech", "bhi-right-to-work", "accept", "northbank/bhi-right-to-work-offer"),
      request("meridian-tech", "bhi-employment", "accept", "northbank/bhi-employment-offer"),
      request("meridian-tech", "bhi-qualification", "accept", "caledonian/bhi-qualification-offer"),
      request("halcyon", "bhi-right-to-work", "refuse", "northbank/bhi-right-to-work-offer"),
    ],
  },
];

type State = { done: boolean; state?: string | null; verified?: boolean; decision?: string; trustVerdict?: string | null };

async function pollState(read: () => Promise<State>, tries = 30, delayMs = 2000): Promise<State> {
  let state = await read();
  for (let i = 1; i < tries && !state.done; i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    state = await read();
  }
  return state;
}

async function mintFor(network: Network, service: CastService, step: Step, demoParams: string): Promise<Mint> {
  if (step.login) return mintPortalLogin(network, step.login, RAIL);
  if (step.kind === "offer") return mintIssuance(network, service, { format: RAIL, demoParams, credential: step.credential, params: step.params });
  const extra = new URLSearchParams(step.params ?? {}).toString();
  return mintPresentation(network, service, { format: RAIL, demoParams: [demoParams, extra].filter(Boolean).join("&"), credential: step.credential });
}

function stateReader(network: Network, service: CastService, step: Step, mint: Mint): () => Promise<State> {
  if (step.login) {
    const login = step.login;
    return () => portalLoginState(network, login, mint);
  }
  return step.kind === "offer" ? () => issuanceState(network, service, mint) : () => presentationState(network, service, mint);
}

function trustProblems(step: Step, screen: Screen, control: Control): string[] {
  const role = step.kind === "offer" ? "issuer" : "verifier";
  if (screen.failure) return [`wwWallet stopped before its trust screen: ${screen.failure}`];
  if (step.expect === "accept") {
    const problems: string[] = [];
    if (screen.verdict !== "TRUSTED") problems.push(`trust screen verdict ${screen.verdict ?? "none"}, expected TRUSTED`);
    if (screen.authorized !== true) problems.push(`trust screen does not say the service is an authorized ${role}`);
    if (control !== "enabled") problems.push(`${step.kind === "offer" ? "Continue" : "Next"} is ${control}`);
    return problems;
  }
  const refused = screen.authorized === false || screen.verdict === "UNTRUSTED";
  return [
    ...(refused ? [] : [`trust screen shows ${screen.verdict ?? "no verdict"} and an authorized ${role}, expected a refusal`]),
    ...(control === "disabled" ? [] : [`${step.kind === "offer" ? "Continue" : "Next"} is ${control} on a refused ${role}`]),
  ];
}

async function readState(read: () => Promise<State>, poll: boolean): Promise<{ state: State | null; problem: string | null }> {
  try {
    return { state: poll ? await pollState(read) : await read(), problem: null };
  } catch (e) {
    return { state: null, problem: `the playground state route failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function runStep(network: Network, walletOf: () => Promise<WwWallet>, service: CastService, step: Step, demoParams: string, shot: (name: string) => Promise<string>): Promise<Verdict> {
  const mint = await mintFor(network, service, step, demoParams);
  const wallet = await walletOf();
  const screen = await wallet.open(mint.url);
  const control = await wallet.control();
  const screenshots = [await shot("consent")];
  const problems = trustProblems(step, screen, control);
  const evidence: Record<string, unknown> = {
    screen: describeScreen(screen, control),
    verdict: screen.verdict,
    authorized: screen.authorized,
    credential: screen.credential,
    control,
    mint: { kind: mint.kind, id: mint.id },
    screenshots,
  };
  const read = stateReader(network, service, step, mint);

  if (step.expect === "refuse") {
    await wallet.cancel();
    await new Promise((resolve) => setTimeout(resolve, REFUSAL_SETTLE_MS));
    const { state, problem } = await readState(read, false);
    if (problem) problems.push(problem);
    if (state?.done || state?.verified) problems.push(`the service recorded ${state.done ? "a completed" : "a verified"} exchange the wallet had to refuse`);
    return { outcome: problems.length ? "broken" : "works", cause: problems.join(" | ") || undefined, evidence: { ...evidence, state } };
  }

  if (problems.length) return { outcome: "broken", cause: problems.join(" | "), evidence };

  const result = step.kind === "offer" ? await wallet.accept() : await wallet.share();
  if (result?.failure) problems.push(`wwWallet reported: ${result.failure}`);
  if (step.kind !== "offer" && !result?.shared) problems.push("wwWallet did not report a successful sharing");
  const { state, problem } = await readState(read, true);
  screenshots.push(await shot("result"));
  if (problem) problems.push(problem);
  if (state && !state.done) problems.push(`the service state is ${state.state ?? "unknown"}, not done`);
  if (state && step.kind !== "offer" && state.verified !== true) problems.push("the service reports verified: false");
  if (state && step.login && state.decision !== step.login.decision) problems.push(`login decision ${state.decision ?? "none"}, expected ${step.login.decision}`);
  if (state && step.login?.route === "verandia-login" && state.trustVerdict !== "TRUSTED_AUTHORIZED") problems.push(`trust verdict ${state.trustVerdict ?? "none"}, expected TRUSTED_AUTHORIZED`);
  return {
    outcome: problems.length ? "broken" : "works",
    cause: problems.join(" | ") || undefined,
    evidence: { ...evidence, result: result ? describeScreen(result, control) : "dialog closed", state: state && { done: state.done, state: state.state, verified: state.verified, decision: state.decision, trustVerdict: state.trustVerdict } },
  };
}

describe.skipIf(!mintsEnabled())("tier 2 wwWallet journeys [CONF-T2-1]", () => {
  describeNetworks("tier 2 wwWallet journeys", (network) => {
    const profile = getWalletProfile(WALLET, profilesDir());
    const build: WalletBuild | undefined = profile && networkBuild(profile, network.id);
    const services = listCastServices(network);
    const wallets = new Map<string, Promise<WwWallet>>();
    const held = new Set<string>();
    const runDir = inject("runDir");

    afterAll(async () => {
      for (const wallet of wallets.values()) await wallet.then((w) => w.close()).catch(() => undefined);
    });

    const walletFor = (cast: string): Promise<WwWallet> => {
      let wallet = wallets.get(cast);
      if (!wallet) {
        wallet = openWwWallet(hostedWalletUrl(network), path.join(runDir, WALLET, cast));
        wallets.set(cast, wallet);
      }
      return wallet;
    };

    for (const journey of JOURNEYS) {
      for (const step of journey.steps) {
        const service = services.find((s) => s.id === step.service && s.cast === journey.cast);
        const runs = network.protocol === "v4" && Boolean(network.casts?.includes(journey.cast)) && Boolean(service && inScope(service)) && Boolean(profile && build);
        const key = `${step.service}/${step.scenario}`;
        it.skipIf(!runs)(
          `${journey.cast} ${key} (${step.expect})`,
          () =>
            check(
              {
                tier: "t2",
                check: "wwwallet-journey",
                clause: "CONF-T2-1",
                network: network.id,
                cast: journey.cast,
                service: step.service,
                wallet: WALLET,
                build: build?.kind,
                scenario: step.scenario,
              },
              async (): Promise<Verdict> => {
                if (!service || !profile || !build) throw new Error(`${key} has no service or wallet build on ${network.id}`);
                if (step.needs && !held.has(step.needs)) return { outcome: "unknown", cause: `needs the credential of ${step.needs}, which wwWallet did not receive` };
                const demoParams = effectiveDemoParams(profile, build, RAIL);
                const walletOf = (): Promise<WwWallet> => walletFor(journey.cast);
                const shot = async (name: string): Promise<string> => path.relative(runDir, await (await walletOf()).screenshot(`${step.service}-${step.scenario}-${name}`));
                let verdict: Verdict;
                let attempts = 1;
                try {
                  verdict = await runStep(network, walletOf, service, step, demoParams, shot);
                } catch (first) {
                  attempts = 2;
                  try {
                    verdict = await runStep(network, walletOf, service, step, demoParams, shot);
                  } catch (second) {
                    const [a, b] = [first, second].map((e) => (e instanceof Error ? e.message : String(e)));
                    throw new Error(a === b ? `twice: ${b}` : `two attempts failed: ${a} | ${b}`);
                  }
                }
                if (step.kind === "offer" && verdict.outcome === "works") held.add(key);
                return { ...verdict, evidence: { ...verdict.evidence, attempts } };
              },
            ),
          STEP_TIMEOUT_MS,
        );
      }
    }
  });
});
