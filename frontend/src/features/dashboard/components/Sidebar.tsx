import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  Key, 
  Book, 
  FileText, 
  Settings, 
  LogOut,
  Bell,
  ShieldCheck,
  Wallet,
  BarChart3,
  TrendingUp,
  Globe,
  Code
} from 'lucide-react'
import { useStore } from '@/store/useStore'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Payments', href: '/dashboard/payments', icon: Wallet },
  { name: 'Transactions', href: '/dashboard/transactions', icon: FileText },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Settlements', href: '/dashboard/settlements', icon: Wallet },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp },
  { name: 'Developer', href: '/dashboard/developer', icon: Code },
  { name: 'API Keys', href: '/dashboard/developer/api-keys', icon: Key },
  { name: 'Webhooks', href: '/dashboard/developer/webhooks', icon: Globe },
  { name: 'API Docs', href: '/dashboard/developer/docs', icon: Book },
  { name: 'KYC', href: '/dashboard/kyc', icon: ShieldCheck },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, logout, toggleSidebar, darkMode } = useStore()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className={cn(
        'fixed left-0 top-0 z-50 h-screen w-64 border-r bg-background transition-transform duration-300 ease-in-out lg:relative lg:z-0 lg:translate-x-0',
        !sidebarOpen && '-translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center space-x-2">
                <Image
                   src={darkMode ? "/Dark mode logo.png" : "/Light mode logo.png"}
                   alt="PayMi Logo"
                   width={120}
                   height={40}
                   priority
                   className="h-10 w-auto"
                 />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PayMi
              </span>
            </div>
            <button
              className="lg:hidden"
              onClick={toggleSidebar}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
