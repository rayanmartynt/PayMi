import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { AuthProvider } from '@/features/auth/AuthContext'
import { Toaster } from 'sonner'
import { LiveChat } from '@/components/LiveChat'
import { LiveChatProvider } from '@/contexts/LiveChatContext'

export const metadata: Metadata = {
  title: 'PayMi - Sierra Leone Payment Gateway',
  description: 'Accept payments in Sierra Leone with Orange Money, Afrimoney, and QMoney',
}

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <LiveChatProvider>
          <AuthProvider>
            <ThemeProvider>{children}</ThemeProvider>
            <Toaster position="top-right" richColors closeButton />
            <LiveChat />
          </AuthProvider>
        </LiveChatProvider>
      </body>
    </html>
  )
}
