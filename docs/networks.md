# Networks and branches

The playground runs on two Verana networks. The Git branch selects the network.

| Branch | Network | Verana protocol | Playground URL |
| --- | --- | --- | --- |
| `main` | testnet (`vna-testnet-1`) | V3 | https://playground.testnet.verana.network |
| `v4` | devnet (`vna-devnet-1`) | V4 | https://playground.devnet.verana.network |

Other branches use testnet.

## How the workflows select the network

Each deploy workflow and each cast workflow sets `NETWORK` from the branch:

```yaml
NETWORK: ${{ github.ref_name == 'v4' && 'devnet' || 'testnet' }}
```

The workflows use `NETWORK` for these items:

- The public hosts: `<org>.playground.<network>.verana.network`.
- The chain, RPC, resolver, indexer and ECS endpoints (see `set_network_vars` in `.github/workflows/v4/common.sh` for devnet, and in `.github/workflows/vesta/common.sh` for testnet).
- The secrets of the job (see below).
- The concurrency group. Runs on testnet and runs on devnet do not block each other.
- The moving Docker tag. Only testnet moves `latest`. Devnet images get the `devnet` tag.

To run a cast workflow on devnet, select the `v4` branch in the "Run workflow" menu.

The conformance workflow (`conformance.yml`) follows the same rule with the ids of `conformance/networks.yaml`: it tests `devnet-v4` on `v4` and `testnet-v3` on the other branches, and a pull request tests the network of its base branch. GitHub runs scheduled workflows only on the default branch, so the nightly on `main` also starts the workflow on `v4` with `nightly: true`. That only works once `main` carries this version of `conformance.yml`.

## Secrets for each network

The workflows set `SECRET_SUFFIX` from the branch: `_V4` on the `v4` branch, empty on the other branches. They read the secrets of the network by name, so a devnet run never uses a testnet secret:

```yaml
${{ secrets[format('K8S_NAMESPACE{0}', env.SECRET_SUFFIX)] }}
```

CAUTION: do not use `secrets.X_V4 || secrets.X` instead. When `X_V4` is empty, that expression gives the testnet value, and a devnet deployment then replaces the testnet deployment with the same name.

| Testnet (`main`) | Devnet (`v4`) | Value |
| --- | --- | --- |
| `K8S_NAMESPACE` | `K8S_NAMESPACE_V4` | The Kubernetes namespace. The two values must be different. |
| `PLAYGROUND_MNEMONIC` | `PLAYGROUND_V4_MNEMONIC` | The operator account of the cast. On devnet it is the operator of the demo cast Corporation and must have funds (about 21 VNA for the first run). |
| `KUBECONFIG_VERANA_DEV` | `KUBECONFIG_VERANA_DEV` | The same cluster for both networks. |
| variable `CLUSTER_POD_CIDR` | variable `CLUSTER_POD_CIDR` | Optional. The pod CIDR of the cluster (default `10.2.0.0/16`). The V4 agents trust Admin API calls from this network. |

Each deploy workflow, each core workflow and the tier jobs of `conformance.yml` stop at the "Check network secrets" step when the namespace secret of the branch is empty. The casts that still use the Verana V3 model (bolivia, ccm, eventos) stop at the "Check network protocol" step on the `v4` branch.

## The app

The Docker build gets `NEXT_PUBLIC_VERANA_NETWORK` from `NETWORK`. The app reads it in `app/lib/network.ts` and selects the protocol:

| Network | Protocol | Trust resolution | vs-agent Admin API |
| --- | --- | --- | --- |
| testnet | V3 | `https://resolver.testnet.verana.network/v1/trust/resolve` | `/v1` |
| devnet | V4 | `POST https://idx.devnet.verana.network/v4/verifiable-trust/resolve` | `/v2` |

The default is testnet.

## The casts on devnet (Verana V4)

On the `v4` branch these casts use the V4 model with veranad v0.10.5 and vs-agent v2:

| Cast | Workflows | Core | Corporations |
| --- | --- | --- | --- |
| demo (Personal Wallets) | `demo-01` to `demo-08` | `demo-00_core.yml` | One for the cast |
| vesta, verandia, cexa, bhi (Use Cases) | `<cast>-01` and the next ones | `<cast>-00_core.yml`, which calls `v4-cast-00_core.yml` | One for each organization |

The shared V4 helpers are in `.github/workflows/v4/common.sh`. Each V4 cast adds its hosts in `.github/workflows/<cast>/cast.sh`. See the README of each cast for its run order. The bolivia, ccm and eventos casts still use the V3 model and do not run on devnet.

Every V4 agent gets its ECS Organization credential from `ecs-org-issuer`, the organization issuer of the devnet ECS Ecosystem.

The demo cast uses these devnet services:

- `https://idx.devnet.verana.network` (the indexer, which also resolves trust)
- `https://ecs-ecosystem.devnet.verana.network` (the ECS Ecosystem)
- `https://ecs-org-issuer.devnet.verana.network` (the issuer of the ECS Organization credential). `demo-01` port-forwards to its Admin API in the namespace `vna-devnet-1`, so the kubeconfig must give access to that namespace.

Devnet has no trust resolver service. On V4 the indexer resolves trust.

### Fund the operator account

The devnet faucet is `https://faucet.devnet.verana.network` ([verana-faucet](https://github.com/verana-labs/verana-faucet)). It sends funds only to the account that signs its challenge (ADR-036), so request them from a wallet that holds the operator key, for example through the Verana Frontend at `https://app.devnet.verana.network`. Each account can get 50 VNA per hour and 300 VNA per day.

The first `demo-01` run spends about 21 VNA: 20 VNA for the Corporation (`CORPORATION_FUNDS`), 0.001 VNA for each agent account (`AGENT_FUNDS`), and the very small fees of the operator account.

The Use Case casts create one Corporation for each organization. `v4-cast-00_core.yml` keeps a float of 1 VNA in each Corporation (`CORPORATION_FUNDS`). Each run fills the float again when it is less than half (`CORPORATION_MIN_FUNDS`). The Corporation pays the fees of its agents through fee grants, and vs-agent uses a gas price of 1uvna, so an agent transaction costs about 0.2 VNA. Each agent account gets 0.001 VNA (`AGENT_FUNDS`), so that it exists on the chain. The operator account pays its own fees at the gas price `GAS_PRICES` (0.01uvna), so they are very small. Plan about 1 VNA for each organization.
