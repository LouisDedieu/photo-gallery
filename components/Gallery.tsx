'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import Masonry from 'react-masonry-css'
import { GalleryFile, TransferMetadata } from '@/lib/types'
import { PhotoCard } from './PhotoCard'
import { Lightbox } from './Lightbox'
import { SelectionBar } from './SelectionBar'
import { ExpirationBanner } from './ExpirationBanner'

interface GalleryProps {
  metadata: TransferMetadata
}

function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem('gallery_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('gallery_session_id', sessionId)
  }
  return sessionId
}

// Folder icon component
function FolderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10z"/>
    </svg>
  )
}

// Home icon
function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// Sun icon for light mode
function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
    </svg>
  )
}

// Moon icon for dark mode
function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Gallery({ metadata }: GalleryProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })
  const [sessionId, setSessionId] = useState<string>('')
  const [useOriginalRatio, setUseOriginalRatio] = useState(true) // Default: original ratio
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('darkMode')
    if (stored !== null) {
      setIsDarkMode(stored === 'true')
    } else {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
  }, [])

  // Apply dark mode to document and persist preference
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
    localStorage.setItem('darkMode', String(isDarkMode))
  }, [isDarkMode])

  const { transferId, galleryId, files, expiresAt } = metadata

  // Generate album name from transferId
  const albumName = metadata.message || `Album ${transferId.slice(0, 8)}`

  // Create a map for quick file lookup
  const fileMap = new Map(files.map((f) => [f.uuid, f]))

  // Initialize session and load saved selection
  useEffect(() => {
    const sid = getSessionId()
    setSessionId(sid)

    fetch(`/api/selection?galleryId=${galleryId}&sessionId=${sid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.selection) {
          setSelectedIds(new Set(data.selection))
        }
      })
      .catch(console.error)
  }, [galleryId])

  // Save selection to server
  const saveSelection = useCallback(
    async (ids: Set<string>) => {
      if (!sessionId) return

      try {
        await fetch('/api/selection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            galleryId,
            sessionId,
            fileUuids: Array.from(ids),
            action: 'set',
          }),
        })
      } catch (error) {
        console.error('Failed to save selection:', error)
      }
    },
    [galleryId, sessionId]
  )

  const handleSelect = useCallback(
    (fileUuid: string) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(fileUuid)) {
          newSet.delete(fileUuid)
        } else {
          newSet.add(fileUuid)
        }
        saveSelection(newSet)
        return newSet
      })
    },
    [saveSelection]
  )

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
    saveSelection(new Set())
  }, [saveSelection])

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(files.map((f) => f.uuid))
    setSelectedIds(allIds)
    saveSelection(allIds)
  }, [files, saveSelection])

  const handleDownload = async () => {
    if (selectedIds.size === 0) return

    setIsDownloading(true)
    setDownloadProgress({ current: 0, total: selectedIds.size })

    try {
      const zip = new JSZip()
      const selectedUuids = Array.from(selectedIds)

      for (let i = 0; i < selectedUuids.length; i++) {
        const fileUuid = selectedUuids[i]
        const fileInfo = fileMap.get(fileUuid)
        const fileName = fileInfo?.fileName || `${fileUuid}.jpg`

        setDownloadProgress({ current: i + 1, total: selectedUuids.length })

        try {
          const response = await fetch(fileInfo?.url || '')

          if (response.ok) {
            const blob = await response.blob()
            zip.file(fileName, blob)
          }
        } catch (error) {
          console.error(`Failed to download ${fileName}:`, error)
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `photos-${transferId.slice(0, 8)}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      alert('Echec du telechargement. Veuillez reessayer.')
    } finally {
      setIsDownloading(false)
      setDownloadProgress({ current: 0, total: 0 })
    }
  }

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goToPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1)
    }
  }

  const goToNext = () => {
    if (lightboxIndex !== null && lightboxIndex < files.length - 1) {
      setLightboxIndex(lightboxIndex + 1)
    }
  }

  const currentFile = lightboxIndex !== null ? files[lightboxIndex] : null

  // Sidebar resize
  const SIDEBAR_MIN = 130
  const SIDEBAR_MAX = 480
  const SIDEBAR_DEFAULT = 240

  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)

  useEffect(() => {
    const stored = localStorage.getItem('sidebarWidth')
    if (stored) {
      setSidebarWidth(Number(stored))
    }
  }, [])

  const isResizing = useRef(false)

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

  // Navigation handler
  const handleGoHome = () => router.push('/')

  return (
    <>
      <ExpirationBanner expiresAt={expiresAt} />

      <div className="apple-window">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="apple-sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
            <div className="sidebar-resize-handle" onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} />
            <div className="flex flex-col h-full">
              <div className="flex-1">
                {/* Navigation Section */}
                <div className="sidebar-section">
                  <div className="sidebar-section-title">Navigation</div>
                  <div className="sidebar-item" onClick={handleGoHome}>
                    <HomeIcon className="sidebar-icon" />
                    <span>Accueil</span>
                  </div>
                </div>

                {/* Albums Section */}
                <div className="sidebar-section">
                  <div className="sidebar-section-title">Albums</div>
                  <div className="sidebar-item active">
                    <FolderIcon className="sidebar-icon" />
                    <span>{albumName}</span>
                  </div>
                </div>
              </div>

              {/* Dark mode toggle at bottom */}
              <div className="sidebar-section pb-6">
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
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

          {/* Main content */}
          <main className="apple-main">
            {/* Header */}
            <header className="apple-header">
              <div>
                <h1 className="apple-header-title">{albumName}</h1>
                <p className="apple-header-subtitle">
                  {files.length} photo{files.length > 1 ? 's' : ''}
                </p>
              </div>

              <div className="header-actions">
                {/* Toggle view mode */}
                <button
                  onClick={() => setUseOriginalRatio(!useOriginalRatio)}
                  className="toggle-button"
                  title={useOriginalRatio ? 'Afficher en carres' : 'Ratio original'}
                >
                  {useOriginalRatio ? (
                    // Icon for "switch to square" - showing a square
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  ) : (
                    // Icon for "switch to original ratio" - showing a rectangle
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                    </svg>
                  )}
                </button>

                {/* Select all / Deselect all */}
                {selectedIds.size < files.length ? (
                  <button
                    onClick={handleSelectAll}
                    className="header-button"
                  >
                    Tout selectionner
                  </button>
                ) : (
                  <button
                    onClick={handleClearSelection}
                    className="header-button"
                  >
                    Deselectionner
                  </button>
                )}

              </div>
            </header>

            {/* Photo grid */}
            {useOriginalRatio ? (
              <Masonry
                breakpointCols={{ default: 3, 900: 2, 600: 2 }}
                className="masonry-grid"
                columnClassName="masonry-column"
              >
                {files.map((file, index) => (
                  <PhotoCard
                    key={file.uuid}
                    file={file}
                    isSelected={selectedIds.has(file.uuid)}
                    onSelect={handleSelect}
                    onClick={() => openLightbox(index)}
                    useOriginalRatio={useOriginalRatio}
                  />
                ))}
              </Masonry>
            ) : (
              <div className="photo-grid">
                {files.map((file, index) => (
                  <PhotoCard
                    key={file.uuid}
                    file={file}
                    isSelected={selectedIds.has(file.uuid)}
                    onSelect={handleSelect}
                    onClick={() => openLightbox(index)}
                    useOriginalRatio={useOriginalRatio}
                  />
                ))}
              </div>
            )}

            {files.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-semibold text-gray-600">
                    Aucune photo
                  </h3>
                  <p className="mt-2 text-sm text-gray-400">
                    Cette galerie ne contient pas de photos.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Lightbox */}
      {currentFile && (
        <Lightbox
          file={currentFile}
          isSelected={selectedIds.has(currentFile.uuid)}
          onSelect={handleSelect}
          onClose={closeLightbox}
          onPrev={goToPrev}
          onNext={goToNext}
          hasPrev={lightboxIndex !== null && lightboxIndex > 0}
          hasNext={lightboxIndex !== null && lightboxIndex < files.length - 1}
        />
      )}

      {/* Selection bar */}
      <SelectionBar
        selectedCount={selectedIds.size}
        onDownload={handleDownload}
        onClearSelection={handleClearSelection}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
      />
    </>
  )
}
