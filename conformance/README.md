# Trust checks

Checks that the deployed playground services answer the Verana trust questions the way each demo expects. Wallet
protocol conformance is out of scope: the playground supports its five listed wallets and leaves OpenID4VC
conformance to the underlying libraries.

- `profiles/` one YAML per listed wallet: rails, builds, promises. The site reads it for the wallet listing, and
  `app/lib/wallet-profiles.ts` validates it in the main CI.
- `networks.yaml` the networks a run can target. `CONFORMANCE_NETWORK=testnet-v4` selects one; by default every
  testable network runs and the others are reported as not yet testable.
- `scenarios.yaml` the issue and present scenarios and what the resolver must answer for each.
- `tier1/` checks without a wallet: the did:webvh log of each service is signed (`service-dids`), the resolver
  answers on each network (`networks`), and the version the cluster actually serves (`serving-version`).
- `tier2/` runs each scenario once as a headless OpenID4VCI/OpenID4VP holder and checks the resolver answers Q1,
  Q2 and Q3. Behind `CONFORMANCE_MINTS=1`. See "Tier 2" below.

This directory is its own npm package so that the Tier 2 native dependencies never enter the site build.

    cd conformance && npm ci && npm test

Hazards the checks encode, so nobody rediscovers them: the resolver caches a negative verdict for an hour (refresh
before asserting); a green workflow is not a deployment (the version actually serving is read from the cluster);
casts drift in version (every result names the tag it ran against); cast rolls share one concurrency group and must
be dispatched one at a time.

## Reading a run

`npm run t1` writes `results/<run id>/results.json` and copies it to `results/latest.json`; `npm run summary`
renders the latest run as markdown. Every cell names its check, the clause it proves, the network, the service and,
for Tier 2, the scenario, with one outcome: `works`, `broken`, `unknown` (the check could not read what it needed
and says why) or `not-testable` (a network without resolver or casts). Cells are sorted by code point, so `diff`
between two `results.json` shows exactly what changed.

Environment: `CONFORMANCE_NETWORK` selects one network; `CONFORMANCE_CASTS` limits the casts that receive live
mints; `CONFORMANCE_MINTS=1` enables the checks that create sessions on the services (off by default, on in the
verana-deploy runs); `CONFORMANCE_K8S_NAMESPACE` enables the cluster read of the image tag actually serving and the
detection of services that rolled during the run (verana-deploy runs only).

**Where each part runs.** The unit tests of the helpers (`npm run test:lib`) run in the CI of this repository on
every change. The live tiers (`t1`, `t2`) check the deployed services, so they run in verana-labs/verana-deploy,
which deploys the playground: its workflow **Playground Conformance** runs them nightly and after each **Playground
Setup**, with its own cast definitions (`playground/casts/`, `CONFORMANCE_CASTS_DIR`), the vs-agent version it pins
(`playground/versions.env`) and its cluster access. Locally, set `CONFORMANCE_CASTS_DIR` to the `playground/casts/`
of a verana-deploy clone.

## Tier 2

`npm run t2` (`CONFORMANCE_MINTS=1`) runs the OpenID4VCI and OpenID4VP protocols end to end as a headless holder
(`@openid4vc/*`, `@sd-jwt/sd-jwt-vc`), once per scenario on the `openid4vc-sdjwt` rail, and checks the resolver
answers: the Q1 trust status by field, Q2 and Q3 from the issuer and verifier authorization endpoints, and the
service's own exchange state (`done`, `verified`). A scenario is `works` only when the protocol completes and every
resolver answer matches what the scenario expects; a flow that completes but disagrees with the resolver is
`broken` with the resolver evidence as the cause.

The trust result does not depend on the wallet, so Tier 2 runs each scenario one time, with the services' default
request parameters. The headless holder never decides accept or refuse: whether a wallet's UI reads the same
answers and gates Add/Share on them is checked by hand on a device, see [`docs/testing.md`](../docs/testing.md).
The DIDComm/AnonCreds rail (Hologram) is not covered yet.
