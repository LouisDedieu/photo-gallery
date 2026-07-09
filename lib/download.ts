// Helpers de téléchargement / partage natif des photos.
//
// Sur mobile, l'API Web Share niveau 2 (`navigator.share({ files })`) est la
// seule voie pour enregistrer une image dans la galerie/Photos du téléphone.
// Sur desktop (pas de partage de fichiers), on retombe sur le téléchargement
// fichier classique (ZIP ou <a download>).

export type ShareResult = 'shared' | 'cancelled' | 'unsupported' | 'gesture-lost' | 'error'

// Détecte un vrai appareil mobile (iOS / Android).
// Nécessaire car les navigateurs desktop récents (Safari macOS, Chrome) supportent
// aussi navigator.share — or on veut y réserver le téléchargement direct (ZIP / fichier).
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  // iPadOS se présente comme un Mac → on le repère via les points tactiles.
  const isIOS = /iPhone|iPad|iPod/.test(ua) || (ua.includes('Mac') && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  return isIOS || isAndroid
}

// Détecte le support du partage de fichiers (mobile compatible).
// Quand on a les fichiers réels, on les teste avec navigator.canShare car
// certains navigateurs refusent certains types/tailles.
export function canShareFiles(files?: File[]): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function' || typeof navigator.share !== 'function') {
    return false
  }
  try {
    return files ? navigator.canShare({ files }) : true
  } catch {
    return false
  }
}

// fetch cross-origin R2 → File (même fetch que le flux ZIP historique).
export async function fetchAsFile(url: string, fileName: string, mimeType: string): Promise<File> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${fileName}: ${res.status}`)
  }
  const blob = await res.blob()
  return new File([blob], fileName, { type: mimeType || blob.type || 'image/jpeg' })
}

// Fallback : téléchargement fichier direct (comportement navigateur classique).
export function downloadBlobFile(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(objectUrl)
}

// Tente le partage natif ; renvoie un statut exploitable par l'appelant.
export async function shareFiles(files: File[]): Promise<ShareResult> {
  if (!canShareFiles(files)) return 'unsupported'
  try {
    await navigator.share({ files })
    return 'shared'
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    if (name === 'AbortError') return 'cancelled' // utilisateur a fermé la feuille
    if (name === 'NotAllowedError') return 'gesture-lost' // geste utilisateur expiré (iOS)
    return 'error'
  }
}
