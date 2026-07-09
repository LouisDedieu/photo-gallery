import { listFiles, getPublicUrl, type R2File } from './cloudflare/r2'
import { TransferMetadata, GalleryFile } from './types'
import { projects, albums, type Project } from './portfolio-config'

export interface ProjectWithCover extends Project {
  coverUrl: string | null
}

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic']

function isImageFile(fileName: string): boolean {
  const ext = fileName.toLowerCase().split('.').pop()
  return IMAGE_EXTENSIONS.includes(ext || '')
}

export async function getProjectsWithCovers(): Promise<ProjectWithCover[]> {
  const projectsWithCovers = await Promise.all(
    projects.map(async (project) => {
      try {
        // Si une cover est spécifiée, l'utiliser directement
        if (project.cover) {
          const storagePath = `${project.slug}/${project.cover}`
          return {
            ...project,
            coverUrl: getPublicUrl(storagePath),
          }
        }

        // Sinon, prendre la première image du dossier
        const files = await listFiles(project.slug)

        const firstImage = files.find((file) => isImageFile(file.name))

        if (firstImage) {
          return {
            ...project,
            coverUrl: getPublicUrl(firstImage.key),
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
  const files = await listFiles(slug)

  if (files.length === 0) {
    throw new Error('Gallery not found or empty')
  }

  // Filter only image files
  const imageFiles = files.filter((file) => isImageFile(file.name))

  // Retro subfolder inside the current folder: `<slug>/<slug>-retro/`
  // Listing is recursive, so these files must be split out from the main gallery.
  const retroPrefix = `${slug}/${slug}-retro/`
  const mainImageFiles = imageFiles.filter((file) => !file.key.startsWith(retroPrefix))
  const retroImageFiles = imageFiles.filter((file) => file.key.startsWith(retroPrefix))

  if (mainImageFiles.length === 0 && retroImageFiles.length === 0) {
    throw new Error('Gallery not found or empty')
  }

  // Build gallery files with public URLs
  const toGalleryFile = (file: R2File): GalleryFile => {
    const publicUrl = getPublicUrl(file.key)

    return {
      uuid: file.key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: getMimeType(file.name),
      url: publicUrl,
      thumbnailUrl: publicUrl, // Next.js Image handles optimization
    }
  }

  const galleryFiles = mainImageFiles.map(toGalleryFile)
  const retroFiles = retroImageFiles.map(toGalleryFile)

  const project = projects.find(p => p.slug === slug)
  const album = albums.find(a => a.slug === slug)
  const title = project?.title || album?.title || undefined

  return {
    transferId: slug,
    galleryId: slug,
    title,
    expiresAt: '',
    createdAt: new Date().toISOString(),
    files: galleryFiles,
    retroFiles: retroFiles.length > 0 ? retroFiles : undefined,
  }
}

function getMimeType(fileName: string): string {
  const ext = fileName.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
  }
  return mimeTypes[ext || ''] || 'image/jpeg'
}
