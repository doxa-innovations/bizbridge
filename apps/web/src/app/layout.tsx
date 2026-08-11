import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Noto_Sans_Ethiopic } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { CurrencyProvider } from '@/components/providers/currency-provider'
import { PageTracker } from '@/components/page-tracker'
import { Toaster } from 'sonner'
import './globals.css'

const notoEthiopic = Noto_Sans_Ethiopic({
  subsets: ['ethiopic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ethiopic',
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  title: {
    default: 'BizBridge Ethiopia — open a business without the guesswork',
    template: '%s · BizBridge Ethiopia',
  },
  description:
    'Every MOR sector, every fee, every ministry approval. A free, independent guide to opening a business in Ethiopia — with cost estimates, an eTrade link-out, and a one-off consult when you want a second pair of eyes.',
  metadataBase: new URL(APP_URL),
  applicationName: 'BizBridge Ethiopia',
  authors: [{ name: '@cherireal7', url: 'https://t.me/Cherireal7' }],
  creator: '@cherireal7',
  publisher: 'BizBridge (independent project)',
  keywords: [
    'Ethiopia',
    'Bishoftu',
    'Debrezeit',
    'Addis Ababa',
    'business setup Ethiopia',
    'MOR Directive 17/2011',
    'trade license',
    'PLC Ethiopia',
    'eTrade Ethiopia',
    'ministry of trade',
    'company registration Ethiopia',
    'sole proprietorship Ethiopia',
  ],
  formatDetection: { telephone: false },
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    type: 'website',
    title: 'BizBridge Ethiopia — open a business without the guesswork',
    description:
      'Every MOR sector, every fee, every ministry approval. Free, independent, no middlemen.',
    siteName: 'BizBridge Ethiopia',
    url: APP_URL,
    locale: 'en_US',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'BizBridge Ethiopia — a free guide to opening a business',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BizBridge Ethiopia',
    description:
      'Every MOR sector, every fee, every ministry approval. Free, independent, no middlemen.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0E100E' },
    { media: '(prefers-color-scheme: light)', color: '#F5F2E8' },
  ],
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BizBridge Ethiopia',
  url: APP_URL,
  description:
    'Independent civic-tech project providing a free guide to opening a business in Ethiopia — 519 MOR sectors, real fees, ministry approvals, and a consult booking.',
  founder: { '@type': 'Person', name: '@cherireal7', url: 'https://t.me/Cherireal7' },
  areaServed: [
    { '@type': 'Country', name: 'Ethiopia' },
    { '@type': 'AdministrativeArea', name: 'Oromia Region' },
  ],
  knowsAbout: [
    'Ministry of Revenue Directive 17/2011',
    'Ethiopian Commercial Code (Proc. 1243/2021)',
    'Company registration in Ethiopia',
    'MOR sector codes',
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${notoEthiopic.variable}`}
      style={
        {
          ['--font-sans' as string]: GeistSans.style.fontFamily,
          ['--font-mono' as string]: GeistMono.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider defaultTheme="dark">
          <CurrencyProvider>
            {children}
            <Toaster position="bottom-right" theme="dark" richColors closeButton />
            {/* Product analytics beacon — fires on every route change,
                writes to page_events in Neon via /api/track. Wrapped
                in Suspense because it uses useSearchParams, which
                needs a boundary under Next 15's static prerender. */}
            <Suspense fallback={null}>
              <PageTracker />
            </Suspense>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
