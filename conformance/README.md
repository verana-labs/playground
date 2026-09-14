# Wallet conformance

Proves, on every change, which listed wallets work against the deployed playground. Implements the
[wallet conformance testing guideline](https://github.com/verana-labs/verana-spec/pull/92).

- `profiles/` one YAML per listed wallet: rails, builds, promises, quirks. Every tier reads it; nothing
  wallet-specific is hard-coded anywhere else. Validated by `app/lib/wallet-profiles.ts` in the main CI.
- `networks.yaml` the networks a run can target. `CONFORMANCE_NETWORK=testnet-v3` selects one; by
  default every testable network runs and the others are reported as not yet testable.
- `tier1/` (planned, next PR) contract checks: what a wallet fetches, asserted without running a wallet.
- `tier2/` (planned) headless flows with the wallets' libraries, asserting the resolver inputs of the verdict.
- `tier3/` (planned) device spot-checks: rendering and gating only.

This directory is its own npm package so that the Tier 2 native dependencies never enter the site build.

    cd conformance && npm ci && npm test

Hazards the checks encode, so nobody rediscovers them: the resolver caches a negative verdict for an
hour (refresh before asserting); a green workflow is not a deployment (the version actually serving is
read from the cluster); casts drift in version (every result names the tag it ran against); cast rolls
share one concurrency group and must be dispatched one at a time.

## Reading a run

`npm run t1` writes `results/<run id>/results.json` and copies it to `results/latest.json`; `npm run summary`
renders the latest run as markdown (CI puts it in the job summary). Every cell names its check, the clause it
proves, the network, the service and, for wallet-specific checks, the wallet, build and scenario, with one
outcome: `works`, `broken`, `incompatible-by-design` (with cause and reference), `unknown` (the check could
not read what it needed and says why) or `not-testable` (a network without resolver or casts). Cells are
sorted by code point, so `diff` between two `results.json` shows exactly what changed.

Environment: `CONFORMANCE_NETWORK` selects one network; `CONFORMANCE_CASTS` limits the casts that receive
live mints (default `demo,eventos`); `CONFORMANCE_MINTS=1` enables the checks that create sessions on the
services (off in the per-change CI job, on nightly); `CONFORMANCE_K8S_NAMESPACE` enables the cluster read of
the image tag actually serving and the detection of services that rolled during the run (nightly only).
