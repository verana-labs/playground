# Wallet compatibility matrix

Drives a real Android wallet through the playground's demos on a connected phone and reports what the wallet decided, next to what the service recorded. It exists because the only way to know a demo works is to run it on a real device against the deployed cast: every failure found so far was invisible from the code and from the page.

```bash
./run.sh swiyu bhi                 # one wallet, one suite
./run.sh swiyu bhi halcyon         # a single scenario
./run.sh procivis personal-wallets
```

`./check-dids.sh` needs no device and no wallet: it checks every cast's did:webvh log for the history problem described under "Things that will waste your time".

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

**A DID's history is immutable, so an old cast cannot be fixed by rolling it.** vs-agent before 2026-08-03 signed each did:webvh log entry with a bare `did:key:z...` verification method instead of the `did:key:z...#z...` reference the spec requires. swiyu's Rust resolver replays the log from version 1, so one bad historical entry rejects the DID forever with `not a valid DID log`. Rolling the image forward only fixes entries written from then on: umbra was already on a fixed image, its entries 20 to 27 are correct, and it still fails. Check before blaming a wallet:

```bash
curl -s https://<host>/.well-known/did.jsonl | head -1 | python3 -c \
  "import json,sys;p=json.load(sys.stdin)['proof'];p=[p] if isinstance(p,dict) else p;print(p[0]['verificationMethod'])"
```

A `#` in the output is healthy. `./check-dids.sh` sweeps every cast service at once and exits non-zero if any is affected; today it flags 14 of 44. Every DID created on or after 2026-08-03 is fine; the whole vesta cast, `playground-demo` and `demo-untrusted` were created on 2026-07-30 and are not. The only repair is destructive: wipe the agent's PVCs so it boots a new DID, then re-provision. `reset_identity` exists for that but only on the demo wrappers, not for vesta.

**A presentation needs the credential already in the wallet.** The runner stops before tapping accept, so a fresh wallet holds nothing and every `kind: present` scenario reports whatever the wallet says when it finds no match: swiyu prints "No matching credential available" and no verdict at all, authbound prints "The requested document is not available". That is not a trust failure. Collect the matching credential by hand first, then run the presentation.

## Known state

Recorded 8 September 2026, all device-verified on the Honor LLY-NX1. Per-wallet results live in `wallets.json` under `verified`.

Six wallets can be driven: swiyu, inji, authbound, procivis, sphereon and, in principle, talao. Talao is currently blocked at its PIN pad because the keypad6 coordinates do not match its layout. The other six entries in `wallets.json` carry a `skip` and the reason.

On the three casts rolled to `.39` on 7 September, inji and procivis are the strongest: both render the Q2 issuer sentence and the Q3 verifier sentence, and both get the cexa darkpool refusal right. Neither actually disables the affirmative button on a denial, so the refusal is text only. authbound shows the trust card but never states whether an issuer is authorized, and sphereon shows Q1 alone. Inji's own gate is the real problem: for an issuer host it has already trusted it downloads the credential with no consent screen at all.

Two cast-side failures are open. swiyu rejects the entire vesta cast on the did:webvh history above, and it rejects `novara.cexa` on `invalid DID document: publicKeyMultibase must not be used` while `aurum` on the same cast, same image and a structurally identical log passes; that one is reproducible but unexplained. `CCM` is published on the site but was never deployed: neither of its workflows has ever run, its services have no trust record, and its hosts serve the ingress default certificate, so every visitor gets an error on every wallet.

The vesta suite's expectations were wrong until 8 September. All three organisations are legitimate ECS-Badge issuers and each holds a valid ISSUER permission on schema 250, so refusing a badge issuance was never the right verdict. The cast turns on the Authorized Repairer credential, which Umbra never receives, and the refusal belongs at the portal login.
