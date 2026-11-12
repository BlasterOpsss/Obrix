'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/launch-page/navbar'
import { SiteFooter } from '@/components/launch-page/site-footer'
import { LaunchForm } from '@/components/launch-page/launch-form'
import { TokenPreview } from '@/components/launch-page/token-preview'

export default function LaunchPage() {
  const [initial, setInitial] = useState<{ tokenName: string; tokenSymbol: string; description: string } | null>(null)
  const [preview, setPreview] = useState({ image: '', name: '', symbol: '', description: '', xLink: '', telegram: '', website: '' })

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const init = { tokenName: (q.get('name') || '').slice(0, 32), tokenSymbol: (q.get('symbol') || '').toUpperCase().slice(0, 10), description: (q.get('description') || '').slice(0, 500) }
    setInitial(init)
    setPreview((p) => ({ ...p, name: init.tokenName, symbol: init.tokenSymbol, description: init.description }))
  }, [])

  return (
    <div className="obrix-site obrix-launchpad-redesign">
      <Navbar />
      <main className="obrix-launchpad-main">
        <section className="obrix-launchpad-hero">
          <div className="obrix-launchpad-hero-copy">
            <span className="obrix-launchpad-eyebrow"><i /> ROBINHOOD CHAIN · PONS V2</span>
            <h1>Launch tokens<br />by building <em>your way.</em></h1>
            <p>Set up your token, preview the details, connect your wallet and deploy directly through Pons V2.</p>
            <div className="obrix-launchpad-hero-meta"><span>01 / Configure</span><span>02 / Connect</span><span>03 / Deploy</span></div>
          </div>
          <aside className="obrix-launchpad-hero-aside">
            <span className="obrix-launchpad-aside-label">YOUR WALLET. YOUR LAUNCH.</span>
            <div className="obrix-launchpad-aside-symbol">↗</div>
            <p>Every launch is approved and signed by your connected wallet. OXRIZ never takes custody of your keys or funds.</p>
            <a href="#token-setup">Start configuring <span>↓</span></a>
          </aside>
        </section>
        <div className="obrix-launchpad-section-head" id="token-setup">
          <div><span>01 — TOKEN CONFIGURATION</span><h2>Make it yours.</h2></div>
          <p>Complete the live launch form. Your preview updates as you enter the details.</p>
        </div>
        <section className="obrix-launchpad-workspace">
          <div className="obrix-launchpad-form-panel">
            <div className="obrix-launchpad-panel-head"><div><span>DEPLOYMENT SETUP</span><h3>Token details</h3></div><span className="obrix-launchpad-step">01 / 03</span></div>
            {initial && <LaunchForm initial={initial} onChange={(d) => setPreview({ image: d.tokenImagePreview || '', name: d.tokenName, symbol: d.tokenSymbol, description: d.description, xLink: d.xLink, telegram: d.telegram, website: d.website })} />}
          </div>
          <aside className="obrix-launchpad-side">
            <div className="obrix-launchpad-preview-panel">
              <div className="obrix-launchpad-panel-head"><div><span>LIVE PREVIEW</span><h3>Your token card</h3></div><span className="obrix-launchpad-preview-tag">PREVIEW</span></div>
              <TokenPreview image={preview.image || undefined} name={preview.name} symbol={preview.symbol} description={preview.description} xLink={preview.xLink} telegram={preview.telegram} website={preview.website} />
            </div>
            <div className="obrix-launchpad-check-panel">
              <span>BEFORE YOU DEPLOY</span><h3>Launch checklist</h3>
              <ul>
                <li><b>01</b><span>Connect a wallet that you control</span></li>
                <li><b>02</b><span>Switch to Robinhood Chain</span></li>
                <li><b>03</b><span>Add your token image and details</span></li>
                <li><b>04</b><span>Review the transaction in your wallet</span></li>
              </ul>
              <p>Only approve a transaction after checking its details in your wallet.</p>
            </div>
          </aside>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
