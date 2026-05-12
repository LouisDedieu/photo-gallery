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
    <div className="apple-floating-bar">
      {/* Selection count */}
      <span className="bar-text">
        {selectedCount} photo{selectedCount > 1 ? 's' : ''} selectionnee{selectedCount > 1 ? 's' : ''}
      </span>

      {/* Divider */}
      <div className="bar-divider" />

      {/* Clear selection button */}
      <button
        onClick={onClearSelection}
        disabled={isDownloading}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Annuler
      </button>

      {/* Download button */}
      <button
        onClick={onDownload}
        disabled={isDownloading}
        className="primary"
        style={{ minWidth: '160px' }}
      >
        {isDownloading ? (
          <>
            <div
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
              style={{ animation: 'spin 0.8s linear infinite' }}
            />
            <span>{downloadProgress.current}/{downloadProgress.total}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Telecharger
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
