import { NextResponse } from 'next/server'
import { clearCookie } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  return clearCookie(response)
}
