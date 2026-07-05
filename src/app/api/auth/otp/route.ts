import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, purpose } = body

    console.log('[OTP] Request:', email, purpose)

    if (!email || !purpose) {
      return NextResponse.json({ error: 'Email and purpose are required' }, { status: 400 })
    }

    if (!['login', 'change-email', 'change-password'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 })
    }

    if (purpose === 'login') {
      const user = await prisma.user.findUnique({ where: { email } })
      if (!user) {
        console.log('[OTP] User not found:', email)
        return NextResponse.json({ message: 'If an account exists, a code has been sent.' })
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.otp.updateMany({ where: { email, purpose, used: false }, data: { used: true } })
    await prisma.otp.create({ data: { email, code, purpose, expiresAt } })

    console.log('[OTP] Code:', code, 'for', email)

    const purposeLabel = purpose === 'login' ? 'login' : 'verification'
    const subject = `Your DevAtlas ${purposeLabel} code: ${code}`
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 400px; margin: 0 auto; padding: 2rem; color: #1a1a1a;">
        <h1 style="font-size: 1.25rem; margin-bottom: 1.5rem;">DevAtlas</h1>
        <p style="margin-bottom: 1rem;">Your verification code is:</p>
        <div style="text-align: center; padding: 1.5rem; background: #f5f5f5; border-radius: 12px; margin-bottom: 1.5rem;">
          <span style="font-size: 2rem; font-weight: 700; letter-spacing: 0.2em; color: #1a1a1a;">${code}</span>
        </div>
        <p style="color: #666; font-size: 0.875rem;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </body>
      </html>
    `

    await sendEmail({ to: email, subject, html })

    return NextResponse.json({ message: 'OTP sent to your email' })
  } catch (error) {
    console.error('[OTP] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
