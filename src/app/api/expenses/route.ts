import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().positive(),
  groupId: z.string(),
  splitType: z.enum(['equal', 'custom']),
  splits: z.array(z.object({
    userId: z.string(),
    amount: z.number().positive(),
  })).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { description, amount, groupId, splitType, splits } = createExpenseSchema.parse(body)

    const group = await db.group.findFirst({
      where: {
        id: groupId,
        members: {
          some: {
            userId: user.id
          }
        }
      },
      include: {
        members: true
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    let expenseSplits
    if (splitType === 'equal') {
      const splitAmount = amount / group.members.length
      expenseSplits = group.members.map(member => ({
        userId: member.userId,
        amount: splitAmount,
      }))
    } else if (splits) {
      expenseSplits = splits
    } else {
      return NextResponse.json({ error: 'Splits required for custom split type' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: {
        description,
        amount,
        paidById: user.id,
        groupId,
        splits: {
          create: expenseSplits.map(split => ({
            userId: split.userId,
            amount: split.amount,
          }))
        }
      },
      include: {
        paidBy: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          }
        },
        splits: {
          include: {
            expense: false
          }
        }
      }
    })

    return NextResponse.json({ expense })
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

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    const whereClause = groupId 
      ? {
          groupId,
          group: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        }
      : {
          group: {
            members: {
              some: {
                userId: user.id
              }
            }
          }
        }

    const expenses = await db.expense.findMany({
      where: whereClause,
      include: {
        paidBy: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          }
        },
        group: {
          select: {
            id: true,
            name: true,
          }
        },
        splits: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}