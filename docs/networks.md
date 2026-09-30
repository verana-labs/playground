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
- The chain, RPC, resolver, indexer and ECS endpoints (see `set_network_vars` in `.github/workflows/vesta/common.sh`).
- The GitHub environment of the job. The environment has the same name as the network.
- The concurrency group. Runs on testnet and runs on devnet do not block each other.
- The moving Docker tag. Only testnet moves `latest`. Devnet images get the `devnet` tag.

To run a cast workflow on devnet, select the `v4` branch in the "Run workflow" menu.

## Secrets for each network

Each job uses the GitHub environment `testnet` or `devnet`. An environment secret replaces the repository secret with the same name.

The `testnet` environment can stay empty. Then the testnet jobs use the repository secrets, as before.

The `devnet` environment must have its own values. If it uses the testnet namespace, a devnet deployment replaces the testnet deployment with the same name.

| Name | Kind | Value for devnet |
| --- | --- | --- |
| `NETWORK` | variable | `devnet` |
| `K8S_NAMESPACE` | secret | A namespace that is different from the testnet namespace |
| `PLAYGROUND_MNEMONIC` | secret | The cast account on devnet. The account must have funds on devnet. |
| `ECS_ECOSYSTEM_MNEMONIC` | secret | The controller account of the devnet ECS trust registry |
| `KUBECONFIG_VERANA_DEV` | secret | Optional. Set it only if devnet uses a different cluster. |

Each job stops at the "Check network environment" step when the `NETWORK` variable of the environment is not equal to the selected network. This check does not apply to testnet.

## What devnet needs before the casts can run

The cast scripts use these devnet services:

- `https://resolver.devnet.verana.network`
- `https://ecs-trust-registry.devnet.verana.network` and its admin API
- `https://faucet-vs.devnet.verana.network`

Make sure that these services are available before you run `vesta-01`.
