'use client'

import { useEffect } from 'react'
import { useStore } from '@/store/useStore'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { darkMode } = useStore()

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(darkMode ? 'dark' : 'light')
  }, [darkMode])

  return <>{children}</>
}
