'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/store/useStore'
import Image from 'next/image'
import { 
  Home, 
  History, 
  Send, 
  ArrowLeftRight, 
  Wallet, 
  User, 
  Shield, 
  Bell, 
  MessageSquare, 
  HelpCircle,
  LogOut,
  DollarSign,
  Users
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/customer' },
  { icon: History, label: 'Payment History', href: '/customer/payments' },
  { icon: Send, label: 'Transfer Money', href: '/customer/transfer' },
  { icon: DollarSign, label: 'Request Money', href: '/customer/request-money' },
  { icon: Wallet, label: 'Add Funds', href: '/customer/add-funds' },
  { icon: ArrowLeftRight, label: 'Transfers', href: '/customer/transfers' },
  { icon: Users, label: 'Friends', href: '/customer/friends' },
  { icon: User, label: 'Profile', href: '/customer/profile' },
  { icon: Shield, label: 'Security', href: '/customer/security' },
  { icon: Bell, label: 'Notifications', href: '/customer/notifications' },
  { icon: HelpCircle, label: 'FAQ', href: '/customer/faq' },
]

export function CustomerSidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, logout, darkMode } = useStore()

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-card border-r transition-transform duration-300 lg:translate-x-0 lg:static lg:z-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b px-6">
              <Link href="/customer" className="flex items-center space-x-2">
                <div className="flex items-center gap-3">
                  <Image
                    src={darkMode ? "/Dark mode logo.png" : "/Light mode logo.png"}
                    alt="PayMi Logo"
                    width={120}
                    height={40}
                    priority
                    className="h-10 w-auto"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  PayMi
                </span>
              </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      toggleSidebar()
                    }
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="border-t px-3 py-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
