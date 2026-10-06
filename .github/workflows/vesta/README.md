# Vesta cast CI/CD

The workflows deploy and provision each verifiable service of the **Vesta
Appliances use case** (spec: `verana-spec/playground/verana-explained/spec.md`,
section 5). Each participant is a separate vs-agent (Business Wallet).

This branch runs the cast on **Verana V4 (devnet)** with veranad v0.10.5 and
vs-agent v2. See [`docs/networks.md`](../../../docs/networks.md). The
`vesta-00_core.yml` wrapper calls the generic V4 core
(`v4-cast-00_core.yml`) with `cast=vesta`. A run from another branch stops
with an error, because only devnet runs Verana V4.

GitHub reads workflow files only at the top level of `.github/workflows/`.
The numbered `vesta-*.yml` entry points are there. This directory holds the
rest:

```
.github/workflows/
  vesta-00_core.yml            wrapper of the generic V4 core
  vesta-01..10_*.yml           one entry point per cast member
  v4-cast-00_core.yml          generic V4 deploy + provision pipeline
  v4/common.sh                 generic V4 helpers
  v4/deployment.template.yaml  Helm values template (vs-agent v2 chart)
  vesta/
    cast.sh                    hosts, schema titles and steps of this cast
    orgs/<org>/config.env      identity, claims and provision settings of an org
    schemas/*.json             ISO 9001-style (demo) and Authorized Repairer schemas
    scripts/provision-*.sh     provision scripts (veranad, indexer, Admin APIs)
    common.sh                  V3 library of the bolivia, ccm and eventos casts
```

CAUTION: `common.sh` is the V3 library of other casts. This cast does not use
it. Do not change it for the vesta cast.

## The cast and their hosts

The organizations are at `<org>.playground.devnet.verana.network`. The
sub-services of Vesta are at `<service>.vesta.playground.devnet.verana.network`.

| # | Workflow | Release | Corporation | Agent mode | What it gets |
|---|---|---|---|---|---|
| 01 | Helvetia Trust | `helvetia-trust` | `helvetia` | standalone | ECS credentials only |
| 03 | Vesta anchor | `vesta` | `vesta` | standalone | ECS credentials, ECS Badge issuer, ISO 9001-style (demo) credential from NormaCert, OpenID4VC issuer |
| 04 | ISO Certification | `iso-certification` | `iso` | standalone | ECS credentials, ISO Ecosystem, `ISO9001DemoCredential` schema, root Participant |
| 05 | NormaCert | `normacert` | `normacert` | standalone | ECS credentials, ISSUER on the ISO schema |
| 06 | Repair Network | `vesta-repair-network` | `vesta` | delegated | ECS Service from Vesta, Repair Network Ecosystem, `AuthorizedRepairerCredential` schema, root Participant |
| 07 | Vesta Portal | `vesta-portal` | `vesta` | delegated | ECS Service from Vesta, ECS Badge verifier, OpenID4VC verifier |
| 08 | Subsidiaries | `vesta-iberia`, `vesta-nordics` | `iberia`, `nordics` | standalone | ECS credentials, ISSUER on the Authorized Repairer schema |
| 09 | Zenith Repairs | `zenith` | `zenith` | standalone | ECS credentials, Authorized Repairer from Vesta Iberia, ECS Badge issuer, OpenID4VC issuer |
| 10 | Umbra Repairs | `umbra` | `umbra` | standalone | ECS credentials, ECS Badge issuer, OpenID4VC issuer, never an Authorized Repairer |

On V4 there is no `vesta-02` workflow. Helvetia is not an ECS Organization
issuer: `ecs-org-issuer` (the ECS Ecosystem of devnet) issues the ECS
Organization credential of each standalone organization.

## The V4 model

- **Corporations.** Each organization has its own Corporation
  (`CORPORATION_KEY` in `config.env`), with the DID
  `did:example:playground-vesta-<key>-<chain id>`. The first deploy of an
  organization creates it. A delegated sub-service uses the Corporation of its
  parent, so the `vesta` Corporation owns the Repair Network Ecosystem. The
  operator account (`PLAYGROUND_V4_MNEMONIC`) operates each Corporation and
  signs each transaction.
- **Agent accounts.** Each agent has its own Verana account, the
  `vs_operator` of its Participant entries. The core workflow keeps its
  mnemonic in the Kubernetes secret `<release>-verana-account`.
- **ECS credentials.** The agents get them through vt-flow onboarding
  processes (DIDComm):
  - A standalone agent gets its ECS Organization credential from
    `ecs-org-issuer` and issues its own ECS Service credential
    (`provision_ecs_standalone`).
  - A delegated agent gets its ECS Service credential from the Vesta anchor
    (`provision_ecs_delegated`), and shares the ECS Organization credential of
    Vesta.
- **Org-to-org credentials.** The holder organization gets a HOLDER entry,
  and the issuer agent validates the onboarding request, sets the claims and
  issues the credential:
  - NormaCert issues the ISO 9001-style (demo) credential to Vesta. The
    claims are the `ISO_*` values in `orgs/vesta/config.env`.
  - Vesta Iberia issues the Authorized Repairer credential to Zenith. The
    claims are the `AR_*` values in `orgs/zenith/config.env`.
- **Accreditations.** NormaCert and the subsidiaries join their schema as
  ISSUER under the root entry. The operator validates the entry with the
  Corporation that owns the Ecosystem (`iso` or `vesta`).
- **ECS Badge.** The badge schema (`BadgeCredential`) belongs to the ECS
  Ecosystem. Vesta, Zenith and Umbra get an OPEN ISSUER entry and an AnonCreds
  credential definition on the badge VTJSC. The portal gets an OPEN VERIFIER
  entry. CAUTION: the devnet ECS Ecosystem does not have this schema yet. The
  badge steps then log a warning and do nothing. When the schema exists, run
  03, 07, 09 and 10 again with `step=provision`.

## Prerequisites

**Repository secrets** (see [`docs/networks.md`](../../../docs/networks.md)):

| Secret | Notes |
|---|---|
| `KUBECONFIG_VERANA_DEV` | the cluster of the cast |
| `K8S_NAMESPACE_V4` | the namespace of the devnet agents |
| `PLAYGROUND_V4_MNEMONIC` | the operator account of the cast Corporations |

The operator account pays for each new Corporation (`CORPORATION_FUNDS` in
`v4-cast-00_core.yml`), for 1 VNA to each new agent account, and for the
transaction fees. The cast has eight Corporations and ten agents. Get funds
from the devnet faucet before the first bootstrap.

**DNS and TLS.** Wildcard records must point at the cluster ingress:
`*.playground.devnet.verana.network` **and**
`*.vesta.playground.devnet.verana.network`. A wildcard matches one label
only, and the portal and repair-network hosts are one level deeper.
cert-manager (`letsencrypt-prod`) issues a certificate for each host.

## Run order

Select the `v4` branch. Run each workflow with `step=all`, one at a time
(all runs use the same operator account and one concurrency group):

1. `vesta-01` Helvetia Trust (no dependency).
2. `vesta-04` ISO Certification: the ISO Ecosystem and its schema.
3. `vesta-05` NormaCert: needs the ISO schema.
4. `vesta-03` Vesta anchor: needs the ISSUER entry of NormaCert for the ISO
   credential.
5. `vesta-06` Repair Network: needs the Vesta anchor (its parent).
6. `vesta-08` Subsidiaries: need the Authorized Repairer schema.
7. `vesta-09` Zenith: needs the ISSUER entry of Vesta Iberia.
8. `vesta-10` Umbra (needs only the ECS Ecosystem).
9. `vesta-07` Vesta Portal: needs the Vesta anchor (its parent).

The numbers of the workflows are not the run order: Vesta (03) needs NormaCert
(05). If you run `vesta-03` first, its provision step stops at the ISO
credential. Run it again with `step=provision` after `vesta-05`.

Each workflow is idempotent. The scripts find the Corporations, Ecosystems,
schemas and Participant entries before they create them. The `step` input
splits a run into `deploy` (Corporation, agent account and Helm) and
`provision` (chain and onboarding processes).

## OpenID4VC rail

The services that a personal wallet uses have `OID4VC_ROLE` in their
`config.env`: vesta, zenith and umbra as `issuer`, the portal as `verifier`.
The core workflow then gives the agent an empty `openid4vc.config`, which
turns on the OpenID4VC plugin with development signing. The agent takes the
credential types, the `vct` and the trust decision from the VPR, so the cast
has no OpenID4VC templates. Umbra makes real SD-JWT badge offers too: its
badges fail at the portal on the membership rule only.

## What CI/CD does not do

- **Personal wallet flows** (badge offers, portal login, the door scan) are
  runtime flows of the deployed agents and the playground app. They are not
  part of the provisioning.
- **Umbra never gets the Authorized Repairer credential.** Umbra is a
  verifiable organization (ECS Organization, ECS Service, badge issuer). The
  red path of the demos needs exactly one missing link: no Authorized
  Repairer credential, so its badges fail at the portal and get no seal.

## After a bootstrap

On devnet, the app finds the DID of each cast member from its host
(`https://<host>/.well-known/did.json`), so no DID value must change in the
app. The testnet DIDs in `app/lib/vesta-cast.ts` apply to the V3 build only.
