import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOtp(email: string, purpose: string): Promise<string> {
  // Invalidate any existing OTPs for this email+purpose
  await prisma.otp.updateMany({
    where: { email, purpose, used: false },
    data: { used: true },
  })

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await prisma.otp.create({
    data: { email, code, purpose, expiresAt },
  })

  return code
}

export async function verifyOtp(email: string, code: string, purpose: string): Promise<boolean> {
  const otp = await prisma.otp.findFirst({
    where: { email, code, purpose, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return false

  await prisma.otp.update({ where: { id: otp.id }, data: { used: true } })
  return true
}

export async function sendOtpEmail(email: string, code: string, purpose: string): Promise<boolean> {
  const subject = purpose === 'login'
    ? `Your DevAtlas login code: ${code}`
    : `Your DevAtlas verification code: ${code}`

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

  const sent = await sendEmail({ to: email, subject, html })
  if (!sent) {
    console.log(`\n[OTP] Code for ${email} (${purpose}): ${code}\n`)
  }
  return true
}
