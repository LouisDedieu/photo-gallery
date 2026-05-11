import { kv } from '@vercel/kv'

const SELECTION_TTL = 30 * 24 * 60 * 60 // 30 days in seconds
const TRANSFER_CACHE_TTL = 60 * 60 // 1 hour in seconds

function getSelectionKey(transferId: string, sessionId: string): string {
  return `selection:${transferId}:${sessionId}`
}

function getTransferCacheKey(transferId: string): string {
  return `transfer:${transferId}`
}

export async function getSelection(transferId: string, sessionId: string): Promise<string[]> {
  const key = getSelectionKey(transferId, sessionId)
  const selection = await kv.get<string[]>(key)
  return selection || []
}

export async function addToSelection(
  transferId: string,
  sessionId: string,
  fileUuid: string
): Promise<string[]> {
  const key = getSelectionKey(transferId, sessionId)
  const current = await getSelection(transferId, sessionId)

  if (!current.includes(fileUuid)) {
    current.push(fileUuid)
    await kv.set(key, current, { ex: SELECTION_TTL })
  }

  return current
}

export async function removeFromSelection(
  transferId: string,
  sessionId: string,
  fileUuid: string
): Promise<string[]> {
  const key = getSelectionKey(transferId, sessionId)
  const current = await getSelection(transferId, sessionId)

  const updated = current.filter((id) => id !== fileUuid)
  await kv.set(key, updated, { ex: SELECTION_TTL })

  return updated
}

export async function setSelection(
  transferId: string,
  sessionId: string,
  fileUuids: string[]
): Promise<void> {
  const key = getSelectionKey(transferId, sessionId)
  await kv.set(key, fileUuids, { ex: SELECTION_TTL })
}

export async function clearSelection(transferId: string, sessionId: string): Promise<void> {
  const key = getSelectionKey(transferId, sessionId)
  await kv.del(key)
}

export async function getCachedTransfer<T>(transferId: string): Promise<T | null> {
  const key = getTransferCacheKey(transferId)
  return kv.get<T>(key)
}

export async function setCachedTransfer<T>(transferId: string, data: T): Promise<void> {
  const key = getTransferCacheKey(transferId)
  await kv.set(key, data, { ex: TRANSFER_CACHE_TTL })
}
