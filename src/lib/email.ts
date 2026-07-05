import nodemailer from 'nodemailer'

const isDev = process.env.NODE_ENV !== 'production'

const smtpConfig = isDev
  ? {
      host: process.env.SMTP_HOST_DEV || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT_DEV || '587'),
      secure: process.env.SMTP_SECURE_DEV === 'true',
      auth: {
        user: process.env.SMTP_USER_DEV,
        pass: process.env.SMTP_PASS_DEV,
      },
    }
  : {
      host: process.env.SMTP_HOST_PROD || 'smtp.resend.com',
      port: parseInt(process.env.SMTP_PORT_PROD || '587'),
      secure: process.env.SMTP_SECURE_PROD === 'true',
      auth: {
        user: process.env.SMTP_USER_PROD,
        pass: process.env.SMTP_PASS_PROD,
      },
    }

const fromAddress = isDev
  ? process.env.SMTP_FROM_DEV || 'DevAtlas <noreply@ethereal.email>'
  : process.env.SMTP_FROM_PROD || 'DevAtlas <onboarding@resend.dev>'

const transporter = nodemailer.createTransport(smtpConfig)

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  const smtpUser = isDev ? process.env.SMTP_USER_DEV : process.env.SMTP_USER_PROD

  if (!smtpUser) {
    console.log(`[Email] SMTP not configured (${isDev ? 'dev' : 'prod'}). Would send to: ${to}\nSubject: ${subject}`)
    return false
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)
    if (previewUrl) {
      console.log(`[Email] Preview (open in browser): ${previewUrl}`)
    } else {
      console.log(`[Email] Sent to ${to} via ${isDev ? 'Ethereal' : 'Resend'}`)
    }
    return true
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error)
    return false
  }
}

export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const email of recipients) {
    const success = await sendEmail({ to: email, subject, html })
    if (success) sent++
    else failed++
  }

  return { sent, failed }
}

export function buildArticleEmail(article: {
  title: string
  excerpt: string | null
  slug: string
  category: { name: string }
}): { subject: string; html: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const articleUrl = `${appUrl}/articles/${article.slug}`
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'DevAtlas'

  const subject = `New article: ${article.title}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 2rem; color: #1a1a1a;">
      <h1 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${appName}</h1>
      <p style="color: #666; margin-bottom: 2rem;">New article published</p>

      <div style="background: #f5f5f5; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem;">
        <p style="font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #3B82F6; margin-bottom: 0.5rem;">${article.category.name}</p>
        <h2 style="font-size: 1.25rem; margin: 0 0 0.5rem;">${article.title}</h2>
        ${article.excerpt ? `<p style="color: #666; margin: 0 0 1rem; line-height: 1.6;">${article.excerpt}</p>` : ''}
        <a href="${articleUrl}" style="display: inline-block; padding: 0.75rem 1.5rem; background: #1a1a1a; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">Read Article →</a>
      </div>

      <p style="color: #999; font-size: 0.8125rem; margin-top: 2rem;">
        You're receiving this because you subscribed to ${appName}.<br>
        <a href="${appUrl}" style="color: #999;">Visit ${appName}</a>
      </p>
    </body>
    </html>
  `

  return { subject, html }
}
