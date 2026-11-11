# Wallet matrix on testnet, 2026-11-11

Re-test of the five integrated wallets against every playground demo after the redeployment (testnet only, deployed from verana-deploy under the Verana Foundation corporation, services on the latest VS Agent dev). Asked by Fabrice at the Reference Implementation WG of 2026-11-11 ([00:28:05]), tracked in #350.

## Setup

- Network: `https://playground.testnet.verana.network`, casts as deployed from verana-deploy (`VS_AGENT_VERSION=v2.0.0-dev.103` in `playground/versions.env`). Trust ground truth from the indexer: `POST https://idx.testnet.verana.network/v4/verifiable-trust/resolve` for every service DID (all trusted services resolve `trusted: true`, corporation 41; the two untrusted demo DIDs are unknown to it) and `/v4/participant/list` for authorizations.
- Device: Android 16 emulator (API 36 `google_apis_playstore` x86_64, 1080x2412, 420 dpi) on the Windows GPU PC with WHPX, driven over adb. The Honor 200 Lite has been offline on Tailscale for 14 days. wwWallet ran in headless Chromium (Playwright, CDP virtual passkey) in WSL on the same PC.
- Builds:
  - Hologram `2.16.0-dev.9` (`io.twentysixty.mobileagent.dev`, current main, dev APK from MinIO, sha256 `166bc13f…2b83400`). The listed store build cannot be installed on the emulator without a Google account.
  - Inji, EUDI and swiyu: the fork APKs the listing links to, tag `verana-2026-10-02` (sha256 `ceeb618d…`, `6a01e6b1…`, `324f9c9f…`).
  - wwWallet: the hosted `https://wwwallet.playground.testnet.verana.network`.
- Rails: Hologram on AnonCreds/DIDComm, the others on OpenID4VC SD-JWT with `signer=x5c`, as in their profiles. Offers and requests minted from `/api/demo/<service>` right before delivery.
- Delivery: implicit VIEW intent restricted to the package (`am start -a VIEW -d <url> -p <pkg>`), so intent filters apply. Hologram gets `didcomm://invite?oob=<invitation>`, wwWallet the hosted URL with the openid query string.
- Outcome read back from the service, `/api/demo/<service>/{credential,proof}/<id>`, never from the wallet screen alone.

A cell passes when the wallet shows the right trust verdict, gates Accept/Share on it, and the service sees the expected end state: `done`/`verified: true` for accredited parties, no credential stored and no proof for the others.

## Matrix

`pass*` is a pass with a note below, `blocked` means the step could not be reached (upstream failure or no device). Every cell links the screen that carries the verdict; raw cells are in [`2026-11-11-wallet-matrix/results.jsonl`](2026-11-11-wallet-matrix/results.jsonl).

| Demo | Service | Hologram | Inji | EUDI | wwWallet | swiyu |
|---|---|---|---|---|---|---|
| Issue, accredited issuer | `demo-issuer-accredited` | [pass](2026-11-11-wallet-matrix/hologram/S1-offer.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [**FAIL**](2026-11-11-wallet-matrix/eudi/S1-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/S1-consent.webp) | [**FAIL**](2026-11-11-wallet-matrix/swiyu/S1-consent.webp) |
| Issue, unaccredited issuer | `demo-issuer-unaccredited` | [pass](2026-11-11-wallet-matrix/hologram/S2-offer.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [**FAIL**](2026-11-11-wallet-matrix/eudi/S2-consent.webp) | [pass*](2026-11-11-wallet-matrix/wwwallet/S2-consent.webp) | [**FAIL**](2026-11-11-wallet-matrix/swiyu/S2-consent.webp) |
| Issue, untrusted issuer | `demo-issuer-untrusted` | [pass](2026-11-11-wallet-matrix/hologram/S5-offer.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [**FAIL**](2026-11-11-wallet-matrix/eudi/S5-consent.webp) | [pass*](2026-11-11-wallet-matrix/wwwallet/S5-consent.webp) | [**FAIL**](2026-11-11-wallet-matrix/swiyu/S5-consent.webp) |
| Present, accredited verifier | `demo-verifier-accredited` | [pass](2026-11-11-wallet-matrix/hologram/S3-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/S3-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/S3-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |
| Present, unaccredited verifier | `demo-verifier-unaccredited` | [pass](2026-11-11-wallet-matrix/hologram/S4-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/S4-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/S4-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |
| Present, untrusted verifier | `demo-verifier-untrusted` | [pass](2026-11-11-wallet-matrix/hologram/S6-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/S6-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/S6-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S6-consent.webp) |
| Vesta, issue badge | `vesta` | [pass](2026-11-11-wallet-matrix/hologram/vesta-issue-offer.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [**FAIL**](2026-11-11-wallet-matrix/eudi/vesta-issue-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/vesta-issue-consent.webp) | [**FAIL**](2026-11-11-wallet-matrix/swiyu/vesta-issue-consent.webp) |
| Vesta, Umbra badge | `umbra` | [pass*](2026-11-11-wallet-matrix/hologram/vesta-umbra-issue-offer.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [**FAIL**](2026-11-11-wallet-matrix/eudi/vesta-umbra-issue-consent.webp) | [pass*](2026-11-11-wallet-matrix/wwwallet/vesta-umbra-issue-consent.webp) | [**FAIL**](2026-11-11-wallet-matrix/swiyu/vesta-umbra-issue-consent.webp) |
| Vesta, portal login | `vesta-portal` | [pass](2026-11-11-wallet-matrix/hologram/vesta-present-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/vesta-present-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/vesta-present-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |
| Verandia, issue citizen ID | `civil-registry` | [pass](2026-11-11-wallet-matrix/hologram/verandia-issue-offer.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [**FAIL**](2026-11-11-wallet-matrix/eudi/verandia-issue-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/verandia-issue-consent.webp) | [**FAIL**](2026-11-11-wallet-matrix/swiyu/verandia-issue-consent.webp) |
| Verandia, Tax Buro | `tax-buro` | [pass](2026-11-11-wallet-matrix/hologram/verandia-present-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/verandia-present-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/verandia-present-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |
| Verandia, QuickCash (refuse) | `quickcash` | [pass](2026-11-11-wallet-matrix/hologram/verandia-quickcash-present-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/verandia-quickcash-present-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/verandia-quickcash-present-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |
| CEXA, issue KYC | `aurum` | [pass](2026-11-11-wallet-matrix/hologram/cexa-issue-offer.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [**FAIL**](2026-11-11-wallet-matrix/eudi/cexa-issue-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/cexa-issue-consent.webp) | [**FAIL**](2026-11-11-wallet-matrix/swiyu/cexa-issue-consent.webp) |
| CEXA, Borealis | `borealis` | [pass](2026-11-11-wallet-matrix/hologram/cexa-present-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/cexa-present-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/cexa-present-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |
| CEXA, Darkpool (refuse) | `darkpool` | [pass](2026-11-11-wallet-matrix/hologram/cexa-darkpool-present-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/cexa-darkpool-present-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/cexa-darkpool-present-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |
| BHI, issue right to work | `northbank` | [pass](2026-11-11-wallet-matrix/hologram/bhi-issue-offer.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [**FAIL**](2026-11-11-wallet-matrix/eudi/bhi-issue-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/bhi-issue-consent.webp) | [**FAIL**](2026-11-11-wallet-matrix/swiyu/bhi-issue-consent.webp) |
| BHI, Meridian Tech | `meridian-tech` | [pass](2026-11-11-wallet-matrix/hologram/bhi-present-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/bhi-present-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/bhi-present-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |
| BHI, Halcyon (refuse) | `halcyon` | [pass](2026-11-11-wallet-matrix/hologram/bhi-halcyon-present-request.webp) | [blocked](2026-11-11-wallet-matrix/inji/launch.webp) | [blocked](2026-11-11-wallet-matrix/eudi/bhi-halcyon-present-consent.webp) | [pass](2026-11-11-wallet-matrix/wwwallet/bhi-halcyon-present-consent.webp) | [blocked](2026-11-11-wallet-matrix/swiyu/S3-consent.webp) |

## What failed

- **EUDI and swiyu cannot get any credential.** Every testnet issuer publishes `credential_response_encryption` without `credential_request_encryption`. openid4vci-kt (EUDI) and swiyu's own validator both refuse that metadata before showing a trust card: "Oups! Something went wrong" and "Invalid credential", 8 offers out of 8 each, sessions left at `OfferUriRetrieved`. Filed as verana-labs/vs-agent#833.
- Their presentation rows are blocked by the same thing. EUDI shows the right TRUSTED or UNTRUSTED verdict on all 10 requests, but it reads `vct` from matching wallet credentials, so with an empty wallet it cannot compute the authorization line and has nothing to share. swiyu stops at "No matching credential available" before any card.
- **Inji was not testable.** The fork stays on a blank screen on the emulator (`SecureStorage: Device Supports Hardware false`, the hardware keystore blocker from the #293 spike) and the phone is offline.
- **The nightly conformance run checks nothing on testnet**: 10 cells, all `not-testable`, because `testnet-v4` is `testable: false` in `conformance/networks.yaml`. Filed as #353.

Not re-filed: the Hologram welcome agent migration key bug, verana-labs/vs-agent#830 (Ariel's fix in progress). The welcome agent is not a playground demo and was not part of this run.

## Notes on the pass* cells

- **Umbra (Vesta).** Hologram and wwWallet both show Umbra as trusted and authorized to issue the badge, and that matches the chain: Umbra holds ACTIVE ISSUER participant #352 on the ECS `BadgeCredential` schema (id 40) since 2026-11-04, like Vesta and Zenith. On V4 any authorized badge issuer passes the wallet check and the Vesta portal decides after the login (`app/api/portal-login/route.ts`). `docs/testing.md` listed Umbra as an S2-style refusal and the demo route comment said the wallet flags it red, both corrected in this PR.
- **wwWallet S2 and S5.** The consent screen is right and Continue stays disabled, but the service reports `Completed`: wwWallet runs OpenID4VCI to the end before asking, so the issuer cannot tell a refusal from a stored credential. Confirmed by hand below, filed as verana-labs/vs-agent#834.
- **Hologram `bhi-issue` and `cexa-present`** passed on retry. The first attempt showed "There was an error processing invitation" and nothing arrived, while the app logged `Unable to start message pickup on resume` (TimeoutError) on the dev mediator `ca.dev.2060.io`. A restart fixed it. Seen once, not filed.

## wwWallet recheck by hand

Second pass the same evening, in desktop Chrome on the hosted wwWallet, a fresh account on a software passkey with PRF injected in the page (no CDP). The six personal-wallet demos were opened from the "Open in wwWallet" buttons of the page, the twelve use-case demos from links minted with the same API call the page makes. Every click in the wallet was a real click, outcomes were read from the playground API.

- **All 18 verdicts and gates match the Playwright run.** Accepted offers landed in the wallet (5 credentials at the end), accepted presentations ended `verified: true`, and every refusal kept the button disabled and shared nothing (`RequestUriRetrieved`).
- **The S2/S5 behaviour is confirmed, and broader.** On all 8 issuances the session is already `Completed` while the consent screen is still open. After Cancel on S2, S5 and Umbra the wallet keeps nothing and the session stays `Completed`. The page handles the refusal cases honestly ("The issuer completed the exchange ... some wallets fetch a credential before they show you anything", [S2](2026-11-11-wallet-matrix/wwwallet/recheck-S2-page.webp), [S5](2026-11-11-wallet-matrix/wwwallet/recheck-S5-page.webp)), but on S1 it says "Credential delivered, it is now in your wallet" before the user has accepted. The missing piece is the OpenID4VCI notification endpoint, absent from the vs-agent issuer and from Credo's issuer side: verana-labs/vs-agent#834. Captures: [S2 consent](2026-11-11-wallet-matrix/wwwallet/recheck-S2-consent.webp), [S5 consent](2026-11-11-wallet-matrix/wwwallet/recheck-S5-consent.webp).
- **Presentations do not leak before consent**: the verifier session stays `RequestUriRetrieved` until Send.
- **Cancel on a refused presentation shows "Failed to send credentials"** ([capture](2026-11-11-wallet-matrix/wwwallet/recheck-refusal-cancel.webp)), reproduced on Halcyon and Darkpool. Cosmetic and on the wallet side: the cancelled selection rejects and lands in the generic error popup (`src/hocs/UriHandlerProvider.tsx` in the fork). No error response reaches the verifier, the same gap as #333.
- **Flaky offers.** 3 of 11 offer openings ended in "Failed to add credential". Two were offers opened 6 and 10 minutes after minting, which return 404 while the session still says `OfferCreated`. The third failed right after fetching the offer (`OfferUriRetrieved`) while `wwwallet-api /status` answered 503 now and then and the wallet showed its offline banner; the retry worked, with a stray copy of the same error popup over the consent screen.

## Details

### Hologram

| Case | Trust screen | Server state | Note |
|---|---|---|---|
| S1 | Trusted, This issuer is accredited for issuing credentials of DemoCredential schema | `done` |  |
| S2 | Trusted, This issuer is not accredited for issuing credentials of DemoCredential schema; Accept asks Accept anyway (unsafe) | `abandoned, declined=true after Refuse` |  |
| S5 | Untrusted, Not trusted by any configured Verana network; not accredited; Accept asks Accept anyway (unsafe) | `abandoned, declined=true after Refuse` |  |
| S3 | Trusted, Accredited Verifier (demo) is an authorized verifier of DemoCredential | `done, verified=true, claims demoId+name` |  |
| S4 | Trusted, Unaccredited Verifier (demo) is not an authorized verifier of DemoCredential; button becomes Share anyway (unsafe) | `abandoned, verified=false after Refuse` |  |
| S6 | Untrusted, Not trusted by any configured Verana network; button becomes Share anyway (unsafe) | `abandoned, verified=false after Refuse` |  |
| vesta-issue | Trusted; This issuer is accredited for issuing credentials of BadgeCredential schema | `{"state":"done","done":true,"declined":false,"error":null}` | Accept not gated |
| vesta-umbra-issue | Trusted; This issuer is accredited for issuing credentials of BadgeCredential schema | `{"state":"credential-issued","done":true,"declined":false,"error":null}` | Verdict matches the chain: Umbra holds ACTIVE ISSUER participant #352 on the ECS BadgeCredential schema 40. Offer accepted without a gate, which is correct on V4; the refusal belongs to the Vesta portal login. |
| vesta-present | Trusted; Vesta Portal (demo) is an authorized verifier of BadgeCredential; Vesta Portal (demo) is requesting you: Badge number, Biometric pattern, Biometric pattern scheme, Birth date, Department, Name, Photo, Title | `{"state":"done","verified":true,"claims":[{"name":"name","value":"Umbra Repairs Employee"},{"name":"department","value":` | button=Present credential, matching credentials=3 |
| verandia-issue | Trusted; This issuer is accredited for issuing credentials of VerandiaCitizenIDCredential schema | `{"state":"credential-issued","done":true,"declined":false,"error":null}` | Accept not gated |
| verandia-present | Trusted; Tax Buro (demo) is an authorized verifier of VerandiaCitizenIDCredential; Tax Buro (demo) is requesting you: Birth date, Family name, Given name, Issuing authority, Nationality, Personal identifier, Portrait | `{"state":"done","verified":true,"claims":[{"name":"nationality","value":"VD"},{"name":"familyName","value":"Solano"},{"n` | button=Present credential, matching credentials=1 |
| verandia-quickcash-present | QuickCash Loans (demo) is not an authorized verifier of VerandiaCitizenIDCredential; QuickCash Loans (demo) is requesting you: Birth date, Family name, Given name, Issuing authority, Nationality, Personal identifier, Por | `{"state":"abandoned","verified":false,"claims":[]}` | button=Share anyway (unsafe), matching credentials=1 |
| cexa-issue | Trusted; CEXA member exchange (demo), accredited to issue and verify the CEXAKycCredential - one full check, reused everywhere; This issuer is accredited for issuing credentials of CEXAKycCredential schema | `{"state":"credential-issued","done":true,"declined":false,"error":null}` | Accept not gated |
| cexa-present | Trusted; CEXA member exchange (demo), accredited to verify the CEXAKycCredential - open an account by presenting it; Borealis Markets (demo) is an authorized verifier of CEXAKycCredential; Borealis Markets (demo) is requ | `{"state":"done","verified":true,"claims":[{"name":"kycLevel","value":"standard"},{"name":"birthDate","value":"19970823"}` | Passed on retry. First attempt hit the same stalled mediator pickup as bhi-issue (server request-sent, nothing in the app). |
| cexa-darkpool-present | is requesting you: Birth date, Document number hash, Evidence digest, Full name, Kyc level, Nationality, Provider, Screening date; DarkPool Exchange (demo) is not an authorized verifier of CEXAKycCredential; DarkPool Exc | `{"state":"abandoned","verified":false,"claims":[]}` | button=Share anyway (unsafe), matching credentials=1 |
| bhi-issue | Trusted; This issuer is accredited for issuing credentials of RightToWorkCredential schema | `{"state":"done","done":true,"declined":false,"error":null}` | Passed on retry. First attempt: toast 'There was an error processing invitation' and the offer never arrived (server offer-sent) while the app logged 'Unable to start message pickup on resume' (TimeoutError) against the  |
| bhi-present | Trusted; Meridian Technologies (demo) is an authorized verifier of RightToWorkCredential; Meridian Technologies (demo) is requesting you: Birth date, First name, Nationality, Portrait, Rtw established date, Rtw expiry da | `{"state":"done","verified":true,"claims":[{"name":"nationality","value":"GB"},{"name":"portrait","value":"-"},{"name":"r` | button=Present credential, matching credentials=1 |
| bhi-halcyon-present | Trusted; Halcyon Talent (demo) is not an authorized verifier of RightToWorkCredential; Halcyon Talent (demo) is requesting you: Birth date, First name, Nationality, Portrait, Rtw established date, Rtw expiry date, Surnam | `{"state":"abandoned","verified":false,"claims":[]}` | button=Share anyway (unsafe), matching credentials=1 |

### Inji

| Case | Trust screen | Server state | Note |
|---|---|---|---|
| S1 |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| S2 |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| S5 |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| S3 |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| S4 |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| S6 |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| vesta-issue |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| vesta-umbra-issue |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| vesta-present |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| verandia-issue |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| verandia-present |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| verandia-quickcash-present |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| cexa-issue |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| cexa-present |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| cexa-darkpool-present |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| bhi-issue |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| bhi-present |  | `` | blank screen on the emulator (no hardware keystore), phone offline |
| bhi-halcyon-present |  | `` | blank screen on the emulator (no hardware keystore), phone offline |

### EUDI

| Case | Trust screen | Server state | Note |
|---|---|---|---|
| S1 | Oups! Something went wrong | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused by openid4vci-kt, vs-agent#833 |
| S2 | Oups! Something went wrong | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused by openid4vci-kt, vs-agent#833 |
| S5 | Oups! Something went wrong | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused by openid4vci-kt, vs-agent#833 |
| S3 | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| S4 | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| S6 | UNTRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| vesta-issue | Oups! Something went wrong | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused by openid4vci-kt, vs-agent#833 |
| vesta-umbra-issue | Oups! Something went wrong | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused by openid4vci-kt, vs-agent#833 |
| vesta-present | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| verandia-issue | Oups! Something went wrong | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused by openid4vci-kt, vs-agent#833 |
| verandia-present | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| verandia-quickcash-present | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| cexa-issue | Oups! Something went wrong | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused by openid4vci-kt, vs-agent#833 |
| cexa-present | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| cexa-darkpool-present | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| bhi-issue | Oups! Something went wrong | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused by openid4vci-kt, vs-agent#833 |
| bhi-present | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |
| bhi-halcyon-present | TRUSTED; authorization not computed: wallet holds no matching credential | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | right Q1 verdict; empty wallet, so no authorization line and nothing to share (vs-agent#833) |

### wwWallet

| Case | Trust screen | Server state | Note |
|---|---|---|---|
| S1 | TRUSTED, authorized issuer of DemoCredential, Continue enabled | `200 {"state":"Completed","done":true,"declined":false,"error":null}` |  |
| S2 | TRUSTED, not authorized issuer of DemoCredential, Continue disabled | `200 {"state":"Completed","done":true,"declined":false,"error":null}` | Gate holds (Continue disabled, Cancel). The service still reports Completed because wwWallet runs OpenID4VCI to completion before showing consent, so the server cannot tell a refusal from a stored credential. |
| S5 | UNTRUSTED, not authorized issuer of DemoCredential, Continue disabled | `200 {"state":"Completed","done":true,"declined":false,"error":null}` | Gate holds (UNTRUSTED, Continue disabled). Service reports Completed for the same reason as S2: wwWallet fetches the credential before consent. |
| S3 | TRUSTED, authorized verifier of DemoCredential, Next enabled | `200 {"state":"done","verified":true,"claims":[{"name":"demoId","value":"demo-e7980f72"},{"name":"name","value":"Playgrou` |  |
| S4 | TRUSTED, not authorized verifier of DemoCredential, Next disabled | `200 {"state":"RequestUriRetrieved","verified":false,"claims":[]}` |  |
| S6 | UNTRUSTED, not authorized verifier of DemoCredential, Next disabled | `200 {"state":"RequestUriRetrieved","verified":false,"claims":[]}` |  |
| vesta-issue | TRUSTED, authorized issuer of BadgeCredential, Continue enabled | `200 {"state":"Completed","done":true,"declined":false,"error":null}` |  |
| vesta-umbra-issue | TRUSTED, authorized issuer of BadgeCredential, Continue enabled | `200 {"state":"Completed","done":true,"declined":false,"error":null}` | Verdict matches the chain: Umbra holds ACTIVE ISSUER participant #352 on the ECS BadgeCredential schema 40 (testnet, since 2026-11-04), like Vesta and Zenith. On V4 any authorized badge issuer passes the wallet check and |
| vesta-present | TRUSTED, authorized verifier of BadgeCredential, Next enabled | `200 {"state":"done","verified":true,"claims":[{"name":"photo","value":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGA` |  |
| verandia-issue | TRUSTED, authorized issuer of VerandiaCitizenIDCredential, Continue enabled | `200 {"state":"Completed","done":true,"declined":false,"error":null}` |  |
| verandia-present | TRUSTED, authorized verifier of VerandiaCitizenIDCredential, Next enabled | `200 {"state":"done","verified":true,"claims":[{"name":"givenName","value":"Aria"},{"name":"personalIdentifier","value":"` |  |
| verandia-quickcash-present | TRUSTED, not authorized verifier of VerandiaCitizenIDCredential, Next disabled | `200 {"state":"RequestUriRetrieved","verified":false,"claims":[]}` |  |
| cexa-issue | TRUSTED, authorized issuer of CEXAKycCredential, Continue enabled | `200 {"state":"Completed","done":true,"declined":false,"error":null}` |  |
| cexa-present | TRUSTED, authorized verifier of CEXAKycCredential, Next enabled | `200 {"state":"done","verified":true,"claims":[{"name":"documentNumberHash","value":"sha256:b555355a07a63169a5e969a630379` |  |
| cexa-darkpool-present | TRUSTED, not authorized verifier of CEXAKycCredential, Next disabled | `200 {"state":"RequestUriRetrieved","verified":false,"claims":[]}` |  |
| bhi-issue | TRUSTED, authorized issuer of RightToWorkCredential, Continue enabled | `200 {"state":"Completed","done":true,"declined":false,"error":null}` |  |
| bhi-present | TRUSTED, authorized verifier of RightToWorkCredential, Next enabled | `200 {"state":"done","verified":true,"claims":[{"name":"surname","value":"Chen"},{"name":"rtwEstablishedDate","value":"20` |  |
| bhi-halcyon-present | TRUSTED, not authorized verifier of RightToWorkCredential, Next disabled | `200 {"state":"RequestUriRetrieved","verified":false,"claims":[]}` |  |

### swiyu

| Case | Trust screen | Server state | Note |
|---|---|---|---|
| S1 | Invalid credential | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused (Invalid credential), vs-agent#833 |
| S2 | Invalid credential | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused (Invalid credential), vs-agent#833 |
| S5 | Invalid credential | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused (Invalid credential), vs-agent#833 |
| S3 |  | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | stops at No matching credential available, no card (vs-agent#833) |
| S4 |  | `` | stops at No matching credential available, no card (vs-agent#833) |
| S6 |  | `{"state":"RequestUriRetrieved","verified":false,"claims":[]}` | stops at No matching credential available, no card (vs-agent#833) |
| vesta-issue | Invalid credential | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused (Invalid credential), vs-agent#833 |
| vesta-umbra-issue | Invalid credential | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused (Invalid credential), vs-agent#833 |
| vesta-present |  | `` | stops at No matching credential available, no card (vs-agent#833) |
| verandia-issue | Invalid credential | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused (Invalid credential), vs-agent#833 |
| verandia-present |  | `` | stops at No matching credential available, no card (vs-agent#833) |
| verandia-quickcash-present |  | `` | stops at No matching credential available, no card (vs-agent#833) |
| cexa-issue | Invalid credential | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused (Invalid credential), vs-agent#833 |
| cexa-present |  | `` | stops at No matching credential available, no card (vs-agent#833) |
| cexa-darkpool-present |  | `` | stops at No matching credential available, no card (vs-agent#833) |
| bhi-issue | Invalid credential | `{"state":"OfferUriRetrieved","done":false,"declined":false,"error":null}` | metadata refused (Invalid credential), vs-agent#833 |
| bhi-present |  | `` | stops at No matching credential available, no card (vs-agent#833) |
| bhi-halcyon-present |  | `` | stops at No matching credential available, no card (vs-agent#833) |
