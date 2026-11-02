'use client'

import { useState } from 'react'
import { useAccount, useReadContract, useSwitchChain } from 'wagmi'
import { parseAbi } from 'viem'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ImageUploader } from './image-uploader'
import { PONS_V2_FACTORY_ADDRESS, useLaunchToken } from '@/lib/hooks/use-launch-token'
import { robinhoodChain } from '@/lib/wagmi-config'
import { Loader2 } from 'lucide-react'
import ConnectWallet from '../ConnectWallet'
import { TransactionStatus } from './transaction-status'
import { isImpersonation, RESERVED_MESSAGE } from '@/lib/brand-guard'

interface FormState {
  tokenImage: File | null
  tokenImagePreview: string | null
  logoUri: string
  tokenName: string
  tokenSymbol: string
  description: string
  xLink: string
  telegram: string
  website: string
  developerBuy: number
  feeReceiver: string
  creatorTaxPct?: string
}

interface LaunchFormProps {
  onSubmit?: (formData: FormState) => Promise<void>
  onChange?: (formData: FormState) => void
  initial?: { tokenName?: string; tokenSymbol?: string; description?: string }
}

export function LaunchForm({ onSubmit, onChange, initial }: LaunchFormProps) {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()
  const { launchToken, isLoading, txHash, error, isConfirming, isConfirmed, receiptError } = useLaunchToken()

  const [formState, setFormState] = useState<FormState>({
    tokenImage: null,
    tokenImagePreview: null,
    logoUri: '',
    tokenName: initial?.tokenName ?? '',
    tokenSymbol: initial?.tokenSymbol ?? '',
    description: initial?.description ?? '',
    xLink: '',
    telegram: '',
    website: '',
    developerBuy: 0,
    feeReceiver: address || '',
    creatorTaxPct: '0',
  })

  const [submitMessage, setSubmitMessage] = useState('')
  const [uploadStatus, setUploadStatus] = useState('')
  const { data: maxTaxBps } = useReadContract({
    address: PONS_V2_FACTORY_ADDRESS,
    abi: parseAbi(['function maxCreatorTaxBps() view returns (uint256)']),
    functionName: 'maxCreatorTaxBps',
    chainId: robinhoodChain.id,
  })
  const maxTaxPct = maxTaxBps !== undefined ? Number(maxTaxBps) / 100 : null

  const uploadToIpfs = async (file: File) => {
    setUploadStatus('Uploading image to IPFS…')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      setFormState((s) => ({ ...s, logoUri: json.uri }))
      setUploadStatus('Image uploaded ✓')
    } catch (err) {
      setUploadStatus((err instanceof Error ? err.message : 'Upload failed'))
    }
  }

  const handleImageSelect = (file: File | null) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newState = {
          ...formState,
          tokenImage: file,
          tokenImagePreview: e.target?.result as string,
        }
        setFormState(newState)
        onChange?.(newState)
        void uploadToIpfs(file)
      }
      reader.readAsDataURL(file)
    } else {
      const newState = {
        ...formState,
        tokenImage: null,
        tokenImagePreview: null,
    logoUri: '',
      }
      setUploadStatus('')
      setFormState(newState)
      onChange?.(newState)
    }
  }

  const handleSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value.toUpperCase().slice(0, 10)
    const newState = { ...formState, tokenSymbol: value }
    setFormState(newState)
    onChange?.(newState)
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.currentTarget.value.slice(0, 500)
    const newState = { ...formState, description: value }
    setFormState(newState)
    onChange?.(newState)
  }

  const handleInputChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newState = { ...formState, [field]: e.currentTarget.value }
    setFormState(newState)
    onChange?.(newState)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMessage('')

    if (!isConnected) {
      setSubmitMessage('Please connect your wallet first')
      return
    }

    if (!formState.tokenName.trim()) {
      setSubmitMessage('Please enter a token name')
      return
    }

    if (!formState.tokenSymbol.trim()) {
      setSubmitMessage('Please enter a token symbol')
      return
    }

    if (isImpersonation(formState.tokenName, formState.tokenSymbol)) {
      setSubmitMessage(RESERVED_MESSAGE)
      return
    }

    if (!formState.logoUri) {
      setSubmitMessage(uploadStatus.startsWith('Uploading') ? 'Wait for the image upload to finish' : 'Upload a token image first')
      return
    }
    const pct = Number(formState.creatorTaxPct || '0')
    if (!isFinite(pct) || pct < 0) {
      setSubmitMessage('Creator fee must be 0 or more')
      return
    }
    if (maxTaxPct !== null && pct > maxTaxPct) {
      setSubmitMessage(`Creator fee can be at most ${maxTaxPct}%`)
      return
    }

    try {
      const logoUrl = formState.logoUri || ''

      await launchToken({
        tokenName: formState.tokenName,
        tokenSymbol: formState.tokenSymbol,
        description: formState.description,
        logoUrl,
        xLink: formState.xLink,
        telegram: formState.telegram,
        website: formState.website,
        feeReceiver: formState.feeReceiver || address || '',
        creatorTaxBps: Math.round(pct * 100),
      })
    } catch (err) {
      setSubmitMessage(err instanceof Error ? err.message : 'Transaction failed')
    }
  }

  return (
    <Card className="obrix-launch-card w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="obrix-launch-form p-6 sm:p-8 space-y-6">
        {/* Token Image */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Token Image</Label>
          <ImageUploader
            onImageSelect={handleImageSelect}
            preview={formState.tokenImagePreview || undefined}
          />
          {uploadStatus && <p className="text-xs">{uploadStatus}</p>}
        </div>

        {/* Token Name & Symbol */}
        <div className="space-y-2">
          <Label htmlFor="tokenName" className="text-sm font-medium">Token Name</Label>
          <Input id="tokenName" placeholder="Enter token name" value={formState.tokenName} onChange={handleInputChange('tokenName')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tokenSymbol" className="text-sm font-medium">Token Symbol</Label>
          <Input id="tokenSymbol" placeholder="TICKER" value={formState.tokenSymbol} onChange={handleSymbolChange} maxLength={10} className="uppercase" />
        </div>

        {/* Description, Links, dll */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="What makes your token special?" value={formState.description} onChange={handleDescriptionChange} rows={4} />
        </div>

        {/* X, Telegram, Website */}
        <div className="space-y-2">
          <Label htmlFor="xLink">X Link</Label>
          <Input id="xLink" type="url" placeholder="x.com/username" value={formState.xLink} onChange={handleInputChange('xLink')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telegram">Telegram (optional)</Label>
          <Input id="telegram" placeholder="t.me/groupname" value={formState.telegram} onChange={handleInputChange('telegram')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website (optional)</Label>
          <Input id="website" type="url" placeholder="https://yoursite.com" value={formState.website} onChange={handleInputChange('website')} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="creatorTax">Creator fee on every trade (%)</Label>
          <div className="obrix-x-chips">
            {['0', '0.5', '1', '2'].map((v) => (
              <button key={v} type="button" className={(formState.creatorTaxPct ?? '0') === v ? 'is-on' : ''} onClick={() => { const ns = { ...formState, creatorTaxPct: v }; setFormState(ns); onChange?.(ns) }}>{v}%</button>
            ))}
          </div>
          <Input id="creatorTax" type="text" inputMode="decimal" placeholder="0" value={formState.creatorTaxPct ?? '0'} onChange={(e) => { const ns = { ...formState, creatorTaxPct: e.currentTarget.value.replace(/[^0-9.]/g, '') }; setFormState(ns); onChange?.(ns) }} />
          <p className="text-xs text-zinc-500">Paid to the Fee Receiver on every buy and sell. Fixed at launch, it cannot be changed later.{maxTaxPct !== null ? ` Maximum allowed: ${maxTaxPct}%.` : ''} Pons also charges its own standard trading fee.</p>
        </div>

        {/* Fee Receiver */}
        <div className="space-y-2">
          <Label htmlFor="feeReceiver">Fee Receiver</Label>
          <Input 
            id="feeReceiver" 
            placeholder="0x..." 
            value={formState.feeReceiver || address || ''} 
            onChange={handleInputChange('feeReceiver')} 
          />
          <p className="text-xs text-muted-foreground">Wallet address to receive fees (defaults to connected wallet)</p>
        </div>

        {/* Submit Area */}
        <div className="space-y-3 pt-4">
          {!isConnected ? (
            <ConnectWallet />
          ) : chainId !== robinhoodChain.id ? (
            <Button type="button" onClick={() => switchChain({ chainId: robinhoodChain.id })} disabled={isSwitching} className="w-full obrix-button py-6 text-base">
              {isSwitching ? 'Switching network…' : 'Switch to Robinhood Chain'}
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full obrix-button text-background font-semibold py-6 text-base disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Launching...
                </>
              ) : (
                'Deploy on Pons V2'
              )}
            </Button>
          )}

          {submitMessage && <div className="text-center text-sm text-amber-300">{submitMessage}</div>}
          <TransactionStatus status={isLoading || isConfirming ? 'loading' : isConfirmed ? 'success' : error || receiptError ? 'error' : 'idle'} txHash={txHash || undefined} message={error || (receiptError instanceof Error ? receiptError.message : undefined)} />
        </div>
      </form>
    </Card>
  )
}
