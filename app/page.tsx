export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md px-4">
        <svg
          className="mx-auto h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
          Galerie Photo
        </h1>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Pour accéder à une galerie, utilisez le lien fourni par le photographe.
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
          Format: /gallery/[transferId]
        </p>
      </div>
    </div>
  )
}
