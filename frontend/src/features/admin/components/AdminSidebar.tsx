import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/useStore'
import Image from 'next/image'
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  AlertTriangle, 
  FileText, 
  ShieldCheck,
  Settings,
  LogOut,
  Bell,
  Activity,
  BarChart3,
  UserCog,
  DollarSign
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Merchants', href: '/admin/merchants', icon: Users },
  { name: 'Transactions', href: '/admin/transactions', icon: Wallet },
  { name: 'Withdrawals', href: '/admin/withdrawals', icon: Wallet },
  { name: 'Fee Management', href: '/admin/fees', icon: DollarSign },
  { name: 'Disputes', href: '/admin/disputes', icon: AlertTriangle },
  { name: 'KYC Approvals', href: '/admin/kyc', icon: ShieldCheck },
  { name: 'API Usage', href: '/admin/api-usage', icon: Activity },
  { name: 'Fraud Monitoring', href: '/admin/fraud', icon: BarChart3 },
  { name: 'User Management', href: '/admin/users', icon: UserCog },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { darkMode, sidebarOpen, logout } = useStore()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className={cn(
      'fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform duration-300 ease-in-out',
      !sidebarOpen && '-translate-x-full'
    )}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <div className="flex items-center space-x-2">
            <Image
              src={darkMode ? "/Dark mode logo.png" : "/Light mode logo.png"}
              alt="PayMi Logo"
              width={60}
              height={20}
              priority
            />
            <span className="text-xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              PayMi Admin
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-red-600 text-white'
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
  )
}
