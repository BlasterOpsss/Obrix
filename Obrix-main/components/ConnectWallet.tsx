'use client'

import { useAccount, useConnect, useSwitchChain, useDisconnect } from 'wagmi'
import { Button } from '@/components/ui/button'
import { robinhoodChain } from '@/lib/wagmi-config'

export default function ConnectWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { disconnect } = useDisconnect()

  if (isConnected) {
    return (
      <div className="w-full space-y-3">
        <p className="text-center text-sm text-zinc-400">
          Connected: <span className="font-mono text-white">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
        </p>
        {chain?.id !== robinhoodChain.id && (
          <Button onClick={() => switchChain({ chainId: robinhoodChain.id })} disabled={isSwitching} className="w-full obrix-button">
            {isSwitching ? 'Switching network…' : 'Switch to Robinhood Chain'}
          </Button>
        )}
        <Button onClick={() => disconnect()} variant="outline" className="w-full border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.07]">
          Disconnect wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      {connectors.map((connector) => (
        <Button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="w-full border border-white/10 bg-white/[0.04] py-5 text-white hover:bg-white/[0.08]"
          variant="outline"
        >
          {isPending ? 'Connecting…' : `Connect ${connector.name}`}
        </Button>
      ))}
    </div>
  )
}
