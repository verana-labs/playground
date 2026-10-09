# BHI cast CI/CD

Deploys and provisions every verifiable service of the **BHI Verifiable
Hiring use case** (source: `verana-spec/playground/submission/oid-bhi.md`;
story at `/usecases/bhi`). Each participant is a separate vs-agent (Business
Wallet). The workflows provision every org-to-org exchange through the
chain and the Admin APIs of the agents. Personal-wallet flows (credential
offers, job applications, the refused request of Halcyon) happen at run
time, not here.

This branch runs the cast on **Verana V4 (devnet)** with veranad v0.10.5 and
vs-agent v2. See [`docs/networks.md`](../../../docs/networks.md). The
testnet cast (Verana V3) stays on the `main` branch.

GitHub reads workflow files only at the top level of `.github/workflows/`.
The numbered `bhi-*.yml` entry points are there. This directory has the
configuration of each organization, the schemas and the provisioning
scripts. `bhi-00_core.yml` calls the generic V4 core
(`v4-cast-00_core.yml`). The generic helpers are in `../v4/common.sh`, and
`cast.sh` adds the BHI hosts and the steps that more than one member runs.

Real organisations, Better Hiring Institute and Orchestrating Identity,
appear as themselves. Every other participant is fictional and has the
label (demo).

## The cast and their domains

The agents are at `<org>.bhi.playground.devnet.verana.network` (the anchor
at `institute.…`). The host of Meridian is `meridian.…`, but its Helm
release is `meridian-tech`, because the verandia cast has the release
`meridian-bank`.

| # | Workflow | Org / service | What it gets |
|---|---|---|---|
| 01 | Orchestrating Identity | certified OSP (real) | ECS credentials + DVS-Aligned Provider Ecosystem (demo) + its ISSUER entry. Second pass: Verified Employer ISSUER_GRANTOR + ISSUER, VERIFIER_GRANTOR on the three candidate schemas |
| 03 | TVS | second certified grantor (demo) | ECS credentials + DVS-Aligned Provider credential (from OID). Second pass: as OID |
| 04 | Better Hiring Institute | anchor + Recruitment Trust Network (real) | ECS credentials + Recruitment Trust Network with Recognised RecTech Provider (ECOSYSTEM issuers) and Verified Employer (GRANTOR issuers) + its Recognised RecTech Provider ISSUER entry |
| 05 | Northbank Identity | certified DVS issuer (demo) | ECS credentials + Ecosystem with Right to Work and Employment (GRANTOR verifiers) + ISSUER entries + AnonCreds credential definitions + OpenID4VC issuer |
| 06 | Caledonian University | awarding body (demo) | ECS credentials + Ecosystem with Qualification (GRANTOR verifiers) + ISSUER entry + AnonCreds credential definition + OpenID4VC issuer |
| 07 | Cirrus Certification | second Qualification issuer (demo) | ECS credentials + ISSUER entry on the Qualification schema of Caledonian + credential definition on the VTJSC of Caledonian + OpenID4VC issuer |
| 08 | Meridian Technologies | the Verified Employer (demo) | ECS credentials + Verified Employer credential (from OID) + VERIFIER entries on the three candidate schemas (validated by OID) + OpenID4VC verifier |
| 09 | JobSearch | recognised verifier (demo) | ECS credentials + Recognised RecTech Provider credential (from the Institute) + VERIFIER entries on the three candidate schemas (validated by **TVS**, the openness argument) + OpenID4VC verifier |
| 10 | Halcyon Talent | the impostor (demo) | ECS credentials only. NO Verified Employer and NO VERIFIER entry, by design. OpenID4VC verifier with the demo flag |

The number 02 is not used. On V3, `bhi-02` accredited OID and TVS as
ECS-Organization issuers. On V4, `ecs-org-issuer` issues every
ECS-Organization credential.

## The V4 model

- **Corporations.** Each organization has its own Corporation, with the DID
  `did:example:playground-bhi-<key>-<chain id>`. The keys (`CORPORATION_KEY`
  in `config.env`) are `oid`, `tvs`, `institute`, `northbank`, `caledonian`,
  `cirrus`, `meridian`, `jobsearch` and `halcyon`. The first `deploy` or
  `all` run of an organization creates its Corporation. The operator
  account (`PLAYGROUND_V4_MNEMONIC`) holds the OperatorAuthorization of
  each Corporation and signs every transaction.
- **Agent accounts.** Each agent has its own Verana account, the
  `vs_operator` of its Participant entries (see `../v4/common.sh`).
- **ECS credentials.** Every agent is standalone. It gets its
  ECS-Organization credential from `ecs-org-issuer` through a vt-flow
  onboarding process, and issues its own ECS-Service credential.
- **Ecosystems.** The agent of the Ecosystem controller publishes the
  VTJSC, the SD-JWT Type Metadata and the AnonCreds schema of each schema.
- **Onboarding modes** (issuer / verifier / holder):

  | Schema | Ecosystem | Issuers | Verifiers | Holders |
  |---|---|---|---|---|
  | DVSAlignedProviderCredential | OID | ECOSYSTEM | OPEN | through an issuer |
  | RecognisedRecTechProviderCredential | Institute | ECOSYSTEM | OPEN | through an issuer |
  | VerifiedEmployerCredential | Institute | GRANTOR | OPEN | through an issuer |
  | RightToWorkCredential | Northbank | ECOSYSTEM | GRANTOR | PERMISSIONLESS |
  | EmploymentCredential | Northbank | ECOSYSTEM | GRANTOR | PERMISSIONLESS |
  | QualificationCredential | Caledonian | ECOSYSTEM | GRANTOR | PERMISSIONLESS |

- **Grantors.** OID and TVS hold the grantor entries:
  - an ISSUER_GRANTOR entry on Verified Employer, validated by the root
    entry of the Institute. Each then holds an ISSUER entry on Verified
    Employer, and the validator is its own ISSUER_GRANTOR entry. An agent
    cannot run a vt-flow with itself, so the operator validates that entry
    with the Corporation of the grantor;
  - a VERIFIER_GRANTOR entry on each candidate schema, validated by the
    root entry of the schema. The agent of the grantor validates the
    VERIFIER entries of Meridian (OID) and JobSearch (TVS) over vt-flow.
- **Org-to-org credentials.** The issuer agent validates the HOLDER entry
  of the applicant and puts the claims from the `config.env` of the
  applicant in the credential: DVS-Aligned Provider (TVS), Verified
  Employer (Meridian), Recognised RecTech Provider (JobSearch). OID has no
  DVS-Aligned Provider credential of its own: its ISSUER entry is the
  proof of its role.

## Prerequisites

Secrets and variables: see [`docs/networks.md`](../../../docs/networks.md).

**DNS + TLS.** A wildcard record must point at the cluster ingress:
`*.bhi.playground.devnet.verana.network`. A wildcard matches one label
only, so the record `*.playground.devnet…` does not cover this zone.
cert-manager (`letsencrypt-prod`) gets a certificate for each host.

**The devnet ECS Ecosystem must be live**, with `ecs-org-issuer` in the
chain namespace.

**Cast logos.** The `config.env` files refer to
`public/images/cast/<org>.svg` on the `main` branch. The agents put the
logo URLs in their ECS credentials, so the files must be on `main` before a
run. The current SVGs are monogram placeholders (PENDING: the brand kits of
BHI and OID).

**PENDING confirmations before a provision run intended to stick:** the
Companies House number and DVS certification scope of OID
(`orgs/orchestrating-identity/config.env`), the CIC number of BHI
(`orgs/institute/config.env`), and the hosts themselves (our proposal).

## Running

Select the `v4` branch. Run the workflows **in this order, one at a time**
(all runs serialize on the `vesta-cast-<network>` concurrency group, and
GitHub keeps only one queued run in a group):

1. `bhi-01` with `step=all`: Orchestrating Identity and the DVS-Aligned
   Provider Ecosystem (demo).
2. `bhi-03` with `step=all`: TVS and its DVS-Aligned Provider credential.
3. `bhi-04` with `step=all`: the Institute and the Recruitment Trust Network.
4. `bhi-05` and `bhi-06` with `step=all`: the candidate schemas.
5. `bhi-07` with `step=all`: Cirrus.
6. **`bhi-01` again with `step=provision`**: the grantor branches of OID.
7. **`bhi-03` again with `step=provision`**: the grantor branches of TVS.
8. `bhi-08`, `bhi-09` and `bhi-10` with `step=all`.

Steps 6 and 7 are necessary: the grantor entries of OID and TVS need the
Ecosystems of bhi-04, bhi-05 and bhi-06. In the first pass, bhi-01 and
bhi-03 skip these entries with a warning. Every step is idempotent, so you
can run a workflow again at any time. The `step` input splits a run into
`deploy` and `provision`.

## The three schema families (partner review, 2026-08-20)

- **Qualification** (`schemas/qualification.json`, the Ecosystem of
  Caledonian): one credential for each qualification, degrees and
  professional certifications alike. Caledonian AND Cirrus issue it.
- **Employment** (`schemas/employment.json`, the Ecosystem of Northbank): one
  credential for each employment relationship. A current employment has no
  `endDate`. The five-year history is the set of credentials in the wallet.
- **Right to Work** (`schemas/right-to-work.json`, the Ecosystem of
  Northbank): exactly one credential for each person.

The employment-reference schema was dropped as redundant. On V4,
`/api/demo` finds the VTJSC of each schema at run time, from the DID
document of the Ecosystem controller and the JSON Schema title
(`app/lib/vtjsc.ts`). The formal schema definitions of BHI follow through
the template of the partner; treat the current claim sets as draft.

## What CI/CD deliberately does not do

- **Halcyon never gets a Verified Employer credential or a VERIFIER
  entry.** It IS a verifiable organisation (ECS credentials). The refusal
  path depends on exactly those missing links. On V3, Halcyon also asked
  for more claims than a verifier may ask for. An empty `openid4vc.config`
  cannot express that, so the V4 cast does not show it.
- **Northgate Screening** exists only in the story (no agent).
- **Personal wallet flows** (credential issuance to visitors, job
  applications) are run-time flows of the deployed agents and the
  playground demos, not provisioning.

## After a bootstrap

On devnet, `app/lib/bhi-cast.ts` gives no DIDs: the app finds each DID from
its host. The testnet values in that file are the live `did:webvh` values of
the V3 cast.
