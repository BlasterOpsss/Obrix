'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, http } from 'viem'
import { SiteFooter } from '@/components/launch-page/site-footer'
import { Navbar } from '@/components/launch-page/navbar'
import { robinhoodChain } from '@/lib/wagmi-config'

const client = createPublicClient({ chain: robinhoodChain, transport: http() })

export function PageShell({ children }: { children: React.ReactNode }) {
  const [block, setBlock] = useState<bigint | null>(null)
  useEffect(() => {
    let alive = true
    const tick = () => client.getBlockNumber().then((b) => alive && setBlock(b)).catch(() => {})
    tick()
    const id = setInterval(tick, 15000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <div className="obrix-site obrix-paper-grid obrix-explore">
      <div className="obrix-x-ticker">
        <span><i /> LIVE</span>
        <span>BLOCK #{block ? block.toString() : '…'}</span>
      </div>
      <div className="obrix-nav-wrap"><Navbar /></div>
      <main className="obrix-x-main">{children}</main>
      <SiteFooter />
    </div>
  )
}
