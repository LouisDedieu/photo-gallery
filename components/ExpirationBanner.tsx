'use client'

interface ExpirationBannerProps {
  expiresAt: string
}

export function ExpirationBanner({ expiresAt }: ExpirationBannerProps) {
  const expirationDate = new Date(expiresAt)
  const now = new Date()
  const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysRemaining <= 0) {
    return (
      <div className="bg-red-600 text-white px-4 py-3 text-center">
        <span className="font-medium">Ce transfert a expiré.</span>
        {' '}Les fichiers ne sont plus disponibles au téléchargement.
      </div>
    )
  }

  if (daysRemaining <= 7) {
    return (
      <div className="bg-amber-500 text-white px-4 py-3 text-center">
        <span className="font-medium">Attention :</span>
        {' '}Ce transfert expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}.
        Téléchargez vos photos rapidement !
      </div>
    )
  }

  return null
}
