'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { darkMode, toggleDarkMode, isAuthenticated, user, userRole, logout } = useStore()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              SalonePay
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="/#pricing" className="text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="/api-docs" className="text-sm font-medium hover:text-primary">
              API
            </Link>
            <Link href="/about" className="text-sm font-medium hover:text-primary">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-primary">
              Contact
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {isAuthenticated ? (
              <>
                <Link href={userRole === 'admin' ? '/admin' : userRole === 'customer' ? '/customer' : '/dashboard'}>
                  <Button variant="ghost">Dashboard</Button>
                </Link>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button variant="gradient">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-4">
            <Link href="/#features" className="block text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="/#pricing" className="block text-sm font-medium hover:text-primary">
              Pricing
            </Link>
            <Link href="/api-docs" className="block text-sm font-medium hover:text-primary">
              API
            </Link>
            <Link href="/about" className="block text-sm font-medium hover:text-primary">
              About
            </Link>
            <Link href="/contact" className="block text-sm font-medium hover:text-primary">
              Contact
            </Link>
            <div className="pt-4 space-y-2">
              {isAuthenticated ? (
                <>
                  <Link href={userRole === 'admin' ? '/admin' : userRole === 'customer' ? '/customer' : '/dashboard'} className="block">
                    <Button variant="outline" className="w-full">Dashboard</Button>
                  </Link>
                  <Button variant="ghost" className="w-full" onClick={handleLogout}>Logout</Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="block">
                    <Button variant="outline" className="w-full">Login</Button>
                  </Link>
                  <Link href="/auth/signup" className="block">
                    <Button variant="gradient" className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
