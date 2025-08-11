import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { validateBitcoinAddress } from '@/lib/bitcoin'

const updateAddressSchema = z.object({
  bitcoinAddress: z.string().refine(validateBitcoinAddress, {
    message: 'Invalid Bitcoin address'
  })
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { bitcoinAddress } = updateAddressSchema.parse(body)

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { bitcoinAddress },
      select: {
        id: true,
        email: true,
        username: true,
        bitcoinAddress: true,
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

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}