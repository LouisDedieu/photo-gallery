import { NextRequest, NextResponse } from 'next/server'
import {
  getSelection,
  addToSelection,
  removeFromSelection,
  clearSelection,
  setSelection,
} from '@/lib/selections'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const galleryId = searchParams.get('galleryId')
  const sessionId = searchParams.get('sessionId')

  if (!galleryId || !sessionId) {
    return NextResponse.json(
      { error: 'Missing galleryId or sessionId' },
      { status: 400 }
    )
  }

  try {
    const selection = await getSelection(galleryId, sessionId)
    return NextResponse.json({ selection })
  } catch (error) {
    console.error('Error getting selection:', error)
    return NextResponse.json(
      { error: 'Failed to get selection' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { galleryId, sessionId, fileUuid, fileUuids, action } = body

    if (!galleryId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing galleryId or sessionId' },
        { status: 400 }
      )
    }

    let selection: string[]

    if (action === 'set' && Array.isArray(fileUuids)) {
      await setSelection(galleryId, sessionId, fileUuids)
      selection = fileUuids
    } else if (fileUuid) {
      if (action === 'add') {
        selection = await addToSelection(galleryId, sessionId, fileUuid)
      } else if (action === 'remove') {
        selection = await removeFromSelection(galleryId, sessionId, fileUuid)
      } else {
        return NextResponse.json(
          { error: 'Invalid action. Use "add", "remove", or "set"' },
          { status: 400 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Missing fileUuid or fileUuids' },
        { status: 400 }
      )
    }

    return NextResponse.json({ selection })
  } catch (error) {
    console.error('Error updating selection:', error)
    return NextResponse.json(
      { error: 'Failed to update selection' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const galleryId = searchParams.get('galleryId')
  const sessionId = searchParams.get('sessionId')

  if (!galleryId || !sessionId) {
    return NextResponse.json(
      { error: 'Missing galleryId or sessionId' },
      { status: 400 }
    )
  }

  try {
    await clearSelection(galleryId, sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing selection:', error)
    return NextResponse.json(
      { error: 'Failed to clear selection' },
      { status: 500 }
    )
  }
}
