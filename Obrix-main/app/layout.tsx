import type { Metadata, Viewport } from 'next'
import { RainbowKitProviderWrapper } from '@/components/providers/rainbow-kit-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pons V2 Token Launcher',
  description: 'Create and deploy tokens through the Pons V2 factory on Robinhood Chain.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#090909',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <RainbowKitProviderWrapper>{children}</RainbowKitProviderWrapper>
      </body>
    </html>
  )
}
