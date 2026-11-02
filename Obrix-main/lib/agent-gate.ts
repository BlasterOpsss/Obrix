import { defineChain, isAddress, parseAbi, type Address } from 'viem'

// Set NEXT_PUBLIC_OXRIZ_TOKEN_ADDRESS in .env.local to switch the token gate on.
const raw = process.env.NEXT_PUBLIC_OXRIZ_TOKEN_ADDRESS || ''
export const GATE_TOKEN: Address | null = isAddress(raw) ? (raw as Address) : null
// Set NEXT_PUBLIC_AGENT_OPEN=true to open the agent to everyone (for testing).
export const AGENT_OPEN = process.env.NEXT_PUBLIC_AGENT_OPEN === 'true'
export const MIN_HOLD = BigInt(process.env.NEXT_PUBLIC_AGENT_MIN_HOLD || '100000')

export const GATE_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
])

export const gateChain = defineChain({
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.chain.robinhood.com'] } },
})

export const accessMessage = (address: string, issued: string) =>
  `OXRIZ agent access\nAddress: ${address}\nIssued: ${issued}`
