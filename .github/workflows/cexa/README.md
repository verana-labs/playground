# The CEXA cast CI/CD

This cast deploys and provisions the agents of the Crypto Exchange
Association (demo) use case (`/usecases/cexa`, unlisted): reusable KYC for
exchanges and banks, and a Travel Rule counterparty proof. Each organization
has one vs-agent on the zone `cexa.playground.<network>.verana.network`.

This branch runs the cast on **Verana V4 (devnet)** with veranad v0.10.5 and
vs-agent v2. See [`docs/networks.md`](../../../docs/networks.md).

## The cast

Each organization has its own Corporation, and each agent is standalone.
Every agent gets its ECS Organization credential from `ecs-org-issuer` (the
organization issuer of the devnet ECS Ecosystem) and issues its own ECS
Service credential.

| Workflow | Release | Role | CEXA entries |
| --- | --- | --- | --- |
| cexa-01 | `association` | Ecosystem controller | the Ecosystem, the two schemas, their root Participant entries, and an ISSUER entry on `CEXAVerifiedCounterpartyCredential` |
| cexa-02 | `aurum` | ISSUER + VERIFIER member | ISSUER and VERIFIER on `CEXAKycCredential`, an AnonCreds credential definition, HOLDER on `CEXAVerifiedCounterpartyCredential` |
| cexa-03 | `novara` | bank member, ISSUER + VERIFIER | the same entries as `aurum` (`provision-member.sh`) |
| cexa-04 | `borealis` | VERIFIER member | VERIFIER on `CEXAKycCredential`, HOLDER on `CEXAVerifiedCounterpartyCredential` |
| cexa-05 | `darkpool` | outsider | none, by design |

The two schemas (`schemas/`) of the Ecosystem "Crypto Exchange Association
(demo)":

| Schema (JSON Schema title) | Issuers | Verifiers | Holders |
| --- | --- | --- | --- |
| `CEXAKycCredential` | onboarding by the Ecosystem | onboarding by the Ecosystem | PERMISSIONLESS (personal wallets) |
| `CEXAVerifiedCounterpartyCredential` | onboarding by the Ecosystem (the Association only) | OPEN | ISSUER_ONBOARDING_PROCESS (one HOLDER entry for each member) |

## The V4 model

- **Corporations.** The first run of an organization creates its Corporation
  with the DID `did:example:playground-cexa-<release>-<chain id>`. The other
  scripts find it by this DID. The operator account
  (`PLAYGROUND_V4_MNEMONIC`) holds the OperatorAuthorization of each
  Corporation and signs every transaction.
- **ISSUER and VERIFIER entries.** A member starts the onboarding process
  with its own Corporation. The operator validates the entry with the
  Corporation of the Association, because the validator is the root
  (ECOSYSTEM) entry of the schema.
- **CEXAVerifiedCounterpartyCredential.** A member gets a HOLDER entry. The
  validator is the ISSUER entry of the Association. The member agent sends
  the onboarding request, the Association agent sets the `CP_*` claims of
  the `config.env` of the member and validates it. The Association agent
  then issues the credential, and the member agent publishes it as the
  Linked VP `#vpr-schemas-<schema id>-vtc-vp` on its DID.
- **VTJSC.** The Association agent publishes the VTJSC of each schema as
  `#vpr-schemas-<schema id>-vtjsc-vp`. The app finds each schema by its
  JSON Schema title (`app/lib/vtjsc.ts`, `app/usecases/cexa/counterparty.ts`).
- **EGF document.** The Corporation and the Ecosystem of the Association
  anchor `https://playground.<network>.verana.network/cexa/cexa-egf-v4.md`
  (`public/cexa/cexa-egf-v4.md`) by digest. The chain keeps the digest of
  the document at creation. A change to the document applies only to a new
  Corporation or a new Ecosystem.

## Before the first run

1. Run **Deploy Playground** for devnet. The URL of the EGF document must
   answer before `cexa-01` runs, because the workflow computes its digest.
2. Make sure that the DNS has the wildcard record
   `*.cexa.playground.devnet.verana.network`, with the same target as the
   other playground hosts. The ingress of each agent gets its TLS
   certificate for `<release>.cexa.playground.devnet.verana.network`.
3. Fund the operator account. Plan about 10 VNA for each organization (see
   [`docs/networks.md`](../../../docs/networks.md)).

## Run order

Each numbered workflow is a `workflow_dispatch` that calls
`cexa-00_core.yml` with `step` = `deploy` | `provision` | `all`. Select the
`v4` branch. Run the workflows **in order, one at a time**. All casts sign
with the same operator account, so all runs share the concurrency group
`vesta-cast-<network>`.

1. `cexa-01` with `step=all`: the Association, its Ecosystem, the two schemas
   and the ISSUER entry on the counterparty schema.
2. `cexa-02` and then `cexa-03` with `step=all`: the issuer members.
3. `cexa-04` with `step=all`: the verifier member.
4. `cexa-05` with `step=all`: the outsider (ECS credentials only).

The app finds the DIDs and the schema ids at run time on devnet. To link the
use case pages to the Verana app, put the ids of the Ecosystem and of the two
schemas in `DEVNET_IDS` in `app/lib/cexa-cast.ts`.

## Dual rail

The `CEXAKycCredential` is served over AnonCreds/DIDComm and over
OpenID4VCI/OpenID4VP SD-JWT:

- Each agent with `OID4VC_ROLE` in its `config.env` gets an empty
  `openid4vc.config`. This turns on the OpenID4VC plugin with development
  signing. The plugin does the issuer role and the verifier role, and the
  agent takes the credential types, the `vct` and the trust decision from
  the VPR.
- The issuer members create an AnonCreds credential definition that refers
  to the VTJSC of the Association.
- vs-agent v2 makes no request without an active VERIFIER entry. `darkpool`
  sets `UNSAFE_SKIP_OWN_AUTHORIZATION="true"` (chart value
  `unsafeSkipOwnAuthorization`). This flag is for demos only: the agent then
  makes the request, and the wallet must refuse it.

## Invariants

- **The Association is NOT an ECS Organization issuer.** Every member gets
  its ECS Organization credential from `ecs-org-issuer`. A Verifiable Service
  is an entry requirement of the EGF, so this cast has no
  `ecs-accreditations` workflow.
- **Verification of `CEXAKycCredential` is governed.** Only accredited
  members can ask a wallet for the credential.
- **`CEXAVerifiedCounterpartyCredential` is free to verify.** It is a Linked
  VP on the DID of each member. Only the Association issues it. The
  Association revokes it when a member loses its license (EGF section 10).
- **`darkpool` is verifiable, but it MUST stay outside the Association.** It
  must resolve TRUSTED (real ECS credentials) and hold no CEXA entry.
  CAUTION: a `darkpool` entry in a CEXA participant tree, or a
  `CEXAVerifiedCounterpartyCredential` on its DID, is an incident.
- The fees on the chain are 0. The fee story (0.90 + 0.10, example values)
  is in the use case pages and in the EGF.

## Shared machinery

- `.github/workflows/v4/common.sh`: the generic V4 helpers.
- `cast.sh`: the hosts, the Corporation DIDs, the schema titles and the
  counterparty claims of this cast.
- `scripts/provision-association.sh`, `scripts/provision-member.sh`,
  `scripts/provision-outsider.sh`: the provision step of each organization.
