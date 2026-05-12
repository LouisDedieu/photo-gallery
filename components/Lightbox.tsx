'use client'

import { useEffect, useCallback, useState } from 'react'
import { GalleryFile } from '@/lib/types'

interface LightboxProps {
  file: GalleryFile
  isSelected: boolean
  onSelect: (fileUuid: string) => void
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
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
          e.preventDefault()
          onSelect(file.uuid)
          break
      }
    },
    [onClose, onPrev, onNext, onSelect, hasPrev, hasNext, file.uuid]
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
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Fermer"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Navigation - Previous */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Photo précédente"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Navigation - Next */}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Photo suivante"
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image container */}
      <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <img
          src={file.url}
          alt={file.fileName}
          className={`max-w-full max-h-[85vh] object-contain transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/60 backdrop-blur-sm rounded-full px-6 py-3">
        {/* Filename */}
        <span className="text-white text-sm">{file.fileName}</span>

        {/* Select button */}
        <button
          onClick={() => onSelect(file.uuid)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
            isSelected
              ? 'bg-blue-500 text-white'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          {isSelected ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sélectionnée
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Sélectionner
            </>
          )}
        </button>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Télécharger
        </button>
      </div>
    </div>
  )
}
