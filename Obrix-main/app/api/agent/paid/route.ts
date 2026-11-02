import { NextRequest, NextResponse } from 'next/server'
import { withX402 } from '@x402/next'
import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server'
import { ExactEvmScheme } from '@x402/evm/exact/server'
import { draftToken } from '@/lib/agent-core'

// Pay-per-request agent endpoint (x402). Configure with env vars in .env.local:
//   X402_PAY_TO           your wallet address that receives the payments (required)
//   X402_NETWORK          default eip155:84532 (Base Sepolia test network)
//   X402_PRICE            default $0.01
//   X402_FACILITATOR_URL  default https://x402.org/facilitator (testnet only)
const payTo = process.env.X402_PAY_TO as `0x${string}` | undefined
const network = (process.env.X402_NETWORK || 'eip155:84532') as `${string}:${string}`
const price = process.env.X402_PRICE || '$0.01'

const server = new x402ResourceServer(
  new HTTPFacilitatorClient({ url: process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator' })
)
server.register('eip155:*', new ExactEvmScheme())

const handler = async (req: NextRequest): Promise<NextResponse> => {
  const body = await req.json().catch(() => null)
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 1000) : ''
  if (!message) return NextResponse.json({ error: 'Send JSON like {"message":"A token called Moon Cat with ticker $MCAT"}' }, { status: 400 })
  return NextResponse.json(await draftToken(message))
}

export const POST = payTo
  ? withX402(
      handler,
      {
        '/api/agent/paid': {
          accepts: [{ scheme: 'exact', price, network, payTo }],
          description: 'OXRIZ launch agent: turns a short description into a token draft (name, ticker, description).',
          mimeType: 'application/json',
        },
      },
      server
    )
  : async () => NextResponse.json({ error: 'x402 payments are not set up yet (X402_PAY_TO is missing).' }, { status: 503 })
