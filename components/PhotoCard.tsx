'use client'

import { useState, useEffect } from 'react'

interface PhotoCardProps {
  transferId: string
  fileUuid: string
  fileName: string
  isSelected: boolean
  onSelect: (fileUuid: string) => void
  onClick: () => void
}

export function PhotoCard({
  transferId,
  fileUuid,
  fileName,
  isSelected,
  onSelect,
  onClick,
}: PhotoCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const imageUrl = `/api/image?transferId=${encodeURIComponent(transferId)}&fileUuid=${fileUuid}`

  // Retry loading image after delay if rate limited
  useEffect(() => {
    if (hasError && retryCount < maxRetries) {
      const timeout = setTimeout(() => {
        setHasError(false)
        setRetryCount((c) => c + 1)
      }, Math.pow(2, retryCount) * 1000) // 1s, 2s, 4s

      return () => clearTimeout(timeout)
    }
  }, [hasError, retryCount])

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(fileUuid)
  }

  const handleError = () => {
    setHasError(true)
  }

  return (
    <div
      className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 aspect-square"
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}

      {/* Error state (only show after all retries exhausted) */}
      {hasError && retryCount >= maxRetries && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Retry indicator */}
      {hasError && retryCount < maxRetries && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Image - key changes to force reload on retry */}
      {(!hasError || retryCount < maxRetries) && (
        <img
          key={`${fileUuid}-${retryCount}`}
          src={`${imageUrl}&retry=${retryCount}`}
          alt={fileName}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
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
        <p className="text-white text-sm truncate">{fileName}</p>
      </div>
    </div>
  )
}
