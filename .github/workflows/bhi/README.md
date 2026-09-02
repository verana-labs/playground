# BHI cast CI/CD

Deploys and provisions every verifiable service of the **BHI Verifiable
Hiring use case** (source: `verana-spec/playground/submission/oid-bhi.md`;
story at `/usecases/bhi`) on the Verana testnet, following the
Vesta/Verandia cast pattern: each participant is a separate vs-agent
(Business Wallet), and every org-to-org exchange is provisioned by CI/CD
driving the agents' Admin APIs. Personal-wallet flows (credential offers,
job applications, Halcyon's refused request) happen at runtime, not here.

GitHub only picks up workflow files at the top level of `.github/workflows/`,
so the numbered `bhi-*.yml` entry points live there while everything else
(this directory) holds the per-org configs, schemas, OID4VC templates and
provisioning scripts. Generic helpers are shared from the Vesta cast
(`vesta/common.sh`) and the demo cast (`demo/scripts/render-oid4vc-config.sh`);
`scripts/lib.sh` adds the BHI hosts.

Real organisations - Better Hiring Institute and Orchestrating Identity -
appear as themselves; every other participant is fictional and labeled
(demo).

## The cast and their domains

Orgs live at `<org>.bhi.playground.testnet.verana.network` (the anchor at
`institute.…`; Meridian's host is `meridian.…` while its Helm release is
`meridian-tech`, since the verandia cast owns `meridian-bank`).

| # | Workflow | Org / service | What it gets |
|---|---|---|---|
| 01 | Orchestrating Identity | certified OSP (real) | ECS-Org (Helvetia) + ECS-Service + DVS-Aligned Provider Ecosystem (demo) + sole ISSUER on it + its own DVS-Aligned Provider credential |
| 02 | ECS accreditations | - (on-chain only) | OID and (once live) TVS: ISSUER on ECS-Organization - the Verana Council decision: DVS certification is the accreditation criterion |
| 03 | TVS | second certified grantor (demo) | ECS-Org (OID) + ECS-Service + DVS-Aligned Provider credential (OID) |
| 04 | Better Hiring Institute | anchor + Recruitment Trust Network (real) | ECS-Org (OID) + ECS-Service + RTN registry with Recognised RecTech Provider (BHI sole issuer) and Verified Employer (OID + TVS as issuers); verification OPEN on both |
| 05 | Northbank Identity | certified DVS issuer (demo) | ECS creds + registry with Right to Work (one per person) and Employment (one per employment) schemas + sole ISSUER + AnonCreds types + OID4VC issuer |
| 06 | Caledonian University | awarding body (demo) | ECS creds + Qualification registry + schema + ISSUER + AnonCreds type + OID4VC issuer |
| 07 | Cirrus Certification | second Qualification issuer (demo) | ECS creds + ISSUER on Caledonian's Qualification schema (one credential per qualification, from any number of institutions) |
| 08 | Meridian Technologies | the Verified Employer (demo) | ECS creds + Verified Employer credential (issued by OID) + open VERIFIER perms on the three candidate schemas + OID4VC verifier |
| 09 | JobSearch | recognised verifier (demo) | ECS-Org from **TVS** (the openness argument) + Recognised RecTech Provider (BHI) + open VERIFIER perms + OID4VC verifier |
| 10 | Halcyon Talent | the impostor (demo) | ECS creds only - deliberately NO Verified Employer and NO verifier perms; OID4VC verifier-overasking |

## Prerequisites

Same repository secrets as the Vesta cast: `KUBECONFIG_VERANA_DEV`,
`K8S_NAMESPACE`, `PLAYGROUND_MNEMONIC` (00), and `ECS_ECOSYSTEM_MNEMONIC`
(02 only - must recover the ECS trust registry controller).

**DNS + TLS.** A wildcard record must point at the cluster ingress:
`*.bhi.playground.testnet.verana.network` (a single wildcard only matches
one label, so the existing `*.playground…` record does not cover this zone).
Certificates come from cert-manager (`letsencrypt-prod`) per host.

**The vesta cast must be live**: bhi-01 obtains OID's ECS-Organization from
Helvetia Trust (`helvetia-trust` release in the shared namespace).

**Cast logos.** The `config.env` files reference
`public/images/cast/<org>.svg` on the `main` branch; provisioning downloads
them into the credentials, so they must be on `main` before a provision run.
The current SVGs are generated monogram placeholders - replace them when
BHI/OID brand kits arrive (PENDING).

**PENDING confirmations before a provision run intended to stick:**
OID's Companies House number and DVS certification scope
(`orgs/orchestrating-identity/config.env`), BHI's CIC number
(`orgs/institute/config.env`), and the hosts themselves (our proposal).

## Run order

First bootstrap: **01 → 02 → 03 → 02 (again, for TVS) → 04 → 05 → 06 → 07 →
08 → 09 → 10** with step `all`. The numbering encodes the provisioning
dependencies (02 needs OID's DID document; 03 needs OID accredited; 04 needs
OID + TVS for the Verified Employer issuer grants - re-run 04 after 03 if
TVS was skipped; 07 needs the schema from 06; 08-10 need 04-07). The
relying parties (08-10) also pin the issuers' OID4VC signing fingerprints at
deploy time, so 05-07 must already run the openid4vc image.

Every workflow is idempotent: permissions, registries, schemas and VTJSCs
are looked up before they are created, and credentials are skipped when the
DID document already presents the linked VP. Use `force_refresh` to re-issue
credentials after changing claims in an org's `config.env`; the `step` input
splits a run into `deploy` and `provision`.

All cast runs share the `vesta-cast` concurrency group (one signing account
across every playground cast): start workflows one at a time.

## The three schema families (partner review, 2026-08-20)

- **Qualification** (`qualification`, Caledonian's registry): one credential
  per qualification, degrees and professional certifications alike; issued
  by Caledonian AND Cirrus.
- **Employment** (`employment`, Northbank's registry): one credential per
  employment relationship, `endDate` absent for a current employment; the
  five-year history is the set in the wallet.
- **Right to Work** (`right-to-work`, Northbank's registry): exactly one per
  person.

The employment-reference schema was dropped as redundant. AnonCreds type
names (`Qualification`, `Employment`, `RightToWork`) and OID4VC credential
configuration ids (`bhi-qualification`, `bhi-employment`,
`bhi-right-to-work`) are the workflow contract for the future demo wiring in
`app/lib/bhi-cast.ts` / `/api/demo`. BHI's formal schema definitions follow
via the partner's forthcoming template; treat the current claim sets as
draft.

## What CI/CD deliberately does not do

- **Halcyon never gets a Verified Employer credential or a VERIFIER
  permission.** It IS a verifiable organisation (ECS-Org from OID, self
  ECS-Service) - the refusal path depends on exactly those missing links.
- **Northgate Screening** exists only in the story (no agent).
- **Personal wallet flows** (credential issuance to visitors, job
  applications) are runtime flows served by the deployed agents and the
  playground demos - not provisioning.

## After a bootstrap

`app/lib/bhi-cast.ts` still carries the `QmBhiCastPending…` placeholder
DIDs. Once the cast is live, replace each DID with the real `did:webvh`
value from `https://<host>/.well-known/did.jsonl` (state.id) - the provision
logs also print the on-chain registry/schema ids. The chapter-4 demo cards
stay "coming soon" until the demo wiring lands (a follow-up, per the
Verandia offers/login pattern).
