import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const subscriber = await prisma.subscriber.findUnique({ where: { email: email.toLowerCase() } })

    if (!subscriber) {
      return NextResponse.redirect(new URL('/unsubscribe?status=not-found', request.url))
    }

    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { active: false },
    })

    return NextResponse.redirect(new URL('/unsubscribe?status=success', request.url))
  } catch (error) {
    console.error('[Unsubscribe]', error)
    return NextResponse.redirect(new URL('/unsubscribe?status=error', request.url))
  }
}
