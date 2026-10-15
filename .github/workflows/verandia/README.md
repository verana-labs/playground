# Verandia cast CI/CD

The verandia workflows deploy and provision each verifiable service of the
**Republic of Verandia use case** (spec: `verana-spec/playground/verandia/spec.md`,
§5). Each organization is a separate vs-agent (a Business Wallet). Personal
wallet flows (Citizen ID offers, portal sign-ins, the refused QuickCash
request) occur at run time, not in CI/CD.

This branch runs the cast on **Verana V4 (devnet)** with veranad v0.10.5 and
vs-agent v2. See [`docs/networks.md`](../../../docs/networks.md).

GitHub reads workflow files only at the top level of `.github/workflows/`.
Thus the numbered `verandia-*.yml` entry points are there, and this directory
holds the cast library (`cast.sh`), the organization configurations, the
schemas and the provisioning scripts. Each entry point calls
`verandia-00_core.yml`, which calls the generic V4 core
`v4-cast-00_core.yml` with `cast=verandia`. The generic V4 helpers are in
`../v4/common.sh`.

## The cast

The organizations are at `<org>.verandia.playground.devnet.verana.network`.

| # | Workflow | Release | What it gets |
|---|---|---|---|
| 01 | Business Registry | `business-registry` | ECS credentials + Legal Representation Ecosystem (Legal Representative schema: issuers ECOSYSTEM, verifiers OPEN, holders PERMISSIONLESS) + root entry + its own ISSUER entry + credential definition |
| 03 | Civil Registry | `civil-registry` | ECS credentials + Verandia Citizen ID Ecosystem (issuers ECOSYSTEM, verifiers ECOSYSTEM, holders PERMISSIONLESS) + root entry + its own ISSUER entry + credential definition |
| 04 | Tax Buro | `tax-buro` | ECS credentials + VERIFIER on the Citizen ID (validated) + VERIFIER on the Legal Representative schema (OPEN) |
| 05 | Meridian Bank | `meridian-bank` | ECS credentials + VERIFIER on the Citizen ID (validated) + VERIFIER on the Legal Representative schema (OPEN) |
| 06 | QuickCash Loans | `quickcash` | ECS credentials only. By design, NO VERIFIER entry on the Citizen ID |

There is no workflow 02. On V3 it made the Business Registry an ISSUER of the
ECS Organization schema. On V4 this step is not on the chain (see below).

## The V4 model

- **Corporations.** Each organization has its own Corporation. The
  `CORPORATION_KEY` of an organization (its `config.env`) is equal to its
  release name, and its Corporation has the DID
  `did:example:playground-verandia-<release>-<chain id>`. The first run of an
  organization creates its Corporation. The operator account
  (`PLAYGROUND_V4_MNEMONIC`) holds the OperatorAuthorization of each
  Corporation and signs each transaction.
- **Agent accounts.** Each agent has its own Verana account, the
  `vs_operator` of its Participant entries (see `../v4/common.sh`).
- **ECS credentials.** All the agents are standalone. `ecs-org-issuer` (the
  ECS ecosystem of the network) issues the ECS Organization credential of
  EACH organization, after a vt-flow onboarding process. Each agent issues
  its own ECS Service credential. The Business Registry does not issue ECS
  Organization credentials on V4: story step 3.2 is not on the chain.
- **Verandia schemas.** Each registry controls one Ecosystem with one schema
  and the root Participant entry. The registry also holds the only ISSUER
  entry on its schema. The Corporation operator validates that entry, because
  the root entry is its validator. The registry agent publishes the VTJSC, and
  the script then creates the AnonCreds credential definition on that VTJSC.
- **Relying parties.** The Corporation operator of the Civil Registry
  validates the VERIFIER entries on the Citizen ID: this is the
  relying-party register of the Republic. The VERIFIER entries on the Legal
  Representative schema are OPEN. vs-agent v2 makes no presentation request
  without an active VERIFIER entry, so the relying parties need that entry too.
- **QuickCash.** Its `config.env` sets `UNSAFE_SKIP_OWN_AUTHORIZATION="true"`
  (demo only, not in the spec): the agent makes the Citizen ID request
  although it has no VERIFIER entry, and the wallets must refuse it.

CAUTION: the root (ECOSYSTEM) entry and the ISSUER entry of a registry name
the same DID on the same schema. The V4 casts did not use this before.

## Prerequisites

The repository secrets and variables of the V4 casts: see
[`docs/networks.md`](../../../docs/networks.md).

**DNS and TLS.** A wildcard record must point to the cluster ingress:
`*.verandia.playground.devnet.verana.network`. A wildcard matches one label
only, so the `*.playground.devnet…` record does not cover this zone.
cert-manager (`letsencrypt-prod`) issues a certificate for each host.

**Cast logos.** The `config.env` files refer to
`public/images/cast/<org>.svg` on the `main` branch. The credentials contain
these URLs, so the files must be on `main` before a provision run.

## Run order

Select the `v4` branch. Run the workflows **in order, one at a time**, with
`step=all` (all runs serialize on one concurrency group):

1. `verandia-01` (Business Registry). It creates the Legal Representative
   schema.
2. `verandia-03` (Civil Registry). It creates the Citizen ID schema.
3. `verandia-04`, `verandia-05` and `verandia-06`, one after the other. The
   relying parties need both schemas. QuickCash needs the Citizen ID schema
   at run time, for its request.

Each workflow can run again: the scripts find the Corporations, the
Ecosystems, the schemas and the Participant entries before they create them.
The `step` input splits a run into `deploy` and `provision`.
`reset_identity` deletes the storage of the agent, so the agent gets a new
DID. Run it with `step=all`, and then provision again each organization that
refers to the old DID.

## Dual rail

The Verandia credentials go over AnonCreds/DIDComm (Hologram) and over
OpenID4VCI/OpenID4VP SD-JWT (the other personal wallets):

- Each organization has an `OID4VC_ROLE`, so it gets an empty
  `openid4vc.config`. This turns on the OpenID4VC plugin with development
  signing. The agent takes the credential types, the display name, the `vct`
  and the trust decision from the VPR.
- Each registry has an AnonCreds credential definition on the VTJSC of its
  schema.
- The app (`app/api/demo`, `app/api/verandia-login`) finds each VTJSC by the
  host of the registry and the schema title (`app/lib/vtjsc.ts`):
  `VerandiaCitizenIDCredential` and `LegalRepresentativeCredential`. These
  titles are the contract between the workflows and the app.
- A request that names only the VTJSC asks for every claim of the schema.
  QuickCash makes such a request (the over-asking request). The Tax Buro and
  Meridian Bank ask for a subset of the claims (`app/api/verandia-login`).

## What CI/CD does not do

- **QuickCash never gets a VERIFIER entry on the Verandia Citizen ID.** It IS
  a verifiable company (ECS credentials), and the refusal depends on one
  missing link only: no relying-party registration.
- **Personal wallet flows** (Citizen ID offers to visitors, sign-ins at the
  Tax Buro and the bank) are run-time flows of the deployed agents and the
  playground demos.

## After a bootstrap

On devnet the app finds the agents by their hosts, so no DID changes in the
app. On testnet (V3), `app/lib/verandia-cast.ts` keeps the testnet DIDs.
