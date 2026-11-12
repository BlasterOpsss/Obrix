'use client'

import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { formatEther, formatUnits, parseEther, type Address } from 'viem'
import { robinhoodChain } from '@/lib/wagmi-config'
import { ERC20_SUPPLY_ABI, PONS_CURVE_ABI } from '@/lib/abi/curve'

export interface Market {
  price: number
  marketCap: number
  progress: number
  graduated: boolean
  native: boolean
  decimals: number
}

const fmt = (n: number) =>
  !isFinite(n) ? '—' : n === 0 ? '0' : n < 0.0001 ? n.toExponential(2) : n < 1 ? n.toPrecision(3) : n.toLocaleString(undefined, { maximumFractionDigits: 2 })

// Reads live price, market cap and curve progress straight from the token's bonding curve.
export function useMarket(token: Address, curve: Address) {
  const client = usePublicClient({ chainId: robinhoodChain.id })
  const [market, setMarket] = useState<Market | null>(null)

  useEffect(() => {
    if (!client) return
    let alive = true
    const load = async () => {
      try {
        const [reserves, real, threshold, graduated, ready, native, supply, dec] = await Promise.all([
          client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'getReserves' }),
          client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'realQuoteReserve' }),
          client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'graduationThreshold' }),
          client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'graduated' }),
          client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'readyToGraduate' }),
          client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'isNativeQuote' }),
          client.readContract({ address: token, abi: ERC20_SUPPLY_ABI, functionName: 'totalSupply' }),
          client.readContract({ address: token, abi: ERC20_SUPPLY_ABI, functionName: 'decimals' }),
        ])
        const decimals = Number(dec)
        const price = Number(formatEther(reserves[0])) / Number(formatUnits(reserves[1], decimals))
        const marketCap = price * Number(formatUnits(supply, decimals))
        const progress = threshold > 0n ? Math.min(100, Number((real * 10000n) / threshold) / 100) : 0
        if (alive) setMarket({ price, marketCap, progress, graduated: graduated || ready, native, decimals })
      } catch { /* keep the last values */ }
    }
    load()
    const id = setInterval(load, 20000)
    return () => { alive = false; clearInterval(id) }
  }, [client, token, curve])

  return market
}

export function MarketStats({ market }: { market: Market | null }) {
  if (!market) return <p className="obrix-x-note">loading market data…</p>
  return (
    <div className="obrix-x-market">
      <dl className="obrix-x-rows">
        <div><dt>price</dt><dd>{fmt(market.price)} ETH</dd></div>
        <div><dt>market cap (est.)</dt><dd>{fmt(market.marketCap)} ETH</dd></div>
        <div><dt>bonding curve</dt><dd>{market.graduated ? 'graduated' : `${market.progress.toFixed(1)}% filled`}</dd></div>
      </dl>
      <div className="obrix-x-bar"><span style={{ width: `${market.graduated ? 100 : market.progress}%` }} /></div>
    </div>
  )
}

export function BuyPanel({ curve, symbol, market }: { curve: Address; symbol: string; market: Market | null }) {
  const { address, chainId, isConnected } = useAccount()
  const client = usePublicClient({ chainId: robinhoodChain.id })
  const { switchChain, isPending: switching } = useSwitchChain()
  const { writeContractAsync } = useWriteContract()

  const [amount, setAmount] = useState('0.001')
  const [slippage, setSlippage] = useState(5)
  const [quote, setQuote] = useState<bigint | null>(null)
  const [snipeTax, setSnipeTax] = useState(0n)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const receipt = useWaitForTransactionReceipt({ hash: hash ?? undefined, chainId: robinhoodChain.id, query: { enabled: Boolean(hash) } })

  let quoteIn: bigint | null = null
  try { const v = parseEther(amount || '0'); quoteIn = v > 0n ? v : null } catch { quoteIn = null }

  const canQuote = Boolean(client && address && quoteIn && market && !market.graduated && market.native && chainId === robinhoodChain.id)

  useEffect(() => {
    setQuote(null)
    setError('')
    if (!canQuote || !client || !address || !quoteIn) return
    let alive = true
    const timer = setTimeout(async () => {
      try {
        const tax = await client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'currentSnipeTaxBps', args: [address] })
        const sim = await client.simulateContract({
          address: curve, abi: PONS_CURVE_ABI, functionName: 'buy', args: [quoteIn, 0n, address], value: quoteIn, account: address,
        })
        if (alive) { setSnipeTax(tax); setQuote(sim.result) }
      } catch {
        if (alive) setError('Could not get a quote. Check your ETH balance and try a smaller amount.')
      }
    }, 500)
    return () => { alive = false; clearTimeout(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, address, chainId, curve, canQuote])

  const buy = async () => {
    if (!address || !quoteIn || quote === null) return
    setBusy(true)
    setError('')
    try {
      const minOut = (quote * BigInt(100 - slippage)) / 100n
      const h = await writeContractAsync({
        address: curve, abi: PONS_CURVE_ABI, functionName: 'buy', args: [quoteIn, minOut, address], value: quoteIn, chainId: robinhoodChain.id,
      })
      setHash(h)
    } catch (e) {
      setError(e instanceof Error ? e.message.split('\n')[0] : 'Transaction failed.')
    } finally {
      setBusy(false)
    }
  }

  if (!market) return <div className="obrix-x-buy"><p className="obrix-x-note">loading…</p></div>
  if (market.graduated) return <div className="obrix-x-buy"><p className="obrix-x-note">This token has graduated. Trading now happens in its Uniswap pool, not on the bonding curve.</p></div>
  if (!market.native) return <div className="obrix-x-buy"><p className="obrix-x-note">This launch uses a custom pair token and can&apos;t be bought here yet.</p></div>
  if (!isConnected) return <div className="obrix-x-buy"><p className="obrix-x-note">Connect your wallet (top of the page) to buy.</p></div>
  if (chainId !== robinhoodChain.id) {
    return (
      <div className="obrix-x-buy">
        <button type="button" className="obrix-x-buy-btn" disabled={switching} onClick={() => switchChain({ chainId: robinhoodChain.id })}>
          {switching ? 'Switching…' : 'Switch to Robinhood Chain'}
        </button>
      </div>
    )
  }

  const sniped = snipeTax > 0n
  return (
    <div className="obrix-x-buy">
      <label className="obrix-x-buy-label">Amount (ETH)</label>
      <input className="obrix-x-buy-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} />
      <div className="obrix-x-chips">
        {['0.001', '0.005', '0.01'].map((v) => <button key={v} type="button" onClick={() => setAmount(v)}>{v}</button>)}
      </div>
      <label className="obrix-x-buy-label">Max slippage</label>
      <div className="obrix-x-chips">
        {[1, 5, 10].map((v) => <button key={v} type="button" className={slippage === v ? 'is-on' : ''} onClick={() => setSlippage(v)}>{v}%</button>)}
      </div>
      {quote !== null && (
        <p className="obrix-x-note">
          You get about {fmt(Number(formatUnits(quote, market.decimals)))} ${symbol} · at least {fmt(Number(formatUnits((quote * BigInt(100 - slippage)) / 100n, market.decimals)))}
        </p>
      )}
      {sniped && <p className="obrix-x-warn">An early-buy tax of {(Number(snipeTax) / 100).toFixed(1)}% applies to this wallet right now. Wait a few seconds and try again.</p>}
      {error && <p className="obrix-x-warn">{error}</p>}
      <button type="button" className="obrix-x-buy-btn" disabled={busy || quote === null || sniped || receipt.isLoading} onClick={buy}>
        {busy ? 'Confirm in your wallet…' : receipt.isLoading ? 'Waiting for confirmation…' : 'Buy'}
      </button>
      {receipt.isSuccess && hash && (
        <p className="obrix-x-note">Bought ✓ <a href={`${robinhoodChain.blockExplorers.default.url}/tx/${hash}`} target="_blank" rel="noreferrer">View transaction</a></p>
      )}
      <p className="obrix-x-note">{'// real ETH. trades cannot be reversed. check the amount in your wallet before you confirm.'}</p>
    </div>
  )
}
