'use client'

import { useState, useRef } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploaderProps {
  onImageSelect: (file: File) => void
  preview?: string
}

export function ImageUploader({ onImageSelect, preview }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        onImageSelect(file)
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      onImageSelect(files[0])
    }
  }

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onImageSelect(null as any)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Token preview"
            className="h-32 w-32 rounded-full object-cover border-2 border-primary/50"
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive p-0 hover:bg-destructive/90"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'w-full max-w-sm rounded-lg border-2 border-dashed border-primary/30 p-8 text-center transition-all cursor-pointer hover:border-primary/50 hover:bg-primary/5',
            isDragging && 'border-primary/80 bg-primary/10'
          )}
        >
          <Upload className="mx-auto h-8 w-8 text-primary/70 mb-3" />
          <p className="font-semibold text-foreground mb-1">Drag & drop your token image</p>
          <p className="text-sm text-muted-foreground">or click to select a file</p>
          <p className="text-xs text-muted-foreground/70 mt-2">PNG, JPG, or GIF (max 10MB)</p>
        </div>
      )}
    </div>
  )
}
