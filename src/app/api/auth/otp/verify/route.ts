import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, purpose } = body

    if (!email || !code || !purpose) {
      return NextResponse.json({ error: 'Email, code, and purpose are required' }, { status: 400 })
    }

    const valid = await verifyOtp(email, code, purpose)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    return NextResponse.json({ verified: true })
  } catch (error) {
    console.error('[OTP Verify]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
