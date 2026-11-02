'use client'

import { Suspense, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Check, Copy } from 'lucide-react'
import type { Address } from 'viem'
import { Navbar } from '@/components/launch-page/navbar'
import { SiteFooter } from '@/components/launch-page/site-footer'
import { BuyPanel, useMarket } from '@/components/explore/token-trade'
import { SellPanel } from '@/components/explore/token-live'
import { PriceChart, RANGES, fmtPrice } from '@/components/token/price-chart'
import { useEthUsd, useHolders, useTokenPage, type TokenInfo, type Trade } from '@/lib/token-data'
import { robinhoodChain } from '@/lib/wagmi-config'

const EXPLORER = robinhoodChain.blockExplorers.default.url
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`
const compact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n)
const ipfs = (u: string) => (u.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${u.slice(7)}` : u)
const age = (ts: number) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - ts))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className="obrix-tk-copy" aria-label="copy" onClick={async () => {
      try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
      setDone(true); setTimeout(() => setDone(false), 1500)
    }}>{done ? <Check size={13} /> : <Copy size={13} />}</button>
  )
}

function TradeBox({ info }: { info: TokenInfo }) {
  const market = useMarket(info.token, info.curve)
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  return (
    <section className="obrix-tk-box">
      <div className="obrix-x-tabs">
        <button type="button" className={tab === 'buy' ? 'is-on' : ''} onClick={() => setTab('buy')}>Buy</button>
        <button type="button" className={tab === 'sell' ? 'is-on' : ''} onClick={() => setTab('sell')}>Sell</button>
      </div>
      {tab === 'buy'
        ? <BuyPanel curve={info.curve} symbol={info.symbol} market={market} />
        : market ? <SellPanel token={info.token} curve={info.curve} symbol={info.symbol} market={market} /> : <div className="obrix-x-buy"><p className="obrix-x-note">loading…</p></div>}
    </section>
  )
}

function Loaded({ token, curveHint, blockHint }: { token: Address; curveHint: string | null; blockHint: string | null }) {
  const { state, error, info, trades, spot } = useTokenPage(token, curveHint, blockHint)
  const usd = useEthUsd()
  const holders = useHolders(info)
  const [mode, setMode] = useState<'line' | 'candles'>('candles')
  const [rangeKey, setRangeKey] = useState<string>('All')
  const [tab, setTab] = useState<'trades' | 'holders'>('trades')
  const [rows, setRows] = useState(15)

  const sorted = useMemo(() => [...trades].sort((a, b) => b.ts - a.ts), [trades])
  const price = spot ?? (trades.length ? trades[trades.length - 1].price : null)
  const change = useMemo(() => {
    if (price === null || !trades.length) return null
    const asc = [...trades].sort((a, b) => a.ts - b.ts)
    const cutoff = Date.now() / 1000 - 86400
    let old = asc[0].price
    for (const t of asc) { if (t.ts <= cutoff) old = t.price; else break }
    return old > 0 ? (price / old - 1) * 100 : null
  }, [trades, price])
  const volume = trades.reduce((s, t) => s + t.eth, 0)
  const range = RANGES.find((r) => r.k === rangeKey)?.s ?? 0
  const money = (eth: number) => (usd ? `$${compact(eth * usd)}` : `${compact(eth)} ETH`)

  return (
    <main className="obrix-x-main obrix-tk">
      <a href="/explore" className="obrix-tk-back"><ArrowLeft size={14} /> Explore</a>

      {state === 'loading' && <p className="obrix-x-note">Loading token from Robinhood Chain…</p>}
      {state === 'error' && <p className="obrix-x-note">{error}</p>}

      {info && (
        <>
          <header className="obrix-tk-head">
            <div className="obrix-x-avatar">
              {info.logo ? <img src={ipfs(info.logo)} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /> : info.symbol.slice(0, 1)}
            </div>
            <div>
              <h1>{info.name} <span>${info.symbol}</span></h1>
              <p className="obrix-tk-sub">by {short(info.creator)} · launched {age(info.launchTs)} ago · ETH pair</p>
              <p className="obrix-tk-sub">{short(info.token)} <CopyBtn text={info.token} /> <a href={`${EXPLORER}/token/${info.token}`} target="_blank" rel="noreferrer" aria-label="explorer"><ArrowUpRight size={13} /></a></p>
            </div>
          </header>

          <div className="obrix-tk-price">
            <strong>{price !== null ? fmtPrice(price, usd) : '—'}</strong>
            {change !== null && <span className={change >= 0 ? 'up' : 'down'}>{change >= 0 ? '+' : ''}{change.toFixed(2)}% 24h</span>}
          </div>

          <div className="obrix-tk-controls">
            <div className="obrix-x-chips">
              <button type="button" className={mode === 'line' ? 'is-on' : ''} onClick={() => setMode('line')}>Line</button>
              <button type="button" className={mode === 'candles' ? 'is-on' : ''} onClick={() => setMode('candles')}>Candles</button>
            </div>
            <div className="obrix-x-chips">
              {RANGES.map((r) => <button key={r.k} type="button" className={rangeKey === r.k ? 'is-on' : ''} onClick={() => setRangeKey(r.k)}>{r.k}</button>)}
            </div>
          </div>

          <PriceChart trades={trades} spot={spot} range={range} startTs={info.launchTs} mode={mode} usd={usd} />

          <dl className="obrix-tk-stats">
            <div><dt>Market cap</dt><dd>{price !== null ? money(price * info.supply) : '—'}</dd></div>
            <div><dt>Holders</dt><dd>{holders ? holders.length.toLocaleString() : '…'}</dd></div>
            <div><dt>Trades</dt><dd>{trades.length.toLocaleString()}</dd></div>
            <div><dt>Supply</dt><dd>{compact(info.supply)}</dd></div>
            <div><dt>Volume</dt><dd>{money(volume)}</dd></div>
            <div><dt>Price (ETH)</dt><dd>{price !== null ? fmtPrice(price, null) : '—'}</dd></div>
          </dl>

          <dl className="obrix-x-rows">
            <div><dt>token</dt><dd>{short(info.token)} <CopyBtn text={info.token} /></dd></div>
            <div><dt>curve</dt><dd>{short(info.curve)} <CopyBtn text={info.curve} /></dd></div>
            <div><dt>launched</dt><dd>{new Date(info.launchTs * 1000).toLocaleString()}</dd></div>
          </dl>

          {(info.description || info.socials.website || info.socials.twitter || info.socials.telegram) && (
            <section className="obrix-tk-about">
              <h2>About</h2>
              {info.description && <p>{info.description}</p>}
              <div className="obrix-x-actions">
                {info.socials.website && <a href={info.socials.website} target="_blank" rel="noreferrer">Website <ArrowUpRight size={13} /></a>}
                {info.socials.twitter && <a href={info.socials.twitter} target="_blank" rel="noreferrer">X <ArrowUpRight size={13} /></a>}
                {info.socials.telegram && <a href={info.socials.telegram} target="_blank" rel="noreferrer">Telegram <ArrowUpRight size={13} /></a>}
              </div>
            </section>
          )}

          <TradeBox info={info} />

          <div className="obrix-tk-tabs">
            <button type="button" className={tab === 'trades' ? 'is-on' : ''} onClick={() => setTab('trades')}>Trades</button>
            <button type="button" className={tab === 'holders' ? 'is-on' : ''} onClick={() => setTab('holders')}>Holders</button>
            <span>{tab === 'trades' ? `${trades.length} total` : holders ? `${holders.length} total` : ''}</span>
          </div>

          {tab === 'trades' ? (
            <div className="obrix-tk-table">
              <div className="obrix-tk-tr head"><span>Side</span><span>Trader</span><span>ETH</span><span>Age</span></div>
              {sorted.slice(0, rows).map((t: Trade) => (
                <div key={t.id} className={`obrix-tk-tr ${t.side}`}>
                  <b>{t.side === 'buy' ? '↗ Buy' : '↘ Sell'}</b>
                  <span><a href={`${EXPLORER}/address/${t.who}`} target="_blank" rel="noreferrer">{short(t.who)}</a></span>
                  <span>{t.eth < 0.0001 ? t.eth.toExponential(1) : t.eth.toFixed(4)}</span>
                  <span>{age(t.ts)}</span>
                </div>
              ))}
              {!trades.length && <p className="obrix-x-note">No trades yet. Be the first.</p>}
              {rows < sorted.length && <button type="button" className="obrix-tk-more" onClick={() => setRows((r) => r + 15)}>Show more</button>}
            </div>
          ) : (
            <div className="obrix-tk-table">
              <div className="obrix-tk-tr head holders"><span>#</span><span>Holder</span><span>%</span><span>Amount</span></div>
              {(holders ?? []).slice(0, 25).map((h, i) => (
                <div key={h.address} className="obrix-tk-tr holders">
                  <span>{i + 1}</span>
                  <span><a href={`${EXPLORER}/address/${h.address}`} target="_blank" rel="noreferrer">{short(h.address)}</a>{h.address.toLowerCase() === info.curve.toLowerCase() ? ' · curve' : h.address.toLowerCase() === info.creator.toLowerCase() ? ' · creator' : ''}</span>
                  <span>{info.supply ? ((h.balance / info.supply) * 100).toFixed(2) : '0'}%</span>
                  <span>{compact(h.balance)}</span>
                </div>
              ))}
              {holders === null && <p className="obrix-x-note">Reading holders…</p>}
            </div>
          )}
          <p className="obrix-x-foot">{'// price, trades and holders are read from Robinhood Chain. market cap uses the curve price.'}</p>
        </>
      )}
    </main>
  )
}

function View() {
  const { address } = useParams<{ address: string }>()
  const sp = useSearchParams()
  const valid = /^0x[0-9a-fA-F]{40}$/.test(address ?? '')
  return (
    <div className="obrix-site obrix-paper-grid obrix-explore">
      <div className="obrix-x-ticker"><span><i /> LIVE</span><span>ROBINHOOD CHAIN</span></div>
      <div className="obrix-nav-wrap"><Navbar /></div>
      {valid
        ? <Loaded token={address as Address} curveHint={sp.get('curve')} blockHint={sp.get('block')} />
        : <main className="obrix-x-main"><a href="/explore" className="obrix-tk-back"><ArrowLeft size={14} /> Explore</a><p className="obrix-x-note">That is not a valid token address.</p></main>}
      <SiteFooter />
    </div>
  )
}

export default function TokenPage() {
  return <Suspense fallback={null}><View /></Suspense>
}
