# Tier 2 Headless Flows Implementation Plan (OpenID4VC rail)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the OpenID4VCI and OpenID4VP protocol end to end as a headless wallet, per rail a listed wallet claims, across the six canonical scenarios and the four eventos ones, and assert the resolver inputs a wallet's verdict depends on: the Q1 answer by field, Q2 and Q3 from the authorization endpoints, and the service's recorded exchange state.

**Architecture:** `conformance/lib/holder/` wraps `@openid4vc/openid4vci` and `@openid4vc/openid4vp` (the library the Credo, Paradym and Sphereon family ship, and the closest Node stand-in for the Kotlin wallets) with an ES256 holder key from `jose` and SD-JWT presentation from `@sd-jwt/sd-jwt-vc`. `tier2/scenarios.test.ts` iterates profiles × builds × scenarios like Tier 1's link check, mints through the site API, runs the flow with the build's rail, and records one cell per scenario with the resolver evidence. The AnonCreds/DIDComm rail (Hologram) is a separate plan: it needs the Credo native stack.

**Tech Stack:** `@openid4vc/openid4vci@0.5.5`, `@openid4vc/openid4vp@0.5.5`, `@openid4vc/oauth2@0.5.5`, `@sd-jwt/sd-jwt-vc@0.20.x`, `@sd-jwt/core@0.20.x`, `jose@^6`, Node 22 `crypto`. Runs nightly only (`CONFORMANCE_MINTS=1`).

**Spec:** `wallet-conformance-testing.md` section 5 [CONF-T2], plus [CONF-OPS-1]. Verified facts: `2026-09-14-conformance-roadmap.md` (Q2/Q3 oracle, rail shapes). Tier 1 (merged as verana-labs/playground#281) provides `lib/report.ts`, `lib/suite.ts`, `lib/cast-services.ts`, `lib/playground-client.ts`, `lib/scenarios.ts`, `lib/resolver-client.ts`, `lib/service-did.ts`, `lib/issuer-metadata.ts` (`vctDocumentUrl`), `lib/links.ts` (`parseWalletLink`, `decodeJwtParts`), `lib/incompatibility.ts`, `lib/mints.ts`, `lib/profiles-dir.ts`.

## Global Constraints

- Branch `feat/conformance-tier2` from `origin/main` in the `playground-eventos` worktree. Never touch the sibling `playground` checkout.
- TypeScript strict, never `any`, named exports, kebab-case, zero comments (one line only for a hidden constraint or upstream workaround). Conventional commits, subject only, lowercase after the colon. Do not push until the plan says so.
- Every check runs inside `check()` and records exactly one cell [CONF-OUT-1]. Wallet-specific values come from profiles, endpoints from `networks.yaml`, services from the cast configs.
- The holder is a stand-in, not a wallet: it never decides accept or refuse. The verdict of a scenario is: protocol completed on the service side (T2-5) AND the resolver answers match the scenario's expectation (T2-2, T2-3). A scenario whose flow completes but whose resolver answers contradict the expectation is `broken` with the resolver evidence as cause.
- Trust readings go through `resolveFresh` before asserting [CONF-OPS-1]; one refresh per service per run, cached in the suite.
- Unicode in code is written with `String.fromCodePoint`, never `\u` escapes.
- The library's typings are the authority for call shapes: where this plan sketches an API, verify it against `conformance/node_modules/@openid4vc/*/dist/index.d.ts` and adapt names minimally, reporting each adaptation.

---

### Task 1: Headless OpenID4VC holder

**Files:**
- Create: `conformance/lib/holder/keys.ts`, `conformance/lib/holder/oid4vci.ts`, `conformance/lib/holder/oid4vp.ts`, `conformance/lib/holder/oid4vp.test.ts`
- Modify: `conformance/package.json` (dependencies)

**Interfaces:**
- `createHolderKey(): Promise<HolderKey>` with `HolderKey = { privateKey: CryptoKey; publicJwk: JsonWebKey; alg: "ES256" }`
- `callbacks(key: HolderKey): CallbackContext-compatible object` (fetch, hash, generateRandom, signJwt, verifyJwt via `jose`, decryptJwe not needed)
- `receiveCredential(offerUrl: string, key): Promise<{ credential: string; configurationId: string; issuerMetadata: unknown; vct: string | null }>` (pre-authorized code, `credential_configuration_id` on v1 issuers, DPoP when the token endpoint advertises it)
- `presentCredential(requestUrl: string, credential: string, key): Promise<{ submitted: true; responseMode: string; query: "dcql" | "presentation_exchange"; clientId: string; vctValues: string[] }>`: parse and resolve the request (`request_uri`, JAR), build the SD-JWT presentation with a KB-JWT (`aud` = client_id, `nonce`), wrap for `direct_post` (form) or `direct_post.jwt` (JARM JWE with the verifier's `jwks` from `client_metadata`), submit to `response_uri`.
- For `presentation_definition` requests build `presentation_submission = { id, definition_id, descriptor_map: [{ id: <first input descriptor id>, format: "vc+sd-jwt", path: "$" }] }`; for `dcql_query` use `vp_token = { [credentialQueryId]: presentation }`.

- [ ] **Step 1: Install**

Run inside `conformance/`: `npm install @openid4vc/openid4vp@0.5.5 @openid4vc/oauth2@0.5.5 @sd-jwt/sd-jwt-vc@0.20.1 @sd-jwt/core@0.20.1 jose@^6.0.0` (a few MB). `@openid4vc/openid4vci@0.5.5` is already present.

- [ ] **Step 2: Keys and callbacks**

`keys.ts`: `generateKeyPair("ES256", { extractable: true })` from `jose`, `exportJWK` for the public JWK, `signJwt` implemented with `SignJWT` (header from the library plus `alg`), `verifyJwt` with `jwtVerify` against a JWK or an x5c leaf (`importX509`), `hash` with `node:crypto` (`sha-256` → `createHash("sha256")`), `generateRandom` with `randomBytes`. Export `callbacks(key)`.

- [ ] **Step 3: Issuance**

`oid4vci.ts`: `new Openid4vciClient({ callbacks })`; `resolveCredentialOffer(url)`; `resolveIssuerMetadata(credential_issuer)`; `retrievePreAuthorizedCodeAccessTokenFromOffer({ credentialOffer, issuerMetadata, dpop: { signer: { method: "jwk", publicJwk, alg } } })` (pass `dpop` only if the metadata advertises `dpop_signing_alg_values_supported`); nonce from the token response or `requestNonce`; `createCredentialRequestJwtProof({ issuerMetadata, credentialConfigurationId, signer: { method: "jwk", publicJwk, alg: "ES256" }, nonce })`; `retrieveCredentials({ issuerMetadata, credentialConfigurationId, accessToken, proof: { proof_type: "jwt", jwt }, dpop })`. Return the first credential string and the configuration's `vct` via `vctDocumentUrl`.

- [ ] **Step 4: Presentation**

`oid4vp.ts`: `new Openid4vpClient({ callbacks })`; `parseOpenid4vpAuthorizationRequest({ authorizationRequest: url })` then `resolveOpenId4vpAuthorizationRequest({ authorizationRequestPayload, responseMode: { type: "direct_post" } })` (the library fetches and verifies the JAR; for x5c requests trust is not asserted here, Tier 1 already checked the chain shape). From the resolved request take `client_id`, `nonce`, `response_mode`, `response_uri`, `client_metadata`, and either `dcql` (credential query ids, `meta.vct_values`) or `pex` (first input descriptor id). Build the presentation with `SDJwtVcInstance({ hasher, saltGenerator, kbSigner, kbSignAlg: "ES256" }).present(credential, presentationFrame, { kb: { payload: { aud: clientId, nonce, iat } } })` where `presentationFrame` discloses every claim. Then `createOpenid4vpAuthorizationResponse({ authorizationRequestPayload, authorizationResponsePayload: { vp_token, presentation_submission?, state }, jarm: response_mode === "direct_post.jwt" ? { encryption: { nonce }, serverMetadata: { authorization_encryption_alg_values_supported: ["ECDH-ES"], authorization_encryption_enc_values_supported: ["A256GCM"] }, jwtSigner? } : undefined })` and `submitOpenid4vpAuthorizationResponse(...)`. Verify each call shape against the installed typings.

- [ ] **Step 5: Unit test the pure parts**

`oid4vp.test.ts`: `buildSubmission(inputDescriptorId)` returns the descriptor map above; `vpTokenFor("dcql", { credentialQueryId: "c1" }, presentation)` returns `{ c1: presentation }` and for `presentation_exchange` returns the bare presentation. Keep the network parts untested here; the tier2 run covers them.

- [ ] **Step 6: Live smoke, then commit**

Run inside `conformance/` a one-off `node --experimental-strip-types` (or a small vitest file marked `.live.test.ts` excluded from `test:lib`) that mints `demo-issuer-accredited` with `signer=x5c` through `mintIssuance`, calls `receiveCredential`, mints `demo-verifier-accredited` with `signer=x5c`, calls `presentCredential`, and then reads `presentationState` until `done`. Expected: `verified: true`. Then repeat with `query=pe` (Inji rail) and with no signer (swiyu store rail). Record what worked in the report; commit `feat: headless openid4vc holder for the conformance tiers`.

---

### Task 2: Scenario suite [CONF-T2-1] [CONF-T2-2] [CONF-T2-3] [CONF-T2-5]

**Files:**
- Create: `conformance/lib/trust-expectation.ts`, `conformance/lib/trust-expectation.test.ts`, `conformance/tier2/scenarios.test.ts`
- Modify: `conformance/package.json` (script `"t2": "vitest run tier2"`)

**Interfaces:**
- `expectedTrust(scenario, service: CastService): { q1: "TRUSTED" | "UNTRUSTED"; q2: boolean | null; q3: boolean | null }`: untrusted services (`demoPerm === null && oid4vcRole !== null && id includes "untrusted"`, or scenario expects refuse on an untrusted service) → `UNTRUSTED`, q2/q3 null; issue scenarios → q2 = expect === "accept", q3 null; present scenarios → q3 = expect === "accept", q2 null. For eventos: taquilla q2 true; evento-* verifiers q3 true (both eventos present scenarios are trusted verifiers; `entrada-otro-evento` refuses on the `pais` claim, not on trust, so q3 true and the decision must be `otro-evento`).
- `assertTrust(resolver, did, expectation, network): Promise<{ ok: boolean; problems: string[]; evidence }>` using `resolveFresh` once per did per run (module-level cache), checking: `trustStatus === q1`; `evaluatedAt` and `expiresAt` parse and `expiresAt > evaluatedAt`; for TRUSTED: `credentials` contain `ECS-SERVICE` and (`ECS-ORG` or `ECS-PERSONA`) with `result === "VALID"`, `dereferenceErrors` and `failedCredentials` empty; for UNTRUSTED: `credentials` has no VALID ECS-SERVICE; `production === network.production` recorded as a separate problem tagged `production-flag` (it is a known resolver mismatch: record it in evidence, do not count it in `ok`).
- Q2/Q3 via `resolver.issuerAuthorization(did, vtjscId)` / `verifierAuthorization`, `vtjscId` = `relatedJsonSchemaCredentialId` of the vct document (issuance: the received credential's configuration; presentation: the first `vct_values` of the request, or for PE the `$.vct` filter const).

- [ ] **Step 1: Unit-test `expectedTrust` on the ten scenarios**, then write it.

- [ ] **Step 2: The suite**

For each profile with the `openid4vc-sdjwt` rail, each build, each scenario (order: issue scenarios first; presentations reuse the credential received by `needs`): `check({ tier: "t2", check: "flow", clause: "CONF-T2-1", wallet, build, scenario, service, … })`. Body: incompatibility → `incompatible-by-design`; mint with `effectiveDemoParams(profile, build, "openid4vc-sdjwt")`; issue → `receiveCredential`, then poll `issuanceState` until `done` (max 60 s); present → `presentCredential` with the stored credential (skip with `unknown` cause "no credential from <needs>" if the issuance failed), then poll `presentationState` until `done` and record `verified` and, for eventos, `decision`. Then `assertTrust` and the Q2/Q3 call. Outcome: `works` when flow done, trust ok and Q answers match; `broken` otherwise with every problem joined; evidence carries the resolver fields (`trustStatus`, `evaluatedAt`, `expiresAt`, credential ecsTypes and results, `authorized`, `vtjscId`, service state).

Also record one cell per network `check: "resolver-production-flag", clause: "PW-CFG-2"` with `broken` when the resolver's `production` disagrees with `networks.yaml` (it does today), so the finding is visible without failing every scenario.

Gate the whole file with `describe.skipIf(!mintsEnabled())`.

- [ ] **Step 3: Run it**

`CONFORMANCE_MINTS=1 npm run t2`. Expected: `works` for wwwallet, intexus-wallet, eudi/fork, swiyu/fork, swiyu/store (DID rail) and inji (PE rail) on the six canonical scenarios and the four eventos ones once the demo cast serves `.42`; `incompatible-by-design` for eudi/publisher. Any `broken` is a finding: read its evidence before touching code, and never weaken an assertion to pass.

- [ ] **Step 4: Commit** `feat: tier 2 headless openid4vc flows with resolver assertions`.

---

### Task 3: Nightly wiring, README, PR

- Add `npm run t2` to `.github/workflows/conformance.yml` after `t1` (same env), `continue-on-error: false`. The per-change job does not run Tier 2.
- Exclude `**/*.live.test.ts` from `test:lib` if Task 1 created one.
- README: a "Tier 2" paragraph (what it proves, what it does not: it is not a wallet, gating is Tier 3).
- Root checks green, conformance typecheck and `test:lib` green, push `feat/conformance-tier2`, PR titled `feat: tier 2 headless openid4vc conformance flows` with Maxime's voice: what was missing (nothing proved a credential could be issued and presented with the trust verdict inputs correct), what this does, first-run findings, and the DIDComm rail as the next PR.
