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
  }, [loading, isAuthenticated, router])

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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn('transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}>
        <DashboardHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
