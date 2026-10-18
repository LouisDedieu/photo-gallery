'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import posthog from 'posthog-js'
import JSZip from 'jszip'
import Masonry from 'react-masonry-css'
import { GalleryFile, TransferMetadata } from '@/lib/types'
import { projects, albums } from '@/lib/portfolio-config'
import { getSessionId, setGalleryContext, track } from '@/lib/analytics'
import { canShareFiles, fetchAsFile, shareFiles, isMobileDevice } from '@/lib/download'
import { PhotoCard } from './PhotoCard'
import { Lightbox } from './Lightbox'
import { SelectionBar } from './SelectionBar'
import { Toast } from './Toast'
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
  // Fichiers préparés en attente de partage (fallback iOS : geste utilisateur perdu)
  const [pendingShareFiles, setPendingShareFiles] = useState<File[] | null>(null)
  // Message de confirmation flottant
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [useOriginalRatio, setUseOriginalRatio] = useState(true)
  const [showRetro, setShowRetro] = useState(false)

  // Gallery reveal state - preload first batch before showing
  const [isGalleryReady, setIsGalleryReady] = useState(false)
  const loadedCountRef = useRef(0)
  const preloadTargetRef = useRef(0)

  // Lightbox tracking refs
  const lightboxOpenTimeRef = useRef<number | null>(null)
  const photosViewedInLightboxRef = useRef<Set<number>>(new Set())

  const { transferId, galleryId, files, expiresAt } = metadata
  const retroFiles = metadata.retroFiles ?? []

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

  // Retro: bouton affiché pour les albums et galeries clients disposant d'un sous-dossier retro
  const hasRetro = selectionEnabled && retroFiles.length > 0
  const displayedFiles = showRetro && hasRetro ? retroFiles : files

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

  // Create a map for quick file lookup (main + retro for downloads)
  const fileMap = new Map([...files, ...retroFiles].map((f) => [f.uuid, f]))

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
      const newSet = new Set(selectedIds)
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

      setSelectedIds(newSet)
      saveSelection(newSet)
    },
    [selectedIds, saveSelection, transferId]
  )

  const handleClearSelection = useCallback(() => {
    if (selectedIds.size > 0) {
      track.selectionCleared({
        gallery_id: transferId,
        cleared_count: selectedIds.size,
      })
    }
    setSelectedIds(new Set())
    saveSelection(new Set())
  }, [selectedIds, saveSelection, transferId])

  const handleSelectAll = useCallback(() => {
    const allIds = new Set(selectedIds)
    displayedFiles.forEach((f) => allIds.add(f.uuid))
    setSelectedIds(allIds)
    saveSelection(allIds)
    track.selectionAll({
      gallery_id: transferId,
      selected_count: allIds.size,
    })
  }, [selectedIds, displayedFiles, saveSelection, transferId])

  // Récupère les photos sélectionnées comme File[] (avec progression).
  const fetchSelectedFiles = async (): Promise<File[]> => {
    const selectedUuids = Array.from(selectedIds)
    const files: File[] = []

    for (let i = 0; i < selectedUuids.length; i++) {
      const fileUuid = selectedUuids[i]
      const fileInfo = fileMap.get(fileUuid)
      if (!fileInfo?.url) continue

      const fileName = fileInfo.fileName || `${fileUuid}.jpg`
      setDownloadProgress({ current: i + 1, total: selectedUuids.length })

      try {
        files.push(await fetchAsFile(fileInfo.url, fileName, fileInfo.mimeType))
      } catch (error) {
        console.error(`Failed to fetch ${fileName}:`, error)
      }
    }

    return files
  }

  // Fallback desktop / navigateur non compatible : téléchargement ZIP.
  const downloadAsZip = async (files: File[]) => {
    const zip = new JSZip()
    files.forEach((file) => zip.file(file.name, file))

    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(zipBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `photos-${transferId.slice(0, 8)}.zip`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    posthog.capture('photo_downloaded', {
      gallery_id: transferId,
      gallery_name: albumName,
      photo_count: files.length,
      download_type: 'zip',
    })
  }

  const trackNativeShare = (count: number) => {
    posthog.capture('photo_downloaded', {
      gallery_id: transferId,
      gallery_name: albumName,
      photo_count: count,
      download_type: 'native-share',
    })
  }

  const handleDownload = async () => {
    if (selectedIds.size === 0 || isDownloading) return

    setPendingShareFiles(null)
    setIsDownloading(true)
    setDownloadProgress({ current: 0, total: selectedIds.size })

    try {
      const files = await fetchSelectedFiles()
      if (files.length === 0) {
        alert('Echec du telechargement. Veuillez reessayer.')
        return
      }

      // Mobile uniquement : partage natif → enregistrement dans Photos/Galerie.
      // Sur desktop on garde le téléchargement ZIP direct.
      if (isMobileDevice() && canShareFiles(files)) {
        const result = await shareFiles(files)
        if (result === 'shared') {
          trackNativeShare(files.length)
          setToastMessage(files.length > 1 ? 'Photos enregistrées' : 'Photo enregistrée')
          return
        }
        if (result === 'cancelled') return
        // Geste utilisateur expiré (iOS) : on garde les fichiers pour un 2e tap
        if (result === 'gesture-lost') {
          setPendingShareFiles(files)
          return
        }
        // 'unsupported' / 'error' → fallback ZIP ci-dessous
      }

      await downloadAsZip(files)
    } catch (error) {
      console.error('Download error:', error)
      alert('Echec du telechargement. Veuillez reessayer.')
    } finally {
      setIsDownloading(false)
      setDownloadProgress({ current: 0, total: 0 })
    }
  }

  // 2e tap (fichiers déjà en mémoire) → partage sans await → geste préservé
  const handleSaveToGallery = async () => {
    if (!pendingShareFiles) return
    const result = await shareFiles(pendingShareFiles)
    if (result === 'shared') {
      trackNativeShare(pendingShareFiles.length)
      setToastMessage(pendingShareFiles.length > 1 ? 'Photos enregistrées' : 'Photo enregistrée')
      setPendingShareFiles(null)
    } else if (result === 'unsupported' || result === 'error') {
      await downloadAsZip(pendingShareFiles)
      setPendingShareFiles(null)
    }
    // 'cancelled'/'gesture-lost' → on garde le bouton pour réessayer
  }

  const openLightbox = (index: number) => {
    lightboxOpenTimeRef.current = Date.now()
    photosViewedInLightboxRef.current = new Set([index])
    track.lightboxOpened({
      gallery_id: transferId,
      photo_index: index,
      photo_uuid: displayedFiles[index]?.uuid || '',
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
    if (lightboxIndex !== null && lightboxIndex < displayedFiles.length - 1) {
      const newIndex = lightboxIndex + 1
      photosViewedInLightboxRef.current.add(newIndex)
      setLightboxIndex(newIndex)
    }
  }

  const currentFile = lightboxIndex !== null ? displayedFiles[lightboxIndex] : null

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
                {displayedFiles.length} photo{displayedFiles.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="header-actions">
            {/* Retro toggle (albums avec sous-dossier retro uniquement) */}
            {hasRetro && (
              <button
                onClick={() => {
                  setLightboxIndex(null)
                  setShowRetro((prev) => !prev)
                }}
                className={`header-button retro-button${showRetro ? ' active' : ''}`}
                title={showRetro ? 'Voir les photos originales' : 'Voir les photos retro'}
              >
                Retro
              </button>
            )}

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
              displayedFiles.some((f) => !selectedIds.has(f.uuid)) ? (
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
            {displayedFiles.map((file, index) => (
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
            {displayedFiles.map((file, index) => (
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

        {displayedFiles.length === 0 && (
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
          hasNext={lightboxIndex !== null && lightboxIndex < displayedFiles.length - 1}
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
          hasPendingShare={pendingShareFiles !== null}
          onSaveToGallery={handleSaveToGallery}
        />
      )}

      {/* Confirmation flottante */}
      {toastMessage && (
        <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
      )}
    </>
  )
}
