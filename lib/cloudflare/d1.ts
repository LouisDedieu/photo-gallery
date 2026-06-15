interface D1QueryResult<T> {
  results: T[]
  success: boolean
  meta: {
    duration: number
    changes: number
    last_row_id: number
    rows_read: number
    rows_written: number
  }
}

interface D1Response<T> {
  result: D1QueryResult<T>[]
  success: boolean
  errors: { message: string }[]
  messages: string[]
}

export async function executeQuery<T = Record<string, unknown>>(
  sql: string,
  params?: (string | number | null)[]
): Promise<T[]> {
  const accountId = process.env.CF_ACCOUNT_ID
  const apiToken = process.env.CF_API_TOKEN
  const databaseId = process.env.CF_D1_DATABASE_ID

  if (!accountId || !apiToken || !databaseId) {
    throw new Error(
      'Missing D1 environment variables. Please set CF_ACCOUNT_ID, CF_API_TOKEN, and CF_D1_DATABASE_ID.'
    )
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`

  const body: { sql: string; params?: (string | number | null)[] } = { sql }
  if (params && params.length > 0) {
    body.params = params
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`D1 query failed: ${response.status} ${errorText}`)
  }

  const data: D1Response<T> = await response.json()

  if (!data.success) {
    throw new Error(`D1 query error: ${data.errors.map((e) => e.message).join(', ')}`)
  }

  return data.result[0]?.results || []
}
