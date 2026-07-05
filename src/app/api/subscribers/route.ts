import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(subscribers)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const existing = await prisma.subscriber.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existing) {
      if (!existing.active) {
        await prisma.subscriber.update({ where: { id: existing.id }, data: { active: true } })
        return NextResponse.json({ message: 'Welcome back!' })
      }
      return NextResponse.json({ message: 'Already subscribed!' })
    }

    await prisma.subscriber.create({ data: { email: email.trim().toLowerCase() } })
    return NextResponse.json({ message: 'Subscribed successfully!' }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
