# OBRIX — Pons V2 launch integration

OBRIX uses the published Pons V2 factory interface on Robinhood Chain mainnet. The former `0xA5a...` contract is the V1 factory and must not be used for V2 launches.

## Live network configuration

- Chain ID: `4663`
- RPC: `https://rpc.mainnet.chain.robinhood.com`
- Explorer: `https://robinhoodchain.blockscout.com`
- Pons V2 factory: `0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e`
- Launch fee: read from the factory at launch time; published docs currently describe `0.0005 ETH`.

## Launch transaction flow

1. Require a connected wallet on chain ID 4663.
2. Read the current launch configuration list and select the first enabled config at transaction time.
3. Read `previewLaunchEconomics(configId, address(0))` and `launchFee()` immediately before launch.
4. Generate a unique 32-byte salt in the browser.
5. Call V2 `launchToken(TokenParams, launchConfigId, pairToken)` with the expected economics hash pinned into the parameters, native ETH as the pair token (`address(0)`), and the factory-reported fee as `msg.value`.
6. Show the transaction hash and link to Blockscout.

The token metadata includes name, symbol, logo URI, description and social links. Creator fee recipient defaults to the connected wallet; creator tax is set to zero and buybacks are disabled by default in this first integration pass.

## Important limits / next steps

- The local image picker is a preview only. The launch form requires a public HTTPS/IPFS image URI because a browser `data:` URL is not a practical on-chain metadata URI and may exceed protocol metadata limits. An IPFS pinning provider can be integrated later for upload-in-app.
- The old “developer buy” slider is not part of the Pons V2 factory `launchToken` call. A V2 launch-and-buy router is a separate integration and has not been wired into this factory-only flow.
- No mainnet transaction has been submitted as part of this code change. Test on a controlled wallet, inspect the transaction preview and verify the deployed contract/interface before production promotion.
