export interface GalleryFile {
  uuid: string
  fileName: string
  fileSize: number
  mimeType: string
  url: string
  thumbnailUrl: string
}

export interface TransferMetadata {
  transferId: string
  galleryId: string
  expiresAt: string
  createdAt: string
  files: GalleryFile[]
  title?: string
  message?: string
}

export interface SelectionState {
  galleryId: string
  sessionId: string
  selectedIds: string[]
}
