import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ articles: [] })
    }

    const articles = await prisma.article.findMany({
      where: {
        published: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { contentHtml: { contains: query, mode: 'insensitive' } },
          { excerpt: { contains: query, mode: 'insensitive' } },
          { tags: { some: { tag: { name: { contains: query, mode: 'insensitive' } } } } },
          { category: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        category: { select: { name: true, slug: true } },
        author: { select: { name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
