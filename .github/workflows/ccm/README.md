# CCM cast CI/CD

Deploys and provisions every verifiable service of the **Cámara de Comercio de
Medellín (demo) use case** (the Colombian legal-representation story at
`/usecases/ccm`) on the Verana testnet, following the Vesta/Bolivia cast
pattern: each participant is a separate vs-agent (Business Wallet), and every
org-to-org exchange is provisioned by CI/CD driving the agents' Admin APIs.
Personal-wallet flows (the credential offer from the CCM portal, the
corporate-access presentation at the bank) happen at runtime, not here.

GitHub only picks up workflow files at the top level of `.github/workflows/`,
so the numbered `ccm-*.yml` entry points live there while everything else
(this directory) holds the per-org configs, the schema, OID4VC templates and
provisioning scripts. Generic helpers are shared from the Vesta cast
(`vesta/common.sh`) and the demo cast (`demo/scripts/render-oid4vc-config.sh`);
`scripts/lib.sh` adds the CCM hosts and the governed-verification helpers
(copied from the Bolivia cast).

## The cast and their domains

Orgs live at `<org>.ccm.playground.testnet.verana.network`.

| # | Workflow | Org / service | What it gets |
|---|---|---|---|
| 01 | Cámara de Comercio de Medellín | chamber (demo) | ECS-Org (Helvetia) + ECS-Service + Ecosistema Cámara de Comercio (issuance AND verification ECOSYSTEM) + sole ISSUER on Representación Legal |
| 02 | ECS accreditations | — (on-chain only) | CCM: ISSUER on ECS-Organization (Business IDs from the register itself) |
| 03 | Bancolombia (demo) | verifiable bank (demo) | ECS creds + validated VERIFIER on Representación Legal (the paid relying-party register) |

**Target deployment vs demo.** In production, Confecámaras would govern the
Cámara de Comercio ecosystem and accredit all 57 chambers as issuers (each
chamber holding a VERIFIER_GRANTOR entry to onboard its own verifiers), and
the Verana Council would onboard Confecámaras as ISSUER_GRANTOR of
ECS-Organization. The demo collapses that hierarchy: the CCM (demo) controls
the ecosystem directly and is accredited as ECS-Organization ISSUER by the
ECS ecosystem (workflow 02).

**Fees.** The Representación Legal root permission is created with symbolic
issuance/verification fees (`ISSUANCE_FEES`/`VERIFICATION_FEES` in
`orgs/camara/config.env`), publishing the business model in the registry:
the holder pays issuance (as they pay today's certificate, ~COP 12.100) and
each registered verifier pays per verification (COP 2.000). The demo rails
do not settle these fees at runtime.

## Prerequisites

Same repository secrets as the Vesta cast: `KUBECONFIG_VERANA_DEV`,
`K8S_NAMESPACE`, `PLAYGROUND_MNEMONIC` (00), and `ECS_ECOSYSTEM_MNEMONIC`
(02 only — must recover the ECS trust registry controller).

**DNS + TLS.** A wildcard record must point at the cluster ingress:
`*.ccm.playground.testnet.verana.network` (a single wildcard only matches
one label, so the existing `*.playground…` record does not cover this zone).
Certificates come from cert-manager (`letsencrypt-prod`) per host.

**Cast logos.** The `config.env` files reference
`public/images/ccm/<org>.png` on the `main` branch; provisioning downloads
them into the credentials, so they must be on `main` before a provision run.

## Run order

First bootstrap: run **01 → 02 → 03** with step `all`. The numbering encodes
the provisioning dependencies (02 needs the chamber's DID document; 03 needs
the chamber issuing ECS-Org and the schema from 01). The bank also pins the
chamber's OID4VC signing fingerprint at deploy time, so 01 must already run
the openid4vc image.

Every workflow is idempotent: permissions, registries, schemas and VTJSCs
are looked up before they are created, and credentials are skipped when the
DID document already presents the linked VP. Use `force_refresh` to re-issue
credentials after changing claims in an org's `config.env`; the `step` input
splits a run into `deploy` and `provision`.

## OpenID4VC rail (SD-JWT for non-DIDComm wallets)

Both cast members carry an `OID4VC_ROLE`, and the role name selects the
template under `oid4vc/`: `issuer-legal-rep` (the chamber — it advertises
only the credential it is authorized to issue) and `verifier` (Bancolombia
(demo); pins the chamber's fingerprint via `OID4VC_ISSUER_RELEASES`).
Credential configuration and policy id (`ccm-legal-rep`) and the AnonCreds
type name (`RepresentacionLegal`) are the workflow contract of
`app/lib/ccm-cast.ts` and `/api/demo`.

## What CI/CD deliberately does not do

- **Revocation.** The story leans on instant revocation (the chamber revokes
  the day the representative ceases; the bank knows at the next check). Both
  rails support it — AnonCreds revocation registries on DIDComm, status
  lists on OpenID4VC — but the mockup does not implement it yet; the use
  case page says so explicitly.
- **Personal wallet flows** (the portal QR issuance, the bank presentation)
  are runtime flows served by the deployed agents and the playground demos —
  not provisioning.

## After a bootstrap

`app/lib/ccm-cast.ts` still carries the `QmCcmCastPending…` placeholder
DIDs. Once the cast is live, replace each DID with the real `did:webvh`
value from `https://<host>/.well-known/did.jsonl` (state.id) — the provision
logs also print the on-chain registry/schema ids.
