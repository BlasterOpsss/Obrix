import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

function validEndpoint(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.hostname === 'localhost' || url.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const endpoint = process.env.ELIZAOS_CHAT_URL?.trim()
  if (!endpoint || !validEndpoint(endpoint)) {
    return NextResponse.json(
      { error: 'ElizaOS is not connected yet. Configure ELIZAOS_CHAT_URL on the OBRIX server.' },
      { status: 503 },
    )
  }

  const body = await request.json().catch(() => null)
  const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 2000) : ''
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.slice(0, 80) : ''
  if (!message) return NextResponse.json({ error: 'Enter a message first.' }, { status: 400 })

  const headers: Record<string, string> = { 'content-type': 'application/json', accept: 'application/json' }
  if (process.env.ELIZAOS_API_TOKEN) headers.authorization = 'Bearer ' + process.env.ELIZAOS_API_TOKEN

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: message, userId: sessionId || 'obrix-web-user' }),
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    })
    const raw = await upstream.text()
    let payload: unknown
    try { payload = JSON.parse(raw) } catch { payload = { text: raw } }
    if (!upstream.ok) {
      return NextResponse.json({ error: 'The ElizaOS service rejected the message. Check its endpoint and authentication.' }, { status: upstream.status >= 500 ? 502 : upstream.status })
    }
    return NextResponse.json(payload)
  } catch (error) {
    const timedOut = error instanceof Error && error.name === 'TimeoutError'
    return NextResponse.json(
      { error: timedOut ? 'ElizaOS took too long to respond. Please try again.' : 'Could not connect to the ElizaOS service.' },
      { status: 502 },
    )
  }
}
