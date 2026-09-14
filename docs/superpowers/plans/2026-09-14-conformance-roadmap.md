# Wallet Conformance Roadmap

Implements `verana-spec/playground/guidelines/wallet-conformance-testing.md` (draft PR verana-labs/verana-spec#92) on top of `personal-wallet-integration.md`. The spec is the design; this file maps every clause to the plan and task that delivers it, fixes the file layout once, and records the findings the research surfaced so they are not rediscovered.

## Definition of done

One artefact says, truthfully: these five wallets (wwWallet, EUDI, Inji, Hologram, swiyu, plus the INTEXUS-branded wwWallet instance) work, on these install routes, against these demos, proven at this timestamp, on this vs-agent image and this network. A regression shows up as a diff between two runs, on the change that caused it, without anyone picking up a phone.

## Layout

```
app/lib/wallet-profiles.ts          profile schema + loader (site and harness both read it)
app/lib/wallet-profiles.test.ts     profile ↔ listing consistency, runs in the main CI vitest
conformance/                        standalone npm package (own lockfile, own vitest, node environment)
  package.json  tsconfig.json  vitest.config.ts  README.md  .gitignore
  networks.yaml                     [CONF-NET] one entry per network, testable or not
  scenarios.yaml                    the six [PW-TEST] scenarios plus the four eventos ones
  profiles/<wallet-id>.yaml         [CONF-PROF] one per listed wallet
  lib/network.ts                    network selection
  lib/cast-services.ts              every deployed service, derived from .github/workflows/<cast>/orgs/*/config.env
  lib/http.ts                       fetch with timeouts
  lib/resolver-client.ts            typed Trust Resolver client (resolve, refresh, issuer/verifier authorization, version)
  lib/playground-client.ts          mint and exchange-state calls against the deployed site API
  lib/scenarios.ts                  scenarios loader
  lib/identity.ts                   version actually serving (kubectl, else the landing page)
  lib/report.ts  lib/global-setup.ts   [CONF-OUT] cells, run identity, results.json, latest.json
  tier1/*.test.ts                   contract checks
  tier2/*.test.ts                   headless flows
  tier3/                            device runner (reworked from scripts/wallet-matrix)
  results/                          gitignored; CI uploads it
.github/workflows/ci.yml            + conformance-t1 job on every PR and push
.github/workflows/conformance.yml   nightly and on-demand, with cluster credentials
```

Why a separate package: Tier 2 pulls in Credo, Askar and AnonCreds native binaries. They must not enter the site's `npm ci` or its Docker image. The root `tsconfig.json` excludes `conformance/`; the harness imports `app/lib/wallet-profiles.ts` by relative path.

## Plans

| Plan | File | Delivers |
| --- | --- | --- |
| A | `2026-09-14-conformance-profiles.md` | profiles, listing narrowed to the five, consistency enforced in CI, package scaffold, network config |
| B | `2026-09-14-conformance-tier1.md` | Tier 1 contract checks, reporting core, CI jobs |
| C | `conformance-tier2.md` (written after A and B land) | headless flows per rail, resolver assertions, policy assertions |
| D | `conformance-tier3.md` | device spot-checks reworked to the five wallets, rendering and gating only |
| E | `conformance-reporting.md` | diff between runs, listing shows proven build and date, unverified marker |

## Clause coverage

| Clause | Plan / task |
| --- | --- |
| CONF-PROF-1 exactly one profile per listed wallet, tiers read it | A3 (profiles), A2 (schema), every tier imports `listWalletProfiles` |
| CONF-PROF-2 builds with kind, obtain, identity, promise | A2 `BuildSchema`, A3 |
| CONF-PROF-3 rails, request rail per build | A2 `PresentationSchema` + `demoParams` guard, A3 |
| CONF-PROF-4 incompatibilities as facts with cause and reference | A2 `IncompatibilitySchema`, A3 (EUDI publisher build, swiyu store build) |
| CONF-PROF-5 quirks | A2 `QuirksSchema`, `DeviceSchema` |
| CONF-T1-1 metadata parses under every draft | B `tier1/metadata-shape.test.ts` |
| CONF-T1-2 both display shapes | B `tier1/metadata-shape.test.ts` |
| CONF-T1-3 AS discovery paths | B `tier1/authorization-server.test.ts` |
| CONF-T1-4 offer and request link shape | B `tier1/offer-links.test.ts` |
| CONF-T1-5 DID resolves, webvh log VM fully qualified | B `tier1/service-dids.test.ts` |
| CONF-T1-6 TLS, cleartext, redirect header size | B `tier1/transport.test.ts` |
| CONF-T1-7 string encoding damage | B `tier1/strings.test.ts` |
| CONF-T2-1 flows end to end per rail | C |
| CONF-T2-2 resolver answer by field | C (client in B `lib/resolver-client.ts`) |
| CONF-T2-3 Q2/Q3 per scenario | C, oracle = `issuer-authorization` / `verifier-authorization` |
| CONF-T2-4 published-build policies as assertions | C |
| CONF-T2-5 verdict from the service's exchange state | C (client in B `lib/playground-client.ts`) |
| CONF-T3-1..4 | D |
| CONF-OUT-1 three outcomes per cell | B `lib/report.ts` |
| CONF-OUT-2 exact identity of what was tested | B `lib/global-setup.ts` run header, `lib/identity.ts` |
| CONF-OUT-3 machine-readable, diffable | B results.json, E diff |
| CONF-OUT-4 listing reflects the installable build | E |
| CONF-NET-1 endpoints and version are inputs | A `networks.yaml`, `lib/network.ts` |
| CONF-NET-2 v3↔v4 vocabulary is configuration | A `vocabulary` block per network |
| CONF-NET-3 run every testable network, report the others | B `tier1/networks.test.ts` |
| CONF-OPS-1 refresh before asserting | B `ResolverClient.resolveFresh`, used by C |
| CONF-OPS-2 version actually serving | B `tier1/serving-version.test.ts` |
| CONF-OPS-3 attribute against the running version | B run header carries `pinnedTag` and `servingTag` per service |
| CONF-OPS-4 rolls one at a time | B Task 13 (serial dispatch of the demo cast roll); documented in `conformance/README.md` |
| CONF-LIST-1 list when one build works on the six | E |
| CONF-LIST-2 state the proven build and date, mark unverified | E |
| CONF-LIST-3 hide rather than delete | A1 |
| CONF-LIST-4 presumptive platform, labelled | A2 `presumptive`, E |

## Facts the plans rely on (verified 2026-09-14)

- Live rails from the playground API: `format=openid4vc-sdjwt&signer=x5c` mints `openid4vp://?client_id=x509_hash:…&request_uri=…`, request JWT ES256 with `x5c`, `dcql_query`, `response_mode=direct_post.jwt`. `query=pe` mints `client_id=did:web:<host>&client_id_scheme=did`, request JWT EdDSA with `kid did:web:<host>#openid4vc-parallel-web`, `presentation_definition`, `response_mode=direct_post`. Issuance mints `openid-credential-offer://?credential_offer_uri=https://<host>/oid4vci/demo-did/offers/<id>`; the offer carries the pre-authorized grant. `format=anoncreds` mints `https://<host>/s?id=<id>` which serves the OOB invitation JSON.
- The resolver's Q2/Q3 oracle: `GET /v1/trust/issuer-authorization?did=&vtjscId=` and `verifier-authorization`, where `vtjscId` is the `relatedJsonSchemaCredentialId` of the credential's vct document (`https://<issuer host>/oid4vc/vct/<configuration id>`). Verified truth table on the demo cast: accredited issuer Q2 true, accredited verifier Q3 true, everything else false.
- Resolver `/v1/trust/resolve?detail=full` fields: `did, trustStatus, production, evaluatedAt, evaluatedAtBlock, expiresAt, credentials[], dereferenceErrors[], failedCredentials[]`. Resolver version endpoint `/resolver/v1/version` (v1.0.3 today).
- vs-agent exposes no image tag over HTTP. The landing page embeds `"version":"1.12.0"` (package version, identical across `.34` to `.42`). The image tag is only readable from the cluster: cast workflows use secrets `KUBECONFIG_VERANA_DEV` and `K8S_NAMESPACE`; releases are StatefulSets named after `RELEASE_NAME`.
- Demo cast pins after the `.41` roll: template `.41`, but every demo org still carries a `VS_AGENT_IMAGE_TAG` override (`demo-issuer-accredited` `.34`, the rest `.36`), which wins over the template. Unless the roll changed the overrides at deploy time, the demo cast is not on `.41`. The serving-version check settles this.
- The site's admin calls (`http://{id}:3000`) are in-cluster only. Every tier mints through the deployed site API (`/api/demo/<serviceId>`, `/api/eventos-login`), which is also what users exercise.
- The wallet-matrix scripts on this branch are the Tier 3 starting point; they are untouched by plans A and B.

## Findings to raise with Maxime (not blockers)

1. Testnet's resolver answers `production: true`. [PW-CFG-2] expects non-production networks to be flagged `false`. Either the resolver config is wrong or the guideline needs the network's own `production` flag to be authoritative. `networks.yaml` records `production: false` for testnet and Tier 2 will report the mismatch.
2. `permissionChain` is `[]` on every credential and `{}` on authorization answers. [PW-POT] block 5 expects the chain. Nothing to test until the resolver fills it.
3. The demo cast per-org tag overrides (see above). Plan B Task 13 moves the pin to the template at `.42` and rolls the cast one workflow at a time.
4. Upstream swiyu accepts only DID client ids. Verified live: a DCQL request minted with no `signer` already carries `client_id=decentralized_identifier:did:webvh:…` signed with the service's DID key, so the store build is mintable today with empty parameters. The profile says so; no site change is needed.
5. `demo-06` (`demo-untrusted`) is DIDComm-only; the OpenID4VC untrusted counterparts are `demo-issuer-untrusted` and `demo-verifier-untrusted`. Scenarios name the service per rail.
6. The listing's captions for Hologram and EUDI describe gating that their listed builds do not do (Hologram's listed build is the store one, which reports Q1 as a safety verdict with Accept enabled; EUDI's fork renders no Q2 or Q3 sentence). Under [CONF-OUT-4] the listing claims what the installable build cannot deliver. Plan E makes the listing derive its claims from the profile and the latest run.
7. Cell hygiene decided after review: every check runs inside `check()`, so an exception records `unknown` instead of dropping the cell; cells are written per worker and merged; checks that mint sessions run only with `CONFORMANCE_MINTS=1` (nightly), so a PR never adds load to the casts the client tour depends on.

## Plan review

An adversarial review of the three documents (2026-09-14) produced 25 findings; all were adjudicated and folded into plans A and B. The rulings live in the plan A ledger (`.superpowers/sdd/2026-09-14-conformance-profiles/progress.md`) and in the text of plan B.
