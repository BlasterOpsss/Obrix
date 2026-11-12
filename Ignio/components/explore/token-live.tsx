'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from 'wagmi'
import { formatEther, formatUnits, parseUnits, toHex, type Address } from 'viem'
import { robinhoodChain } from '@/lib/wagmi-config'
import { CURVE_BUY_TOPIC, CURVE_SELL_TOPIC, ERC20_TRADE_ABI, PONS_CURVE_ABI } from '@/lib/abi/curve'
import { BuyPanel, type Market } from '@/components/explore/token-trade'

const fmt = (n: number) =>
  !isFinite(n) ? '—' : n === 0 ? '0' : n < 0.0001 ? n.toExponential(2) : n < 1 ? n.toPrecision(3) : n.toLocaleString(undefined, { maximumFractionDigits: 2 })
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

interface Trade { id: string; side: 'buy' | 'sell'; who: string; eth: number; tokens: number; price: number; block: bigint }
type RawLog = { topics: string[]; data: string; blockNumber: string; transactionHash: string; logIndex: string }
const word = (d: string, i: number) => BigInt('0x' + d.slice(2 + i * 64, 2 + (i + 1) * 64))

// Reads trade history from the curve's events, then keeps polling for new trades and the live price.
function useLive(curve: Address, fromBlock: bigint, decimals: number) {
  const client = usePublicClient({ chainId: robinhoodChain.id })
  const [trades, setTrades] = useState<Trade[]>([])
  const [series, setSeries] = useState<number[]>([])
  const [price, setPrice] = useState<number | null>(null)
  const seen = useRef(new Set<string>())
  const last = useRef(fromBlock)

  useEffect(() => {
    if (!client) return
    let alive = true
    seen.current = new Set()
    last.current = fromBlock
    const decode = (l: RawLog): Trade | null => {
      const id = `${l.transactionHash}-${l.logIndex}`
      if (seen.current.has(id)) return null
      seen.current.add(id)
      const buy = l.topics[0].toLowerCase() === CURVE_BUY_TOPIC.toLowerCase()
      const eth = Number(formatEther(word(l.data, buy ? 0 : 1)))
      const tokens = Number(formatUnits(word(l.data, buy ? 1 : 0), decimals))
      if (!(tokens > 0)) return null
      return { id, side: buy ? 'buy' : 'sell', who: '0x' + l.topics[1].slice(26), eth, tokens, price: eth / tokens, block: BigInt(l.blockNumber) }
    }
    const pull = async () => {
      try {
        const latest = await client.getBlockNumber()
        const raw = (await client.request({
          method: 'eth_getLogs',
          params: [{ address: curve, fromBlock: toHex(last.current), toBlock: toHex(latest), topics: [[CURVE_BUY_TOPIC, CURVE_SELL_TOPIC]] }],
        } as never)) as unknown as RawLog[]
        if (!alive) return
        const fresh = raw.map(decode).filter((t): t is Trade => t !== null)
        last.current = latest
        if (alive && fresh.length) {
          setTrades((t) => [...t, ...fresh].slice(-200))
          setSeries((s) => [...s, ...fresh.map((f) => f.price)].slice(-300))
        }
        const [q, tk] = await client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'getReserves' })
        const p = Number(formatEther(q)) / Number(formatUnits(tk, decimals))
        if (alive && isFinite(p)) {
          setPrice(p)
          setSeries((s) => [...s, p].slice(-300))
        }
      } catch { /* try again on the next tick */ }
    }
    pull()
    const id = setInterval(pull, 4000)
    return () => { alive = false; clearInterval(id) }
  }, [client, curve, decimals])

  return { trades, series, price }
}

function LiveChart({ series }: { series: number[] }) {
  if (series.length < 2) return <p className="obrix-x-note">waiting for price ticks…</p>
  const W = 320, H = 120, P = 6
  const min = Math.min(...series), max = Math.max(...series)
  const span = max - min || max * 0.1 || 1
  const lo = min - span * 0.15, hi = max + span * 0.15
  const x = (i: number) => P + (i / (series.length - 1)) * (W - 2 * P)
  const y = (v: number) => H - P - ((v - lo) / (hi - lo)) * (H - 2 * P)
  let d = `M${x(0)},${y(series[0])}`
  for (let i = 1; i < series.length; i++) d += ` H${x(i)} V${y(series[i])}`
  const area = `${d} V${H - P} H${x(0)} Z`
  const lastX = x(series.length - 1), lastY = y(series[series.length - 1])
  return (
    <div className="obrix-x-chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="live price">
        <path d={area} className="obrix-x-chart-fill" />
        <path d={d} className="obrix-x-chart-line" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="obrix-x-chart-dot" style={{ left: `${(lastX / W) * 100}%`, top: `${(lastY / H) * 100}%` }} />
      <span className="obrix-x-chart-hi">{fmt(hi)}</span>
      <span className="obrix-x-chart-lo">{fmt(lo)}</span>
    </div>
  )
}

export function SellPanel({ token, curve, symbol, market }: { token: Address; curve: Address; symbol: string; market: Market }) {
  const { address, chainId, isConnected } = useAccount()
  const client = usePublicClient({ chainId: robinhoodChain.id })
  const { switchChain, isPending: switching } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(5)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [quote, setQuote] = useState<bigint | null>(null)
  const [needApprove, setNeedApprove] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const dec = market.decimals
  const tokensIn = useMemo(() => {
    try { const v = parseUnits(amount || '0', dec); return v > 0n ? v : null } catch { return null }
  }, [amount, dec])

  useEffect(() => {
    if (!client || !address) return
    let alive = true
    client.readContract({ address: token, abi: ERC20_TRADE_ABI, functionName: 'balanceOf', args: [address] })
      .then((b) => alive && setBalance(b)).catch(() => {})
    return () => { alive = false }
  }, [client, address, token, tick])

  const ready = Boolean(client && address && tokensIn && !market.graduated && market.native && chainId === robinhoodChain.id)

  useEffect(() => {
    setQuote(null)
    setError('')
    setNeedApprove(false)
    const tin = tokensIn
    if (!ready || !client || !address || !tin) return
    if (balance !== null && tin > balance) { setError('That is more than your balance.'); return }
    let alive = true
    const timer = setTimeout(async () => {
      try {
        const sim = await client.simulateContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'sell', args: [tin, 0n, address], account: address })
        if (alive) setQuote(sim.result)
      } catch {
        try {
          const allowance = await client.readContract({ address: token, abi: ERC20_TRADE_ABI, functionName: 'allowance', args: [address, curve] })
          if (!alive) return
          if (allowance < tin) setNeedApprove(true)
          else setError('Could not get a quote. Selling may be unavailable for this token right now.')
        } catch { if (alive) setError('Could not get a quote.') }
      }
    }, 500)
    return () => { alive = false; clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokensIn, address, chainId, curve, ready, balance, tick])

  const fail = (e: unknown) => setError(e instanceof Error ? e.message.split('\n')[0] : 'Transaction failed.')

  const approve = async () => {
    if (!client || !tokensIn) return
    setBusy(true); setError('')
    try {
      const h = await writeContractAsync({ address: token, abi: ERC20_TRADE_ABI, functionName: 'approve', args: [curve, tokensIn], chainId: robinhoodChain.id })
      await client.waitForTransactionReceipt({ hash: h })
      setTick((t) => t + 1)
    } catch (e) { fail(e) } finally { setBusy(false) }
  }

  const sell = async () => {
    if (!client || !address || !tokensIn || quote === null) return
    setBusy(true); setError('')
    try {
      const minOut = (quote * BigInt(100 - slippage)) / 100n
      const h = await writeContractAsync({ address: curve, abi: PONS_CURVE_ABI, functionName: 'sell', args: [tokensIn, minOut, address], chainId: robinhoodChain.id })
      await client.waitForTransactionReceipt({ hash: h })
      setDone(h); setAmount(''); setTick((t) => t + 1)
    } catch (e) { fail(e) } finally { setBusy(false) }
  }

  if (market.graduated) return <div className="obrix-x-buy"><p className="obrix-x-note">This token has graduated. Trading now happens in its Uniswap pool, not on the bonding curve.</p></div>
  if (!market.native) return <div className="obrix-x-buy"><p className="obrix-x-note">This launch uses a custom pair token and can&apos;t be sold here yet.</p></div>
  if (!isConnected) return <div className="obrix-x-buy"><p className="obrix-x-note">Connect your wallet (top of the page) to sell.</p></div>
  if (chainId !== robinhoodChain.id) {
    return (
      <div className="obrix-x-buy">
        <button type="button" className="obrix-x-buy-btn" disabled={switching} onClick={() => switchChain({ chainId: robinhoodChain.id })}>
          {switching ? 'Switching…' : 'Switch to Robinhood Chain'}
        </button>
      </div>
    )
  }

  const pct = (p: number) => { if (balance !== null) setAmount(formatUnits((balance * BigInt(p)) / 100n, dec)) }
  return (
    <div className="obrix-x-buy">
      <label className="obrix-x-buy-label">Amount (${symbol}) {balance !== null && `· you hold ${fmt(Number(formatUnits(balance, dec)))}`}</label>
      <input className="obrix-x-buy-input" inputMode="decimal" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} />
      <div className="obrix-x-chips">
        {[25, 50, 75, 100].map((p) => <button key={p} type="button" onClick={() => pct(p)}>{p}%</button>)}
      </div>
      <label className="obrix-x-buy-label">Max slippage</label>
      <div className="obrix-x-chips">
        {[1, 5, 10].map((v) => <button key={v} type="button" className={slippage === v ? 'is-on' : ''} onClick={() => setSlippage(v)}>{v}%</button>)}
      </div>
      {quote !== null && (
        <p className="obrix-x-note">You get about {fmt(Number(formatEther(quote)))} ETH · at least {fmt(Number(formatEther((quote * BigInt(100 - slippage)) / 100n)))} ETH</p>
      )}
      {needApprove && <p className="obrix-x-note">First approve the curve to take this amount of ${symbol}. It&apos;s a separate small transaction.</p>}
      {error && <p className="obrix-x-warn">{error}</p>}
      {needApprove ? (
        <button type="button" className="obrix-x-buy-btn" disabled={busy} onClick={approve}>{busy ? 'Confirm in your wallet…' : `Approve $${symbol}`}</button>
      ) : (
        <button type="button" className="obrix-x-buy-btn" disabled={busy || quote === null} onClick={sell}>{busy ? 'Confirm in your wallet…' : 'Sell'}</button>
      )}
      {done && <p className="obrix-x-note">Sold ✓ <a href={`${robinhoodChain.blockExplorers.default.url}/tx/${done}`} target="_blank" rel="noreferrer">View transaction</a></p>}
      <p className="obrix-x-note">{'// trades cannot be reversed. check the amount in your wallet before you confirm.'}</p>
    </div>
  )
}

function LiveInner({ token, curve, symbol, market, fromBlock }: { token: Address; curve: Address; symbol: string; market: Market; fromBlock: bigint }) {
  const { trades, series, price } = useLive(curve, fromBlock, market.decimals)
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const volume = trades.reduce((s, t) => s + t.eth, 0)
  const buys = trades.filter((t) => t.side === 'buy').length
  const recent = [...trades].reverse().slice(0, 6)
  return (
    <div className="obrix-x-live">
      <div className="obrix-x-live-head">
        <span className="obrix-x-pill"><i /> LIVE</span>
        <strong>{price !== null ? `${fmt(price)} ETH` : '—'}</strong>
      </div>
      <LiveChart series={series} />
      <dl className="obrix-x-rows">
        <div><dt>volume</dt><dd>{fmt(volume)} ETH</dd></div>
        <div><dt>trades</dt><dd>{trades.length} ({buys} buys · {trades.length - buys} sells)</dd></div>
      </dl>
      {recent.length > 0 && (
        <ul className="obrix-x-trades">
          {recent.map((t) => (
            <li key={t.id} className={t.side}>
              <b>{t.side === 'buy' ? 'BUY' : 'SELL'}</b>
              <span>{fmt(t.eth)} ETH</span>
              <span>{short(t.who)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="obrix-x-tabs">
        <button type="button" className={tab === 'buy' ? 'is-on' : ''} onClick={() => setTab('buy')}>Buy</button>
        <button type="button" className={tab === 'sell' ? 'is-on' : ''} onClick={() => setTab('sell')}>Sell</button>
      </div>
      {tab === 'buy' ? <BuyPanel curve={curve} symbol={symbol} market={market} /> : <SellPanel token={token} curve={curve} symbol={symbol} market={market} />}
    </div>
  )
}

export function LivePanel(props: { token: Address; curve: Address; symbol: string; market: Market | null; fromBlock: bigint }) {
  if (!props.market) return <div className="obrix-x-buy"><p className="obrix-x-note">loading…</p></div>
  return <LiveInner {...props} market={props.market} />
}
