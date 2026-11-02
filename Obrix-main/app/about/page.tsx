'use client'

import { ArrowUpRight } from 'lucide-react'
import { PageShell } from '@/components/launch-page/page-shell'
import { PONS_V2_FACTORY_ADDRESS } from '@/lib/hooks/use-launch-token'
import { robinhoodChain } from '@/lib/wagmi-config'

const EXPLORER = robinhoodChain.blockExplorers.default.url

const PRINCIPLES = [
  { title: 'Non-custodial', body: 'Your wallet signs every transaction. OxRiZ never takes custody of your funds.' },
  { title: 'Transparent', body: 'Launches are read straight from Robinhood Chain, so what you see on Explore is what is on-chain.' },
  { title: 'Simple', body: 'One clear path from an idea to a live token, with nothing hidden behind the form.' },
]

export default function AboutPage() {
  return (
    <PageShell>
      <p className="obrix-x-kicker">[ 06 ] ABOUT</p>
      <h1>Launch tools,<br />kept simple.</h1>
      <p className="obrix-x-sub">
        OxRiZ is a launch interface for Pons V2 on Robinhood Chain. It helps you turn an idea into a token, with a clean form, a live preview and an agent that drafts the details with you.
      </p>

      <p className="obrix-x-label">● PRINCIPLES</p>
      <div className="obrix-x-steps">
        {PRINCIPLES.map((p) => (
          <article className="obrix-x-card" key={p.title}>
            <div className="obrix-x-card-title"><strong>{p.title}</strong></div>
            <p className="obrix-x-desc obrix-x-desc-full" style={{ marginTop: 10 }}>{p.body}</p>
          </article>
        ))}
      </div>

      <p className="obrix-x-label">● ON-CHAIN DETAILS</p>
      <article className="obrix-x-card">
        <dl className="obrix-x-rows" style={{ marginBottom: 18 }}>
          <div><dt>network</dt><dd>Robinhood Chain</dd></div>
          <div><dt>chain id</dt><dd>{robinhoodChain.id}</dd></div>
          <div><dt>protocol</dt><dd>Pons V2</dd></div>
          <div><dt>factory</dt><dd>{PONS_V2_FACTORY_ADDRESS.slice(0, 6)}…{PONS_V2_FACTORY_ADDRESS.slice(-4)}</dd></div>
        </dl>
        <div className="obrix-x-actions">
          <a href={`${EXPLORER}/address/${PONS_V2_FACTORY_ADDRESS}`} target="_blank" rel="noreferrer">View factory <ArrowUpRight size={14} /></a>
          <a href={EXPLORER} target="_blank" rel="noreferrer">Block explorer <ArrowUpRight size={14} /></a>
        </div>
      </article>

      <p className="obrix-x-label">● DISCLAIMER</p>
      <p className="obrix-x-note-box">
        {'// oxriz is an interface, not the contracts. tokens launched here are created by their deployers, not by oxriz. launches spend real ETH and are irreversible. nothing on this site is financial advice. always verify transactions in your wallet.'}
      </p>

      <p className="obrix-x-foot">{'// built for robinhood chain'}</p>
    </PageShell>
  )
}
