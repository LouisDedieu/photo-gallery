import { S3Client, ListObjectsV2Command, _Object } from '@aws-sdk/client-s3'

let r2Client: S3Client | null = null

function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client
  }

  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing R2 environment variables. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.'
    )
  }

  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return r2Client
}

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'gallery-photos'

export function getPublicUrl(path: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL
  if (!publicUrl) {
    throw new Error('Missing R2_PUBLIC_URL environment variable')
  }
  return `${publicUrl}/${path}`
}

export interface R2File {
  key: string
  name: string
  size: number
  lastModified: Date | undefined
}

export async function listFiles(prefix: string): Promise<R2File[]> {
  const client = getR2Client()

  const command = new ListObjectsV2Command({
    Bucket: R2_BUCKET_NAME,
    Prefix: prefix.endsWith('/') ? prefix : `${prefix}/`,
  })

  const response = await client.send(command)

  if (!response.Contents) {
    return []
  }

  return response.Contents
    .filter((obj): obj is _Object & { Key: string } => !!obj.Key)
    .map((obj) => ({
      key: obj.Key,
      name: obj.Key.split('/').pop() || obj.Key,
      size: obj.Size || 0,
      lastModified: obj.LastModified,
    }))
    .filter((file) => file.name && !file.name.startsWith('.'))
    .sort((a, b) => a.name.localeCompare(b.name))
}
