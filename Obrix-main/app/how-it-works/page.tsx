'use client'

import { ArrowRight } from 'lucide-react'
import { PageShell } from '@/components/launch-page/page-shell'

const STEPS = [
  { n: '01', title: 'Describe your token', body: 'Enter your token name, ticker, description, image and optional links on the Launch page. Review the live preview before continuing.' },
  { n: '02', title: 'Connect your wallet', body: 'Connect a wallet and switch to Robinhood Chain (chain ID 4663). Your wallet stays in your control the whole time.' },
  { n: '03', title: 'Deploy through Pons V2', body: 'Right before launching, Ignio reads the current launch settings and launch fee from the Pons V2 factory and pins them into your transaction. You review and sign it in your wallet.' },
  { n: '04', title: 'Trade and track', body: 'The token has a fixed supply that is minted to its bonding curve. If the curve completes, the launch graduates into a Uniswap V4 pool with locked liquidity. Every launch shows up on the Explore page.' },
]

const NOTES = [
  'Ignio is non-custodial. Only your wallet signs transactions, and Ignio never holds your funds.',
  'The launch fee is read live from the factory when you launch. Published docs currently describe 0.0005 ETH.',
  'The fee recipient defaults to your connected wallet. Creator tax is set to zero and buybacks are off by default.',
  'Launches spend real ETH and cannot be undone. Check every detail in your wallet before you sign.',
  'Ignio does not estimate market cap or liquidity, and nothing here is financial advice.',
]

export default function HowItWorksPage() {
  return (
    <PageShell>
      <p className="obrix-x-kicker">[ 01 ] HOW IT WORKS</p>
      <h1>From idea to on-chain<br />in four steps.</h1>
      <p className="obrix-x-sub">Ignio is a simple interface on top of the Pons V2 launch contracts on Robinhood Chain.</p>

      <div className="obrix-x-steps">
        {STEPS.map((s) => (
          <article className="obrix-x-card" key={s.n}>
            <div className="obrix-x-card-head">
              <div className="obrix-x-avatar">{s.n}</div>
              <div className="obrix-x-card-title"><strong>{s.title}</strong></div>
            </div>
            <p className="obrix-x-desc obrix-x-desc-full">{s.body}</p>
          </article>
        ))}
      </div>

      <p className="obrix-x-label">● GOOD TO KNOW</p>
      <ul className="obrix-x-list">
        {NOTES.map((n) => <li key={n}>{n}</li>)}
      </ul>

      <div className="obrix-x-cta-row">
        <a className="obrix-x-btn" href="/launch">Launch a token <ArrowRight size={16} /></a>
        <a className="obrix-x-btn ghost" href="/explore">Explore launches</a>
      </div>

      <p className="obrix-x-foot">{'// ignio is an interface · the contracts belong to pons v2'}</p>
    </PageShell>
  )
}
