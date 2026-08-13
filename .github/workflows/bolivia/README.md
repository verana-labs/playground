# Bolivia cast CI/CD

Deploys and provisions every verifiable service of the **Estado Plurinacional de Bolivia (demo)
use case** (spec: `verana-spec/playground/bolivia/spec.md`, §5) on the Verana
testnet, following the Vesta cast pattern: each participant is a separate
vs-agent (Business Wallet), and every org-to-org exchange is provisioned by
CI/CD driving the agents' Admin APIs. Personal-wallet flows (Cedula Digital
offers, portal logins, el prestamista's refused request) happen at runtime, not
here.

GitHub only picks up workflow files at the top level of `.github/workflows/`,
so the numbered `bolivia-*.yml` entry points live there while everything else
(this directory) holds the per-org configs, schemas, OID4VC templates and
provisioning scripts. Generic helpers are shared from the Vesta cast
(`vesta/common.sh`) and the demo cast (`demo/scripts/render-oid4vc-config.sh`)
— the demo-cast precedent; `scripts/lib.sh` adds the Bolivia hosts and the
governed-verification helpers the other casts never needed.

## The cast and their domains

Orgs live at `<org>.bolivia.playground.testnet.verana.network`.

| # | Workflow | Org / service | What it gets |
|---|---|---|---|
| 01 | Business Registry | company register (demo) | ECS-Org (Helvetia) + ECS-Service + Legal Representation registry (issuance ECOSYSTEM, verification OPEN) + sole ISSUER on it |
| 02 | ECS accreditations | — (on-chain only) | Business Registry: ISSUER on ECS-Organization (Business IDs) |
| 03 | Civil Registry | identity authority (demo) | ECS-Org (Business Registry) + ECS-Service + Cedula Digital registry (issuance AND verification ECOSYSTEM) + sole ISSUER on it |
| 04 | Impuestos Nacionales | tax portal (demo) | ECS creds + validated VERIFIER on Cedula Digital + open VERIFIER on Legal Representative |
| 05 | Banco Union (demo) | verifiable bank (demo) | ECS creds + validated VERIFIER on Cedula Digital + open VERIFIER on Legal Representative |
| 06 | el prestamista Loans | the over-asking verifier (demo) | ECS creds only — deliberately NO Cedula Digital VERIFIER permission |

## Prerequisites

Same repository secrets as the Vesta cast: `KUBECONFIG_VERANA_DEV`,
`K8S_NAMESPACE`, `PLAYGROUND_MNEMONIC` (00), and `ECS_ECOSYSTEM_MNEMONIC`
(02 only — must recover the ECS trust registry controller).

**DNS + TLS.** A wildcard record must point at the cluster ingress:
`*.bolivia.playground.testnet.verana.network` (a single wildcard only matches
one label, so the existing `*.playground…` record does not cover this zone).
Certificates come from cert-manager (`letsencrypt-prod`) per host.

**Cast logos.** The `config.env` files reference
`public/images/cast/<org>.svg` on the `main` branch; provisioning downloads
them into the credentials, so they must be on `main` before a provision run.

## Run order

First bootstrap: run **01 → 02 → 03 → 04 → 05 → 06** with step `all`. The
numbering encodes the provisioning dependencies (02 needs the Business
Registry's DID document; 03–06 need the register issuing ECS-Org; 04/05 need
the schemas from 03 and 01). The relying parties (04–06) also pin the
issuers' OID4VC signing fingerprints at deploy time, so 01 and 03 must
already run the openid4vc image.

Every workflow is idempotent: permissions, registries, schemas and VTJSCs
are looked up before they are created, and credentials are skipped when the
DID document already presents the linked VP. Use `force_refresh` to re-issue
credentials after changing claims in an org's `config.env`; the `step` input
splits a run into `deploy` and `provision`.

## OpenID4VC rail (SD-JWT for non-DIDComm wallets)

Every cast member carries an `OID4VC_ROLE`, and the role name selects the
template under `oid4vc/`: `issuer-cedula` (Civil Registry),
`issuer-legal-rep` (Business Registry) — each issuer advertises only the
credential it is authorized to issue, per the governed-issuance story —
`verifier` (Impuestos Nacionales, Banco Union (demo); pins both issuers' fingerprints via
`OID4VC_ISSUER_RELEASES`) and `verifier-overasking` (el prestamista: requests the
FULL Cedula Digital, portrait included, and pins no fingerprints — compliant
wallets refuse before ever presenting). Credential configuration and policy
ids (`cedula-digital`, `bolivia-legal-rep`) and the AnonCreds type names
(`CedulaDigital`, `LegalRepresentative`) are the workflow contract of
`app/lib/bolivia-cast.ts` and `/api/demo`.

## What CI/CD deliberately does not do

- **el prestamista never gets a VERIFIER permission on the Cedula Digital.**
  It IS a verifiable company (ECS-Org from the register, self ECS-Service) —
  the refusal path depends on exactly one missing link: no relying-party
  registration, so every compliant wallet refuses its presentation request.
- **Personal wallet flows** (Cedula Digital issuance to visitors, tax/bank
  logins) are runtime flows served by the deployed agents and the
  playground demos — not provisioning.

## After a bootstrap

`app/lib/bolivia-cast.ts` still carries the `QmBoliviaCastPending…`
placeholder DIDs. Once the cast is live, replace each DID with the real
`did:webvh` value from `https://<host>/.well-known/did.jsonl` (state.id) —
the provision logs also print the on-chain registry/schema ids.
