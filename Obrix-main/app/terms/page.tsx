'use client'

import { PageShell } from '@/components/launch-page/page-shell'

// Add the address people can contact you on. Leave empty to hide it.
const CONTACT_EMAIL = ''

export default function TermsPage() {
  return (
    <PageShell>
      <p className="obrix-x-kicker">[ 07 ] LEGAL</p>
      <h1>Terms of Use</h1>
      <p className="obrix-x-sub">Last updated: October 31, 2026</p>

      <div className="obrix-x-doc">
        <h2>1. Acceptance</h2>
        <p>By using OXRIZ you agree to these terms. If you do not agree, do not use the site.</p>

        <h2>2. What OXRIZ is</h2>
        <p>OXRIZ is a software interface that helps you send transactions to the Pons V2 launch contracts on Robinhood Chain. OXRIZ does not create, own, issue, market or control the tokens launched through it, and it does not control the underlying contracts.</p>

        <h2>3. No custody</h2>
        <p>OXRIZ never holds your private keys, wallet or funds. Every transaction is signed by you in your own wallet.</p>

        <h2>4. Your responsibilities</h2>
        <ul>
          <li>You are responsible for your wallet, your keys and every transaction you sign.</li>
          <li>You are responsible for the tokens you launch, including their names, images, descriptions and links.</li>
          <li>You must follow the laws that apply to you. You may not launch tokens that are fraudulent, misleading, infringe someone else&apos;s rights or are otherwise unlawful.</li>
          <li>You must be old enough to enter a binding agreement where you live.</li>
        </ul>

        <h2>5. Launches are final</h2>
        <p>Blockchain transactions cannot be reversed. Launch fees and network fees are spent when a transaction is confirmed, and OXRIZ cannot refund them or undo a launch.</p>

        <h2>6. Risks</h2>
        <p>Digital assets are volatile and you can lose everything you put in. Smart contracts can contain bugs, and networks can fail or change. Nothing on this site is financial, legal or tax advice, and nothing here is a promise of profit.</p>

        <h2>7. Third-party services</h2>
        <p>OXRIZ relies on services it does not control, such as the Pons V2 contracts, Robinhood Chain and its RPC providers, your wallet software, IPFS pinning and, if enabled, an AI provider. Those services have their own terms and may be unavailable or change at any time.</p>

        <h2>8. No warranty</h2>
        <p>OXRIZ is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind. We do not guarantee that the site will be uninterrupted, error-free or that information shown, such as the launch fee or launch list, is complete or current.</p>

        <h2>9. Limitation of liability</h2>
        <p>To the fullest extent allowed by law, OXRIZ and its contributors are not liable for any loss or damage arising from your use of the site, including lost funds, failed or mistaken transactions, or actions of third parties.</p>

        <h2>10. Changes</h2>
        <p>We may update these terms from time to time. Continuing to use the site after a change means you accept the new terms.</p>

        {CONTACT_EMAIL && (<><h2>11. Contact</h2><p>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p></>)}
      </div>
    </PageShell>
  )
}
