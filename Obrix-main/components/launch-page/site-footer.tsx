export function SiteFooter() {
  return (
    <footer className="obrix-sf">
      <div className="obrix-sf-word" aria-hidden="true">OXRIZ</div>
      <div className="obrix-sf-inner">
        <a href="/" className="obrix-sf-brand" aria-label="OXRIZ home">
          <img src="/logo.svg" alt="" width={34} height={34} />
          <span>OXRIZ</span>
        </a>
        <p className="obrix-sf-about">
          Token launches for Robinhood Chain. Describe your token, preview it, then deploy through Pons V2 straight from your own wallet.
        </p>

        <h4>PRODUCT</h4>
        <nav className="obrix-sf-links">
          <a href="/launch">Launch a token</a>
          <a href="/explore">Explore launches</a>
          <a href="/docs">Documentation</a>
          <a href="/how-it-works">How it works</a>
          <a href="/about">About</a>
          <a href="/terms">Terms of Use</a>
          <a href="/privacy">Privacy Policy</a>
        </nav>

        <h4>THE SAME WALLET</h4>
        <p className="obrix-sf-about">
          Every launch is signed by your own wallet, and the fee recipient defaults to that same wallet. OXRIZ never holds your keys or your funds, so check which wallet is connected before you deploy.
        </p>

        <p className="obrix-sf-copy">© 2026 OXRIZ // built for Robinhood Chain</p>
      </div>
    </footer>
  )
}
