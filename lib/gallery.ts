import { getSupabase, STORAGE_BUCKET, getThumbnailUrl } from './supabase'
import { TransferMetadata, GalleryFile } from './types'
import { projects, type Project } from './portfolio-config'

export interface ProjectWithCover extends Project {
  coverUrl: string | null
}

export async function getProjectsWithCovers(): Promise<ProjectWithCover[]> {
  const supabase = getSupabase()

  const projectsWithCovers = await Promise.all(
    projects.map(async (project) => {
      try {
        // Si une cover est spécifiée, l'utiliser directement
        if (project.cover) {
          const storagePath = `${project.slug}/${project.cover}`
          return {
            ...project,
            coverUrl: getThumbnailUrl(storagePath, 1200, 90),
          }
        }

        // Sinon, prendre la première image du dossier
        const { data: files } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list(project.slug, {
            limit: 10,
            sortBy: { column: 'name', order: 'asc' },
          })

        if (files && files.length > 0) {
          const firstImage = files.find((file) => {
            const ext = file.name.toLowerCase().split('.').pop()
            return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
          })

          if (firstImage) {
            const storagePath = `${project.slug}/${firstImage.name}`
            return {
              ...project,
              coverUrl: getThumbnailUrl(storagePath, 1200, 90),
            }
          }
        }

        return { ...project, coverUrl: null }
      } catch {
        return { ...project, coverUrl: null }
      }
    })
  )

  return projectsWithCovers
}

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
