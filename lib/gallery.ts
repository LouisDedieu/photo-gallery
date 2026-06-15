import { listFiles, getPublicUrl } from './cloudflare/r2'
import { TransferMetadata, GalleryFile } from './types'
import { projects, type Project } from './portfolio-config'

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

  if (imageFiles.length === 0) {
    throw new Error('Gallery not found or empty')
  }

  // Build gallery files with public URLs
  const galleryFiles: GalleryFile[] = imageFiles.map((file) => {
    const publicUrl = getPublicUrl(file.key)

    return {
      uuid: file.key,
      fileName: file.name,
      fileSize: file.size,
      mimeType: getMimeType(file.name),
      url: publicUrl,
      thumbnailUrl: publicUrl, // Next.js Image handles optimization
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
