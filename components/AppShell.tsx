'use client'

import { useState, useEffect, ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
  currentGalleryName?: string
  currentGallerySlug?: string
}

export function AppShell({ children, currentGalleryName, currentGallerySlug }: AppShellProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      setIsDarkMode(stored === 'true')
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('darkMode', String(isDarkMode))
  }, [isDarkMode])

  const handleToggleDarkMode = () => setIsDarkMode(!isDarkMode)

  return (
    <div className="apple-window">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentGalleryName={currentGalleryName}
          currentGallerySlug={currentGallerySlug}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
        />
        <main className="apple-main">
          {children}
        </main>
      </div>
    </div>
  )
}
