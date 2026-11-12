# Pons V2 Token Launcher

A focused token-launch interface for Pons V2 on Robinhood Chain. The app connects a wallet, collects token metadata, uploads the token image to IPFS, and submits a launch transaction to the Pons V2 factory.

## What it does

- Connects an EVM wallet using wagmi and RainbowKit.
- Uses Robinhood Chain mainnet (chain ID `4663`).
- Collects a token name, symbol, description, image, social links, creator fee, and fee receiver.
- Uploads selected images to IPFS through the server-side Pinata endpoint.
- Reads an enabled launch configuration, launch economics, and the current launch fee from the Pons V2 factory immediately before launch.
- Submits the factory's `launchToken` transaction and displays transaction status.

The application is intentionally limited to the token launch flow. It does not include token discovery, trading, portfolio, analytics, or marketing pages.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

- `PINATA_JWT` — required for image uploads. Configure this as a server-side environment variable; do not expose it with a `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — optional, if WalletConnect is needed. Injected wallet connectors are also configured.

Images must be image files under 2 MB. The upload endpoint returns an `ipfs://` URI used in the launch metadata.

## Pons V2 network configuration

- Chain ID: `4663`
- RPC: [https://rpc.mainnet.chain.robinhood.com](https://rpc.mainnet.chain.robinhood.com)
- Factory: `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`
- Explorer: [https://robinhoodchain.blockscout.com](https://robinhoodchain.blockscout.com)

See [TOKEN_LAUNCH_IMPLEMENTATION.md](./TOKEN_LAUNCH_IMPLEMENTATION.md) for the transaction sequence, metadata handling, and operational limitations.

## Production checklist

- Set `PINATA_JWT` in the deployment environment and verify image uploads.
- Verify the deployed factory address, ABI, enabled launch configurations, and launch fee against current Pons V2 contract information.
- Test the complete wallet and launch flow with a controlled wallet before promoting changes. Mainnet transactions spend real ETH.
