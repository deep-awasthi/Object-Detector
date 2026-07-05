'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Mail, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import styles from './page.module.css'

const OTP_EXPIRY_SECONDS = 600 // 10 minutes

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS)
  const [expired, setExpired] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (step === 'otp' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setExpired(true)
            clearInterval(timerRef.current!)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [step, otpSent])

  function startTimer() {
    setTimeLeft(OTP_EXPIRY_SECONDS)
    setExpired(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Invalid credentials')
        setLoading(false)
        return
      }
      const otpRes = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'login' }),
      })
      if (otpRes.ok) {
        setOtpSent(true)
        setStep('otp')
        startTimer()
      } else {
        setError('Failed to send OTP')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp, purpose: 'login' }),
      })
      if (!res.ok) {
        setError('Invalid or expired code')
        setLoading(false)
        return
      }
      router.push('/admin/dashboard')
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'login' }),
      })
      if (res.ok) {
        setOtp('')
        setOtpSent(true)
        startTimer()
        setError('')
      } else {
        setError('Failed to resend code')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    setStep('credentials')
    setOtp('')
    setError('')
    setOtpSent(false)
    setExpired(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const timerColor = timeLeft <= 60 ? '#EF4444' : timeLeft <= 180 ? '#F59E0B' : 'var(--color-text-tertiary)'

  return (
    <div className={styles.page}>
      <motion.div className={styles.card} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <h1 className={styles.title}>DevAtlas</h1>
        <p className={styles.subtitle}>Admin Dashboard</p>

        {step === 'credentials' ? (
          <form onSubmit={handleCredentials} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.inputGroup}>
              <Mail size={18} className={styles.inputIcon} />
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className={styles.input} />
            </div>
            <div className={styles.inputGroup}>
              <Lock size={18} className={styles.inputIcon} />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className={styles.input} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtp} className={styles.form}>
            {error && <div className={styles.error}>{error}</div>}
            {otpSent && !expired && (
              <div className={styles.success}>
                <CheckCircle size={16} /> Code sent to {email}
              </div>
            )}

            {/* Countdown Timer */}
            <div className={styles.timer}>
              <Clock size={14} style={{ color: timerColor }} />
              {expired ? (
                <span style={{ color: '#EF4444', fontWeight: 600 }}>Code expired</span>
              ) : (
                <span style={{ color: timerColor, fontWeight: timeLeft <= 60 ? 600 : 400 }}>
                  Expires in {formatTime(timeLeft)}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className={styles.input}
                disabled={expired}
                style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: '0.2em' }}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading || otp.length !== 6 || expired}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>

            {expired ? (
              <button type="button" onClick={handleResend} className={styles.resendBtn} disabled={loading}>
                {loading ? 'Sending...' : 'Send new code'}
              </button>
            ) : (
              <button type="button" onClick={handleResend} className={styles.resendBtn} disabled={loading || timeLeft > 540}>
                {timeLeft > 540 ? `Resend in ${formatTime(timeLeft - 540)}` : 'Resend code'}
              </button>
            )}

            <button type="button" onClick={goBack} className={styles.backBtn}>
              <ArrowLeft size={14} /> Back to login
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
