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
  if (process.env.OBRIX_COPILOT_TOKEN) headers.authorization = 'Bearer ' + process.env.OBRIX_COPILOT_TOKEN

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, userId: sessionId || 'obrix-web-user' }),
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    })
    const raw = await upstream.text()
    let payload: unknown
    try { payload = JSON.parse(raw) } catch { payload = { text: raw } }
    if (!upstream.ok) {
      const upstreamError = payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as { error: unknown }).error).slice(0, 240)
        : ''
      const detail = payload && typeof payload === 'object' && 'detail' in payload
        ? String((payload as { detail: unknown }).detail).slice(0, 240)
        : ''
      const statusHint = upstream.status === 401
        ? 'Authentication failed: make sure OBRIX_COPILOT_TOKEN matches exactly in Vercel and Railway.'
        : upstream.status === 404
          ? 'The Railway URL or /chat path is incorrect. Check ELIZAOS_CHAT_URL.'
          : upstream.status >= 500
            ? 'The Railway bridge or ElizaOS runtime failed while processing the request.'
            : 'The Railway bridge rejected the request.'
      return NextResponse.json({
        error: statusHint,
        upstreamStatus: upstream.status,
        ...(upstreamError ? { upstreamError } : {}),
        ...(detail ? { detail } : {}),
      }, { status: upstream.status >= 500 ? 502 : upstream.status })
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
