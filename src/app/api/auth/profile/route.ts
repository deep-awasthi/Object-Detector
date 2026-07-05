import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession, verifyPassword, hashPassword } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, avatar: true, bio: true, createdAt: true },
  })

  return NextResponse.json(user)
}

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, email, bio, avatar, currentPassword, newPassword } = body

  // If changing password, verify current password first
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const valid = await verifyPassword(currentPassword, user.password)
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 })
    }
  }

  // Check if email is already taken by another user
  if (email) {
    const existing = await prisma.user.findFirst({ where: { email, NOT: { id: session.userId } } })
    if (existing) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 400 })
    }
  }

  const updateData: Record<string, unknown> = {}
  if (name !== undefined) updateData.name = name
  if (email !== undefined) updateData.email = email
  if (bio !== undefined) updateData.bio = bio
  if (avatar !== undefined) updateData.avatar = avatar
  if (newPassword) updateData.password = await hashPassword(newPassword)

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data: updateData,
    select: { id: true, name: true, email: true, avatar: true, bio: true },
  })

  return NextResponse.json(updated)
}
