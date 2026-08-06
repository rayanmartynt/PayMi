import { Bell, Search, Menu, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useStore } from '@/store/useStore'
import { useState } from 'react';
import Image from 'next/image'

export function DashboardHeader() {
  const { sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode } = useStore()
  const { merchant } = useStore();
  const [unreadCount, setUnreadCount] = useState(0);

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
            placeholder="Search transactions, customers..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
      </div>
    </header>
  )
}
