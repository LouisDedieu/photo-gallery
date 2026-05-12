import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--apple-bg-secondary)' }}>
      <div className="text-center max-w-lg px-6">
        {/* Warning icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-8" style={{ background: 'linear-gradient(135deg, #ff9500 0%, #ff3b30 100%)', boxShadow: '0 8px 32px rgba(255, 59, 48, 0.3)' }}>
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--apple-text-primary)', letterSpacing: '-0.02em' }}>
          Galerie introuvable
        </h1>

        <p className="mt-4 text-base" style={{ color: 'var(--apple-text-secondary)', lineHeight: 1.6 }}>
          Ce transfert n'existe pas ou a expire. Les fichiers sont disponibles pendant une duree limitee.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium transition-all hover:opacity-90"
          style={{ background: 'var(--apple-blue)', boxShadow: '0 4px 16px rgba(0, 122, 255, 0.3)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour a l'accueil
        </Link>
      </div>
    </div>
  )
}
