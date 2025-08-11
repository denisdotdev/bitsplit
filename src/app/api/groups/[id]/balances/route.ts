import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { calculateUserBalances, calculateOptimalSettlements } from '@/lib/settlement-calculator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const resolvedParams = await params
    const group = await db.group.findFirst({
      where: {
        id: resolvedParams.id,
        members: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                bitcoinAddress: true,
              }
            }
          }
        },
        expenses: {
          include: {
            splits: true,
            paidBy: {
              select: {
                id: true,
                username: true,
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const balances = calculateUserBalances(group.expenses)
    const settlements = calculateOptimalSettlements(balances)

    const enrichedBalances = balances.map(balance => {
      const member = group.members.find(m => m.userId === balance.userId)
      return {
        ...balance,
        user: member?.user
      }
    })

    const enrichedSettlements = settlements.map(settlement => {
      const fromUser = group.members.find(m => m.userId === settlement.fromUserId)?.user
      const toUser = group.members.find(m => m.userId === settlement.toUserId)?.user
      return {
        ...settlement,
        fromUser,
        toUser
      }
    })

    return NextResponse.json({
      balances: enrichedBalances,
      settlements: enrichedSettlements
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}