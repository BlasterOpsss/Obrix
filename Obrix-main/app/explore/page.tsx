'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPublicClient, decodeFunctionData, http, parseAbi, parseAbiItem, toHex, type Address } from 'viem'
import { PONS_V2_FACTORY_ABI } from '@/lib/abi/factory'
import { ArrowRight, ArrowUpRight, Check, Copy, Search } from 'lucide-react'
import { Navbar } from '@/components/launch-page/navbar'
import { SiteFooter } from '@/components/launch-page/site-footer'
import { MarketStats, useMarket } from '@/components/explore/token-trade'
import { LivePanel } from '@/components/explore/token-live'
import { robinhoodChain } from '@/lib/wagmi-config'
import { isImpersonation } from '@/lib/brand-guard'
import { PONS_V2_FACTORY_ADDRESS } from '@/lib/hooks/use-launch-token'

// The official IGNIO token comes from NEXT_PUBLIC_IGNIO_TOKEN_ADDRESS in .env.local. Empty means "coming soon".
const OFFICIAL_TOKEN: Address | null = process.env.NEXT_PUBLIC_IGNIO_TOKEN_ADDRESS ? (process.env.NEXT_PUBLIC_IGNIO_TOKEN_ADDRESS as Address) : null
const SHOWN_LAUNCHES = 40

const EXPLORER = robinhoodChain.blockExplorers.default.url
const client = createPublicClient({ chain: robinhoodChain, transport: http(undefined, { batch: { batchSize: 10, wait: 20 } }) })
const LAUNCH_EVENT = parseAbiItem(
  'event TokenLaunched(address indexed token, address indexed curve, address indexed deployer, address pairToken)'
)
const ERC20_ABI = parseAbi(['function name() view returns (string)', 'function symbol() view returns (string)'])

interface Launch {
  token: Address
  curve: Address
  creator: Address
  block: bigint
  name: string
  symbol: string
  logo: string
}

const isOfficial = (a: string) => OFFICIAL_TOKEN !== null && a.toLowerCase() === OFFICIAL_TOKEN.toLowerCase()
const blocked = (l: Launch) => isImpersonation(l.name, l.symbol) && !isOfficial(l.token)

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

// Real TokenLaunched topic hash taken from an actual launch on Robinhood Chain.
const LAUNCH_TOPIC = '0x8d4aad4953d0ca700d468f3753aa14432d1b35b43ec6409f051fb6aa43a89607'
const topicAddr = (t: string) => ('0x' + t.slice(26)) as Address
type RawLog = { topics: string[]; blockNumber: string; transactionHash: string; logIndex: string }

async function fetchRange(fromBlock: bigint, toBlock: bigint) {
  const raw = (await client.request({
    method: 'eth_getLogs',
    params: [{ address: PONS_V2_FACTORY_ADDRESS, fromBlock: toHex(fromBlock), toBlock: toHex(toBlock), topics: [LAUNCH_TOPIC] }],
  } as never)) as unknown as RawLog[]
  return raw
    .filter((l) => l.topics.length >= 4)
    .map((l) => ({
      args: { token: topicAddr(l.topics[1]), curve: topicAddr(l.topics[2]), deployer: topicAddr(l.topics[3]) },
      blockNumber: BigInt(l.blockNumber),
      transactionHash: l.transactionHash,
      logIndex: Number(BigInt(l.logIndex)),
    }))
}

// Only tokens launched through this site are shown: our launch form puts this tag into the launch salt.
const IGNIO_TAG = '4f5852495a'
const START_BLOCK = 103_606_000n
const LEGACY_ALLOWED = ['0x00ac8318090ab86a088c4da4f05207433a6ae931'] // launched via this site before tagging existed
const viaCache = new Map<string, boolean>()

async function viaIgnio(txHash: string): Promise<boolean> {
  const hit = viaCache.get(txHash)
  if (hit !== undefined) return hit
  try {
    const tx = (await client.request({ method: 'eth_getTransactionByHash', params: [txHash] } as never)) as unknown as { input?: string } | null
    const ok = Boolean(tx?.input?.toLowerCase().includes(IGNIO_TAG))
    viaCache.set(txHash, ok)
    return ok
  } catch { return false }
}

async function onlyOurs(list: Awaited<ReturnType<typeof fetchRange>>) {
  const out: typeof list = []
  for (let i = 0; i < list.length; i += 10) {
    const part = list.slice(i, i + 10)
    const flags = await Promise.all(
      part.map((l) => (LEGACY_ALLOWED.includes((l.args.token as string).toLowerCase()) ? true : viaIgnio(l.transactionHash)))
    )
    part.forEach((l, k) => { if (flags[k]) out.push(l) })
  }
  return out
}

// The token image is stored in the launch transaction, so read it from there.
const logoCache = new Map<string, string>()
async function logoFor(txHash: string): Promise<string> {
  const hit = logoCache.get(txHash)
  if (hit !== undefined) return hit
  let logo = ''
  try {
    const tx = (await client.request({ method: 'eth_getTransactionByHash', params: [txHash] } as never)) as unknown as { input?: string } | null
    if (tx?.input) {
      const d = decodeFunctionData({ abi: PONS_V2_FACTORY_ABI, data: tx.input as `0x${string}` })
      if (d.functionName === 'launchToken') logo = String((d.args as unknown as Record<string, unknown>[])[0]?.logo ?? '')
    }
  } catch { /* launched through a router: no readable image */ }
  logoCache.set(txHash, logo)
  return logo
}

async function loadLaunches(): Promise<Launch[]> {
  const latest = await client.getBlockNumber()
  // FAST-SCAN: read backwards in big chunks and stop once there are enough launches.
  let logs: Awaited<ReturnType<typeof fetchRange>> = []
  const STEP = 1_000_000n
  let to = latest
  for (let i = 0; i < 120; i++) {
    let from = to > STEP ? to - STEP + 1n : 0n
    if (from < START_BLOCK) from = START_BLOCK
    try {
      logs = [...(await fetchRange(from, to)), ...logs]
    } catch {
      const SUB = 100_000n
      let t = to
      while (t >= from) {
        const f = t - SUB + 1n > from ? t - SUB + 1n : from
        try { logs = [...(await fetchRange(f, t)), ...logs] } catch { /* skip */ }
        if (f === from) break
        t = f - 1n
      }
    }
    if (from <= START_BLOCK) break
    to = from - 1n
  }
  logs.sort((x, y) => ((x.blockNumber ?? 0n) < (y.blockNumber ?? 0n) ? -1 : 1))
  logs = await onlyOurs(logs)

  // Newest launches, plus the official token even if it is older.
  const recent = logs.slice(-SHOWN_LAUNCHES)
  const official = logs.find((l) => isOfficial(l.args.token as string))
  if (official && !recent.includes(official)) recent.push(official)

  return Promise.all(
    recent.map(async (log) => {
      const token = log.args.token as Address
      const [name, symbol, logo] = await Promise.all([
        client.readContract({ address: token, abi: ERC20_ABI, functionName: 'name' }).catch(() => 'Unknown'),
        client.readContract({ address: token, abi: ERC20_ABI, functionName: 'symbol' }).catch(() => '???'),
        logoFor(log.transactionHash),
      ])
      return { token, curve: log.args.curve as Address, creator: log.args.deployer as Address, block: log.blockNumber ?? 0n, name, symbol, logo }
    })
  )
}

function Logo({ src, letter }: { src: string; letter: string }) {
  const [bad, setBad] = useState(false)
  const url = src.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${src.slice(7)}` : src
  return /^https?:\/\//.test(url) && !bad ? <img src={url} alt="" onError={() => setBad(true)} /> : <>{letter}</>
}

function TokenCard({ t, official }: { t: Launch; official?: boolean }) {
  const [copied, setCopied] = useState(false)
  const [buying, setBuying] = useState(false)
  const market = useMarket(t.token, t.curve)
  const copy = async () => {
    try { await navigator.clipboard.writeText(t.token) } catch { /* ignore */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <article className={`obrix-x-card ${official ? 'is-official' : ''}`}>
      <a className="obrix-x-card-head" href={`/token/${t.token}?curve=${t.curve}&block=${t.block.toString()}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={`obrix-x-avatar ${official ? 'is-token' : ''}`}>{official ? <img src="/ignio-token.svg" alt="" /> : <Logo src={t.logo} letter={t.symbol.slice(0, 1) || '?'} />}</div>
        <div className="obrix-x-card-title">
          <strong>{t.name}</strong>
          <span>${t.symbol}</span>
        </div>
        {official && <em className="obrix-x-badge">OFFICIAL</em>}
      </a>

      <MarketStats market={market} />

      <dl className="obrix-x-rows">
        <div><dt>contract</dt><dd>{short(t.token)}</dd></div>
        <div><dt>creator</dt><dd>{short(t.creator)}</dd></div>
        <div><dt>network</dt><dd>Robinhood Chain</dd></div>
      </dl>
      <div className="obrix-x-actions">
        <a className="obrix-x-primary" href={`/token/${t.token}?curve=${t.curve}&block=${t.block.toString()}`}>Trade</a>
        <a href={`${EXPLORER}/token/${t.token}`} target="_blank" rel="noreferrer">Explorer <ArrowUpRight size={14} /></a>
        <button type="button" onClick={copy}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy contract'}
        </button>
      </div>
      {buying && <LivePanel token={t.token} curve={t.curve} symbol={t.symbol} market={market} fromBlock={t.block} />}
    </article>
  )
}

export default function ExplorePage() {
  const [launches, setLaunches] = useState<Launch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [block, setBlock] = useState<bigint | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    let alive = true
    loadLaunches()
      .then((l) => alive && setLaunches(l))
      .catch(() => alive && setError('Could not read launches from Robinhood Chain. Please try again.'))
      .finally(() => alive && setLoading(false))
    const tick = () => client.getBlockNumber().then((b) => alive && setBlock(b)).catch(() => {})
    tick()
    const id = setInterval(tick, 15000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  const official = useMemo(() => (OFFICIAL_TOKEN ? launches.find((l) => isOfficial(l.token)) ?? null : null), [launches])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = launches
      .filter((l) => !blocked(l) && !isOfficial(l.token))
      .filter((l) => !q || l.name.toLowerCase().includes(q) || l.symbol.toLowerCase().includes(q) || l.token.toLowerCase().includes(q))
    const sorted = [...list]
    if (sort === 'newest') sorted.sort((a, b) => (a.block < b.block ? 1 : -1))
    if (sort === 'oldest') sorted.sort((a, b) => (a.block > b.block ? 1 : -1))
    if (sort === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'symbol') sorted.sort((a, b) => a.symbol.localeCompare(b.symbol))
    return sorted
  }, [launches, query, sort])

  return (
    <div className="obrix-site obrix-paper-grid obrix-explore obrix-interior-theme">
      <div className="obrix-x-ticker">
        <span><i /> LIVE</span>
        <span>BLOCK #{block ? block.toString() : '…'}</span>
      </div>
      <div className="obrix-nav-wrap"><Navbar /></div>

      <main className="obrix-x-main">
        <p className="obrix-x-kicker">[ 04 ] EXPLORE</p>
        <h1>Every token born<br />through Ignio.</h1>
        <p className="obrix-x-sub">Tokens launched through Ignio appear here automatically, the moment they go live.</p>

        <label className="obrix-x-search">
          <Search size={16} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="search name, ticker, or contract…" />
        </label>
        <select className="obrix-x-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort tokens">
          <option value="newest">--sort newest</option>
          <option value="oldest">--sort oldest</option>
          <option value="name">--sort name</option>
          <option value="symbol">--sort ticker</option>
        </select>

        <section>
          <p className="obrix-x-label">● OFFICIAL TOKEN</p>
          {official ? (
            <TokenCard t={official} official />
          ) : OFFICIAL_TOKEN ? (
            <p className="obrix-x-note">{loading ? 'Loading the official token…' : 'The official token was not found among the factory launches. Check NEXT_PUBLIC_IGNIO_TOKEN_ADDRESS.'}</p>
          ) : (
            <article className="obrix-x-card is-official">
              <div className="obrix-x-card-head">
                <div className="obrix-x-avatar is-token"><img src="/ignio-token.svg" alt="IGNIO token" /></div>
                <div className="obrix-x-card-title"><strong>Ignio</strong><span>$IGNIO</span></div>
                <em className="obrix-x-badge">COMING SOON</em>
              </div>
              <p className="obrix-x-desc obrix-x-desc-full" style={{ marginBottom: 16 }}>
                The official $IGNIO token is coming soon. It has not launched yet, so any token using the name IGNIO is not ours.
              </p>
              <dl className="obrix-x-rows" style={{ marginBottom: 0 }}>
                <div><dt>contract</dt><dd>not launched yet</dd></div>
                <div><dt>network</dt><dd>Robinhood Chain</dd></div>
              </dl>
            </article>
          )}
        </section>

        <section>
          <p className="obrix-x-label">● COMMUNITY LAUNCHES {!loading && `(${shown.length})`}</p>
          {loading && <p className="obrix-x-note">Reading launches from Robinhood Chain…</p>}
          {error && <p className="obrix-x-note">{error}</p>}
          {!loading && !error && shown.length === 0 && (
            <div className="obrix-x-empty">
              <pre>{`  .-------.\n / ? ? ? \\\n|  [_____]  |\n \\_________/`}</pre>
              <p>{launches.length ? 'No tokens match your search.' : 'No community launches yet. The first token launched through Ignio will appear here.'}</p>
              <a href="/launch">Launch the first one <ArrowRight size={16} /></a>
            </div>
          )}
          <div className="obrix-x-grid">
            {shown.map((t) => <TokenCard key={t.token} t={t} />)}
          </div>
        </section>

        <p className="obrix-x-foot">{'// every token launched through ignio · read from Robinhood Chain'}</p>
      </main>
      <SiteFooter />
    </div>
  )
}
