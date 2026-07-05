import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { articleSchema } from '@/lib/validators'
import { calculateReadingTime } from '@/lib/utils'
import { sendBulkEmail, buildArticleEmail } from '@/lib/email'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        category: true,
        tags: { include: { tag: true } },
        author: { select: { id: true, name: true, avatar: true, bio: true } },
      },
    })

    if (!article || !article.category.enabled) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()
    const parsed = articleSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.article.findUnique({ where: { slug }, select: { published: true } })

    const data = parsed.data
    const readingTime = calculateReadingTime(data.contentHtml)

    const article = await prisma.article.update({
      where: { slug },
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
        categoryId: data.categoryId,
        tags: {
          deleteMany: {},
          create: data.tagIds.map((tagId) => ({ tag: { connect: { id: tagId } } })),
        },
      },
      include: { category: true, tags: { include: { tag: true } } },
    })

    if (existing && !existing.published && article.published) {
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

    return NextResponse.json(article)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    const body = await request.json()

    const existing = await prisma.article.findUnique({ where: { slug }, select: { published: true } })

    const updateData: Record<string, unknown> = { ...body }
    if (!existing?.published && body.published === true) {
      updateData.publishedAt = new Date()
    }
    if (existing?.published && body.published === false) {
      updateData.publishedAt = null
    }

    const article = await prisma.article.update({
      where: { slug },
      data: updateData,
      include: { category: true, tags: { include: { tag: true } } },
    })

    if (existing && !existing.published && article.published) {
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

    return NextResponse.json(article)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { slug } = await params
    await prisma.article.delete({ where: { slug } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
