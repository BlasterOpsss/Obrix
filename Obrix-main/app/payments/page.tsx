import { PageShell } from '@/components/launch-page/page-shell'

export const dynamic = 'force-dynamic'

const NETWORKS: Record<string, string> = {
  'eip155:84532': 'Base Sepolia (test network)',
  'eip155:8453': 'Base',
  'eip155:4663': 'Robinhood Chain',
}

export default function PaymentsPage() {
  const payTo = process.env.X402_PAY_TO || ''
  const network = process.env.X402_NETWORK || 'eip155:84532'
  const price = process.env.X402_PRICE || '$0.01'
  const isTest = network === 'eip155:84532'
  const status = !payTo ? 'NOT SET UP' : isTest ? 'TEST MODE' : 'LIVE'

  return (
    <PageShell>
      <p className="obrix-x-kicker">[ 09 ] PAYMENTS</p>
      <h1>Pay per request<br />with x402.</h1>
      <p className="obrix-x-sub">
        Other apps and AI agents can use the OXRIZ launch agent without an account. They pay a small stablecoin amount per request, straight from their wallet, using the open x402 standard.
      </p>

      <p className="obrix-x-label">● ENDPOINT</p>
      <article className="obrix-x-card">
        <dl className="obrix-x-rows" style={{ marginBottom: 0 }}>
          <div><dt>status</dt><dd>{status}</dd></div>
          <div><dt>method</dt><dd>POST /api/agent/paid</dd></div>
          <div><dt>price</dt><dd>{price} per request</dd></div>
          <div><dt>launches on</dt><dd>Robinhood Chain</dd></div>
          <div><dt>payment network</dt><dd>{NETWORKS[network] || network}</dd></div>
          <div><dt>pay to</dt><dd>{payTo ? `${payTo.slice(0, 6)}…${payTo.slice(-4)}` : 'not set'}</dd></div>
        </dl>
      </article>

      <p className="obrix-x-label">● HOW IT WORKS</p>
      <div className="obrix-x-steps">
        {[
          ['01', 'Ask', 'The caller sends a normal request describing the token it wants drafted.'],
          ['02', 'Get a 402', 'The server replies HTTP 402 Payment Required with the price and where to pay.'],
          ['03', 'Pay', 'The caller signs a stablecoin payment from its wallet and sends the request again.'],
          ['04', 'Get the draft', 'The server confirms payment and returns the token name, ticker and description.'],
        ].map(([n, title, body]) => (
          <article className="obrix-x-card" key={n}>
            <div className="obrix-x-card-head">
              <div className="obrix-x-avatar">{n}</div>
              <div className="obrix-x-card-title"><strong>{title}</strong></div>
            </div>
            <p className="obrix-x-desc obrix-x-desc-full">{body}</p>
          </article>
        ))}
      </div>

      <p className="obrix-x-label">● TRY IT</p>
      <pre className="obrix-x-code">{`curl -i -X POST https://YOUR-SITE/api/agent/paid \\
  -H 'content-type: application/json' \\
  -d '{"message":"A token called Moon Cat with ticker $MCAT"}'`}</pre>
      <p className="obrix-x-note-box">
        {'// without payment you get HTTP 402 and the payment details. an x402-capable client pays automatically and retries. you are only charged when the request succeeds.'}
      </p>

      <p className="obrix-x-label">● GOOD TO KNOW</p>
      <ul className="obrix-x-list">
        <li>Payments go directly to the OXRIZ wallet. OXRIZ never holds a caller&apos;s funds or keys.</li>
        <li>{isTest ? 'This is currently a test network, so no real money moves.' : 'Payments are real stablecoin transfers and cannot be reversed.'}</li>
        <li>The agent only drafts a token. Launching still happens from a wallet on the Launch page.</li>
        <li>Learn more about the standard at <a href="https://www.x402.org" target="_blank" rel="noreferrer">x402.org</a>.</li>
      </ul>
    </PageShell>
  )
}
