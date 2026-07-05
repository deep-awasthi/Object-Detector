import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter for auth endpoints
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const record = loginAttempts.get(ip)

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  record.count++
  return record.count <= limit
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of loginAttempts.entries()) {
    if (now > value.resetAt) loginAttempts.delete(key)
  }
}, 60000)

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Security headers applied to all responses
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  // Admin routes
  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Is-Admin', 'true')

    // Rate limit login attempts
    if (pathname === '/api/auth/login' || pathname === '/api/auth/otp') {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 request.headers.get('x-real-ip') || 'unknown'

      if (!checkRateLimit(ip)) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.' },
          { status: 429 }
        )
      }
    }
  }

  // API routes security
  if (pathname.startsWith('/api/')) {
    // Prevent path traversal in API routes
    if (pathname.includes('..') || pathname.includes('%2e%2e')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Block common attack paths
    const blockedPaths = [
      '/api/__proto__',
      '/api/constructor',
      '/api/prototype',
    ]
    if (blockedPaths.some((p) => pathname.toLowerCase().startsWith(p))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  // Static assets caching
  if (pathname.startsWith('/_next/static/') || pathname.startsWith('/public/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  // API responses should not be cached
  if (pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    '/_next/static/:path*',
  ],
}
