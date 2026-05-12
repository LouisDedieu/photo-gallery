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
      <div className="expiration-banner expired">
        <span className="font-semibold">Ce transfert a expire.</span>
        {' '}Les fichiers ne sont plus disponibles au telechargement.
      </div>
    )
  }

  if (daysRemaining <= 7) {
    return (
      <div className="expiration-banner warning">
        <span className="font-semibold">Attention :</span>
        {' '}Ce transfert expire dans {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}.
        Telechargez vos photos rapidement !
      </div>
    )
  }

  return null
}
