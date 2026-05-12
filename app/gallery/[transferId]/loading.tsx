export default function Loading() {
  return (
    <div className="apple-window">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <aside className="apple-sidebar">
          <div className="window-controls">
            <div className="window-control close" />
            <div className="window-control minimize" />
            <div className="window-control maximize" />
          </div>

          <div className="pt-10 px-4">
            <div className="h-3 w-16 rounded skeleton-pulse" />
            <div className="mt-4 h-8 w-full rounded-md skeleton-light" />

            <div className="mt-8 h-3 w-16 rounded skeleton-pulse" />
            <div className="mt-4 h-8 w-full rounded-md skeleton-blue" />
          </div>
        </aside>

        {/* Main content skeleton */}
        <main className="apple-main">
          <header className="apple-header">
            <div>
              <div className="h-7 w-48 rounded-md skeleton-pulse" />
              <div className="h-4 w-24 rounded mt-2 skeleton-light" />
            </div>
          </header>

          <div className="photo-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="photo-card skeleton-shimmer"
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
