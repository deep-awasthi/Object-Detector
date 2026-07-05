import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { articleSchema } from '@/lib/validators'
import { calculateReadingTime } from '@/lib/utils'
import { sendBulkEmail, buildArticleEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const published = searchParams.get('published')
    const featured = searchParams.get('featured')

    const where: Record<string, unknown> = {}
    if (published !== null) where.published = published === 'true'
    if (featured !== null) where.featured = featured === 'true'
    if (category) where.category = { slug: category, enabled: true }
    else where.category = { enabled: true }
    if (tag) where.tags = { some: { tag: { slug: tag } } }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contentHtml: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: { category: true, tags: { include: { tag: true } }, author: { select: { name: true } } },
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.article.count({ where }),
    ])

    return NextResponse.json({
      articles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
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
    const parsed = articleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const readingTime = calculateReadingTime(data.contentHtml)

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        contentHtml: data.contentHtml,
        excerpt: data.excerpt,
        coverImage: data.coverImage || null,
        published: data.published,
        featured: data.featured,
        pinned: data.pinned,
        readingTime,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        canonicalUrl: data.canonicalUrl || null,
        publishedAt: data.published ? new Date() : null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        authorId: session.userId,
        categoryId: data.categoryId,
        tags: {
          create: data.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
      },
      include: { category: true, tags: { include: { tag: true } } },
    })

    if (article.published) {
      const settings = await prisma.siteSettings.findFirst()
      if (settings?.emailingEnabled) {
        const subscribers = await prisma.subscriber.findMany({ where: { active: true } })
        if (subscribers.length > 0) {
          const { subject, html } = buildArticleEmail(article)
          const emails = subscribers.map((s) => s.email)
          sendBulkEmail(emails, subject, html).catch(() => {})
        }
      }
    }

    return NextResponse.json(article, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
