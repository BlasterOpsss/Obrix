import { timingSafeEqual } from 'node:crypto'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { ElizaClient } from '@elizaos/api-client'

const port = Number(process.env.PORT || 3002)
const runtimeUrl = process.env.ELIZAOS_RUNTIME_URL || 'http://127.0.0.1:3001'
const bridgeToken = process.env.OBRIX_COPILOT_TOKEN || ''
const runtimeApiKey = process.env.ELIZAOS_RUNTIME_API_KEY
if (!bridgeToken) throw new Error('OBRIX_COPILOT_TOKEN is required.')

const client = ElizaClient.create({ baseUrl: runtimeUrl, ...(runtimeApiKey ? { apiKey: runtimeApiKey } : {}) })
function send(res: ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
  res.end(JSON.stringify(payload))
}
function authorized(req: IncomingMessage) {
  const supplied = Buffer.from(req.headers.authorization || '')
  const expected = Buffer.from('Bearer ' + bridgeToken)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}
async function readBody(req: IncomingMessage) {
  let raw = ''
  for await (const chunk of req) {
    raw += chunk.toString()
    if (raw.length > 12000) throw new Error('Request body too large.')
  }
  return JSON.parse(raw || '{}')
}
function extractText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return ''
  const record = value as Record<string, unknown>
  for (const key of ['text', 'message', 'response', 'content', 'answer']) {
    const item = record[key]
    if (typeof item === 'string' && item.trim()) return item
    if (item && typeof item === 'object') { const nested = extractText(item); if (nested) return nested }
    if (Array.isArray(item)) { const joined = item.map(extractText).filter(Boolean).join('\\n'); if (joined) return joined }
  }
  return ''
}
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname.replace(/\\/+$/, '') || '/'
  console.log('OBRIX bridge request:', req.method, pathname)

  if (req.method === 'GET' && pathname === '/') {
    return send(res, 200, { ok: true, service: 'obrix-elizaos-bridge', endpoints: ['/healthz', '/chat'] })
  }
  if (req.method === 'GET' && pathname === '/healthz') {
    return send(res, 200, { ok: true, service: 'obrix-elizaos-bridge' })
  }
  if (req.method !== 'POST' || pathname !== '/chat') return send(res, 404, { error: 'Not found.' })
  if (!authorized(req)) return send(res, 401, { error: 'Unauthorized.' })
  try {
    const body = await readBody(req) as { message?: unknown; userId?: unknown }
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : ''
    const userId = typeof body.userId === 'string' ? body.userId.slice(0, 100) : 'obrix-web-user'
    if (!message) return send(res, 400, { error: 'A non-empty message is required.' })
    const result = await client.jobs.ask(userId, message)
    const text = extractText(result)
    if (!text) return send(res, 502, { error: 'ElizaOS returned no readable text.' })
    return send(res, 200, { text })
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown bridge error.'
    return send(res, 502, { error: 'The ElizaOS runtime could not complete this request.', detail })
  }
})
server.listen(port, '0.0.0.0', () => console.log('OBRIX ElizaOS bridge listening on ' + port))
