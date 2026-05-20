'use client'

import { useEffect, useCallback, useState } from 'react'
import { GalleryFile } from '@/lib/types'

interface LightboxProps {
  file: GalleryFile
  isSelected: boolean
  onSelect?: (fileUuid: string) => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
  hideSelection?: boolean
}

export function Lightbox({
  file,
  isSelected,
  onSelect,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  hideSelection = false,
}: LightboxProps) {
  const [isLoading, setIsLoading] = useState(true)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          if (hasPrev) onPrev()
          break
        case 'ArrowRight':
          if (hasNext) onNext()
          break
        case ' ':
          if (!hideSelection && onSelect) {
            e.preventDefault()
            onSelect(file.uuid)
          }
          break
      }
    },
    [onClose, onPrev, onNext, onSelect, hasPrev, hasNext, file.uuid, hideSelection]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  useEffect(() => {
    setIsLoading(true)
  }, [file.uuid])

  const handleDownload = async () => {
    const response = await fetch(file.url)
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = objectUrl
    a.download = file.fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(objectUrl)
  }

  return (
    <div className="apple-lightbox">
      {/* Close button */}
      <button
        onClick={onClose}
        className="lightbox-button absolute top-5 right-5 z-10"
        aria-label="Fermer"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation - Previous */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="lightbox-button absolute left-5 top-1/2 -translate-y-1/2 z-10"
          aria-label="Photo precedente"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Navigation - Next */}
      {hasNext && (
        <button
          onClick={onNext}
          className="lightbox-button absolute right-5 top-1/2 -translate-y-1/2 z-10"
          aria-label="Photo suivante"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
          </div>
        )}
        <img
          src={file.url}
          alt={file.fileName}
          className={`max-w-full max-h-[85vh] object-contain rounded-lg transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-xl rounded-full px-5 py-3">
        {/* Filename */}
        <span className="text-white/80 text-sm font-medium max-w-[200px] truncate">
          {file.fileName}
        </span>

        {/* Selection and download buttons (hidden for portfolio) */}
        {!hideSelection && (
          <>
            <div className="w-px h-5 bg-white/20" />

            {/* Select button */}
            <button
              onClick={() => onSelect?.(file.uuid)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-[var(--apple-blue)] text-white'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              {isSelected ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Selectionnee
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Selectionner
                </>
              )}
            </button>

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Telecharger
            </button>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
