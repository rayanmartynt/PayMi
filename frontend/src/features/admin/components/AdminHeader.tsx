import { Bell, Search, Menu, Moon, Sun, Shield } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useStore } from '@/store/useStore'
import Image from 'next/image'

export function AdminHeader() {
  const { sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode, user } = useStore()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3">
        <Image
          src={darkMode ? "/Dark mode logo.png" : "/Light mode logo.png"}
          alt="PayMi Logo"
          width={60}
          height={20}
          priority
        />
      </div>

      <div className="flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search merchants, transactions..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 mr-4">
          <Shield className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium">Admin Panel</span>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <div className="flex items-center gap-3">
          {user?.profilePicture || user?.customer?.profilePicture ? (
            <img
              src={user.profilePicture || user.customer?.profilePicture}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
              onError={(e) => {
                // Fallback to initial if image fails to load
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`h-8 w-8 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center text-white text-sm font-medium ${user?.profilePicture || user?.customer?.profilePicture ? 'hidden' : ''}`}>
            {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
