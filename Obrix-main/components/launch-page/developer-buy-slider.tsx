'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface DeveloperBuySliderProps {
  value: number
  onChange: (value: number) => void
}

const ETH_TO_USD = 2500 // Mock conversion rate

export function DeveloperBuySlider({ value = 0, onChange }: DeveloperBuySliderProps) {
  const handleSliderChange = (newValue: number | readonly number[]) => {
    const value = typeof newValue === "number" ? newValue : newValue[0]
    if (value !== undefined) onChange(value)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = parseFloat(e.currentTarget.value) || 0
    const clamped = Math.max(0, Math.min(inputValue, 1000))
    onChange(clamped)
  }

  const numValue = typeof value === 'number' ? value : 0
  const usdValue = (numValue * ETH_TO_USD).toFixed(2)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Developer Buy</Label>
        <div className="text-sm text-muted-foreground">
          {numValue.toFixed(2)} ETH ≈ ${usdValue}
        </div>
      </div>

      <Slider
        value={[numValue]}
        onValueChange={handleSliderChange}
        min={0}
        max={1}
        step={0.001}
        className="w-full"
      />

      <div className="flex gap-2">
        <Input
          type="number"
          value={numValue}
          onChange={handleInputChange}
          placeholder="0.00"
          step="0.001"
          min="0"
          max="1000"
          className="flex-1"
        />
        <div className="flex items-center px-3 bg-card border border-input rounded-md text-sm text-muted-foreground font-medium">
          ETH
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Fully flexible amount. Slide or manually enter any amount up to 1000 ETH.
      </p>
    </div>
  )
}
