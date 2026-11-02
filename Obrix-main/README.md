# OXRIZ

A dark, premium token launch interface for Pons V2 on Robinhood Chain, built with Next.js, TypeScript, wagmi and viem.

## Current features

- OBRIX visual identity: obsidian surfaces, restrained white typography and acid-lime accent.
- Wallet connection through wagmi connectors.
- Robinhood Chain mainnet configuration (chain ID 4663).
- Pons V2 launch flow that reads the enabled launch config, pins current launch economics, reads the current launch fee, generates a salt and submits `launchToken` to the V2 factory.
- Transaction feedback with a Blockscout transaction link.
- Live token preview; market-cap and liquidity estimates are intentionally not fabricated.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment

Set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` if WalletConnect is needed. Injected wallets and MetaMask connectors are configured as well.

## Pons V2 configuration

- Chain ID: `4663`
- RPC: `https://rpc.mainnet.chain.robinhood.com`
- Factory: `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`
- Explorer: `https://robinhoodchain.blockscout.com`

See [`TOKEN_LAUNCH_IMPLEMENTATION.md`](./TOKEN_LAUNCH_IMPLEMENTATION.md) for the transaction sequence and known limits.

## Before production

- Configure an image pinning provider so users can upload images directly; currently the image picker is only a preview and a public HTTPS/IPFS URI must be pasted into the form.
- Integrate the optional Pons V2 launch-and-buy router separately if atomic creator buys are required. The V2 factory launch call does not consume a developer-buy amount.
- Verify the current contract ABI and enabled launch configs against official Pons V2 docs before each deployment. Mainnet launch transactions spend real ETH and have not been tested by this source-code update.
