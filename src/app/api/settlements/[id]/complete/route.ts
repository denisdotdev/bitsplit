import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { validateBitcoinAddress } from '@/lib/bitcoin'

const completeSettlementSchema = z.object({
  txHash: z.string().min(1),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { txHash } = completeSettlementSchema.parse(body)
    
    const resolvedParams = await params
    const settlement = await db.settlement.findFirst({
      where: {
        id: resolvedParams.id,
        fromUserId: user.id,
        status: 'pending'
      }
    })

    if (!settlement) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
    }

    const updatedSettlement = await db.settlement.update({
      where: { id: resolvedParams.id },
      data: {
        txHash,
        status: 'completed',
        completedAt: new Date()
      }
    })

    return NextResponse.json({ settlement: updatedSettlement })
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