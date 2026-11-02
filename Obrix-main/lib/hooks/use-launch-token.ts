'use client'

import { useState, useCallback } from 'react'
import { useAccount, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { isAddress, zeroAddress, toHex } from 'viem'
import { PONS_V2_FACTORY_ABI } from '@/lib/abi/factory'
import { robinhoodChain } from '@/lib/wagmi-config'
import { isImpersonation, RESERVED_MESSAGE } from '@/lib/brand-guard'

export const PONS_V2_FACTORY_ADDRESS = '0x7eD598BcEf8bd9Edd8C97A195C6d13f40801EC7e' as const
const NATIVE_PAIR_TOKEN = zeroAddress

export interface LaunchTokenParams {
  tokenName: string
  tokenSymbol: string
  description: string
  logoUrl: string
  xLink: string
  telegram: string
  website: string
  feeReceiver: string
  creatorTaxBps?: number
}

export function useLaunchToken() {
  const { address, chainId } = useAccount()
  const publicClient = usePublicClient({ chainId: robinhoodChain.id })
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { writeContractAsync } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({
    hash: txHash ?? undefined,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(txHash) },
  })

  const launchToken = useCallback(async (params: LaunchTokenParams) => {
    try {
      setError(null)
      setTxHash(null)
      setIsLoading(true)

      if (!address) throw new Error('Connect your wallet before launching.')
      if (chainId !== robinhoodChain.id) throw new Error('Switch your wallet to Robinhood Chain (chain ID 4663).')
      if (!publicClient) throw new Error('Robinhood Chain RPC is unavailable. Please try again.')
      if (!params.tokenName.trim()) throw new Error('Token name is required.')
      if (!params.tokenSymbol.trim()) throw new Error('Token symbol is required.')
      if (isImpersonation(params.tokenName, params.tokenSymbol)) throw new Error(RESERVED_MESSAGE)
      if (!params.logoUrl.trim()) throw new Error('Add a public HTTPS or IPFS image URI. A local image preview cannot be stored on-chain.')
      if (params.logoUrl.startsWith('data:')) throw new Error('The selected image is only a local preview. Upload it to IPFS or another public image host, then paste its HTTPS/IPFS URI.')
      if (params.logoUrl.length > 500) throw new Error('Image URI is too long. Use a short public HTTPS/IPFS URI.')

      const feeReceiver = params.feeReceiver.trim() || address
      if (!isAddress(feeReceiver)) throw new Error('Fee recipient must be a valid wallet address.')

      // Read a currently enabled config at launch time; config IDs can be disabled or changed.
      const count = await publicClient.readContract({
        address: PONS_V2_FACTORY_ADDRESS,
        abi: PONS_V2_FACTORY_ABI,
        functionName: 'launchConfigCount',
      })
      let launchConfigId: bigint | undefined
      for (let i = 0n; i < count; i++) {
        const config = await publicClient.readContract({
          address: PONS_V2_FACTORY_ADDRESS,
          abi: PONS_V2_FACTORY_ABI,
          functionName: 'getLaunchConfig',
          args: [i],
        })
        if (config.enabled) { launchConfigId = i; break }
      }
      if (launchConfigId === undefined) throw new Error('Pons V2 has no enabled launch configurations right now.')

      const [expectedEconomics, launchFee] = await Promise.all([
        publicClient.readContract({
          address: PONS_V2_FACTORY_ADDRESS,
          abi: PONS_V2_FACTORY_ABI,
          functionName: 'previewLaunchEconomics',
          args: [launchConfigId, NATIVE_PAIR_TOKEN],
        }),
        publicClient.readContract({
          address: PONS_V2_FACTORY_ADDRESS,
          abi: PONS_V2_FACTORY_ABI,
          functionName: 'launchFee',
        }),
      ])

      // First 5 bytes tag the launch as made through OxRiZ (shows up on the Explore tab); the rest stay random.
      const saltBytes = crypto.getRandomValues(new Uint8Array(32))
      saltBytes.set([0x4f, 0x58, 0x52, 0x49, 0x5a], 0)
      const salt = toHex(saltBytes)
      const hash = await writeContractAsync({
        address: PONS_V2_FACTORY_ADDRESS,
        abi: PONS_V2_FACTORY_ABI,
        functionName: 'launchToken',
        args: [{
          name: params.tokenName.trim(),
          symbol: params.tokenSymbol.trim().toUpperCase(),
          logo: params.logoUrl.trim(),
          description: params.description.trim(),
          socials: {
            twitter: params.xLink.trim(),
            telegram: params.telegram.trim(),
            discord: '',
            website: params.website.trim(),
            farcaster: '',
          },
          creatorFeeRecipient: feeReceiver,
          creatorTaxBps: params.creatorTaxBps ?? 0,
          buybackEnabled: false,
          expectedEconomics,
          salt,
        }, launchConfigId, NATIVE_PAIR_TOKEN],
        value: launchFee,
        chainId: robinhoodChain.id,
      })
      setTxHash(hash)
      return hash
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transaction failed.'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [address, chainId, publicClient, writeContractAsync])

  return { launchToken, isLoading, txHash, error, isConfirming: receipt.isLoading, isConfirmed: receipt.isSuccess, receiptError: receipt.error }
}
