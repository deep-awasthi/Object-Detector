import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { deviceApi } from '../api/client'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'

interface Device {
  id: string
  name: string
  fingerprint: string
  whitelisted: boolean
  lastIpAddress: string
  userAgent: string
  registeredAt: string
  lastSeenAt: string | null
  revokedAt: string | null
}

export default function DevicesPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery<{ data: Device[] }>({
    queryKey: ['devices'],
    queryFn: () => deviceApi.list(),
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => deviceApi.revoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Device revoked — all its sessions are terminated')
    },
  })

  const whitelistMutation = useMutation({
    mutationFn: (id: string) => deviceApi.whitelist(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['devices'] })
      toast.success('Device whitelisted')
    },
  })

  const devices: Device[] = data?.data || []
  const active = devices.filter(d => d.whitelisted)
  const revoked = devices.filter(d => !d.whitelisted)

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>💻 Devices</h1>
          <p style={styles.subtitle}>
            Manage which devices can access DeepCloneAI. Revoking a device terminates all its sessions.
          </p>
        </div>
      </div>

      {/* Security Info */}
      <div style={styles.infoBanner} className="glass">
        <span style={{ fontSize: 20 }}>🛡️</span>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          Each JWT token is bound to the device it was issued on. Revoking a device immediately
          invalidates all its refresh tokens.
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="card shimmer" style={{ height: 88 }} />)}
        </div>
      ) : (
        <>
          {/* Active Devices */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              Active Devices <span className="badge badge-success">{active.length}</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {active.map(device => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onRevoke={() => revokeMutation.mutate(device.id)}
                  isRevoking={revokeMutation.isPending}
                />
              ))}
              {active.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No active devices</p>
              )}
            </div>
          </div>

          {/* Revoked Devices */}
          {revoked.length > 0 && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Revoked Devices <span className="badge badge-danger">{revoked.length}</span>
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {revoked.map(device => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onWhitelist={() => whitelistMutation.mutate(device.id)}
                    isRevoking={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function DeviceCard({
  device, onRevoke, onWhitelist, isRevoking,
}: {
  device: Device
  onRevoke?: () => void
  onWhitelist?: () => void
  isRevoking: boolean
}) {
  const isActive = device.whitelisted

  return (
    <div className="card" style={styles.deviceCard}>
      <div style={styles.deviceIcon}>
        {deviceIcon(device.userAgent)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{device.name}</span>
          <span
            className="badge"
            style={{
              background: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
              color: isActive ? '#10b981' : '#ef4444',
            }}
          >
            {isActive ? '● Active' : '✕ Revoked'}
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
          <span>IP: {device.lastIpAddress || 'unknown'}</span>
          {device.lastSeenAt && (
            <span>Last seen: {formatDistanceToNow(new Date(device.lastSeenAt), { addSuffix: true })}</span>
          )}
          <span>Registered: {formatDistanceToNow(new Date(device.registeredAt), { addSuffix: true })}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {device.userAgent}
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>
        {isActive && onRevoke && (
          <button
            className="btn btn-danger btn-sm"
            onClick={onRevoke}
            disabled={isRevoking}
          >
            Revoke
          </button>
        )}
        {!isActive && onWhitelist && (
          <button className="btn btn-ghost btn-sm" onClick={onWhitelist}>
            Re-enable
          </button>
        )}
      </div>
    </div>
  )
}

function deviceIcon(userAgent: string) {
  if (!userAgent) return '💻'
  if (userAgent.includes('Mobile')) return '📱'
  if (userAgent.includes('Windows')) return '🖥️'
  if (userAgent.includes('Mac')) return '🍎'
  if (userAgent.includes('Linux')) return '🐧'
  return '💻'
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 32, overflowY: 'auto', height: '100%' },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 700 },
  subtitle: { color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 },
  infoBanner: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderRadius: 12, marginBottom: 24,
  },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 },
  deviceCard: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px' },
  deviceIcon: { fontSize: 28, flexShrink: 0 },
}
