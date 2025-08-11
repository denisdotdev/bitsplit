import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const recentExpenses = await db.expense.findMany({
      where: {
        group: {
          members: {
            some: {
              userId: user.id
            }
          }
        },
        paidById: {
          not: user.id
        }
      },
      include: {
        paidBy: {
          select: {
            username: true
          }
        },
        group: {
          select: {
            name: true
          }
        },
        splits: {
          where: {
            userId: user.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    })

    const pendingSettlements = await db.settlement.findMany({
      where: {
        toUserId: user.id,
        status: 'pending'
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
      }
    })

    const notifications = [
      ...recentExpenses.map(expense => ({
        id: `expense-${expense.id}`,
        type: 'expense' as const,
        message: `${expense.paidBy.username} added "${expense.description}" in ${expense.group.name}`,
        amount: expense.splits[0]?.amount || 0,
        createdAt: expense.createdAt
      })),
      ...pendingSettlements.map(settlement => ({
        id: `settlement-${settlement.id}`,
        type: 'settlement' as const,
        message: `${settlement.fromUser.username} wants to settle ${settlement.amount.toFixed(8)} BTC`,
        amount: settlement.amount,
        createdAt: settlement.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ notifications })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}