'use client'

import { useEffect, useRef, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { decodeFunctionData, formatEther, formatUnits, parseAbi, toHex, type Address } from 'viem'
import { robinhoodChain } from '@/lib/wagmi-config'
import { CURVE_BUY_TOPIC, CURVE_SELL_TOPIC, PONS_CURVE_ABI } from '@/lib/abi/curve'
import { PONS_V2_FACTORY_ABI } from '@/lib/abi/factory'
import { PONS_V2_FACTORY_ADDRESS } from '@/lib/hooks/use-launch-token'

// Real TokenLaunched topic hash taken from an actual launch on Robinhood Chain.
const LAUNCH_TOPIC = '0x8d4aad4953d0ca700d468f3753aa14432d1b35b43ec6409f051fb6aa43a89607'
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const ERC20 = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
])

type Client = NonNullable<ReturnType<typeof usePublicClient>>
type RawLog = { topics: string[]; data: string; blockNumber: string; transactionHash: string; logIndex: string }
const topicAddr = (t: string) => ('0x' + t.slice(26)) as Address
const word = (d: string, i: number) => BigInt('0x' + d.slice(2 + i * 64, 2 + (i + 1) * 64))

export interface Trade { id: string; side: 'buy' | 'sell'; who: string; eth: number; tokens: number; price: number; block: bigint; ts: number }
export interface TokenInfo {
  token: Address; curve: Address; creator: string; launchBlock: bigint; launchTs: number
  name: string; symbol: string; decimals: number; supply: number
  logo: string; description: string; socials: { twitter: string; telegram: string; website: string; discord: string; farcaster: string }
}
export interface Holder { address: string; balance: number }

async function rawLogs(client: Client, address: Address, from: bigint, to: bigint, topics: unknown[]): Promise<RawLog[]> {
  const call = (f: bigint, t: bigint) =>
    client.request({ method: 'eth_getLogs', params: [{ address, fromBlock: toHex(f), toBlock: toHex(t), topics }] } as never) as unknown as Promise<RawLog[]>
  try {
    return await call(from, to)
  } catch {
    const out: RawLog[] = []
    const STEP = 100_000n
    for (let f = from; f <= to; f += STEP) {
      const t = f + STEP - 1n > to ? to : f + STEP - 1n
      try { out.push(...(await call(f, t))) } catch { /* skip a failed piece */ }
    }
    return out
  }
}

async function findLaunch(client: Client, token: Address, latest: bigint): Promise<RawLog | null> {
  const topic = '0x' + token.slice(2).toLowerCase().padStart(64, '0')
  let to = latest
  for (let i = 0; i < 120; i++) {
    const from = to > 1_000_000n ? to - 999_999n : 0n
    try {
      const r = await rawLogs(client, PONS_V2_FACTORY_ADDRESS, from, to, [LAUNCH_TOPIC, topic])
      if (r.length) return r[0]
    } catch { /* keep going */ }
    if (from === 0n) break
    to = from - 1n
  }
  return null
}

// Block numbers have no timestamp in event logs, so sample a few blocks and interpolate between them.
async function makeClock(client: Client, from: bigint, to: bigint) {
  const N = 14
  const pts: { b: number; t: number }[] = []
  const span = to > from ? to - from : 0n
  await Promise.all(
    Array.from({ length: N + 1 }, async (_, i) => {
      const b = from + (span * BigInt(i)) / BigInt(N)
      try { const blk = await client.getBlock({ blockNumber: b }); pts.push({ b: Number(b), t: Number(blk.timestamp) }) } catch { /* skip */ }
    })
  )
  pts.sort((a, b) => a.b - b.b)
  return (block: bigint) => {
    const b = Number(block)
    if (!pts.length) return Math.floor(Date.now() / 1000)
    if (b <= pts[0].b) return pts[0].t
    for (let i = 1; i < pts.length; i++) {
      if (b <= pts[i].b) {
        const a = pts[i - 1], c = pts[i]
        return a.t + ((b - a.b) / Math.max(1, c.b - a.b)) * (c.t - a.t)
      }
    }
    return pts[pts.length - 1].t
  }
}

export function useTokenPage(token: Address, hintCurve: string | null, hintBlock: string | null) {
  const client = usePublicClient({ chainId: robinhoodChain.id })
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState('')
  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [spot, setSpot] = useState<number | null>(null)
  const seen = useRef(new Set<string>())

  useEffect(() => {
    if (!client) return
    let alive = true
    let timer: ReturnType<typeof setInterval> | undefined
    seen.current = new Set()

    ;(async () => {
      try {
        const latest = await client.getBlockNumber()
        const topic = '0x' + token.slice(2).toLowerCase().padStart(64, '0')
        let launch: RawLog | null = null
        if (hintBlock && /^\d+$/.test(hintBlock)) {
          const b = BigInt(hintBlock)
          const r = await rawLogs(client, PONS_V2_FACTORY_ADDRESS, b, b, [LAUNCH_TOPIC, topic])
          launch = r[0] ?? null
        }
        if (!launch) launch = await findLaunch(client, token, latest)
        if (!launch) throw new Error('This token was not found on the factory.')
        const curve = topicAddr(launch.topics[2])
        const launchBlock = BigInt(launch.blockNumber)
        if (hintCurve && hintCurve.toLowerCase() !== curve.toLowerCase()) throw new Error('Token and curve do not match.')

        const rd = <T,>(fn: 'name' | 'symbol' | 'decimals' | 'totalSupply', fallback: T) =>
          client.readContract({ address: token, abi: ERC20, functionName: fn }).catch(() => fallback) as Promise<T>
        const [name, symbol, decimalsRaw, supplyRaw] = await Promise.all([rd<string>('name', 'Unknown'), rd<string>('symbol', '???'), rd<number>('decimals', 18), rd<bigint>('totalSupply', 0n)])
        const decimals = Number(decimalsRaw)

        let logo = '', description = ''
        let socials = { twitter: '', telegram: '', website: '', discord: '', farcaster: '' }
        try {
          const tx = (await client.request({ method: 'eth_getTransactionByHash', params: [launch.transactionHash] } as never)) as unknown as { input?: string } | null
          if (tx?.input) {
            const dec = decodeFunctionData({ abi: PONS_V2_FACTORY_ABI, data: tx.input as `0x${string}` })
            if (dec.functionName === 'launchToken') {
              const p = (dec.args as unknown as readonly Record<string, unknown>[])[0] as Record<string, unknown>
              logo = String(p.logo ?? ''); description = String(p.description ?? '')
              socials = { ...socials, ...((p.socials as typeof socials) ?? {}) }
            }
          }
        } catch { /* launched through a router: no readable details */ }

        const clock = await makeClock(client, launchBlock, latest)
        const raw = await rawLogs(client, curve, launchBlock, latest, [[CURVE_BUY_TOPIC, CURVE_SELL_TOPIC]])
        const toTrade = (l: RawLog, ts?: number): Trade | null => {
          const id = `${l.transactionHash}-${l.logIndex}`
          if (seen.current.has(id)) return null
          const buy = l.topics[0].toLowerCase() === CURVE_BUY_TOPIC.toLowerCase()
          const eth = Number(formatEther(word(l.data, buy ? 0 : 1)))
          const tokens = Number(formatUnits(word(l.data, buy ? 1 : 0), decimals))
          if (!(tokens > 0)) return null
          seen.current.add(id)
          const block = BigInt(l.blockNumber)
          return { id, side: buy ? 'buy' : 'sell', who: '0x' + l.topics[1].slice(26), eth, tokens, price: eth / tokens, block, ts: ts ?? clock(block) }
        }
        const all = raw.map((l) => toTrade(l)).filter((t): t is Trade => t !== null)
        if (!alive) return
        setInfo({
          token, curve, creator: '0x' + launch.topics[3].slice(26), launchBlock, launchTs: clock(launchBlock),
          name, symbol, decimals, supply: Number(formatUnits(supplyRaw, decimals)), logo, description, socials,
        })
        setTrades(all)
        setState('ready')

        let last = latest
        const poll = async () => {
          try {
            const head = await client.getBlockNumber()
            const fresh = (await rawLogs(client, curve, last, head, [[CURVE_BUY_TOPIC, CURVE_SELL_TOPIC]]))
              .map((l) => toTrade(l, Math.floor(Date.now() / 1000))).filter((t): t is Trade => t !== null)
            last = head
            if (alive && fresh.length) setTrades((t) => [...t, ...fresh])
            const [q, tk] = await client.readContract({ address: curve, abi: PONS_CURVE_ABI, functionName: 'getReserves' })
            const p = Number(formatEther(q)) / Number(formatUnits(tk, decimals))
            if (alive && isFinite(p)) setSpot(p)
          } catch { /* next tick */ }
        }
        poll()
        timer = setInterval(poll, 5000)
      } catch (e) {
        if (alive) { setError(e instanceof Error ? e.message : 'Could not load this token.'); setState('error') }
      }
    })()
    return () => { alive = false; if (timer) clearInterval(timer) }
  }, [client, token, hintCurve, hintBlock])

  return { state, error, info, trades, spot }
}

// Token holders, rebuilt from the token's Transfer events.
export function useHolders(info: TokenInfo | null) {
  const client = usePublicClient({ chainId: robinhoodChain.id })
  const [holders, setHolders] = useState<Holder[] | null>(null)
  useEffect(() => {
    if (!client || !info) return
    let alive = true
    ;(async () => {
      try {
        const latest = await client.getBlockNumber()
        const logs = await rawLogs(client, info.token, info.launchBlock, latest, [TRANSFER_TOPIC])
        const bal = new Map<string, bigint>()
        for (const l of logs) {
          if (l.topics.length < 3) continue
          const from = '0x' + l.topics[1].slice(26), to = '0x' + l.topics[2].slice(26), v = word(l.data, 0)
          bal.set(from, (bal.get(from) ?? 0n) - v)
          bal.set(to, (bal.get(to) ?? 0n) + v)
        }
        const zero = '0x0000000000000000000000000000000000000000'
        const list = [...bal.entries()]
          .filter(([a, v]) => v > 0n && a !== zero)
          .map(([address, v]) => ({ address, balance: Number(formatUnits(v, info.decimals)) }))
          .sort((a, b) => b.balance - a.balance)
        if (alive) setHolders(list)
      } catch { if (alive) setHolders([]) }
    })()
    return () => { alive = false }
  }, [client, info])
  return holders
}

// ETH price in dollars (optional: the page falls back to ETH if this can't be fetched).
export function useEthUsd() {
  const [usd, setUsd] = useState<number | null>(null)
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const r = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot')
        const j = await r.json()
        const v = Number(j?.data?.amount)
        if (alive && v > 0) setUsd(v)
      } catch { /* stay in ETH */ }
    }
    load()
    const id = setInterval(load, 60000)
    return () => { alive = false; clearInterval(id) }
  }, [])
  return usd
}
