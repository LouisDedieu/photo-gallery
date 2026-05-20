'use client'

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { Sidebar } from './Sidebar'

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

interface AppShellProps {
  children: ReactNode
  currentGalleryName?: string
  currentGallerySlug?: string
}

export function AppShell({ children, currentGalleryName, currentGallerySlug }: AppShellProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const wrapperRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

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

  // Initialize Lenis
  useEffect(() => {
    if (!wrapperRef.current || !contentRef.current) return

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    })

    lenisRef.current = lenis

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    // Handle hash on initial load
    if (window.location.hash) {
      const target = document.querySelector(window.location.hash)
      if (target) {
        setTimeout(() => {
          lenis.scrollTo(target as HTMLElement, { offset: -40 })
        }, 100)
      }
    }

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Handle hash changes (for navigation from sidebar)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash && lenisRef.current) {
        const target = document.querySelector(window.location.hash)
        if (target) {
          lenisRef.current.scrollTo(target as HTMLElement, { offset: -40 })
        }
      }
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Scroll to section when pathname changes with hash (coming from another page)
  useEffect(() => {
    if (pathname === '/' && window.location.hash && lenisRef.current) {
      const target = document.querySelector(window.location.hash)
      if (target) {
        setTimeout(() => {
          lenisRef.current?.scrollTo(target as HTMLElement, { offset: -40 })
        }, 100)
      }
    }
  }, [pathname])

  const handleToggleDarkMode = () => setIsDarkMode(!isDarkMode)
  const handleCloseMobileSidebar = () => setIsMobileSidebarOpen(false)

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileSidebarOpen(false)
  }, [pathname])

  const handleScrollToSection = useCallback((sectionId: string) => {
    if (lenisRef.current) {
      const target = document.querySelector(`#${sectionId}`)
      if (target) {
        lenisRef.current.scrollTo(target as HTMLElement, { offset: -40 })
      }
    }
  }, [])

  return (
    <div className="apple-window">
      {/* Mobile hamburger button */}
      <button
        className="mobile-menu-button"
        onClick={() => setIsMobileSidebarOpen(true)}
        aria-label="Ouvrir le menu"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Mobile overlay */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={handleCloseMobileSidebar}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentGalleryName={currentGalleryName}
          currentGallerySlug={currentGallerySlug}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onScrollToSection={handleScrollToSection}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={handleCloseMobileSidebar}
        />
        <main ref={wrapperRef} className="apple-main">
          <div ref={contentRef}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
