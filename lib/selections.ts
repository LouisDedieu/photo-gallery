import { executeQuery } from './cloudflare/d1'

interface SelectionRow {
  id: string
  gallery_id: string
  session_id: string
  photo_ids: string // JSON string in D1
  updated_at: string
}

export async function getSelection(galleryId: string, sessionId: string): Promise<string[]> {
  const results = await executeQuery<Pick<SelectionRow, 'photo_ids'>>(
    'SELECT photo_ids FROM selections WHERE gallery_id = ? AND session_id = ?',
    [galleryId, sessionId]
  )

  if (results.length === 0) {
    return []
  }

  try {
    return JSON.parse(results[0].photo_ids) as string[]
  } catch {
    return []
  }
}

export async function setSelection(
  galleryId: string,
  sessionId: string,
  photoIds: string[]
): Promise<void> {
  const photoIdsJson = JSON.stringify(photoIds)
  const now = new Date().toISOString()

  await executeQuery(
    `INSERT INTO selections (gallery_id, session_id, photo_ids, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(gallery_id, session_id)
     DO UPDATE SET photo_ids = ?, updated_at = ?`,
    [galleryId, sessionId, photoIdsJson, now, photoIdsJson, now]
  )
}

export async function addToSelection(
  galleryId: string,
  sessionId: string,
  photoId: string
): Promise<string[]> {
  const current = await getSelection(galleryId, sessionId)

  if (!current.includes(photoId)) {
    current.push(photoId)
    await setSelection(galleryId, sessionId, current)
  }

  return current
}

export async function removeFromSelection(
  galleryId: string,
  sessionId: string,
  photoId: string
): Promise<string[]> {
  const current = await getSelection(galleryId, sessionId)
  const updated = current.filter((id) => id !== photoId)
  await setSelection(galleryId, sessionId, updated)
  return updated
}

export async function clearSelection(galleryId: string, sessionId: string): Promise<void> {
  await executeQuery(
    'DELETE FROM selections WHERE gallery_id = ? AND session_id = ?',
    [galleryId, sessionId]
  )
}
