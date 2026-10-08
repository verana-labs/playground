import { describe, expect, it } from "vitest";
import { listCastServices, type CastService } from "../lib/cast-services";
import { createHolderKey } from "../lib/holder/keys";
import { receiveCredential } from "../lib/holder/oid4vci";
import { presentCredential } from "../lib/holder/oid4vp";
import { mintsEnabled } from "../lib/mints";
import { testableNetworks, type Network } from "../lib/network";
import { mintIssuance, mintPresentation, presentationState, type Mint } from "../lib/playground-client";

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

type Parties = { network: Network; issuer: CastService; verifier: CastService };

function partiesOn(network: Network): Parties {
  const services = listCastServices(network);
  const find = (id: string): CastService => required(services.find((s) => s.id === id), `${network.id}: ${id} not found in the demo cast`);
  return { network, issuer: find("demo-issuer-accredited"), verifier: find("demo-verifier-accredited") };
}

async function pollUntilDone<T extends { done: boolean }>(pollFn: () => Promise<T>, tries = 30, delayMs = 2000): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const state = await pollFn();
    if (state.done) return state;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw new Error("presentation did not complete in time");
}

async function runRail({ network, issuer, verifier }: Parties, demoParams: string) {
  const key = await createHolderKey();

  const issuanceMint: Mint = await mintIssuance(network, issuer, { format: "openid4vc-sdjwt", demoParams: "signer=x5c" });
  const received = await receiveCredential(issuanceMint.url, key);

  const presentationMint: Mint = await mintPresentation(network, verifier, { format: "openid4vc-sdjwt", demoParams });
  const presented = await presentCredential(presentationMint.url, received.credential, key);

  const state = await pollUntilDone(() => presentationState(network, verifier, presentationMint));
  return { received, presented, state };
}

async function runRailWithRetry(parties: Parties, demoParams: string) {
  try {
    return await runRail(parties, demoParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/HTTP 5\d\d/.test(message)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 60_000));
    return runRail(parties, demoParams);
  }
}

for (const network of testableNetworks()) {
  describe.skipIf(!mintsEnabled())(`${network.id} headless openid4vc holder [live]`, () => {
    const parties = partiesOn(network);

    it(
      "completes issuance and x5c/dcql presentation (signer=x5c)",
      async () => {
        const { presented, state } = await runRailWithRetry(parties, "signer=x5c");
        expect(presented.query).toBe("dcql");
        expect(presented.clientId.startsWith("x509_hash:")).toBe(true);
        expect(presented.vctValues.length).toBeGreaterThan(0);
        expect(state.verified).toBe(true);
      },
      180_000,
    );

    it(
      "completes issuance and presentation-exchange presentation (query=pe, Inji rail)",
      async () => {
        const { presented, state } = await runRailWithRetry(parties, "query=pe");
        expect(presented.query).toBe("presentation_exchange");
        expect(presented.clientId.startsWith("did:")).toBe(true);
        expect(state.verified).toBe(true);
      },
      180_000,
    );

    it(
      "completes issuance and no-signer dcql presentation (swiyu store rail)",
      async () => {
        const { presented, state } = await runRailWithRetry(parties, "");
        expect(presented.query).toBe("dcql");
        expect(presented.clientId).toContain("did:webvh:");
        expect(state.verified).toBe(true);
      },
      180_000,
    );
  });
}
