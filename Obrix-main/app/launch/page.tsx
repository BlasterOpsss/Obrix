'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { Navbar } from '@/components/launch-page/navbar'
import { SiteFooter } from '@/components/launch-page/site-footer'
import { LaunchForm } from '@/components/launch-page/launch-form'
import { TokenPreview } from '@/components/launch-page/token-preview'
import { robinhoodChain } from '@/lib/wagmi-config'

const client = createPublicClient({ chain: robinhoodChain, transport: http() })

export default function LaunchPage() {
  const [block, setBlock] = useState<bigint | null>(null)
  const [initial, setInitial] = useState<{ tokenName: string; tokenSymbol: string; description: string } | null>(null)
  const [preview, setPreview] = useState({
    image: '', name: '', symbol: '', description: '', xLink: '', telegram: '', website: '',
  })

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const init = {
      tokenName: (q.get('name') || '').slice(0, 32),
      tokenSymbol: (q.get('symbol') || '').toUpperCase().slice(0, 10),
      description: (q.get('description') || '').slice(0, 500),
    }
    setInitial(init)
    setPreview((p) => ({ ...p, name: init.tokenName, symbol: init.tokenSymbol, description: init.description }))
  }, [])

  useEffect(() => {
    let alive = true
    const tick = () => client.getBlockNumber().then((b) => alive && setBlock(b)).catch(() => {})
    tick()
    const id = setInterval(tick, 15000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <div className="obrix-site obrix-paper-grid obrix-explore obrix-launch-tab">
      <div className="obrix-x-ticker">
        <span><i /> LIVE</span>
        <span>BLOCK #{block ? block.toString() : '…'}</span>
      </div>
      <div className="obrix-nav-wrap"><Navbar /></div>

      <main className="obrix-x-main">
        <p className="obrix-x-kicker">[ 03 ] LAUNCH</p>
        <h1>Launch your token<br />through OxRiZ.</h1>
        <p className="obrix-x-sub">
          Fill in the details, connect your wallet and deploy through Pons V2 on Robinhood Chain.
          Your wallet signs the transaction directly; OxRiZ never takes custody of your funds.
        </p>

        <p className="obrix-x-label">● TOKEN DETAILS</p>
        {initial && <LaunchForm
          initial={initial}
          onChange={(d) =>
            setPreview({
              image: d.tokenImagePreview || '',
              name: d.tokenName,
              symbol: d.tokenSymbol,
              description: d.description,
              xLink: d.xLink,
              telegram: d.telegram,
              website: d.website,
            })
          }
        />}

        <p className="obrix-x-label">● LIVE PREVIEW</p>
        <TokenPreview
          image={preview.image || undefined}
          name={preview.name}
          symbol={preview.symbol}
          description={preview.description}
          xLink={preview.xLink}
          telegram={preview.telegram}
          website={preview.website}
        />

        <p className="obrix-x-foot">{'// launches are sent from your wallet · read from Robinhood Chain'}</p>
      </main>
      <SiteFooter />
    </div>
  )
}
