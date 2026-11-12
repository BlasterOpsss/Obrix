'use client'

import { useEffect, useState } from 'react'
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
    <main className="pons-launch-app">
      <header className="pons-launch-header">
        <span className="pons-launch-mark">PONS V2</span>
        <span>ROBINHOOD CHAIN</span>
      </header>
      <section className="pons-launch-heading">
        <h1>Launch a token</h1>
        <p>Create and deploy directly through the Pons V2 factory. Your wallet signs the transaction.</p>
      </section>
      <section className="pons-launch-workspace">
        <div className="pons-launch-form">
          {initial && <LaunchForm initial={initial} onChange={(d) => setPreview({ image: d.tokenImagePreview || '', name: d.tokenName, symbol: d.tokenSymbol, description: d.description, xLink: d.xLink, telegram: d.telegram, website: d.website })} />}
        </div>
        <aside className="pons-launch-preview">
          <div className="pons-launch-preview-label">LIVE PREVIEW</div>
          <TokenPreview image={preview.image || undefined} name={preview.name} symbol={preview.symbol} description={preview.description} xLink={preview.xLink} telegram={preview.telegram} website={preview.website} />
        </aside>
      </section>
    </main>
  )
}
