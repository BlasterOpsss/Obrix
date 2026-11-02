'use client'

import { useEffect, useState } from 'react'
import { createPublicClient, formatEther, http, parseAbi, parseAbiItem, type Address } from 'viem'
import { robinhoodChain } from '@/lib/wagmi-config'
import { PONS_V2_FACTORY_ADDRESS } from '@/lib/hooks/use-launch-token'
import { PONS_V2_FACTORY_ABI } from '@/lib/abi/factory'
import { isImpersonation } from '@/lib/brand-guard'

const client = createPublicClient({ chain: robinhoodChain, transport: http() })
const LAUNCH_EVENT = parseAbiItem(
  'event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken)'
)
const ERC20_ABI = parseAbi(['function symbol() view returns (string)'])

function fetchRange(fromBlock: bigint, toBlock: bigint) {
  return client.getLogs({ address: PONS_V2_FACTORY_ADDRESS, event: LAUNCH_EVENT, fromBlock, toBlock })
}

async function loadLogs() {
  const latest = await client.getBlockNumber()
  let logs: Awaited<ReturnType<typeof fetchRange>> = []
  try {
    logs = await fetchRange(0n, latest)
  } catch {
    const STEP = 50_000n
    let to = latest
    for (let i = 0; i < 100; i++) {
      const from = to > STEP ? to - STEP + 1n : 0n
      try { logs.push(...(await fetchRange(from, to))) } catch { /* skip failed chunk */ }
      if (from === 0n) break
      to = from - 1n
    }
  }
  return logs
}

export function LiveSection() {
  const [count, setCount] = useState<number | null>(null)
  const [block, setBlock] = useState<bigint | null>(null)
  const [fee, setFee] = useState<string | null>(null)
  const [symbols, setSymbols] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    const tick = () => client.getBlockNumber().then((b) => alive && setBlock(b)).catch(() => {})
    tick()
    const id = setInterval(tick, 15000)

    client.readContract({ address: PONS_V2_FACTORY_ADDRESS, abi: PONS_V2_FACTORY_ABI, functionName: 'launchFee' })
      .then((f) => alive && setFee(formatEther(f)))
      .catch(() => {})

    loadLogs()
      .then(async (logs) => {
        if (!alive) return
        setCount(logs.length)
        const recent = logs.slice(-12).reverse()
        const syms = await Promise.all(
          recent.map((l) =>
            client.readContract({ address: l.args.token as Address, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => '???')
          )
        )
        if (alive) setSymbols(syms.filter((s) => !isImpersonation('', s)))
      })
      .catch(() => {})

    return () => { alive = false; clearInterval(id) }
  }, [])

  const track = symbols.length ? [...symbols, ...symbols] : []

  return (
    <section id="live" className="obrix-section obrix-live">
      <div className="obrix-live-head obrix-reveal">
        <span className="obrix-eyebrow">LIVE FROM THE CHAIN</span>
        <h2>Robinhood Chain,<br />in real time.</h2>
      </div>

      <div className="obrix-live-stats obrix-reveal" data-delay="150">
        <div><span>TOKENS LAUNCHED</span><strong>{count === null ? '…' : count}</strong></div>
        <div><span>CURRENT BLOCK</span><strong>{block === null ? '…' : block.toString()}</strong></div>
        <div><span>LAUNCH FEE</span><strong>{fee === null ? '…' : `${fee} ETH`}</strong></div>
      </div>

      <div className="obrix-live-marquee obrix-reveal" data-delay="250">
        {track.length ? (
          <div className="obrix-live-track">
            {track.map((s, i) => <span key={i}>${s}</span>)}
          </div>
        ) : (
          <p className="obrix-live-empty">{count === 0 ? 'No launches yet. Yours could be the first.' : 'Reading the latest launches…'}</p>
        )}
      </div>

      <a className="obrix-live-cta obrix-reveal" data-delay="300" href="/explore">See all launches →</a>
    </section>
  )
}
