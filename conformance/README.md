# Wallet conformance

Proves, on every change, which listed wallets work against the deployed playground. Implements the
[wallet conformance testing guideline](https://github.com/verana-labs/verana-spec/pull/92).

- `profiles/` one YAML per listed wallet: rails, builds, promises, quirks. Every tier reads it; nothing
  wallet-specific is hard-coded anywhere else. Validated by `app/lib/wallet-profiles.ts` in the main CI.
- `networks.yaml` the networks a run can target. `CONFORMANCE_NETWORK=testnet-v3` selects one; by
  default every testable network runs and the others are reported as not yet testable.
- `tier1/` contract checks: what a wallet fetches, asserted without running a wallet.
- `tier2/` headless OpenID4VCI/OpenID4VP flows with the wallets' own libraries, asserting the resolver inputs of
  the verdict. Behind `CONFORMANCE_MINTS=1`. See "Tier 2" below.
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

## Gate

CI never trusts a tier's exit code. `.github/workflows/conformance.yml` runs tier 1 and tier 2 in parallel on the
nightly schedule, on dispatch, on push to `main` and on same-repository pull requests that touch conformance, the
wallet list or the profile schema. The `gate` job then merges their `latest.json` files and runs:

    node --experimental-strip-types lib/gate.ts --issues known-issues.yaml --results <latest.json>... --require-tier t1 --require-tier t2

It fails on a `broken` or `unknown` cell that no active entry in `known-issues.yaml` covers, on a required tier with
no cells, and, on the nightly only, on a cell that existed in the previous nightly and is gone. An entry names the
cells it covers (`tier` and `check` required, then `network`, `cast`, `service`, `wallet`, `build`, `scenario`, each a
value or a list), a `cause` and an `expires` date; after that date its cells fail again. The gate lists entries that
matched nothing so they can be deleted. Add an entry only for a failure that is understood and has an owner; never
widen an entry to silence a new cell.

## Tier 2

`npm run t2` (`CONFORMANCE_MINTS=1`) runs the OpenID4VCI and OpenID4VP protocols end to end as a
headless holder (`@openid4vc/*`, `@sd-jwt/sd-jwt-vc`), once per listed wallet build on the `openid4vc-sdjwt` rail
and canonical scenario, and asserts the resolver inputs a real wallet's accept/refuse verdict depends on: the Q1
trust status by field, Q2 and Q3 from the issuer/verifier authorization endpoints, and the service's own exchange
state (`done`, `verified`, and for eventos the `decision`). A scenario is `works` only when the protocol completes
and every resolver answer matches what the scenario expects; a flow that completes but disagrees with the
resolver is `broken` with the resolver evidence as the cause, never weakened to pass.

Tier 2 proves the protocol and the trust inputs are correct end to end. It does not prove a wallet: the headless
holder never decides accept or refuse, it always completes the flow so the resolver assertions can run regardless
of what a real wallet's own policy would have done. Whether a wallet's UI reads the same inputs correctly and
gates Add/Share on them is Tier 3, the only tier that runs against a device. The DIDComm/AnonCreds rail
(Hologram) is not covered yet.
