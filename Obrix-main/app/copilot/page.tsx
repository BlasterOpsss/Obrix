'use client'

import { FormEvent, useRef, useState } from 'react'
import { ArrowUp, Bot, Sparkles, UserRound } from 'lucide-react'
import { Navbar } from '@/components/launch-page/navbar'
import './copilot.css'

type Message = { role: 'user' | 'assistant'; content: string }

const starters = [
  'Explain how a Pons V2 token launch works.',
  'What should I check before launching a token?',
  'Help me plan tokenomics for a new project.',
]

function readReply(payload: unknown): string {
  if (typeof payload === 'string') return payload
  if (!payload || typeof payload !== 'object') return ''
  const value = payload as Record<string, unknown>
  for (const key of ['text', 'message', 'reply', 'response', 'content']) {
    const candidate = value[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate
    if (Array.isArray(candidate)) {
      const joined = candidate.map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part) return String((part as { text: unknown }).text)
        return ''
      }).filter(Boolean).join('\n')
      if (joined) return joined
    }
  }
  return ''
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const sessionId = useRef<string>(crypto.randomUUID())
  const endRef = useRef<HTMLDivElement>(null)

  const send = async (raw: string) => {
    const text = raw.trim()
    if (!text || busy) return
    setInput('')
    setError('')
    setMessages((current) => [...current, { role: 'user', content: text }])
    setBusy(true)
    try {
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId.current }),
      })
      const payload: unknown = await response.json().catch(() => ({}))
      if (!response.ok) {
        const detail = payload && typeof payload === 'object' && 'error' in payload
          ? String((payload as { error: unknown }).error)
          : 'The Copilot service is unavailable.'
        throw new Error(detail)
      }
      const reply = readReply(payload)
      if (!reply) throw new Error('ElizaOS returned an empty response. Check the service endpoint configuration.')
      setMessages((current) => [...current, { role: 'assistant', content: reply }])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reach the Copilot service.')
    } finally {
      setBusy(false)
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }))
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void send(input)
  }

  return (
    <div className="obrix-copilot">
      <div className="obrix-copilot-nav"><Navbar /></div>
      <main className="obrix-copilot-main">
        <header className="obrix-copilot-heading">
          <span className="obrix-copilot-kicker"><i /> OBRIX INTELLIGENCE / 01</span>
          <div className="obrix-copilot-title-row">
            <div>
              <h1>AI Copilot<span>.</span></h1>
              <p>Your on-chain thinking partner. Ask, research and plan before you act.</p>
            </div>
            <div className="obrix-copilot-orbit" aria-hidden="true"><span /><span /><Bot size={25} /></div>
          </div>
          <div className="obrix-copilot-rule" />
          <div className="obrix-copilot-meta"><span>ELIZAOS RUNTIME</span><span>WALLET ACTIONS DISABLED</span><span>HUMAN APPROVAL REQUIRED</span></div>
        </header>

        <section className="obrix-copilot-workspace" aria-label="Copilot conversation">
          <div className="obrix-copilot-thread">
            {messages.length === 0 ? (
              <div className="obrix-copilot-welcome">
                <div className="obrix-copilot-spark"><Sparkles size={18} /></div>
                <p className="obrix-copilot-overline">YOUR OBRIX COPILOT</p>
                <h2>What are we<br />thinking about?</h2>
                <p className="obrix-copilot-muted">Explore token ideas, understand launch mechanics and reason through on-chain data.</p>
                <div className="obrix-copilot-starters">
                  {starters.map((starter) => (
                    <button key={starter} type="button" onClick={() => void send(starter)}>{starter}<span>↗</span></button>
                  ))}
                </div>
              </div>
            ) : messages.map((message, index) => (
              <article className={'obrix-copilot-message is-' + message.role} key={index}>
                <div className="obrix-copilot-avatar">{message.role === 'assistant' ? <Bot size={16} /> : <UserRound size={16} />}</div>
                <div><span className="obrix-copilot-role">{message.role === 'assistant' ? 'OBRIX COPILOT' : 'YOU'}</span><p>{message.content}</p></div>
              </article>
            ))}
            {busy && <div className="obrix-copilot-thinking"><span /><span /><span /> ElizaOS is thinking</div>}
            {error && <div className="obrix-copilot-error" role="alert">{error}</div>}
            <div ref={endRef} />
          </div>

          <form className="obrix-copilot-composer" onSubmit={submit}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask OBRIX anything…" rows={1} maxLength={2000} disabled={busy} aria-label="Message the OBRIX Copilot" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(input) } }} />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send message"><ArrowUp size={19} /></button>
            <span>ENTER TO SEND · SHIFT + ENTER FOR NEW LINE</span>
          </form>
          <p className="obrix-copilot-disclaimer">Copilot responses are informational, not financial advice. It cannot sign transactions or move funds.</p>
        </section>
      </main>
    </div>
  )
}
