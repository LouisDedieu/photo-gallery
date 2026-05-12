export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--apple-bg-secondary)' }}>
      <div className="text-center max-w-lg px-6">
        {/* Apple-style icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-8" style={{ background: 'linear-gradient(135deg, #007aff 0%, #5856d6 100%)', boxShadow: '0 8px 32px rgba(0, 122, 255, 0.3)' }}>
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--apple-text-primary)', letterSpacing: '-0.02em' }}>
          Galerie Photo
        </h1>

        <p className="mt-4 text-base" style={{ color: 'var(--apple-text-secondary)', lineHeight: 1.6 }}>
          Pour acceder a une galerie, utilisez le lien fourni par le photographe.
        </p>

        <div className="mt-8 p-4 rounded-xl" style={{ background: 'rgba(0, 0, 0, 0.03)', border: '1px solid var(--apple-border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--apple-text-tertiary)' }}>
            Format du lien
          </p>
          <code className="mt-2 block text-sm font-mono px-3 py-2 rounded-lg" style={{ background: 'var(--apple-bg)', color: 'var(--apple-blue)' }}>
            /gallery/[identifiant]
          </code>
        </div>
      </div>
    </div>
  )
}
