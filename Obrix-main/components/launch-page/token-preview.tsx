'use client'

import { ArrowUpRight } from 'lucide-react'

interface TokenPreviewProps {
  image?: string
  name: string
  symbol: string
  description: string
  xLink: string
  telegram: string
  website: string
}

const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`)

export function TokenPreview({ image, name, symbol, description, xLink, telegram, website }: TokenPreviewProps) {
  const ticker = symbol || 'TKN'
  return (
    <article className="obrix-x-card obrix-x-preview">
      <div className="obrix-x-card-head">
        <div className="obrix-x-avatar">
          {image ? <img src={image} alt={`${ticker} logo`} /> : ticker.slice(0, 1)}
        </div>
        <div className="obrix-x-card-title">
          <strong>{name || 'Your Token'}</strong>
          <span>${ticker}</span>
        </div>
        <em className="obrix-x-badge obrix-x-badge-ghost">PREVIEW</em>
      </div>

      <p className="obrix-x-desc">{description || 'Token description appears here…'}</p>

      <dl className="obrix-x-rows">
        <div><dt>contract</dt><dd>assigned on launch</dd></div>
        <div><dt>creator</dt><dd>your wallet</dd></div>
        <div><dt>network</dt><dd>Robinhood Chain</dd></div>
        <div><dt>protocol</dt><dd>Pons V2</dd></div>
      </dl>

      {(xLink || telegram || website) && (
        <div className="obrix-x-actions">
          {xLink && <a href={withProtocol(xLink)} target="_blank" rel="noreferrer">X <ArrowUpRight size={14} /></a>}
          {telegram && <a href={`https://t.me/${telegram.replace(/^(https?:\/\/)?t\.me\//, '')}`} target="_blank" rel="noreferrer">Telegram <ArrowUpRight size={14} /></a>}
          {website && <a href={withProtocol(website)} target="_blank" rel="noreferrer">Website <ArrowUpRight size={14} /></a>}
        </div>
      )}

      <p className="obrix-x-note-box">
        {'// fixed supply is minted to its bonding curve. if the curve completes, the launch graduates into a Uniswap V4 pool with locked liquidity. this preview does not estimate market cap or liquidity.'}
      </p>
    </article>
  )
}
