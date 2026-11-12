'use client'

import { useState } from 'react'
import { Navbar } from '@/components/launch-page/navbar'

const prompts = [
  { label: 'Fan token', text: 'Create a fan token called ' },
  { label: 'Rewards', text: 'Create a rewards token called ' },
  { label: 'Membership', text: 'Create a membership token called ' },
  { label: 'Chat instead', text: 'Type or say what you want to create…' },
]
const bars = [14, 28, 40, 26, 48, 22, 40, 16, 34, 12, 22, 10]

export default function Home() {
  const [prompt, setPrompt] = useState('Create a rewards token called Spark, ten million supply')
  const [live, setLive] = useState(true)

  return (
    <div className="ox-home">
      <Navbar />
      <main className="ox-home-main">
        <p className="ox-home-sub">Create and launch tokens on Robinhood Chain. Start with an idea, finish with an on-chain launch.</p>
        <div className="ox-home-title" aria-label="Say it. Launch it.">
          <span>Say it.</span>
          <span>Launch it.</span>
        </div>
        <div className="ox-home-bubble">
          Your next token starts with an idea. Shape it, preview it, and launch when you're ready.
          <small>Powered by OXRIZ · Built for Robinhood Chain</small>
        </div>
        <a className="ox-home-launch" href="/launch">Launch a token <span aria-hidden="true">↗</span></a>
      </main>

      <section className="ox-home-pills" aria-label="Token ideas">
        {prompts.map((item) => (
          <button key={item.label} type="button" className="ox-home-pill" onClick={() => setPrompt(item.text || 'Type or say what you want to create…')}>
            {item.label}
          </button>
        ))}
      </section>

      <div className="ox-home-promptbar">
        <div className={`ox-home-wave ${live ? 'is-live' : ''}`} aria-hidden="true">
          {bars.map((height, index) => <i key={index} style={{ '--bar-height': `${height}px`, '--bar-index': index } as React.CSSProperties} />)}
        </div>
        <div className="ox-home-prompt">{prompt}</div>
        <button className="ox-home-mic" type="button" aria-label="Toggle waveform animation" aria-pressed={live} onClick={() => setLive(!live)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>
        </button>
      </div>
      <p className="ox-home-footnote">No forms to start. No code required to explore the launch flow.</p>
    </div>
  )
}
