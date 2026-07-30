# Vesta cast CI/CD

Deploys and provisions every verifiable service of the **Vesta Appliances use
case** (spec: `verana-spec/playground/verana-explained/spec.md`, section 5) on
the Verana testnet, following the verana-demos pattern: each participant is a
separate vs-agent (Business Wallet), and every org-to-org exchange is
provisioned by CI/CD driving the agents' Admin APIs — in v3 there is no
DIDComm between verifiable services. DIDComm is only used between Personal
Wallets and services (badge issuance, login presentations), which happens at
runtime, not here.

GitHub only picks up workflow files at the top level of `.github/workflows/`,
so the numbered `vesta-*.yml` entry points live there while everything else
(this directory) holds the shared library, per-org configs, schemas and
provisioning scripts:

```
.github/workflows/
  vesta-00_core.yml            reusable deploy+provision pipeline
  vesta-01..10_*.yml           one entry point per cast member (run order)
  vesta/
    common.sh                  shared helpers (adapted from verana-demos)
    deployment.template.yaml   Helm values template (vs-agent chart)
    orgs/<org>/config.env      per-org identity, claims and provisioning config
    schemas/*.json             ISO 9001-style (demo) + Authorized Repairer schemas
    scripts/*.sh               provisioning scripts (Admin APIs + veranad)
```

## The cast and their domains

Orgs live at `<org>.playground.testnet.verana.network`, sub-services at
`<subservice>.<org>.playground.testnet.verana.network`.

| # | Workflow | Org / service | Host | What it gets |
|---|---|---|---|---|
| 01 | Helvetia Trust | KYB issuer (demo) | `helvetia-trust.playground…` | ECS-Org (bootstrap from ECS TR) + ECS-Service |
| 02 | ECS accreditations | — (on-chain only) | — | Helvetia: ISSUER on ECS-Organization; ECS-Badge root perm |
| 03 | Vesta anchor | Vesta Appliances (demo) | `vesta.playground…` | ECS-Org (Helvetia) + ECS-Service + ECS-Badge issuer |
| 04 | ISO Certification | certification registry (demo) | `iso-certification.playground…` | ECS creds + trust registry + ISO 9001-style (demo) schema |
| 05 | NormaCert | certification body (demo) | `normacert.playground…` | ECS creds + ISSUER on ISO schema + issues certificate to Vesta |
| 06 | Repair Network | Vesta sub-service | `repair-network.vesta.playground…` | delegated ECS-Service + trust registry + Authorized Repairer schema |
| 07 | Vesta Portal | Vesta sub-service | `portal.vesta.playground…` | delegated ECS-Service + VERIFIER on ECS-Badge |
| 08 | Subsidiaries | Vesta Iberia + Nordics (demo) | `vesta-iberia.playground…`, `vesta-nordics.playground…` | ECS creds + ISSUER on Authorized Repairer |
| 09 | Zenith Repairs | partner repairer (demo) | `zenith.playground…` | ECS creds + Authorized Repairer (from Iberia) + ECS-Badge issuer |
| 10 | Umbra Repairs | the impostor (demo) | `umbra.playground…` | nothing on purpose — DID only, no credentials |

Delegated sub-services (06, 07) get their ECS-Service credential issued by the
Vesta anchor and inherit its ECS-Organization per the Verifiable Trust spec —
they never link an organization credential of their own.

## Prerequisites

**Repository secrets**

| Secret | Used by | Notes |
|---|---|---|
| `KUBECONFIG_VERANA_DEV` | 00 | already used by `deploy.yml` (same cluster as verana-demos) |
| `K8S_NAMESPACE` | 00 | already used by `deploy.yml`; all cast agents deploy there |
| `PLAYGROUND_MNEMONIC` | 00 | dedicated funded testnet account for the playground cast; controls all cast registries/permissions |
| `ECS_ECOSYSTEM_MNEMONIC` | 02 only | must recover the ECS trust registry controller (`verana19yvkutae4g3gkkakrpnt0wf70hwa2vq4qs5e43`) |

`PLAYGROUND_MNEMONIC` is deliberately its own account (not the verana-demos
one). Generate it with `veranad keys add playground --keyring-backend test`
(save the mnemonic as the secret) and fund it with uvna at
https://faucet-vs.testnet.verana.network/invitation — runs fail on
`check_balance` with that faucet link when the balance is empty.

**DNS + TLS.** Wildcard records must point at the cluster ingress:
`*.playground.testnet.verana.network` **and**
`*.vesta.playground.testnet.verana.network` (a single wildcard only matches
one label, and the portal / repair-network hosts are one level deeper).
Certificates come from cert-manager (`letsencrypt-prod`) per host.

## Run order

First bootstrap: run **01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10** with
step `all`. The numbering encodes the dependencies (02 needs Helvetia's DID
document; 03/04/05/08/09 need Helvetia issuing; 05 links the certificate on
the anchor from 03; 08 needs the schema from 06; 09 needs Iberia from 08).

Every workflow is idempotent: permissions, registries, schemas and VTJSCs are
looked up before they are created, and credentials are skipped when the DID
document already presents the linked VP. Use the `force_refresh` input to
re-issue credentials after changing claims (name, logo, address) in an org's
`config.env`. The `step` input splits a run into `deploy` (Helm only) and
`provision` (Admin APIs + chain only).

## What CI/CD deliberately does not do

- **Personal wallet flows** (employee/technician badge offers, portal login,
  the door scan) are runtime DIDComm flows served by the deployed agents and
  the playground demos — not provisioning.
- **Umbra stays unverifiable.** Do not add a provisioning script for it; the
  red path in the demos depends on its trust resolution failing.

## After a bootstrap

The chapter-3 diagrams and TrustCards in the playground still show
`QmPLACEHOLDER` DIDs. Once the cast is live, replace them with the real
`did:webvh` values from each `https://<host>/.well-known/did.json` (spec
section 6, open item 2).
