import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const addMemberSchema = z.object({
  email: z.string().email(),
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

    const resolvedParams = await params
    const body = await request.json()
    const { email } = addMemberSchema.parse(body)

    // Check if user is admin of the group
    const groupMember = await db.groupMember.findFirst({
      where: {
        groupId: resolvedParams.id,
        userId: user.id,
        role: 'admin'
      }
    })

    if (!groupMember) {
      return NextResponse.json({ error: 'Not authorized to add members' }, { status: 403 })
    }

    // Find the user to invite
    const userToInvite = await db.user.findUnique({
      where: { email }
    })

    if (!userToInvite) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await db.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: userToInvite.id,
          groupId: resolvedParams.id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this group' }, { status: 400 })
    }

    // Add user to group
    const newMember = await db.groupMember.create({
      data: {
        userId: userToInvite.id,
        groupId: resolvedParams.id,
        role: 'member'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    })

    return NextResponse.json({ member: newMember })
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

    // Check if user is a member of the group
    const groupMember = await db.groupMember.findFirst({
      where: {
        groupId: resolvedParams.id,
        userId: user.id
      }
    })

    if (!groupMember) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Get all members
    const members = await db.groupMember.findMany({
      where: {
        groupId: resolvedParams.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          }
        }
      }
    })

    return NextResponse.json({ members })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const resolvedParams = await params
    const { searchParams } = new URL(request.url)
    const userIdToRemove = searchParams.get('userId')

    if (!userIdToRemove) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Check if current user is admin of the group
    const groupMember = await db.groupMember.findFirst({
      where: {
        groupId: resolvedParams.id,
        userId: user.id,
        role: 'admin'
      }
    })

    if (!groupMember) {
      return NextResponse.json({ error: 'Not authorized to remove members' }, { status: 403 })
    }

    // Remove the member
    await db.groupMember.delete({
      where: {
        userId_groupId: {
          userId: userIdToRemove,
          groupId: resolvedParams.id
        }
      }
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}