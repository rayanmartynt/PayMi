'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from '@/features/admin/components/AdminSidebar'
import { AdminHeader } from '@/features/admin/components/AdminHeader'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { sidebarOpen } = useStore()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      if (user.role !== 'ADMIN') {
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

  if (!user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className={cn('transition-all duration-300', sidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}>
        <AdminHeader />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
