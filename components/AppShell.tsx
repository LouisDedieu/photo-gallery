'use client'

import { useState, useEffect, useRef, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
  currentGalleryName?: string
  currentGallerySlug?: string
}

export function AppShell({ children, currentGalleryName, currentGallerySlug }: AppShellProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
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
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentGalleryName={currentGalleryName}
          currentGallerySlug={currentGallerySlug}
          isDarkMode={isDarkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onScrollToSection={handleScrollToSection}
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
