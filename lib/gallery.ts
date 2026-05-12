import { getSupabase, STORAGE_BUCKET, getThumbnailUrl } from './supabase'
import { TransferMetadata, GalleryFile } from './types'

export async function getGalleryBySlug(slug: string): Promise<TransferMetadata> {
  const supabase = getSupabase()

  // List all files in the folder
  const { data: files, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(slug, {
      sortBy: { column: 'name', order: 'asc' },
    })

  if (error) {
    throw new Error('Gallery not found')
  }

  if (!files || files.length === 0) {
    throw new Error('Gallery not found or empty')
  }

  // Filter only image files
  const imageFiles = files.filter((file) => {
    const ext = file.name.toLowerCase().split('.').pop()
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext || '')
  })

  // Build gallery files with public URLs and thumbnail URLs
  const galleryFiles: GalleryFile[] = imageFiles.map((file) => {
    const storagePath = `${slug}/${file.name}`
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath)

    return {
      uuid: file.id || file.name,
      fileName: file.name,
      fileSize: file.metadata?.size || 0,
      mimeType: file.metadata?.mimetype || 'image/jpeg',
      url: data.publicUrl,
      thumbnailUrl: getThumbnailUrl(storagePath),
    }
  })

  return {
    transferId: slug,
    galleryId: slug,
    expiresAt: '',
    createdAt: new Date().toISOString(),
    files: galleryFiles,
  }
}
