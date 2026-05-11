export interface SwissTransferFile {
  UUID: string
  containerUUID: string
  fileName: string
  fileSizeInBytes: number
  downloadCounter: number
  createdDate: string
  expiredDate: string
  deletedDate: string | null
  mimeType: string
  receivedSizeInBytes: number
  path: string
  eVirus: string
}

export interface SwissTransferContainer {
  UUID: string
  duration: number
  createdDate: string
  expiredDate: string
  numberOfFile: number
  message: string
  needPassword: number
  lang: string
  sizeUploaded: number
  deletedDate: string | null
  swiftVersion: number
  downloadLimit: number
  source: string
  files: SwissTransferFile[]
}

export interface SwissTransferLinkData {
  linkUUID: string
  containerUUID: string
  downloadCounterCredit: number
  createdDate: string
  expiredDate: string
  isDownloadOnetime: number
  isMailSent: number
  downloadHost: string
  container: SwissTransferContainer
}

export interface SwissTransferResponse {
  result: string
  data: SwissTransferLinkData
}

export interface GalleryFile {
  uuid: string
  fileName: string
  fileSize: number
  mimeType: string
}

export interface TransferMetadata {
  transferId: string
  downloadHost: string
  expiresAt: string
  createdAt: string
  files: GalleryFile[]
  message?: string
}

export interface SelectionState {
  transferId: string
  sessionId: string
  selectedIds: string[]
}
