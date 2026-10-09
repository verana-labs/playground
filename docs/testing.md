# Testing the playground

How we know that the listed wallets work against the deployed playground, and what to run before telling anyone
they do. There are three layers. The first two run in GitHub Actions, the third one is a person with a phone.

| Layer | When | What it proves | Where |
|---|---|---|---|
| CI | every pull request and push | the site builds, the listing is valid and pinned, the wallet profiles agree with what the services offer, the contract checks pass | `.github/workflows/ci.yml` |
| Nightly conformance | 03:17 UTC every day, or by hand | the same contract checks plus live OpenID4VCI and OpenID4VP flows with a headless holder per listed wallet build | `.github/workflows/conformance.yml` |
| Device pass (Tier 3) | after a new wallet build, a new vs-agent image on the casts, or a chain reset | the real wallet shows the trust card, gates Add and Share on it, and the service sees the exchange complete | this document |

The automated layers are described in detail in [`conformance/README.md`](../conformance/README.md), and the
reasoning behind them in the [wallet conformance testing guideline](https://github.com/verana-labs/verana-spec/pull/92).

## CI on every change

`ci.yml` runs two jobs.

- `ci`: lint, typecheck, `validate:registry`, the site unit tests and `next build`, then in `conformance/` its
  typecheck and `test:lib`. `test:lib` validates every wallet profile, compares each listed wallet's
  `capabilities` with `conformance/devnet-services.yaml` (a recommended or compatible wallet that will not work
  fails the build), and refuses mutable or wrong links in the listing (`listing-exceptions.yaml` holds the few
  allowed ones, each with an expiry date).
- `conformance-t1`: the Tier 1 contract checks against the live network without creating sessions. The verdict
  table lands in the job summary and `results.json` is uploaded as an artifact.

A red `ci` job is always ours to fix. A red `conformance-t1` cell names the check, the service and the wallet; when
the cause is on the service side, record it as a gap in `devnet-services.yaml` with a reference and a re-check
date instead of weakening the check.

## Nightly conformance

`conformance.yml` runs Tier 1 and Tier 2 with `CONFORMANCE_MINTS=1`, so it creates real sessions on the casts, and
reads the image tag actually serving from the cluster. Tier 2 completes every flow headless and asserts the
resolver inputs a wallet decides on (trust status, issuer and verifier authorization) plus the service's own
exchange state. It does not prove a wallet's UI, and it does not cover the DIDComm/AnonCreds rail yet. Both are
the device pass.

Dispatch it by hand after a cast rollout. Casts share one concurrency group, so roll them one at a time and run
conformance once they are all up.

## Device pass

Run it on a physical phone with the wallet builds the listing links to, one wallet at a time. Use the demo
network only and never real personal data.

### What to run

The personal-wallets demos, for each of the five integrated wallets (Hologram, Inji, EUDI, swiyu, wwWallet):

| Scenario | Service | Expected |
|---|---|---|
| S1 issue, accredited | `demo-issuer-accredited` | trust card TRUSTED, "authorized issuer", credential stored, service state `done`/`Completed` |
| S2 issue, unaccredited | `demo-issuer-unaccredited` | "not an authorized issuer", Add/Accept disabled (Hologram warns and asks "Accept anyway (unsafe)") |
| S3 present, accredited | `demo-verifier-accredited` | "authorized verifier", proof `verified: true` with the claims |
| S4 present, unaccredited | `demo-verifier-unaccredited` | "not an authorized verifier", Share disabled (Hologram warns and asks "Share anyway (unsafe)") |

Then one issuance and one presentation per use case, on each rail a wallet supports:

| Use case | Issue | Present |
|---|---|---|
| Vesta | `vesta`, credential `ecs-badge` | `vesta-portal`, `ecs-badge`, `action=request` |
| Verandia | `civil-registry`, `verandia-citizen-id` | `tax-buro`, `verandia-citizen-id`, `action=request` |
| CEXA | `aurum`, `cexa-kyc` | `borealis`, `cexa-kyc`, `action=request` |
| BHI | `northbank`, `bhi-right-to-work` | `meridian-tech`, `bhi-right-to-work`, `action=request` |

The refusal cases of the use cases (`umbra`, `quickcash`, `darkpool`, `halcyon`) follow the S2 and S4 pattern.

### Minting and checking an exchange

Every QR on the site comes from the same API, so a test can mint without a browser:

    GET https://playground.<network>.verana.network/api/demo/<service>?format=<anoncreds|oid4vc>&credential=<id>[&action=request]

The answer has `kind`, the `url` the QR encodes and an exchange id (`credentialExchangeId`, `proofExchangeId`,
`issuanceSessionId` or `verificationSessionId`). The service's own view of the exchange:

    GET https://playground.<network>.verana.network/api/demo/<service>/credential/<id>[?rail=oid4vc]
    GET https://playground.<network>.verana.network/api/demo/<service>/proof/<id>[?rail=oid4vc]

An OpenID4VC offer lives about three minutes, so mint right before delivering it.

### Delivering it to the wallet

- OpenID4VC wallets (Inji, EUDI, swiyu): open the `openid-credential-offer://` or `openid4vp://` URL as a deep link,
  for example `adb shell am start -a android.intent.action.VIEW -d '<url>' -p <package>`. Inji ignores deep links
  after a completed download until it is restarted, and swiyu locks again on every deep link.
- Hologram: the `url` is an Out-of-Band 1.1 short link. Paste it in Scan, then Use link, or fetch it with
  `Accept: application/json`, base64url-encode the JSON and open `didcomm://invite?oob=<encoded>`. Hologram connects
  first, then shows the offer or the request in the chat.
- wwWallet: open `https://wwwallet.playground.<network>.verana.network/?<query of the openid URL>` in a browser
  where you are signed in with your passkey. A reload can sign you out; the request resumes after you sign in.

Unlock secrets of the test builds live outside the repository; never commit or paste them.

### Recording the result

Keep one folder per run (`device-tests/<date>/<wallet>/`) with a screenshot of every screen that carries a
verdict, the mint answers, the service state after each step, and the wallet log for failures. One JSON line per
step is enough: scenario, wallet build, rail, exchange id, outcome (`pass`, `fail`, `blocked`), what the trust card
said, the service state, and a note for anything unexpected. A failure is only reported with the line from the
wallet log or the service state that explains it.

When a device result contradicts a profile, update the profile's `capabilities` or the gap in
`devnet-services.yaml` in the same pull request, so CI carries what the phone showed.
