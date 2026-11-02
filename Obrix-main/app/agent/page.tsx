'use client'

import { ThinkingSphere } from '@/components/ThinkingSphere'
import { useEffect, useRef, useState } from 'react'
import { useAccount, useReadContract, useSignMessage } from 'wagmi'
import { formatUnits, type Address } from 'viem'
import { ArrowRight, ArrowUp, Lock, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/launch-page/navbar'
import { AGENT_OPEN, GATE_ABI, GATE_TOKEN, MIN_HOLD, accessMessage } from '@/lib/agent-gate'

interface Draft { name: string; symbol: string; description: string }
interface Msg { role: 'user' | 'agent'; text: string; draft?: Draft }
interface Proof { address: string; message: string; signature: string }

const EXAMPLES = [
  'A token called Pixel Frog with ticker $PFROG about a frog that loves retro games',
  'A token named Chain Chef, ticker $CHEF, for people who love cooking on-chain',
]

export default function AgentPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const gated = !AGENT_OPEN
  const decimals = useReadContract({
    address: GATE_TOKEN ?? undefined, abi: GATE_ABI, functionName: 'decimals', chainId: 4663,
    query: { enabled: GATE_TOKEN !== null },
  })
  const balance = useReadContract({
    address: GATE_TOKEN ?? undefined, abi: GATE_ABI, functionName: 'balanceOf', args: [address as Address], chainId: 4663,
    query: { enabled: GATE_TOKEN !== null && Boolean(address) },
  })
  const loaded = balance.data !== undefined && decimals.data !== undefined
  const needed = loaded ? MIN_HOLD * 10n ** BigInt(decimals.data as number) : 0n
  const hasAccess = AGENT_OPEN || (GATE_TOKEN !== null && loaded && (balance.data as bigint) >= needed)
  const held = loaded ? Number(formatUnits(balance.data as bigint, decimals.data as number)) : null

  let gateText = ''
  if (gated) {
    if (GATE_TOKEN === null) gateText = `// the agent unlocks for holders of ${MIN_HOLD.toLocaleString()} $OXRIZ once $OXRIZ launches.`
    else if (!isConnected) gateText = `// hold ${MIN_HOLD.toLocaleString()} $OXRIZ to use the agent. connect your wallet to check your balance.`
    else if (!loaded) gateText = '// checking your $OXRIZ balance…'
    else if (!hasAccess) gateText = `// you hold ${held?.toLocaleString(undefined, { maximumFractionDigits: 2 })} $OXRIZ. you need ${MIN_HOLD.toLocaleString()} to use the agent.`
    else gateText = `// access unlocked · you hold ${held?.toLocaleString(undefined, { maximumFractionDigits: 2 })} $OXRIZ`
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, busy])

  const getProof = async (): Promise<Proof | null> => {
    if (!gated) return null
    if (!address) throw new Error('Connect your wallet first.')
    const key = `oxriz-agent-proof-${address}`
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || 'null')
      if (cached && Date.now() - cached.t < 23 * 3600 * 1000) return cached.proof as Proof
    } catch { /* ignore */ }
    const message = accessMessage(address, new Date().toISOString())
    const signature = await signMessageAsync({ message })
    const proof = { address, message, signature }
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), proof })) } catch { /* ignore */ }
    return proof
  }

  const send = async (text: string) => {
    const message = text.trim()
    if (!hasAccess) {
      setMessages((m) => [...m, { role: 'agent', text: `You need to hold ${MIN_HOLD.toLocaleString()} $OXRIZ to use the agent.` }])
      return
    }
    if (!message || busy) return
    setInput('')
    setBusy(true)
    const t0 = Date.now()
    setMessages((m) => [...m, { role: 'user', text: message }])
    try {
      const proof = await getProof()
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, proof }),
      })
      const json = await res.json()
      await new Promise((r) => setTimeout(r, Math.max(0, 2200 - (Date.now() - t0))))
      if (!res.ok) throw new Error(json.error || 'Agent unavailable.')
      const draft = json.name && json.symbol ? { name: json.name, symbol: json.symbol, description: json.description || '' } : undefined
      setMessages((m) => [...m, { role: 'agent', text: json.reply, draft }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'agent', text: err instanceof Error ? err.message : 'Something went wrong. Please try again.' }])
    } finally {
      setBusy(false)
    }
  }

  const launchHref = (d: Draft) =>
    `/launch?name=${encodeURIComponent(d.name)}&symbol=${encodeURIComponent(d.symbol)}&description=${encodeURIComponent(d.description)}`

  return (
    <div className="obrix-site obrix-paper-grid obrix-explore obrix-agent">
      <div className="obrix-x-ticker">
        <span><i /> LIVE</span>
        <span>STATUS <b>{!gated || hasAccess ? 'AGENT READY' : 'LOCKED'}</b></span>
      </div>
      <div className="obrix-nav-wrap"><Navbar /></div>

      <main className="obrix-x-main obrix-agent-main">
        <div className="obrix-agent-head">
          <p className="obrix-x-kicker">[ 05 ] THE LAB</p>
          <h1>Converse with OxRiZ.</h1>
          <p className="obrix-x-sub">Describe your token. The agent drafts it, you review and launch.</p>
        </div>

        {gated && <p className="obrix-x-note-box">{gateText}</p>}

        <div className="obrix-agent-thread">
          {messages.length === 0 && (
            <div className="obrix-agent-examples">
              <p className="obrix-x-label">● TRY AN EXAMPLE</p>
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => send(ex)}>{ex}</button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`obrix-agent-msg is-${m.role}`}>
              <p>{m.text}</p>
              {m.draft && (
                <article className="obrix-x-card">
                  <div className="obrix-x-card-head">
                    <div className="obrix-x-avatar">{m.draft.symbol.slice(0, 1)}</div>
                    <div className="obrix-x-card-title"><strong>{m.draft.name}</strong><span>${m.draft.symbol}</span></div>
                    <em className="obrix-x-badge obrix-x-badge-ghost">DRAFT</em>
                  </div>
                  {m.draft.description && <p className="obrix-x-desc">{m.draft.description}</p>}
                  <div className="obrix-x-actions">
                    <a href={launchHref(m.draft)}>Open in launch form <ArrowRight size={14} /></a>
                  </div>
                </article>
              )}
            </div>
          ))}
          {busy && <ThinkingSphere />}
          <div ref={endRef} />
        </div>
      </main>

      <form className="obrix-agent-bar" onSubmit={(e) => { e.preventDefault(); send(input) }}>
        <Sparkles size={20} />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={hasAccess ? 'Describe your token…' : `Hold ${MIN_HOLD.toLocaleString()} $OXRIZ to unlock`}
          maxLength={1000}
          disabled={!hasAccess}
          aria-label="Describe your token"
        />
        <button type="submit" className={hasAccess ? '' : 'is-locked'} disabled={busy || (hasAccess && !input.trim())} aria-label={hasAccess ? 'Send' : 'Locked'}>{hasAccess ? <ArrowUp size={20} /> : <Lock size={20} />}</button>
      </form>
    </div>
  )
}
