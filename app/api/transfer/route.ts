import { NextRequest, NextResponse } from 'next/server'
import { getTransferMetadata } from '@/lib/swisstransfer'

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
    const metadata = await getTransferMetadata(transferId)
    return NextResponse.json(metadata)
  } catch (error) {
    console.error('Error fetching transfer:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('expired')) {
        return NextResponse.json(
          { error: 'Transfer not found or expired' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch transfer metadata' },
      { status: 500 }
    )
  }
}
