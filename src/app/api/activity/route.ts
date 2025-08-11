import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const expenses = await db.expense.findMany({
      where: {
        group: {
          members: {
            some: {
              userId: user.id
            }
          }
        }
      },
      include: {
        paidBy: {
          select: {
            id: true,
            username: true
          }
        },
        group: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    const settlements = await db.settlement.findMany({
      where: {
        OR: [
          { fromUserId: user.id },
          { toUserId: user.id }
        ]
      },
      include: {
        fromUser: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    const activity = [
      ...expenses.map(expense => ({
        id: `expense-${expense.id}`,
        type: 'expense' as const,
        description: expense.description,
        amount: expense.amount,
        user: expense.paidBy,
        group: expense.group.name,
        createdAt: expense.createdAt
      })),
      ...settlements.map(settlement => ({
        id: `settlement-${settlement.id}`,
        type: 'settlement' as const,
        description: `Settlement ${settlement.status}`,
        amount: settlement.amount,
        user: settlement.fromUser,
        status: settlement.status,
        txHash: settlement.txHash,
        createdAt: settlement.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ activity })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}