// Shared token-drafting logic used by the paid (x402) agent endpoint.
const SYSTEM = `You are the OXRIZ launch agent. You help people design a token for launch on Pons V2 (Robinhood Chain).
From the user's message, propose a token. Reply with ONLY a JSON object, no other text:
{"reply": "one or two short sentences to the user", "name": "token name or null", "symbol": "TICKER or null", "description": "one-sentence token description or null"}
Rules: name max 32 characters. symbol 2-10 letters or digits, uppercase. description max 200 characters.
If the user has not given enough to propose a name and ticker, use null for them and ask one short question in "reply".
Never promise profits or returns.`

export interface TokenDraft { reply: string; name: string | null; symbol: string | null; description: string | null }

function clean(d: Partial<TokenDraft>): TokenDraft {
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

function heuristic(message: string): TokenDraft {
  const symbol = message.match(/\$([A-Za-z]{2,10})\b/)?.[1] ?? message.match(/(?:ticker|symbol)\s+(?:is\s+)?\$?([A-Za-z]{2,10})\b/i)?.[1] ?? null
  const name = message.match(/(?:called|named|name it)\s+["“]?([A-Za-z0-9 ]{2,32}?)["”]?(?=[,.]|\s+(?:with|ticker|symbol|\$)|$)/i)?.[1] ?? null
  if (name && symbol) {
    return clean({ reply: `Draft ready: ${name} ($${symbol.toUpperCase()}).`, name, symbol, description: message.slice(0, 200) })
  }
  return { reply: 'Tell me a name and ticker, for example: "A token called Moon Cat with ticker $MCAT about a cat that loves the moon."', name, symbol, description: null }
}

export async function draftToken(message: string): Promise<TokenDraft> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return heuristic(message)
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
    if (!res.ok || !match) return heuristic(message)
    return clean(JSON.parse(match[0]))
  } catch {
    return heuristic(message)
  }
}
