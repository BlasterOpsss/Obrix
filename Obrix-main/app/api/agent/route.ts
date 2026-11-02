import { NextResponse } from 'next/server'
import { createPublicClient, http, type Address } from 'viem'
import { AGENT_OPEN, GATE_ABI, GATE_TOKEN, MIN_HOLD, gateChain } from '@/lib/agent-gate'

const SYSTEM = `You are the OXRIZ launch agent. You help people design a token for launch on Pons V2 (Robinhood Chain).
From the user's message, propose a token. Reply with ONLY a JSON object, no other text:
{"reply": "one or two short sentences to the user", "name": "token name or null", "symbol": "TICKER or null", "description": "one-sentence token description or null"}
Rules: name max 32 characters. symbol 2-10 letters or digits, uppercase. description max 200 characters.
If the user has not given enough to propose a name and ticker, use null for them and ask one short question in "reply".
Never promise profits or returns.`

interface Draft { reply: string; name: string | null; symbol: string | null; description: string | null }

function clean(d: Partial<Draft>): Draft {
  const symbol = typeof d.symbol === 'string' ? d.symbol.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10) : ''
  const name = typeof d.name === 'string' ? d.name.trim().slice(0, 32) : ''
  const description = typeof d.description === 'string' ? d.description.trim().slice(0, 200) : ''
  return {
    reply: typeof d.reply === 'string' && d.reply ? d.reply.slice(0, 500) : 'Here is a draft. Open it in the launch form to review and deploy.',
    name: name || null,
    symbol: symbol.length >= 2 ? symbol : null,
    description: description || null,
  }
}

// Simple fallback used when ANTHROPIC_API_KEY is not set.
function heuristic(message: string): Draft {
  const symbol = message.match(/\$([A-Za-z]{2,10})\b/)?.[1] ?? message.match(/(?:ticker|symbol)\s+(?:is\s+)?\$?([A-Za-z]{2,10})\b/i)?.[1] ?? null
  const name = message.match(/(?:called|named|name it)\s+["“]?([A-Za-z0-9 ]{2,32}?)["”]?(?=[,.]|\s+(?:with|ticker|symbol|\$)|$)/i)?.[1] ?? null
  if (name && symbol) {
    return clean({ reply: `Draft ready: ${name} ($${symbol.toUpperCase()}). Open it in the launch form to review it.`, name, symbol, description: message.slice(0, 200) })
  }
  return { reply: 'Tell me a name and ticker, for example: "A token called Moon Cat with ticker $MCAT about a cat that loves the moon."', name, symbol, description: null }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 1000) : ''
  if (!message) return NextResponse.json({ error: 'Empty message.' }, { status: 400 })

  // Token gate: the caller must prove they own a wallet that holds enough $OXRIZ.
  if (!AGENT_OPEN && !GATE_TOKEN) {
    return NextResponse.json({ error: 'The agent unlocks once $OXRIZ launches.' }, { status: 403 })
  }
  if (!AGENT_OPEN && GATE_TOKEN) {
    const proof = body?.proof
    const m = typeof proof?.message === 'string' ? proof.message.match(/^OXRIZ agent access\nAddress: (0x[a-fA-F0-9]{40})\nIssued: (.+)$/) : null
    if (!m || typeof proof?.signature !== 'string' || m[1].toLowerCase() !== String(proof.address).toLowerCase()) {
      return NextResponse.json({ error: 'Connect your wallet and sign to use the agent.' }, { status: 403 })
    }
    const age = Date.now() - new Date(m[2]).getTime()
    if (!(age > -5 * 60 * 1000 && age < 24 * 3600 * 1000)) {
      return NextResponse.json({ error: 'Your access signature expired. Please try again.' }, { status: 403 })
    }
    try {
      const rpc = createPublicClient({ chain: gateChain, transport: http() })
      const valid = await rpc.verifyMessage({ address: m[1] as Address, message: proof.message, signature: proof.signature })
      if (!valid) return NextResponse.json({ error: 'Signature check failed.' }, { status: 403 })
      const [bal, dec] = await Promise.all([
        rpc.readContract({ address: GATE_TOKEN, abi: GATE_ABI, functionName: 'balanceOf', args: [m[1] as Address] }),
        rpc.readContract({ address: GATE_TOKEN, abi: GATE_ABI, functionName: 'decimals' }),
      ])
      if (bal < MIN_HOLD * 10n ** BigInt(dec)) {
        return NextResponse.json({ error: `Hold ${MIN_HOLD.toLocaleString()} $OXRIZ to use the agent.` }, { status: 403 })
      }
    } catch {
      return NextResponse.json({ error: 'Could not verify your $OXRIZ balance. Please try again.' }, { status: 503 })
    }
  }

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return NextResponse.json(heuristic(message))

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
        max_tokens: 400,
        system: SYSTEM,
        messages: [{ role: 'user', content: message }],
      }),
    })
    const json = await res.json()
    const text: string = json?.content?.[0]?.text ?? ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!res.ok || !match) return NextResponse.json(heuristic(message))
    return NextResponse.json(clean(JSON.parse(match[0])))
  } catch {
    return NextResponse.json(heuristic(message))
  }
}
