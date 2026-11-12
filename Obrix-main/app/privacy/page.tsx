'use client'

import { PageShell } from '@/components/launch-page/page-shell'

// Add the address people can contact you on. Leave empty to hide it.
const CONTACT_EMAIL = ''

export default function PrivacyPage() {
  return (
    <PageShell>
      <p className="obrix-x-kicker">[ 08 ] LEGAL</p>
      <h1>Privacy Policy</h1>
      <p className="obrix-x-sub">Last updated: October 31, 2026</p>

      <div className="obrix-x-doc">
        <h2>What we collect</h2>
        <p>IGNIO has no accounts and does not ask for your name or email. When you connect a wallet, your browser reads your public wallet address so the site can show it and fill in the fee receiver. We do not store it on our servers.</p>

        <h2>On-chain data is public</h2>
        <p>Transactions you send, and the token details you launch, are written to a public blockchain. Anyone can see them and they cannot be erased.</p>

        <h2>Information handled by the site</h2>
        <ul>
          <li><strong>Usage statistics:</strong> in the live version, the site may use Vercel Analytics for aggregate page-view counts.</li>
          <li><strong>Hosting logs:</strong> our hosting provider may keep standard server logs, such as IP address and browser type, for security and reliability.</li>
          <li><strong>Cookies:</strong> IGNIO itself does not set tracking cookies.</li>
        </ul>

        <h2>Third parties you may interact with</h2>
        <ul>
          <li><strong>Blockchain RPC:</strong> your browser talks to the Robinhood Chain RPC to read data and send transactions, so that provider can see your IP address and requests.</li>
          <li><strong>Wallets and WalletConnect:</strong> if you connect with WalletConnect, that service handles the connection under its own policy.</li>
          <li><strong>Image upload:</strong> if you upload a token image, the file is sent through our server to an IPFS pinning service. IPFS content is public and may be impossible to remove.</li>
          <li><strong>AI agent:</strong> if the agent is enabled, the text you type is sent to an AI provider to draft your token. Do not enter private information.</li>
        </ul>

        <h2>Your choices</h2>
        <p>You can use IGNIO without uploading an image or using the agent. You can disconnect your wallet at any time from the site or from your wallet.</p>

        <h2>Children</h2>
        <p>IGNIO is not meant for people under 18 and we do not knowingly collect information from them.</p>

        <h2>Changes</h2>
        <p>We may update this policy and will change the date above when we do.</p>

        {CONTACT_EMAIL && (<><h2>Contact</h2><p>Privacy questions: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></>)}
      </div>
    </PageShell>
  )
}
