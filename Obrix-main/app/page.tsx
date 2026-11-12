'use client'

import { Navbar } from '@/components/launch-page/navbar'

const destinations = [
  { label: 'Launch a token', href: '/launch' },
  { label: 'Explore tokens', href: '/explore' },
  { label: 'AI Agent', href: '/agent' },
  { label: 'AI Copilot', href: '/copilot' },
  { label: 'Payments', href: '/payments' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
]

export default function Home() {
  return (
    <main>
      <Navbar />
      <section aria-label="Main navigation">
        <h1>OXRIZ</h1>
        <p>On-chain token launch tools for Robinhood Chain.</p>
        <nav aria-label="Website pages">
          <ul>
            {destinations.map((destination) => (
              <li key={destination.href}>
                <a href={destination.href}>{destination.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </section>
    </main>
  )
}
