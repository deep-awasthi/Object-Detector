import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [
      totalArticles,
      publishedArticles,
      draftArticles,
      totalCategories,
      totalMedia,
      totalTags,
      recentArticles,
      categoryStats,
    ] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { published: true } }),
      prisma.article.count({ where: { published: false } }),
      prisma.category.count(),
      prisma.media.count(),
      prisma.tag.count(),
      prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          title: true,
          slug: true,
          published: true,
          featured: true,
          readingTime: true,
          createdAt: true,
          publishedAt: true,
          category: { select: { name: true, color: true } },
        },
      }),
      prisma.category.findMany({
        select: {
          name: true,
          color: true,
          _count: { select: { articles: true } },
        },
        orderBy: { articles: { _count: 'desc' } },
        take: 6,
      }),
    ])

    return NextResponse.json({
      stats: {
        totalArticles,
        publishedArticles,
        draftArticles,
        totalCategories,
        totalMedia,
        totalTags,
      },
      recentArticles,
      categoryStats,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
