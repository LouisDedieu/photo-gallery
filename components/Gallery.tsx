'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import posthog from 'posthog-js'
import JSZip from 'jszip'
import Masonry from 'react-masonry-css'
import { GalleryFile, TransferMetadata } from '@/lib/types'
import { projects, albums } from '@/lib/portfolio-config'
import { getSessionId, setGalleryContext, track } from '@/lib/analytics'
import { PhotoCard } from './PhotoCard'
import { Lightbox } from './Lightbox'
import { SelectionBar } from './SelectionBar'
import { ExpirationBanner } from './ExpirationBanner'
import { AppShell } from './AppShell'
import Link from 'next/link'

interface GalleryProps {
  metadata: TransferMetadata
}

// Check if gallery is a portfolio project (no selection/download)
const portfolioSlugs = new Set(projects.map(p => p.slug))
const albumSlugs = new Set(albums.map(a => a.slug))

// Number of images to preload before revealing gallery
const PRELOAD_BATCH_SIZE = 6

export function Gallery({ metadata }: GalleryProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })
  const [sessionId, setSessionId] = useState<string>('')
  const [useOriginalRatio, setUseOriginalRatio] = useState(true)

  // Gallery reveal state - preload first batch before showing
  const [isGalleryReady, setIsGalleryReady] = useState(false)
  const loadedCountRef = useRef(0)
  const preloadTargetRef = useRef(0)

  // Lightbox tracking refs
  const lightboxOpenTimeRef = useRef<number | null>(null)
  const photosViewedInLightboxRef = useRef<Set<number>>(new Set())

  const { transferId, galleryId, files, expiresAt } = metadata

  // Calculate preload target based on actual file count
  useEffect(() => {
    preloadTargetRef.current = Math.min(PRELOAD_BATCH_SIZE, files.length)
    // If no files, mark as ready immediately
    if (files.length === 0) {
      setIsGalleryReady(true)
      return
    }

    // Fallback timeout - reveal gallery after max wait time even if images aren't loaded
    const timeoutId = setTimeout(() => {
      if (!isGalleryReady) {
        setIsGalleryReady(true)
      }
    }, 3000) // 3 second max wait

    return () => clearTimeout(timeoutId)
  }, [files.length, isGalleryReady])

  // Callback when an image finishes loading
  const handleImageLoaded = useCallback(() => {
    loadedCountRef.current += 1
    // Once enough images are loaded, reveal the gallery
    if (!isGalleryReady && loadedCountRef.current >= preloadTargetRef.current) {
      setIsGalleryReady(true)
    }
  }, [isGalleryReady])

  // Check gallery type - Portfolio has no selection, Albums and Client galleries have selection
  const isPortfolio = portfolioSlugs.has(transferId)
  const isAlbum = albumSlugs.has(transferId)
  const selectionEnabled = !isPortfolio // Albums et clients ont la sélection

  // Generate album name from transferId
  const albumName = metadata.title || metadata.message || `Album ${transferId.slice(0, 8)}`

  // Determine gallery type for tracking
  const galleryType: 'portfolio' | 'album' | 'client' = isPortfolio
    ? 'portfolio'
    : isAlbum
      ? 'album'
      : 'client'

  // Track gallery view on mount
  useEffect(() => {
    setGalleryContext(transferId, albumName, galleryType, files.length)
    track.galleryViewed({
      gallery_id: transferId,
      gallery_name: albumName,
      gallery_type: galleryType,
      photo_count: files.length,
    })
  }, [transferId, albumName, galleryType, files.length])

  // Create a map for quick file lookup
  const fileMap = new Map(files.map((f) => [f.uuid, f]))

  // Initialize session and load saved selection (only for galleries with selection enabled)
  useEffect(() => {
    if (!selectionEnabled) return

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
  }, [galleryId, selectionEnabled])

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
        const wasSelected = newSet.has(fileUuid)

        if (wasSelected) {
          newSet.delete(fileUuid)
          track.photoDeselected({
            gallery_id: transferId,
            photo_uuid: fileUuid,
            selection_count: newSet.size,
          })
        } else {
          newSet.add(fileUuid)
          track.photoSelected({
            gallery_id: transferId,
            photo_uuid: fileUuid,
            selection_count: newSet.size,
          })
        }
        saveSelection(newSet)
        return newSet
      })
    },
    [saveSelection, transferId]
  )

  const handleClearSelection = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size > 0) {
        track.selectionCleared({
          gallery_id: transferId,
          cleared_count: prev.size,
        })
      }
      return new Set()
    })
    saveSelection(new Set())
  }, [saveSelection, transferId])

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(files.map((f) => f.uuid))
    setSelectedIds(allIds)
    saveSelection(allIds)
    track.selectionAll({
      gallery_id: transferId,
      selected_count: allIds.size,
    })
  }, [files, saveSelection, transferId])

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

      // Track ZIP download
      posthog.capture('photo_downloaded', {
        gallery_id: transferId,
        gallery_name: albumName,
        photo_count: selectedIds.size,
        download_type: 'zip',
      })
    } catch (error) {
      console.error('Download error:', error)
      alert('Echec du telechargement. Veuillez reessayer.')
    } finally {
      setIsDownloading(false)
      setDownloadProgress({ current: 0, total: 0 })
    }
  }

  const openLightbox = (index: number) => {
    lightboxOpenTimeRef.current = Date.now()
    photosViewedInLightboxRef.current = new Set([index])
    track.lightboxOpened({
      gallery_id: transferId,
      photo_index: index,
      photo_uuid: files[index]?.uuid || '',
    })
    setLightboxIndex(index)
  }

  const closeLightbox = () => {
    if (lightboxOpenTimeRef.current !== null) {
      const timeSpent = Math.round((Date.now() - lightboxOpenTimeRef.current) / 1000)
      track.lightboxClosed({
        gallery_id: transferId,
        photos_viewed: photosViewedInLightboxRef.current.size,
        time_spent_seconds: timeSpent,
      })
      lightboxOpenTimeRef.current = null
      photosViewedInLightboxRef.current = new Set()
    }
    setLightboxIndex(null)
  }

  const goToPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1
      photosViewedInLightboxRef.current.add(newIndex)
      setLightboxIndex(newIndex)
    }
  }

  const goToNext = () => {
    if (lightboxIndex !== null && lightboxIndex < files.length - 1) {
      const newIndex = lightboxIndex + 1
      photosViewedInLightboxRef.current.add(newIndex)
      setLightboxIndex(newIndex)
    }
  }

  const currentFile = lightboxIndex !== null ? files[lightboxIndex] : null

  return (
    <>
      <ExpirationBanner expiresAt={expiresAt} />

      <AppShell currentGalleryName={albumName} currentGallerySlug={transferId}>
        {/* Header */}
        <header className="apple-header">
          <div className="flex items-center gap-3">
            <Link href="/" className="back-button" title="Retour a l'accueil">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </Link>
            <div className="w-fit">
              <h1 className="apple-header-title">{albumName}</h1>
              <p className="apple-header-subtitle">
                {files.length} photo{files.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="header-actions">
            {/* Toggle view mode */}
            <button
              onClick={() => {
                const newMode = !useOriginalRatio
                setUseOriginalRatio(newMode)
                track.viewModeChanged({
                  gallery_id: transferId,
                  mode: newMode ? 'masonry' : 'square',
                })
              }}
              className="toggle-button"
              title={useOriginalRatio ? 'Afficher en carres' : 'Ratio original'}
            >
              {useOriginalRatio ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                </svg>
              )}
            </button>

            {/* Select all / Deselect all (only for galleries with selection enabled) */}
            {selectionEnabled && (
              selectedIds.size < files.length ? (
                <button onClick={handleSelectAll} className="header-button">
                  Tout selectionner
                </button>
              ) : (
                <button onClick={handleClearSelection} className="header-button">
                  Deselectionner
                </button>
              )
            )}
          </div>
        </header>

        {/* Photo grid */}
        {useOriginalRatio ? (
          <Masonry
            breakpointCols={{ default: 3, 900: 2, 600: 2 }}
            className={`masonry-grid ${isGalleryReady ? 'gallery-ready' : ''}`}
            columnClassName="masonry-column"
          >
            {files.map((file, index) => (
              <PhotoCard
                key={file.uuid}
                file={file}
                index={index}
                isSelected={selectionEnabled && selectedIds.has(file.uuid)}
                onSelect={selectionEnabled ? handleSelect : undefined}
                onClick={() => openLightbox(index)}
                useOriginalRatio={useOriginalRatio}
                hideCheckbox={!selectionEnabled}
                isGalleryReady={isGalleryReady}
                onImageLoaded={handleImageLoaded}
                shouldPreload={index < PRELOAD_BATCH_SIZE}
              />
            ))}
          </Masonry>
        ) : (
          <div className={`photo-grid ${isGalleryReady ? 'gallery-ready' : ''}`}>
            {files.map((file, index) => (
              <PhotoCard
                key={file.uuid}
                file={file}
                index={index}
                isSelected={selectionEnabled && selectedIds.has(file.uuid)}
                onSelect={selectionEnabled ? handleSelect : undefined}
                onClick={() => openLightbox(index)}
                useOriginalRatio={useOriginalRatio}
                hideCheckbox={!selectionEnabled}
                isGalleryReady={isGalleryReady}
                onImageLoaded={handleImageLoaded}
                shouldPreload={index < PRELOAD_BATCH_SIZE}
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
      </AppShell>

      {/* Lightbox */}
      {currentFile && (
        <Lightbox
          file={currentFile}
          galleryId={transferId}
          photoIndex={lightboxIndex!}
          isSelected={selectionEnabled && selectedIds.has(currentFile.uuid)}
          onSelect={selectionEnabled ? handleSelect : undefined}
          onClose={closeLightbox}
          onPrev={goToPrev}
          onNext={goToNext}
          hasPrev={lightboxIndex !== null && lightboxIndex > 0}
          hasNext={lightboxIndex !== null && lightboxIndex < files.length - 1}
          hideSelection={!selectionEnabled}
        />
      )}

      {/* Selection bar (only for galleries with selection enabled) */}
      {selectionEnabled && (
        <SelectionBar
          selectedCount={selectedIds.size}
          onDownload={handleDownload}
          onClearSelection={handleClearSelection}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
        />
      )}
    </>
  )
}
