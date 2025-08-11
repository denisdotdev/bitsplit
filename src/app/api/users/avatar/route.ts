import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const uploadAvatarSchema = z.object({
  avatarData: z.string().min(1, 'Avatar data is required'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { avatarData } = uploadAvatarSchema.parse(body)

    // Validate that it's a valid base64 image
    if (!avatarData.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
    }

    // Check file size (limit to ~1MB base64 encoded)
    if (avatarData.length > 1400000) {
      return NextResponse.json({ error: 'Image too large. Please use an image smaller than 1MB' }, { status: 400 })
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { avatarUrl: avatarData },
      select: {
        id: true,
        email: true,
        username: true,
        bitcoinAddress: true,
        avatarUrl: true,
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Avatar upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { avatarUrl: null },
      select: {
        id: true,
        email: true,
        username: true,
        bitcoinAddress: true,
        avatarUrl: true,
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}