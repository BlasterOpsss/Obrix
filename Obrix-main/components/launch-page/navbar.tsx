'use client'

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Wallet, LogOut, Menu, X } from 'lucide-react'
import { robinhoodChain } from '@/lib/wagmi-config'

export function Navbar() {
  const { address, isConnected, chainId } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [menuOpen, setMenuOpen] = useState(false)
  const handleConnect = () => {
    const connector = connectors[0]
    if (connector) connect({ connector })
  }

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Launch', href: '/launch' },
    { label: 'Explore', href: '/explore' },
    { label: 'How it works', href: '/how-it-works' },
    { label: 'About', href: '/about' },
  ]

  return (
    <header className="obrix-nav-shell">
      <nav className="obrix-nav">
        <a href="/" className="obrix-brand" aria-label="OXRIZ home">
          <span className="obrix-brand-mark"><img src="/logo.svg" alt="" width={26} height={26} /></span>
          <span>OXRIZ</span>
        </a>

        <div className="obrix-desktop-links">
          {links.map((link) => (
            <a key={link.label} href={link.href}>{link.label}</a>
          ))}
        </div>

        <div className="obrix-nav-actions">
{isConnected && address ? (
            <div className="obrix-wallet-actions">
              {chainId !== robinhoodChain.id && (
                <span className="obrix-network-warning">Wrong network</span>
              )}
              <span className="obrix-wallet-address">{formatAddress(address)}</span>
              <Button
                variant="outline"
                size="sm"
                className="obrix-wallet-button"
                onClick={() => disconnect()}
              >
                <LogOut size={15} />
                <span className="obrix-button-label">Disconnect</span>
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              className="obrix-wallet-button"
              onClick={handleConnect}
            >
              <Wallet size={16} />
              <span>Connect Wallet</span>
            </Button>
          )}

          <button
            type="button"
            className="obrix-menu-toggle"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="obrix-mobile-menu">
          {links.map((link, index) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMenuOpen(false)}
            >
              <span className="obrix-menu-number">0{index + 1}</span>
              <span>{link.label}</span>
              <span className="obrix-menu-arrow">↗</span>
            </a>
          ))}
</div>
      )}
    </header>
  )
}
