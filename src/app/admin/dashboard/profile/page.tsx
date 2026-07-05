'use client'

import { useEffect, useState } from 'react'
import { Save, Shield } from 'lucide-react'
import styles from './page.module.css'

interface Profile {
  id: string
  name: string
  email: string
  avatar: string | null
  bio: string | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // OTP state
  const [otpAction, setOtpAction] = useState<'email' | 'password' | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpError, setOtpError] = useState('')

  useEffect(() => {
    fetch('/api/auth/profile')
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setName(data.name || '')
        setEmail(data.email || '')
        setBio(data.bio || '')
        setAvatar(data.avatar || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  async function sendOtp(action: 'email' | 'password') {
    setOtpSending(true)
    setOtpError('')
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, purpose: action === 'email' ? 'change-email' : 'change-password' }),
      })
      if (res.ok) {
        setOtpSent(true)
        setOtpAction(action)
      } else {
        setOtpError('Failed to send code')
      }
    } catch {
      setOtpError('Failed to send code')
    } finally {
      setOtpSending(false)
    }
  }

  async function verifyOtpAndSave() {
    if (otpCode.length !== 6) {
      setOtpError('Enter the 6-digit code')
      return
    }
    setSaving(true)
    setOtpError('')
    try {
      const purpose = otpAction === 'email' ? 'change-email' : 'change-password'
      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile?.email, code: otpCode, purpose }),
      })
      if (!verifyRes.ok) {
        setOtpError('Invalid or expired code')
        setSaving(false)
        return
      }

      if (otpAction === 'email') {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), bio: bio.trim() || null, avatar: avatar.trim() || null }),
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data)
          showToast('success', 'Email updated')
        } else {
          const err = await res.json()
          showToast('error', err.error || 'Failed to update')
        }
      } else {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword }),
        })
        if (res.ok) {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmPassword('')
          showToast('success', 'Password changed')
        } else {
          const err = await res.json()
          showToast('error', err.error || 'Failed to change password')
        }
      }
      cancelOtp()
    } catch {
      showToast('error', 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  function cancelOtp() {
    setOtpAction(null)
    setOtpCode('')
    setOtpSent(false)
    setOtpError('')
  }

  async function handleSaveProfile() {
    if (!name.trim()) {
      showToast('error', 'Name is required')
      return
    }
    if (email !== profile?.email) {
      await sendOtp('email')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), bio: bio.trim() || null, avatar: avatar.trim() || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        showToast('success', 'Profile updated')
      } else {
        const err = await res.json()
        showToast('error', err.error || 'Failed to update')
      }
    } catch {
      showToast('error', 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      showToast('error', 'Fill in both password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters')
      return
    }
    await sendOtp('password')
  }

  if (loading) return <div className={styles.page}><p style={{ color: 'var(--color-text-secondary)' }}>Loading profile...</p></div>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
      </div>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.msg}
        </div>
      )}

      {/* OTP Modal */}
      {otpAction && (
        <div className={styles.otpOverlay}>
          <div className={styles.otpCard}>
            <div className={styles.otpHeader}>
              <Shield size={20} />
              <h3>Verify Identity</h3>
            </div>
            <p className={styles.otpDesc}>
              Enter the 6-digit code sent to {profile?.email}
            </p>
            {otpError && <div className={styles.otpError}>{otpError}</div>}
            <input
              type="text"
              placeholder="000000"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className={styles.otpInput}
              autoFocus
            />
            <div className={styles.otpActions}>
              <button onClick={cancelOtp} className="btn btn-secondary" disabled={saving}>Cancel</button>
              <button onClick={verifyOtpAndSave} className="btn btn-primary" disabled={saving || otpCode.length !== 6}>
                {saving ? 'Verifying...' : 'Verify & Save'}
              </button>
            </div>
            <button onClick={() => sendOtp(otpAction)} className={styles.otpResend} disabled={otpSending}>
              {otpSending ? 'Sending...' : 'Resend code'}
            </button>
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Account</h3>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          {email !== profile?.email && <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.25rem' }}>Changing email requires OTP verification</p>}
        </div>
        <div className="form-group">
          <label className="form-label">Bio</label>
          <textarea className="form-input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell readers about yourself..." />
        </div>
        <div className="form-group">
          <label className="form-label">Avatar URL</label>
          <input type="url" className="form-input" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
        </div>
        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Change Password</h3>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input type="password" className="form-input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
        </div>
        <div className="form-group">
          <label className="form-label">New Password</label>
          <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" />
        </div>
        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" />
        </div>
        <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Change Password'}
        </button>
      </div>
    </div>
  )
}
