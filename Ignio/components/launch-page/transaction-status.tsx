'use client'

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface TransactionStatusProps {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
  txHash?: string
}

export function TransactionStatus({
  status,
  message,
  txHash,
}: TransactionStatusProps) {
  if (status === 'idle') return null

  const isSuccess = status === 'success'
  const isError = status === 'error'
  const isLoading = status === 'loading'

  const explorerUrl = txHash
    ? `https://robinhoodchain.blockscout.com/tx/${txHash}`
    : null

  return (
    <Card className="border border-primary/50 bg-gradient-to-br from-primary/10 to-secondary/10 p-4 neon-glow">
      <div className="flex gap-3">
        {isLoading && (
          <Loader2 className="h-5 w-5 text-primary animate-spin flex-shrink-0" />
        )}
        {isSuccess && (
          <CheckCircle className="h-5 w-5 text-neutral-300 flex-shrink-0" />
        )}
        {isError && (
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        )}

        <div className="flex-1">
          {isLoading && (
            <div className="space-y-1">
              <p className="font-semibold text-foreground">
                Launching Token...
              </p>
              <p className="text-sm text-muted-foreground">
                Please confirm the transaction in your wallet
              </p>
            </div>
          )}

          {isSuccess && (
            <div className="space-y-1">
              <p className="font-semibold text-neutral-300">
                Token Launched Successfully!
              </p>
              {txHash && (
                <p className="text-sm text-muted-foreground">
                  Transaction Hash:{' '}
                  <a
                    href={explorerUrl ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </a>
                </p>
              )}
              {message && (
                <p className="text-sm text-muted-foreground">{message}</p>
              )}
            </div>
          )}

          {isError && (
            <div className="space-y-1">
              <p className="font-semibold text-red-500">
                Transaction Failed
              </p>
              {message && (
                <p className="text-sm text-red-400">{message}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
