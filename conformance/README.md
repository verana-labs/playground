# Wallet conformance

Proves, on every change, which listed wallets work against the deployed playground. Implements the
[wallet conformance testing guideline](https://github.com/verana-labs/verana-spec/pull/92).

- `profiles/` one YAML per listed wallet: rails, builds, promises, quirks. Every tier reads it; nothing
  wallet-specific is hard-coded anywhere else. Validated by `app/lib/wallet-profiles.ts` in the main CI.
- `networks.yaml` the networks a run can target. `CONFORMANCE_NETWORK=testnet-v3` selects one; by
  default every testable network runs and the others are reported as not yet testable. A network resolves
  trust through its resolver (v3) or its indexer (v4); `casts` limits it to the casts it has deployed
  (devnet v4: demo, vesta, verandia, cexa and bhi), whatever `CONFORMANCE_CASTS` says.
- `tier1/` contract checks: what a wallet fetches, asserted without running a wallet.
- `tier2/` headless OpenID4VCI/OpenID4VP flows with the wallets' own libraries, asserting the resolver inputs of
  the verdict. Behind `CONFORMANCE_MINTS=1`. See "Tier 2" below.
- `tier3/` wallet apps on a cloud Android emulator: the QR of a freshly minted offer or request goes into the
  emulator's virtual camera, the wallet scans it with its own scanner, and the outcome is read from the service API.
  It proves rendering and gating, nightly, one job per wallet and network. See "Tier 3" below.

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
not read what it needed and says why) or `not-testable` (a network without a playground or a trust backend). Cells are
sorted by code point, so `diff` between two `results.json` shows exactly what changed.

Environment: `CONFORMANCE_NETWORK` selects one network; `CONFORMANCE_CASTS` limits the casts that receive
live mints (default `demo,eventos`); `CONFORMANCE_MINTS=1` enables the checks that create sessions on the
services (on in every CI run); `CONFORMANCE_K8S_NAMESPACE` enables the cluster read of the image tag actually
serving and the detection of services that rolled during the run (on in every CI run).

## Gate

CI never trusts a tier's exit code. `.github/workflows/conformance.yml` runs tier 1 and tier 2 in parallel on the
nightly schedule, on dispatch, on push to `main` or `v4` and on same-repository pull requests that touch conformance,
the wallet list or the profile schema. The branch selects the network and its secrets as in `docs/networks.md`:
`main` tests `testnet-v3`, `v4` tests `devnet-v4`, and a pull request tests the network of its base branch. The tier 2
job installs the pinned eudi-dev release (checked against its `checksums.txt`) and points `EUDI_DEV_BIN` at it. The
`gate` job then merges the `latest.json` of every tier artifact and runs:

    node --experimental-strip-types lib/gate.ts --issues known-issues.yaml --results <latest.json>... --require-tier t1 --require-tier t2

It fails on a `broken` or `unknown` cell that no active entry in `known-issues.yaml` covers, on a required tier with
no cells, and, on a nightly, on a cell of a tier that ran and that existed in the previous nightly of the same branch
and is gone. Cron only fires on `main`, so the scheduled run also dispatches the workflow on `v4` with `nightly: true`;
both runs are named `conformance nightly`, which is how the gate finds its baseline. Tier 3 runs only when dispatched
with `tier3: true`: it calls `conformance-tier3.yml` and the gate then adds `--require-tier t3`; otherwise t3 cells are
gated when present and never required.

An entry names the cells it covers (`tier` and `check` required, then `network`, `cast`, `service`, `wallet`, `build`,
`scenario`, each a value or a list; every entry names its network), a `cause` and an `expires` date; after that date
its cells fail again. The gate lists the entries that matched nothing in a run of their tier and network so they can
be deleted. Add an entry only for a failure that is understood and has an owner; never widen an entry to silence a new
cell.

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

The headless holder shares the Credo/Animo library family with vs-agent, so a bug in both would pass unseen.
`tier2/reference-holder.test.ts` runs the demo issue and present scenarios a second time through
[eudi-dev](https://github.com/dominikschlosser/eudi-dev), an independent Go wallet certified by the OpenID Foundation
for OpenID4VCI 1.0 and HAIP, and writes `reference-holder` cells. It calls `eudi wallet accept --auto-accept --json
--mode strict` from `EUDI_DEV_BIN` (default `eudi` on `PATH`), one run at a time. A cell is `works` when eudi-dev
receives a credential whose signature it verifies, or when the verifier accepts its presentation and records
`verified`. A missing binary or a timeout is `unknown`, never `works`.

`tier2/reference-holder-deep.test.ts` runs the same holder over the whole playground, in strict mode. Nothing in it
names a service or a credential: the credentials are the keys of the `CREDENTIALS` registry of
`app/api/demo/[serviceId]/route.ts`, the services are the OpenID4VC services of the casts in scope, and before any check
it asks `/api/demo` which services mint which credential (`reference-holder-mint`, one cell per credential, `unknown`
when no issuer or no verifier mints it on the network). A new use case is picked up as soon as the route mints it. Mint
parameters come from `scenarios.yaml`. Cells name the credential and the variant in `scenario`, as
`<credential>@<variant>`, one check id per concern:

- `reference-holder-issue`: the offer through a one-shot strict accept, then through a strict wallet server at
  `--vci-version 1.1`, `--key-attestation-level none` and `iso_18045_high`. A key attestation variant is `not-testable`
  when the metadata eudi-dev received offers no attestation proof type and no `key_attestations_required`.
- `reference-holder-validate`: `eudi decode` and `eudi validate` of the received credential (type, expiry, disclosure
  digests, signature, status list when present) and its `vct#integrity` against the Type Metadata it names.
- `reference-holder-decode`: on an issuer, `eudi decode` of its signed metadata (signature, plus the `typ`, `alg`, `sub`
  and `credential_issuer` rules of the strict wallet) and the offered configurations it must list; on a verifier, each
  request format (`dcql`, `dcql+x5c`, `pe`, `pe+x5c`) decoded and validated by a strict wallet server with an empty
  wallet, so nothing is presented.
- `reference-holder-present`: each request format answered with a credential from the first issuer that minted one.
  eudi-dev implements OpenID4VP 1.0 only, so a `presentation_definition` request (`?query=pe`) or a DID-signed request is
  `incompatible-by-design`, with its reference.
- `reference-holder-haip`: issuance and the `x509_hash` DCQL request through `eudi wallet serve --haip --mode strict`.
  Since eudi-dev 2.6.1 ([eudi-dev#23](https://github.com/dominikschlosser/eudi-dev/pull/23)) the one-shot
  `wallet accept --haip` applies the same HAIP checks and refuses the devnet demo issuer and verifier for the same reasons.
- `reference-holder-replay-offer`, `reference-holder-replay-presentation`, `reference-holder-garbage-request`: a redeemed
  offer (by URI and by its pre-authorized code), an answered request (by `request_uri` and inline) and an unknown
  `request_uri` must be refused by the agent; a success or a 5xx is `broken`, eudi-dev stopping on its own is `unknown`.
- `reference-holder-error-response`: the verifier answers 200 to the `access_denied` error the empty wallet sends. When
  strict eudi-dev refuses a request before answering it (a draft 21 request, say), the error comes from a debug-mode
  wallet instead and the cell says so.
- `reference-holder-expired-request`, only with `CONFORMANCE_SLOW=1`: one request per verifier, presented after its `exp`
  (about five minutes of waiting), must be refused.

No offer carries a `tx_code` today; the issue cell records whether one did. Mints are spaced one second apart. One
eudi-dev task runs at a time on the host (a lock file in the temp directory), so at most two eudi-dev processes run, a
wallet server and the CLI driving it, and presentations pass an explicit free `--port` instead of 8085.

## Tier 3

`WALLET=<profile id> CONFORMANCE_NETWORK=<network id> bash tier3/run.sh` installs the wallet's build for that network,
onboards it and runs every scenario of `scenarios.yaml` the profile supports, on an Android emulator.
`TIER3_DRY_RUN=1` resolves the same plan (build, APK, signer, scenarios, the mint and state URLs it would call),
prints it and stops before touching a device or a service.

The build comes from the profile. A build may name the networks it targets (`networks: [devnet-v4]`); one without
`networks` targets every network. On a network the listed build does not target, the build of the same kind that
names it stands in, and two builds of one kind may not share a network. When no build targets the network, every
scenario is `not-testable`. Everything wallet-specific lives under the build's `device`:

    delivery: scan            # or link, when the wallet has no scanner path
    onboard:                  # steps to a usable home screen, run once after install
      - tap: get started      # taps the first enabled control whose label starts with this
      - type: secret          # types device.secret
      - wait: 30              # seconds
    scan:
      issue: [{ tap: documents }, { tap: scan qr }]
      present: [{ tap: home }, { tap: authenticate }, { tap: scan qr }]

Scenarios run when their service belongs to a cast in scope: the network's `casts`, intersected with
`CONFORMANCE_CASTS` (default `demo` for tier 3). Issue scenarios run before presentations. A scenario is
`incompatible-by-design` when the build declares it, `not-testable` when it needs the eventos login, scan steps the
profile lacks, or a credential no planned scenario issues. A wallet without the `openid4vc-sdjwt` rail or without
`onboard` steps is skipped with no cell, never guessed at. A build may pin `signerSha256`, the APK signing
certificate; when it does not match what was downloaded every scenario is `unknown` and none runs.

Each scenario records one cell with the build version, the delivery used, the server state, what the accept control
reported and the screenshot, and a verdict of `works` (the server completed, or a refused payload stayed blocked),
`broken` (the wallet showed an error, accepted an untrusted payload or blocked a trusted one) or `unknown` with its
reason. Cells land in `results/<run id>/cells-t3-<network>-<wallet>.jsonl` and `results.json`. `tier3/fixtures.sh`
checks the screen reader against saved dumps and the planner against fixture profiles, without an emulator.
`.github/workflows/conformance-tier3.yml` runs one job per wallet and network (`workflow_call` or dispatch with
`network` and `wallets`), boots the emulator only when the plan has something to run, and uploads
`conformance-t3-<network>-<wallet>`.
