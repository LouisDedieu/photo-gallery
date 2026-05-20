'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { projects, categories, categoryLabels, albums, type Category } from '@/lib/portfolio-config'

// Icons
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z"/>
    </svg>
  )
}

function CategoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function AlbumIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  )
}

interface SidebarProps {
  currentGalleryName?: string
  currentGallerySlug?: string
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onScrollToSection?: (sectionId: string) => void
}

export function Sidebar({ currentGalleryName, currentGallerySlug, isDarkMode, onToggleDarkMode, onScrollToSection }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const SIDEBAR_MIN = 130
  const SIDEBAR_MAX = 480
  const SIDEBAR_DEFAULT = 240

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const isResizing = useRef(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebarWidth')
    if (stored) {
      setSidebarWidth(Number(stored))
    }
  }, [])

  const handleResizeStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isResizing.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, e.clientX)))
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing.current) return
      setSidebarWidth(Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, e.touches[0].clientX)))
    }

    const handleResizeEnd = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleResizeEnd)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleResizeEnd)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleResizeEnd)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleResizeEnd)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sidebarWidth', String(sidebarWidth))
  }, [sidebarWidth])

  const isHome = pathname === '/'
  const projectSlugs = new Set(projects.map(p => p.slug))
  const albumSlugs = new Set(albums.map(a => a.slug))
  const isProjectGallery = currentGallerySlug && projectSlugs.has(currentGallerySlug)
  const isAlbumGallery = currentGallerySlug && albumSlugs.has(currentGallerySlug)
  const isClientGallery = currentGallerySlug && !isProjectGallery && !isAlbumGallery

  // Find which category the current project belongs to
  const currentProjectCategory = currentGallerySlug
    ? projects.find(p => p.slug === currentGallerySlug)?.category
    : null

  const handleCategoryClick = (e: React.MouseEvent, category: Category) => {
    e.preventDefault()

    if (isHome && onScrollToSection) {
      // On home page - smooth scroll to section
      onScrollToSection(category)
      // Update URL hash without triggering navigation
      window.history.pushState(null, '', `/#${category}`)
    } else {
      // On another page - navigate to home with hash
      router.push(`/#${category}`)
    }
  }

  return (
    <aside className="apple-sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
      <div className="sidebar-resize-handle" onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} />
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {/* Navigation */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Navigation</div>
            <Link
              href="/"
              className={`sidebar-item ${isHome ? 'active' : ''}`}
            >
              <HomeIcon className="sidebar-icon" />
              <span>Accueil</span>
            </Link>
          </div>

          {/* Portfolio Categories */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Portfolio</div>
            {categories.map((category) => (
              <a
                key={category}
                href={`/#${category}`}
                onClick={(e) => handleCategoryClick(e, category)}
                className={`sidebar-item ${currentProjectCategory === category ? 'active' : ''}`}
              >
                <CategoryIcon className="sidebar-icon" />
                <span>{categoryLabels[category]}</span>
              </a>
            ))}
          </div>

          {/* Albums publics */}
          {albums.length > 0 && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Albums</div>
              {albums.map((album) => (
                <Link
                  key={album.slug}
                  href={`/gallery/${album.slug}`}
                  className={`sidebar-item ${currentGallerySlug === album.slug ? 'active' : ''}`}
                >
                  <AlbumIcon className="sidebar-icon" />
                  <span>{album.title}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Current Client Gallery (if applicable) */}
          {isClientGallery && currentGalleryName && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Galerie</div>
              <div className="sidebar-item active">
                <FolderIcon className="sidebar-icon" />
                <span>{currentGalleryName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="sidebar-section pb-4">
          <a
            href="https://www.instagram.com/louis_ddg"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-item"
          >
            <InstagramIcon className="sidebar-icon" />
            <span>Instagram</span>
          </a>
          <button
            onClick={onToggleDarkMode}
            className="sidebar-item w-full"
          >
            {isDarkMode ? (
              <SunIcon className="sidebar-icon" />
            ) : (
              <MoonIcon className="sidebar-icon" />
            )}
            <span>{isDarkMode ? 'Mode clair' : 'Mode sombre'}</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
