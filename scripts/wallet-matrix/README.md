# Wallet compatibility matrix

Drives a real Android wallet through the playground's demos on a connected phone and reports what the wallet decided, next to what the service recorded. It exists because the only way to know a demo works is to run it on a real device against the deployed cast: every failure found so far was invisible from the code and from the page.

```bash
./run.sh swiyu bhi                 # one wallet, one suite
./run.sh swiyu bhi halcyon         # a single scenario
./run.sh procivis personal-wallets
```

Requires `adb` on PATH with a phone connected and USB debugging on. Runs against `https://playground.testnet.verana.network` unless `PLAYGROUND_BASE` says otherwise. Screen text for every run lands in `results/<wallet>-<suite>.txt`, which is where you look when a verdict surprises you.

## Reading the output

```
halcyon    expect=refuse  screen=TRUSTED/DENIED   server=RequestUriRetrieved
```

- **expect** — what an integrated wallet is supposed to do, from `scenarios.json`.
- **screen** — `<trust>/<permission>` read off the consent screen. `TRUSTED` or `UNTRUSTED` is the Q1 verdict; `GRANTED` or `DENIED` is the Q2/Q3 permission sentence. `?` means the wallet printed neither, which is itself a finding. `ERROR` means the wallet refused the payload before rendering anything.
- **selfissued** — the wallet said the service's ECS credential is issued by the service to itself. Expected on every cast except the demo one, which issues from its anchor.
- **server** — the exchange state from the same endpoint the page polls. `Completed` on an issuance means the credential left the issuer; it does **not** mean the user accepted, because several wallets fetch before showing consent.

A scenario passes when `expect=accept` reaches `GRANTED` and a completed exchange, or when `expect=refuse` reaches `DENIED` and the exchange never completes. Compare the two columns rather than trusting either alone: the wallet screen and the service routinely disagree, and that disagreement is usually the bug.

## Why the runner stops at the verdict

It mints, delivers, unlocks and reads the consent screen. It does not tap accept or share, because every wallet places those controls differently and a mis-tap produces a confident wrong answer. Read the verdict from the table, then finish the flow by hand when you need the end-to-end proof.

## The one substitution

The phone is not rooted, so the camera cannot be driven. The runner decodes the payload the QR encodes and hands the wallet that exact string as an Android VIEW intent. For Inji, EUDI, Sphereon, Procivis, swiyu, Altme and Paradym the scanner and link paths were confirmed in source to converge on the same handler.

NL Wallet is the exception and is marked `skip`: it passes an is-QR flag that becomes a cross-device session type, checked against the verifier's request, so a link delivery is rejected by design. It needs a real optical scan.

## Adding a wallet

Add an entry to `wallets.json`:

- `package` / `activity` — from `adb shell cmd package query-activities -a android.intent.action.VIEW -d 'openid-credential-offer://x'`.
- `demoParams` — the mint query the wallet needs. The OpenID4VP rails are mutually exclusive: a wallet that never implemented DCQL needs `query=pe`, one that resolves no DIDs needs `signer=x5c`. The wrong value produces failures that look like wallet bugs. Keep this in step with `personal-wallets.yaml`.
- `unlock` — one of `password`, `passcode`, `keypad6`, `pinfield`, `none`. If a new wallet needs different taps, add a branch to `unlock()` rather than special-casing the caller.
- `coldStart` — true when the wallet only acts on a link at launch.
- `skip` — set it, with a reason, when a wallet cannot be driven this way at all. The reason is the deliverable.

## Adding a demo

Add a suite to `scenarios.json`. Each scenario needs `service`, `kind` and `expect`; add `credential` when the service issues more than one type, and `extra` for query params the page sends (BHI's right-to-work carries the applicant name). Scenarios reached through a login route rather than `/api/demo` carry `route` instead of `service` and are skipped by the runner — drive those from the page.

## Things that will waste your time

**The resolver caches a bad verdict for an hour.** If it evaluates a DID during a cast roll's ~5 minute window, the DID fetch fails and `UNTRUSTED` with zero credentials is cached with a 60 minute TTL. Every later check reads the cache, so deploy, provision and even a rollback all appear to do nothing. Clear it:

```bash
curl -X POST https://resolver.testnet.verana.network/v1/trust/refresh \
  -H 'content-type: application/json' -d '{"did":"did:webvh:..."}'
```

Never conclude a cast is broken from a reading taken soon after a roll.

**Cast version drift is the usual root cause.** Casts have sat on images from `.1` to `.35` simultaneously, and most wallet failures traced to a cast running older than the fix it needed rather than to the wallet. Check the tag in `.github/workflows/<cast>/deployment.template.yaml` before blaming a wallet.

**A green workflow is not a deploy.** Check the run's conclusion, not that a waiter finished. A cast deploy also needs the Helm chart published at the same version; if the CD run's auxiliary image builds fail, the `helm` job is skipped and the chart is missing even though the agent image pushed fine.

**Wallet quirks are recorded in `wallets.json`.** swiyu locks on every backgrounding and needs a prompt re-login or the request expires; Inji drops an intent when idle at home; Altme only acts at cold start. When a wallet behaves oddly, read its `notes` before debugging the platform.

## Known state

Recorded 7 September 2026, all device-verified. `CCM` is published on the site but was never deployed: neither of its workflows has ever run, its services have no trust record, and its hosts serve the ingress default certificate, so every visitor gets an error on every wallet.
