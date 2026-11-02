'use client'

import { useMemo } from 'react'
import type { Trade } from '@/lib/token-data'

export const RANGES = [
  { k: '5m', s: 300 }, { k: '1h', s: 3600 }, { k: '6h', s: 21600 }, { k: '24h', s: 86400 }, { k: '7D', s: 604800 }, { k: 'All', s: 0 },
] as const

interface Candle { t: number; o: number; h: number; l: number; c: number; v: number }

export function fmtPrice(v: number, usd: number | null) {
  const x = usd ? v * usd : v
  const pre = usd ? '$' : ''
  const suf = usd ? '' : ' ETH'
  if (!isFinite(x)) return '—'
  if (x === 0) return `${pre}0${suf}`
  if (x >= 1000) return `${pre}${x.toLocaleString(undefined, { maximumFractionDigits: 0 })}${suf}`
  if (x >= 1) return `${pre}${x.toFixed(2)}${suf}`
  if (x >= 0.01) return `${pre}${x.toFixed(4)}${suf}`
  if (x >= 0.0001) return `${pre}${x.toPrecision(2)}${suf}`
  return `${pre}${x.toExponential(2)}${suf}`
}

export function buildCandles(trades: Trade[], spot: number | null, range: number, startTs: number, buckets = 48): Candle[] {
  const now = Math.floor(Date.now() / 1000)
  const winStart = range > 0 ? now - range : Math.min(startTs, now - 300)
  const step = (now - winStart) / buckets
  const sorted = [...trades].sort((a, b) => a.ts - b.ts)
  let prev = sorted.length ? sorted[0].price : spot ?? 0
  for (const t of sorted) { if (t.ts < winStart) prev = t.price; else break }
  const out: Candle[] = []
  for (let i = 0; i < buckets; i++) {
    const a = winStart + i * step, b = a + step
    const inb = sorted.filter((t) => t.ts >= a && (i === buckets - 1 ? t.ts <= b + 1 : t.ts < b))
    if (!inb.length) { out.push({ t: a, o: prev, h: prev, l: prev, c: prev, v: 0 }); continue }
    const ps = inb.map((t) => t.price)
    const c = inb[inb.length - 1].price
    out.push({ t: a, o: prev, h: Math.max(prev, ...ps), l: Math.min(prev, ...ps), c, v: inb.reduce((s, t) => s + t.eth, 0) })
    prev = c
  }
  if (spot && out.length) { const last = out[out.length - 1]; last.c = spot; last.h = Math.max(last.h, spot); last.l = Math.min(last.l, spot) }
  return out
}

export function PriceChart({ trades, spot, range, startTs, mode, usd }: {
  trades: Trade[]; spot: number | null; range: number; startTs: number; mode: 'line' | 'candles'; usd: number | null
}) {
  const candles = useMemo(() => buildCandles(trades, spot, range, startTs), [trades, spot, range, startTs])
  const W = 360, H = 250, PW = 296, PH = 175, VY = 190, VH = 46
  const hi0 = Math.max(...candles.map((c) => c.h)), lo0 = Math.min(...candles.map((c) => c.l))
  const pad = (hi0 - lo0 || hi0 * 0.1 || 1) * 0.15
  const hi = hi0 + pad, lo = Math.max(0, lo0 - pad)
  const y = (v: number) => 6 + (1 - (v - lo) / (hi - lo || 1)) * (PH - 12)
  const n = candles.length, cw = PW / n
  const x = (i: number) => i * cw + cw / 2
  const vmax = Math.max(...candles.map((c) => c.v), 1e-18)
  const ticks = [0, 1, 2, 3, 4].map((i) => lo + ((hi - lo) * (4 - i)) / 4)
  const last = candles[n - 1]
  const up = last.c >= candles[0].o

  let line = `M${x(0)},${y(candles[0].c)}`
  for (let i = 1; i < n; i++) line += ` L${x(i)},${y(candles[i].c)}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="obrix-tk-chart" role="img" aria-label="price chart">
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1="0" x2={PW} y1={y(t)} y2={y(t)} className="obrix-tk-grid" />
          <text x={PW + 6} y={y(t) + 3} className="obrix-tk-axis">{fmtPrice(t, usd).replace(' ETH', '')}</text>
        </g>
      ))}
      {mode === 'line' ? (
        <>
          <path d={`${line} L${x(n - 1)},${PH} L${x(0)},${PH} Z`} className="obrix-tk-area" />
          <path d={line} className="obrix-tk-line" />
        </>
      ) : (
        candles.map((c, i) => {
          const g = c.c >= c.o
          return (
            <g key={i} className={g ? 'obrix-tk-up' : 'obrix-tk-down'}>
              <line x1={x(i)} x2={x(i)} y1={y(c.h)} y2={y(c.l)} />
              <rect x={x(i) - cw * 0.3} width={cw * 0.6} y={Math.min(y(c.o), y(c.c))} height={Math.max(1.5, Math.abs(y(c.o) - y(c.c)))} />
            </g>
          )
        })
      )}
      <line x1="0" x2={PW} y1={y(last.c)} y2={y(last.c)} className="obrix-tk-last" />
      <rect x={PW + 2} y={y(last.c) - 8} width={W - PW - 2} height="16" rx="3" className={up ? 'obrix-tk-tag up' : 'obrix-tk-tag down'} />
      <text x={PW + 5} y={y(last.c) + 3.5} className="obrix-tk-tagtext">{fmtPrice(last.c, usd).replace(' ETH', '')}</text>
      {candles.map((c, i) => (
        <rect key={i} x={x(i) - cw * 0.3} width={cw * 0.6} y={VY + VH - (c.v / vmax) * VH} height={(c.v / vmax) * VH} className={c.c >= c.o ? 'obrix-tk-vol up' : 'obrix-tk-vol down'} />
      ))}
    </svg>
  )
}
