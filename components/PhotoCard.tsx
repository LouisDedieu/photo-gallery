'use client'

import { useState } from 'react'
import { GalleryFile } from '@/lib/types'

interface PhotoCardProps {
  file: GalleryFile
  isSelected: boolean
  onSelect?: (fileUuid: string) => void
  onClick: () => void
  useOriginalRatio?: boolean
  hideCheckbox?: boolean
}

export function PhotoCard({
  file,
  isSelected,
  onSelect,
  onClick,
  useOriginalRatio = true,
  hideCheckbox = false,
}: PhotoCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect?.(file.uuid)
  }

  return (
    <div
      className={`photo-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 skeleton-shimmer"
          style={useOriginalRatio ? { minHeight: '150px' } : undefined}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={useOriginalRatio ? { minHeight: '150px' } : undefined}
        >
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Image - using thumbnail for faster loading */}
      {!hasError && (
        <img
          src={file.thumbnailUrl}
          alt={file.fileName}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      )}

      {/* Checkbox (hidden for portfolio) */}
      {!hideCheckbox && (
        <div
          className={`photo-checkbox ${isSelected ? 'selected' : ''}`}
          onClick={handleCheckboxClick}
        >
          {isSelected && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}
    </div>
  )
}
