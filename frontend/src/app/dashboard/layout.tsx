'use client'

import { Sidebar } from '@/features/dashboard/components/Sidebar'
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader'
import { useStore } from '@/store/useStore'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen } = useStore()
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login')
    }
    if (!loading && isAuthenticated && user?.role !== 'MERCHANT') {
      router.replace('/customer')
    }
  }, [loading, isAuthenticated, user?.role, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
