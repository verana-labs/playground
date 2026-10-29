# Deployments

This directory holds the files that the deploy workflows use: the
configuration of each organization, the schemas, the templates and the
scripts. GitHub reads workflow files only at the top level of
`.github/workflows/`, so the workflows stay there.

## The two tiers

Each service is in one of two tiers. The prefix of the workflow file and of
the workflow name shows the tier.

| Tier | Workflow prefix | Cluster | Kubeconfig secret | Host zone |
| --- | --- | --- | --- | --- |
| Base | `testnet-` | testnet (prod) | `KUBECONFIG_VERANA_TESTNET` | `*.playground.testnet.verana.network` |
| Other | `dev-` | dev | `KUBECONFIG_VERANA_DEV` | `*.testnet.demos.verana.network` |

The base tier holds the services that the site shows: the Personal Wallets
and the Use Cases. Each other service goes to the dev tier.

All the services of the two tiers use the testnet chain (`NETWORK: testnet`).
They use the same operator account (`PLAYGROUND_MNEMONIC`), the indexer and
the ECS Ecosystem of testnet. The `testnet.verana.network` zone is for the
testnet cluster only. Thus a dev service has its host in the
`demos.verana.network` zone. The network stays in the host name, so that the
host shows which chain the service uses.

## The services

| Service | Tier | Workflows | Directory | Notes |
| --- | --- | --- | --- | --- |
| Playground (the site) | Base | `testnet-playground.yml` | — | Runs on each push to `main`. |
| demo (Personal Wallets) | Base | `testnet-demo-00` to `testnet-demo-08` | [`demo/`](demo/README.md) | |
| vesta (Use Case) | Base | `testnet-vesta-00` to `testnet-vesta-10` | [`vesta/`](vesta/README.md) | |
| verandia (Use Case) | Base | `testnet-verandia-00` to `testnet-verandia-06` | [`verandia/`](verandia/README.md) | |
| cexa (Use Case) | Base | `testnet-cexa-00` to `testnet-cexa-05` | [`cexa/`](cexa/README.md) | |
| bhi (Use Case) | Base | `testnet-bhi-00` to `testnet-bhi-10` | [`bhi/`](bhi/README.md) | |
| wwWallet (hosted) | Base | `testnet-wwwallet.yml` | [`wwwallet/`](wwwallet/) | Brand `wwwallet`. |
| eventos | Other | `dev-eventos-00` to `dev-eventos-04` | [`eventos/`](eventos/README.md) | Verana V3. The run stops at "Check network protocol". |
| bolivia | Other | `dev-bolivia-00` to `dev-bolivia-06` | [`bolivia/`](bolivia/README.md) | Verana V3. The run stops at "Check network protocol". |
| ccm | Other | `dev-ccm-00` to `dev-ccm-03` | [`ccm/`](ccm/README.md) | Verana V3. The run stops at "Check network protocol". |
| INTEXUS Wallet | Other | `dev-intexus-wallet.yml` | [`wwwallet/`](wwwallet/) | Brand `intexus`. |

These files are shared:

- `lib/common.sh` and `lib/deployment.template.yaml`: the generic V4 helpers
  and the Helm values template. `testnet-cast-00_core.yml` uses them for
  vesta, verandia, cexa and bhi.
- `vesta/common.sh` and `demo/scripts/render-oid4vc-config.sh`: the V3
  helpers of the eventos, bolivia and ccm casts.
- `wwwallet-00_core.yml`: the reusable core of the two wwWallet instances.
  Its `cluster` input selects the kubeconfig.

The workflows that do not deploy a service have no prefix: `ci.yml`,
`conformance.yml` and `unfold-sync.yml`.

## Concurrency

All the casts of the two tiers sign with the same operator account. Two runs
at the same time race on the sequence number of the account. Thus every cast
core uses the concurrency group `cast-operator-testnet`. GitHub keeps only one
queued run for each group, so start the cast workflows one at a time.

## Add a service

1. Select the tier. A service that the site does not show goes to the dev
   tier.
2. Put its files in `deploy/<service>/`.
3. Add the workflows as `<tier>-<service>-NN_<name>.yml`. Start the name with
   `Testnet · ` or `Dev · `.
4. For the dev tier, use `KUBECONFIG_VERANA_DEV` and a host in the
   `demos.verana.network` zone.
5. Add the service to the table above.
