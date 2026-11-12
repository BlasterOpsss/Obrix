import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { RainbowKitProviderWrapper } from '@/components/providers/rainbow-kit-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'IGNIO — Token Launch Infrastructure',
  description: 'Launch tokens through Pons V2 on Robinhood Chain with IGNIO.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/ignio-logo.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <RainbowKitProviderWrapper>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </RainbowKitProviderWrapper>
      </body>
    </html>
  )
}
