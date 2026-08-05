'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerSidebar } from '@/features/customer/components/CustomerSidebar'
import { CustomerHeader } from '@/features/customer/components/CustomerHeader'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen } = useStore()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (user.role !== 'CUSTOMER') {
        router.push('/dashboard')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || user.role !== 'CUSTOMER') {
    return null
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <CustomerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <CustomerHeader />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
