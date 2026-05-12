'use client'

import { useState } from 'react'
import { GalleryFile } from '@/lib/types'

interface PhotoCardProps {
  file: GalleryFile
  isSelected: boolean
  onSelect: (fileUuid: string) => void
  onClick: () => void
  preserveAspectRatio?: boolean
}

export function PhotoCard({
  file,
  isSelected,
  onSelect,
  onClick,
  preserveAspectRatio = false,
}: PhotoCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(file.uuid)
  }

  return (
    <div
      className={`relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 ${preserveAspectRatio ? 'break-inside-avoid mb-4' : 'aspect-square'}`}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Image - use direct Supabase URL */}
      {!hasError && (
        <img
          src={file.url}
          alt={file.fileName}
          className={`w-full transition-all duration-300 group-hover:scale-105 ${preserveAspectRatio ? 'h-auto' : 'h-full object-cover'} ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      )}

      {/* Selection overlay */}
      <div
        className={`absolute inset-0 transition-opacity ${isSelected ? 'bg-blue-500/30' : 'bg-black/0 group-hover:bg-black/20'}`}
      />

      {/* Checkbox */}
      <div
        className={`absolute top-2 left-2 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all shadow-md ${
          isSelected
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'bg-white/90 border-gray-400'
        }`}
        onClick={handleCheckboxClick}
      >
        {isSelected && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Filename on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-sm truncate">{file.fileName}</p>
      </div>
    </div>
  )
}
