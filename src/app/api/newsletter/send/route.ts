import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { sendBulkEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { subject, heading, body: emailBody, ctaText, ctaUrl, articleSlug } = body

    if (!subject?.trim() || !emailBody?.trim()) {
      return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
    }

    const subscribers = await prisma.subscriber.findMany({ where: { active: true } })
    if (subscribers.length === 0) {
      return NextResponse.json({ error: 'No active subscribers' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'DevAtlas'

    // If articleSlug provided, fetch article details
    let articleTitle = ''
    let articleExcerpt = ''
    let articleUrl = ''
    if (articleSlug) {
      const article = await prisma.article.findUnique({
        where: { slug: articleSlug },
        select: { title: true, excerpt: true, slug: true },
      })
      if (article) {
        articleTitle = article.title
        articleExcerpt = article.excerpt || ''
        articleUrl = `${appUrl}/articles/${article.slug}`
      }
    }

    const bodyHtml = emailBody.includes('<') && emailBody.includes('>')
      ? emailBody
      : emailBody.split('\n').map((line: string) => `<p style="margin: 0.5rem 0; line-height: 1.7;">${line}</p>`).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; color: #1a1a1a;">
        <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${appName}</h1>
        <p style="color: #999; font-size: 0.8125rem; margin-bottom: 2rem;">Newsletter</p>

        ${heading ? `<h2 style="font-size: 1.375rem; font-weight: 700; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #eee;">${heading}</h2>` : ''}

        <div style="font-size: 0.9375rem; color: #333;">
          ${bodyHtml}
        </div>

        ${articleTitle ? `
          <div style="margin-top: 2rem; padding: 1.5rem; background: #f9f9f9; border-radius: 12px; border: 1px solid #eee;">
            <p style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #3B82F6; margin-bottom: 0.5rem;">New Article</p>
            <h3 style="font-size: 1.125rem; font-weight: 700; margin: 0 0 0.5rem;">${articleTitle}</h3>
            ${articleExcerpt ? `<p style="color: #666; font-size: 0.875rem; margin: 0 0 1rem; line-height: 1.6;">${articleExcerpt}</p>` : ''}
            <a href="${articleUrl}" style="display: inline-block; padding: 0.75rem 1.5rem; background: #1a1a1a; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Read Blog</a>
          </div>
        ` : ''}

        ${ctaText && ctaUrl && !articleTitle ? `
          <div style="margin-top: 2rem;">
            <a href="${ctaUrl}" style="display: inline-block; padding: 0.75rem 1.5rem; background: #1a1a1a; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">${ctaText}</a>
          </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #eee; margin: 2.5rem 0 1rem;" />
        <p style="color: #999; font-size: 0.75rem; line-height: 1.6;">
          You're receiving this because you subscribed to ${appName}.<br>
          <a href="${appUrl}" style="color: #999;">Visit ${appName}</a>
          &nbsp;·&nbsp;
          <a href="${appUrl}/api/subscribers/unsubscribe?email=SUBSCRIBER_EMAIL" style="color: #999;">Unsubscribe</a>
        </p>
      </body>
      </html>
    `

    // Send to each subscriber with personalized unsubscribe link
    let sent = 0
    let failed = 0
    for (const sub of subscribers) {
      const personalizedHtml = html.replace('SUBSCRIBER_EMAIL', encodeURIComponent(sub.email))
      const result = await sendBulkEmail([sub.email], subject.trim(), personalizedHtml)
      sent += result.sent
      failed += result.failed
    }

    return NextResponse.json({ sent, failed, total: subscribers.length })
  } catch (error) {
    console.error('[Newsletter]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
