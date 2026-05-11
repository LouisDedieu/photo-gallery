import { NextRequest, NextResponse } from 'next/server'
import { streamFile } from '@/lib/swisstransfer'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const transferId = searchParams.get('transferId')
  const fileUuid = searchParams.get('fileUuid')

  if (!transferId || !fileUuid) {
    return NextResponse.json(
      { error: 'Missing transferId or fileUuid' },
      { status: 400 }
    )
  }

  try {
    const response = await streamFile(transferId, fileUuid)

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const body = response.body

    if (!body) {
      return NextResponse.json(
        { error: 'Empty response from SwissTransfer' },
        { status: 502 }
      )
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache agressif : 7 jours sur CDN, 30 jours navigateur
        'Cache-Control': 'public, max-age=2592000, s-maxage=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error streaming image:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    // Return a specific status for rate limiting
    if (message.includes('429') || message.includes('rate')) {
      return NextResponse.json(
        { error: 'Rate limited by SwissTransfer, please retry' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    )
  }
}
