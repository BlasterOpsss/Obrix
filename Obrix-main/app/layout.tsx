import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { RainbowKitProviderWrapper } from '@/components/providers/rainbow-kit-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'OXRIZ — Token Launch Infrastructure',
  description: 'Launch tokens through Pons V2 on Robinhood Chain with OXRIZ.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#08090b' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('obrix-theme');document.documentElement.dataset.obrixTheme=(t==='night')?'night':'paper'}catch(e){document.documentElement.dataset.obrixTheme='paper'}",
          }}
        />
      </head>
      <body className="antialiased">
        <RainbowKitProviderWrapper>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </RainbowKitProviderWrapper>
      </body>
    </html>
  )
}
