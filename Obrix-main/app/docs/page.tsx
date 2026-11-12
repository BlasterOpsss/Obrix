'use client'

import { PageShell } from '@/components/launch-page/page-shell'
import { PONS_V2_FACTORY_ADDRESS } from '@/lib/hooks/use-launch-token'

const TOC = [
  ['overview', 'Overview'],
  ['quick-start', 'Quick start'],
  ['fields', 'Token fields'],
  ['economics', 'Fees and economics'],
  ['network', 'Network details'],
  ['images', 'Token images'],
  ['faq', 'FAQ'],
]

export default function DocsPage() {
  return (
    <PageShell>
      <p className="obrix-x-kicker">[ 02 ] DOCUMENTATION</p>
      <h1>Everything you need<br />to launch.</h1>
      <p className="obrix-x-sub">A short guide to launching a token with IGNIO on Robinhood Chain.</p>

      <nav className="obrix-x-toc">
        {TOC.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <div className="obrix-x-doc">
        <h2 id="overview">Overview</h2>
        <p>IGNIO is an interface for the Pons V2 launch contracts on Robinhood Chain. You fill in your token details, connect a wallet and sign one transaction. The token is created by the Pons V2 factory, not by IGNIO.</p>

        <h2 id="quick-start">Quick start</h2>
        <ol>
          <li>Open the <a href="/launch">Launch</a> page, .</li>
          <li>Enter the token name, ticker and description, and add an image.</li>
          <li>Connect your wallet and switch to Robinhood Chain.</li>
          <li>Press Deploy and confirm the transaction in your wallet.</li>
          <li>Find your token on the <a href="/explore">Explore</a> page once the transaction is confirmed.</li>
        </ol>

        <h2 id="fields">Token fields</h2>
        <ul>
          <li><strong>Name:</strong> the full token name. Required.</li>
          <li><strong>Symbol:</strong> the ticker, up to 10 characters, shown in capitals. Required.</li>
          <li><strong>Description:</strong> up to 500 characters.</li>
          <li><strong>Image URL:</strong> a public https:// or ipfs:// link, up to 500 characters. Required.</li>
          <li><strong>X, Telegram, Website:</strong> optional links stored with the token.</li>
          <li><strong>Fee receiver:</strong> the wallet that receives creator fees. Defaults to your connected wallet.</li>
        </ul>

        <h2 id="economics">Fees and economics</h2>
        <ul>
          <li>The launch fee is read from the factory at the moment you launch. Published Pons V2 docs currently describe 0.0005 ETH, but the live value is what you pay.</li>
          <li>IGNIO reads the current launch settings just before sending and pins them into your transaction, so the terms you saw are the terms you get.</li>
          <li>Creator tax is set to zero and buybacks are off by default.</li>
          <li>The token has a fixed supply that is minted to its bonding curve. If the curve completes, the launch graduates into a Uniswap V4 pool with locked liquidity.</li>
          <li>IGNIO does not estimate market cap or liquidity, and a developer buy is not part of the factory launch call.</li>
        </ul>

        <h2 id="network">Network details</h2>
        <ul>
          <li><strong>Network:</strong> Robinhood Chain (chain ID 4663)</li>
          <li><strong>Pons V2 factory:</strong> <code>{PONS_V2_FACTORY_ADDRESS}</code></li>
          <li><strong>Explorer:</strong> robinhoodchain.blockscout.com</li>
        </ul>

        <h2 id="images">Token images</h2>
        <p>The factory stores a link to your image, not the image itself. If image upload is set up on this site, your file is pinned to IPFS and the link is filled in for you (images up to 2 MB). Otherwise, host the image yourself and paste a public https:// or ipfs:// link.</p>

        <h2 id="faq">FAQ</h2>
        <h3>Can a launch be undone?</h3>
        <p>No. Blockchain transactions are final and the launch fee is spent. Check every detail before you sign.</p>
        <h3>Does IGNIO hold my funds?</h3>
        <p>No. Your wallet signs each transaction and IGNIO never has access to your keys.</p>
        <h3>The button says Switch to Robinhood Chain.</h3>
        <p>Your wallet is on another network. Press the button and approve the network switch in your wallet.</p>
        <h3>My token is not on Explore yet.</h3>
        <p>Wait for the transaction to confirm, then refresh. Explore reads launches straight from the chain.</p>
      </div>
    </PageShell>
  )
}
