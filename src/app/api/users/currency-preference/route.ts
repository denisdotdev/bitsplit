import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const updateCurrencyPreferenceSchema = z.object({
  preferredUnit: z.enum(['BTC', 'sats']),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { preferredUnit } = updateCurrencyPreferenceSchema.parse(body)

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { preferredUnit },
      select: {
        id: true,
        email: true,
        username: true,
        bitcoinAddress: true,
        avatarUrl: true,
        preferredUnit: true,
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

    console.error('Currency preference update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}