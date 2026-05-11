'use client'

import { useState, useEffect, useCallback } from 'react'
import JSZip from 'jszip'
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

export function Gallery({ metadata }: GalleryProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 })
  const [sessionId, setSessionId] = useState<string>('')

  const { transferId, downloadHost, files, expiresAt } = metadata

  // Create a map for quick file lookup
  const fileMap = new Map(files.map((f) => [f.uuid, f]))

  // Initialize session and load saved selection
  useEffect(() => {
    const sid = getSessionId()
    setSessionId(sid)

    fetch(`/api/selection?transferId=${transferId}&sessionId=${sid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.selection) {
          setSelectedIds(new Set(data.selection))
        }
      })
      .catch(console.error)
  }, [transferId])

  // Save selection to server
  const saveSelection = useCallback(
    async (ids: Set<string>) => {
      if (!sessionId) return

      try {
        await fetch('/api/selection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transferId,
            sessionId,
            fileUuids: Array.from(ids),
            action: 'set',
          }),
        })
      } catch (error) {
        console.error('Failed to save selection:', error)
      }
    },
    [transferId, sessionId]
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

  const handleDownload = async () => {
    if (selectedIds.size === 0) return

    setIsDownloading(true)
    setDownloadProgress({ current: 0, total: selectedIds.size })

    try {
      const zip = new JSZip()
      const selectedUuids = Array.from(selectedIds)

      // Download each file and add to ZIP
      for (let i = 0; i < selectedUuids.length; i++) {
        const fileUuid = selectedUuids[i]
        const fileInfo = fileMap.get(fileUuid)
        const fileName = fileInfo?.fileName || `${fileUuid}.jpg`

        setDownloadProgress({ current: i + 1, total: selectedUuids.length })

        try {
          const response = await fetch(
            `/api/image?downloadHost=${encodeURIComponent(downloadHost)}&fileUuid=${fileUuid}`
          )

          if (response.ok) {
            const blob = await response.blob()
            zip.file(fileName, blob)
          }
        } catch (error) {
          console.error(`Failed to download ${fileName}:`, error)
        }
      }

      // Generate and download ZIP
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
      alert('Échec du téléchargement. Veuillez réessayer.')
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

  return (
    <>
      <ExpirationBanner expiresAt={expiresAt} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Galerie Photo
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {files.length} photo{files.length > 1 ? 's' : ''} disponible{files.length > 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedIds.size < files.length ? (
                  <button
                    onClick={() => {
                      const allIds = new Set(files.map((f) => f.uuid))
                      setSelectedIds(allIds)
                      saveSelection(allIds)
                    }}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Tout sélectionner
                  </button>
                ) : (
                  <button
                    onClick={handleClearSelection}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 dark:text-gray-400"
                  >
                    Tout désélectionner
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Gallery grid */}
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {metadata.message && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-200">
              {metadata.message}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file, index) => (
              <PhotoCard
                key={file.uuid}
                downloadHost={downloadHost}
                fileUuid={file.uuid}
                fileName={file.fileName}
                isSelected={selectedIds.has(file.uuid)}
                onSelect={handleSelect}
                onClick={() => openLightbox(index)}
              />
            ))}
          </div>

          {files.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Aucune photo trouvée
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Ce transfert ne contient pas de photos, ou les fichiers ont expiré.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Lightbox */}
      {currentFile && (
        <Lightbox
          downloadHost={downloadHost}
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
