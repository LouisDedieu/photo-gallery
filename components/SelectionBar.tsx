'use client'

interface SelectionBarProps {
  selectedCount: number
  onDownload: () => void
  onClearSelection: () => void
  isDownloading: boolean
  downloadProgress: { current: number; total: number }
}

export function SelectionBar({
  selectedCount,
  onDownload,
  onClearSelection,
  isDownloading,
  downloadProgress,
}: SelectionBarProps) {
  if (selectedCount === 0) {
    return null
  }

  const progressPercent = downloadProgress.total > 0
    ? Math.round((downloadProgress.current / downloadProgress.total) * 100)
    : 0

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-full shadow-2xl px-6 py-4 flex items-center gap-4 animate-in slide-in-from-bottom-4">
      {/* Selection count */}
      <span className="font-medium">
        {selectedCount} photo{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}
      </span>

      {/* Divider */}
      <div className="w-px h-6 bg-white/20" />

      {/* Clear selection button */}
      <button
        onClick={onClearSelection}
        className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-white/10 transition-colors"
        disabled={isDownloading}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Désélectionner
      </button>

      {/* Download button */}
      <button
        onClick={onDownload}
        disabled={isDownloading}
        className="flex items-center gap-2 px-6 py-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] justify-center"
      >
        {isDownloading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>{downloadProgress.current}/{downloadProgress.total} ({progressPercent}%)</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Télécharger ZIP
          </>
        )}
      </button>
    </div>
  )
}
