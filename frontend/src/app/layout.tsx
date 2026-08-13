import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/features/auth/AuthContext'
import { Toaster } from 'sonner'
import { LiveChat } from '@/components/LiveChat'
import { LiveChatProvider } from '@/contexts/LiveChatContext'
import { SocketProvider } from '@/contexts/SocketContext'

export const metadata: Metadata = {
  title: 'PayMi - Sierra Leone Payment Gateway',
  description: 'Accept payments in Sierra Leone with Orange Money, Afrimoney, and QMoney',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <AuthProvider>
          <SocketProvider>
            <LiveChatProvider>
              <ThemeProvider>{children}</ThemeProvider>
              <Toaster position="top-right" richColors closeButton />
              <LiveChat />
            </LiveChatProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
