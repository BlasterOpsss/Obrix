# Pons V2 Token Launch — Implementation Notes

This document describes the current factory-only Pons V2 launch flow implemented in this repository.

## Network and contract

- Network: Robinhood Chain mainnet
- Chain ID: `4663`
- RPC: `https://rpc.mainnet.chain.robinhood.com`
- Explorer: `https://robinhoodchain.blockscout.com`
- Pons V2 factory: `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`
- Pair token: native token (`address(0)`)
- Launch fee: read from the factory at launch time; do not hard-code a fee assumption.

The factory ABI is maintained in `lib/abi/factory.ts`. The launch transaction logic is in `lib/hooks/use-launch-token.ts`.

## User flow

1. The user connects a wallet.
2. The app requires the wallet to be on Robinhood Chain (chain ID 4663), and offers a network switch when it is not.
3. The form collects the token name, symbol, description, image, X link, Telegram link, website, creator fee percentage, and fee receiver.
4. The selected image is uploaded to the app's `/api/upload` endpoint. The endpoint requires the server-side `PINATA_JWT` environment variable, accepts image files up to 2 MB, uploads them to Pinata's public IPFS network, and returns an `ipfs://` URI. The form requires this URI before launch.
5. The form validates required fields, reserved-name protection, creator-fee bounds, and the image upload state.
6. The launch hook verifies the connected wallet and chain, then reads the current launch configuration count and finds the first enabled configuration.
7. It reads `previewLaunchEconomics(configId, address(0))` and `launchFee()` immediately before submitting.
8. It generates a random 32-byte salt, with the first five bytes currently set to the fixed identifier `49 47 4e 49 4f`; the remaining bytes come from the browser cryptographic random-number generator.
9. It calls the factory's `launchToken(TokenParams, launchConfigId, pairToken)` with the expected economics hash, native pair token, creator fee recipient, creator tax basis points, metadata, and factory-reported fee as `msg.value`.
10. The UI displays the transaction hash and transaction confirmation/error status, with an explorer link in the transaction status component.

## Metadata and launch parameters

The launch metadata passed to the factory includes:

- Token name and uppercase symbol
- IPFS logo URI
- Description
- X/Twitter, Telegram, and website links
- Creator fee recipient (defaults to the connected wallet)
- Creator tax in basis points (converted from the percentage entered in the form)

Discord and Farcaster links are currently passed as empty strings. Buybacks are disabled in the launch parameters. There is no developer-buy amount or atomic launch-and-buy operation in this factory-only implementation.

## Image upload endpoint

The implementation is in `app/api/upload/route.ts`.

- Requires `PINATA_JWT` on the server.
- Accepts an uploaded image file only.
- Enforces a 2 MB maximum file size.
- Uploads to Pinata using its public network option.
- Returns the resulting CID as an `ipfs://` URI.

If `PINATA_JWT` is missing, the endpoint returns an image-upload-not-configured response. Keep the JWT server-side.

## Important limits and verification

- This is a factory-only launch flow; a separate Pons V2 launch-and-buy router is not integrated.
- The first enabled launch configuration is selected at launch time. Confirm that this selection matches the intended product behavior if multiple configurations are enabled.
- The salt prefix is currently fixed in code; change it only if the launch identification convention is intentionally being changed.
- Contract ABI, factory address, enabled launch configurations, fee behavior, and metadata requirements can change. Verify them against current Pons V2 contract information before production releases.
- A successful source-code update does not prove that a mainnet launch has been tested. Test with a controlled wallet and inspect the transaction before production use.
