import { SwissTransferResponse, TransferMetadata, GalleryFile } from './types'

const SWISSTRANSFER_API_BASE = 'https://www.swisstransfer.com/api'

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://www.swisstransfer.com/',
  'Origin': 'https://www.swisstransfer.com',
}

export async function getTransferMetadata(transferId: string): Promise<TransferMetadata> {
  const response = await fetch(`${SWISSTRANSFER_API_BASE}/links/${transferId}`, {
    headers: DEFAULT_HEADERS,
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Transfer not found or expired')
    }
    throw new Error(`SwissTransfer API error: ${response.status}`)
  }

  const data: SwissTransferResponse = await response.json()
  const linkData = data.data
  const container = linkData.container

  const files: GalleryFile[] = container.files.map((file) => ({
    uuid: file.UUID,
    fileName: file.fileName,
    fileSize: file.fileSizeInBytes,
    mimeType: file.mimeType,
  }))

  // Sort files by name for consistent ordering
  files.sort((a, b) => a.fileName.localeCompare(b.fileName))

  return {
    transferId,
    downloadHost: linkData.downloadHost,
    expiresAt: container.expiredDate,
    createdAt: container.createdDate,
    files,
    message: container.message || undefined,
  }
}

export function getDownloadUrl(downloadHost: string, fileUuid: string): string {
  return `https://${downloadHost}/${fileUuid}`
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function streamFile(
  downloadHost: string,
  fileUuid: string,
  retries = 3
): Promise<Response> {
  const downloadUrl = getDownloadUrl(downloadHost, fileUuid)

  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(downloadUrl, {
      headers: {
        ...DEFAULT_HEADERS,
        'Accept': 'image/*, */*',
      },
    })

    if (response.ok) {
      return response
    }

    // Rate limited - wait and retry
    if (response.status === 429) {
      const waitTime = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
      console.log(`Rate limited, waiting ${waitTime}ms before retry...`)
      await delay(waitTime)
      continue
    }

    throw new Error(`Failed to download file: ${response.status}`)
  }

  throw new Error('Max retries exceeded for rate limiting')
}
