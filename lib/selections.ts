import { getSupabase } from './supabase'

interface SelectionRow {
  id: string
  gallery_id: string
  session_id: string
  photo_ids: string[]
  updated_at: string
}

export async function getSelection(galleryId: string, sessionId: string): Promise<string[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('selections')
    .select('photo_ids')
    .eq('gallery_id', galleryId)
    .eq('session_id', sessionId)
    .single<Pick<SelectionRow, 'photo_ids'>>()

  if (error || !data) {
    return []
  }

  return data.photo_ids || []
}

export async function setSelection(
  galleryId: string,
  sessionId: string,
  photoIds: string[]
): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase
    .from('selections')
    .upsert(
      {
        gallery_id: galleryId,
        session_id: sessionId,
        photo_ids: photoIds,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'gallery_id,session_id',
      }
    )

  if (error) {
    throw new Error('Failed to save selection')
  }
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
  const supabase = getSupabase()

  const { error } = await supabase
    .from('selections')
    .delete()
    .eq('gallery_id', galleryId)
    .eq('session_id', sessionId)

  if (error) {
    throw new Error('Failed to clear selection')
  }
}
