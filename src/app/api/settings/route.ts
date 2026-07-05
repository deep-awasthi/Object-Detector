import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findFirst()
    return NextResponse.json(settings || {
      siteName: 'DevAtlas',
      tagline: 'Crafting knowledge for engineers.',
      analyticsEnabled: false,
      newsletterEnabled: true,
      emailingEnabled: false,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const updateData: Record<string, unknown> = {}
    if (body.siteName !== undefined) updateData.siteName = body.siteName
    if (body.tagline !== undefined) updateData.tagline = body.tagline
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.contactEmail !== undefined) updateData.contactEmail = body.contactEmail || null
    if (body.socialLinks !== undefined) updateData.socialLinks = body.socialLinks
    if (body.footerContent !== undefined) updateData.footerContent = body.footerContent || null
    if (body.logo !== undefined) updateData.logo = body.logo || null
    if (body.favicon !== undefined) updateData.favicon = body.favicon || null
    if (body.seoDefaultTitle !== undefined) updateData.seoDefaultTitle = body.seoDefaultTitle || null
    if (body.seoDefaultDesc !== undefined) updateData.seoDefaultDesc = body.seoDefaultDesc || null
    if (body.analyticsEnabled !== undefined) updateData.analyticsEnabled = body.analyticsEnabled
    if (body.newsletterEnabled !== undefined) updateData.newsletterEnabled = body.newsletterEnabled
    if (body.emailingEnabled !== undefined) updateData.emailingEnabled = body.emailingEnabled

    const settings = await prisma.siteSettings.upsert({
      where: { userId: session.userId },
      update: updateData,
      create: { ...updateData, userId: session.userId },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('[Settings]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
