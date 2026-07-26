# Verana Playground

**Try the open trust layer. Live.** — `https://playground.testnet.verana.network`

The interactive site for understanding the Verana concepts (the **Verana
Explained** ACME story) and trying the **integrated user and cloud wallets**,
everything running against the Verana **testnet** — real registry entries, real
trust resolution, nothing simulated.

Built to the spec in
[`verana-labs/verana-spec → playground/`](https://github.com/verana-labs/verana-spec/tree/main/playground):
site spec, wallet-integration guidelines, and the Verana Explained story.

## Structure

```
app/                     Next.js 15 (App Router) + Tailwind v4, verana.io design language
  page.tsx               Home: What is Verana · Learn (ACME story cards) · User wallets · Cloud wallets
  explained/             Verana Explained (the ACME story)
  user-wallets/[slug]/   Per-user-wallet playground (identical template, spec §4)
  cloud-wallets/[slug]/  Per-cloud-wallet playground (identical template, spec §5)
  integrate/             Add your wallet (guidelines + PR process)
integrations/            The integration registry: one folder per wallet with integration.yaml
                         (submitted by PR — this is how a wallet gets listed and gets its page)
```

## Add your wallet

1. Integrate per the guideline for your wallet kind:
   [user wallets](https://github.com/verana-labs/verana-spec/blob/main/playground/guidelines/user-wallet-integration.md) ·
   [cloud wallets](https://github.com/verana-labs/verana-spec/blob/main/playground/guidelines/cloud-wallet-integration.md).
2. Record the acceptance loop (the ISO Certification loop).
3. Open a PR adding `integrations/<your-slug>/integration.yaml` (see existing
   entries for the format). Requirements: OSI license; the wallet is obtainable
   from its tile (mobile: direct APK; web/cloud: URL).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (standalone output)
```

## Related

- Demo services (the ACME cast, v3): [`verana-labs/verana-demos`](https://github.com/verana-labs/verana-demos)
- Trust Resolver: `https://resolver.testnet.verana.network/docs`
- Network frontend: `https://app.testnet.verana.network`

## License

Code Apache-2.0 (see [LICENSE](./LICENSE)). Site content CC BY-SA 4.0.
