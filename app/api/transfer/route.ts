import { NextRequest, NextResponse } from 'next/server'
import { getGalleryBySlug } from '@/lib/gallery'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const transferId = searchParams.get('id')

  if (!transferId) {
    return NextResponse.json(
      { error: 'Missing transfer ID' },
      { status: 400 }
    )
  }

  try {
    const metadata = await getGalleryBySlug(transferId)
    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error fetching transfer:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Gallery not found or expired' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch gallery metadata' },
      { status: 500 }
    )
  }
}
