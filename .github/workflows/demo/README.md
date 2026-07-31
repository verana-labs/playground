# Playground demo cast CI/CD

The shared demo services of the **user-wallet playground pages** (spec §4 —
[verana-spec → playground/spec.md](https://github.com/verana-labs/verana-spec/blob/main/playground/spec.md)):
one cast, six scenarios, identical on every wallet page.

The **Playground Organization (demo)** controls the anchor VS **Playground
Demo**, which owns the **Playground Ecosystem (demo)** and its single
**DemoCredential** schema (`schemas/demo-credential.json`; issuer mode
ecosystem-governed, verifier mode open). Four trusted services are its
delegated sub-services; the fifth is deliberately unprovisioned:

| Workflow | Release | Q1 | DemoCredential |
| --- | --- | --- | --- |
| demo-01 | `playground-demo` (anchor) | TRUSTED | ecosystem owner |
| demo-02 | `demo-issuer-accredited` | TRUSTED | ISSUER (validated) |
| demo-03 | `demo-issuer-unaccredited` | TRUSTED | none, by design |
| demo-04 | `demo-verifier-accredited` | TRUSTED | VERIFIER (open) |
| demo-05 | `demo-verifier-unaccredited` | TRUSTED | none, by design |
| demo-06 | `demo-untrusted` | UNTRUSTED | n/a — deploy-only, superseded by demo-07/08 |
| demo-07 | `demo-issuer-untrusted` | UNTRUSTED | n/a — deploy-only, issuer side |
| demo-08 | `demo-verifier-untrusted` | UNTRUSTED | n/a — deploy-only, verifier side |

Seven agents, one per case a wallet has to render: the anchor, then a trusted
trio each side (accredited/authorized, trusted but without the permission,
untrusted). `demo-06` predates the split and served both trios at once; tear it
down once `demo-07` and `demo-08` are up.

## Running

Same pattern as the vesta cast: each numbered workflow is a
`workflow_dispatch` calling `demo-00_core.yml` with `step` = `deploy` |
`provision` | `all`. Run them **in order, one at a time** (both casts share
the veranad account, so all runs serialize on the `vesta-cast` concurrency
group):

1. **Prerequisite:** the vesta cast's Helvetia (`vesta-01`) must be deployed
   and provisioned — it issues the anchor's ECS-Organization.
2. `demo-01` — anchor: ECS-Org (from Helvetia) + self ECS-Service + trust
   registry + DemoCredential schema + root permission + VTJSC.
3. `demo-02` … `demo-05` — delegated services + their `DEMO_PERM`.
4. `demo-06` … `demo-08` — deploy-only.

Secrets: `PLAYGROUND_MNEMONIC`, `KUBECONFIG_VERANA_DEV`, `K8S_NAMESPACE`
(same as the vesta cast). `common.sh` is shared from
[`../vesta/common.sh`](../vesta/common.sh).

## Dual rail

The cast runs the oidc4vc-enabled build `veranalabs/vs-agent:v1.12.0-oidc4vc.2`
(`deployment.template.yaml` → `image.tag`): the DemoCredential is served over
AnonCreds/DIDComm (Track N wallets — Hologram) and OpenID4VCI/OpenID4VP
(Track B wallets).

## Monitoring invariant

A demo service in the wrong trust state is a paging incident — **including
`demo-untrusted` resolving as anything but UNTRUSTED** (spec §6).
