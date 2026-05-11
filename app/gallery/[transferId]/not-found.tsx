import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md px-4">
        <svg
          className="mx-auto h-16 w-16 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
          Galerie introuvable
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Ce transfert n'existe pas ou a expiré. Les fichiers SwissTransfer sont
          disponibles pendant 30 jours maximum.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
