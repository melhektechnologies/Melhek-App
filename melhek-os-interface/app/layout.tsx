import type { Viewport, Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })


export const viewport: Viewport = {
  themeColor: '#010133',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Melhek OS — Internal Productivity System',
  description: 'Melhek Technologies internal operating system — tasks, projects, and AI assistant.',
  manifest: '/manifest.ts',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Melhek OS',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--melhek-bg-2)',
              border: '1px solid rgba(0,128,255,0.2)',
              color: 'var(--melhek-text-primary)',
            },
          }}
        />
      </body>
    </html>
  )
}
