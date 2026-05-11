import { NextRequest, NextResponse } from 'next/server'
import {
  getSelection,
  addToSelection,
  removeFromSelection,
  clearSelection,
  setSelection,
} from '@/lib/kv'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const transferId = searchParams.get('transferId')
  const sessionId = searchParams.get('sessionId')

  if (!transferId || !sessionId) {
    return NextResponse.json(
      { error: 'Missing transferId or sessionId' },
      { status: 400 }
    )
  }

  try {
    const selection = await getSelection(transferId, sessionId)
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
    const { transferId, sessionId, fileUuid, fileUuids, action } = body

    if (!transferId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing transferId or sessionId' },
        { status: 400 }
      )
    }

    let selection: string[]

    if (action === 'set' && Array.isArray(fileUuids)) {
      // Set the entire selection at once
      await setSelection(transferId, sessionId, fileUuids)
      selection = fileUuids
    } else if (fileUuid) {
      // Add or remove a single file
      if (action === 'add') {
        selection = await addToSelection(transferId, sessionId, fileUuid)
      } else if (action === 'remove') {
        selection = await removeFromSelection(transferId, sessionId, fileUuid)
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
  const transferId = searchParams.get('transferId')
  const sessionId = searchParams.get('sessionId')

  if (!transferId || !sessionId) {
    return NextResponse.json(
      { error: 'Missing transferId or sessionId' },
      { status: 400 }
    )
  }

  try {
    await clearSelection(transferId, sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing selection:', error)
    return NextResponse.json(
      { error: 'Failed to clear selection' },
      { status: 500 }
    )
  }
}
