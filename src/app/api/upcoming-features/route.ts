import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const features = await prisma.upcomingFeature.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json(features)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status } = body

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
    }

    const count = await prisma.upcomingFeature.count()

    const feature = await prisma.upcomingFeature.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        status: status || 'coming-soon',
        order: count,
      },
    })

    return NextResponse.json(feature, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
