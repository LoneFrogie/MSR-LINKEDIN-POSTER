import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../services/api'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

export default function AlertBanner() {
  const [alerts, setAlerts] = useState([])

  const load = useCallback(async () => {
    try {
      const data = await api.getAlerts()
      setAlerts(data.alerts || [])
    } catch {
      // Silently ignore — don't break the page if alerts fail
    }
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_INTERVAL)
    return () => clearInterval(timer)
  }, [load])

  const dismiss = async (id) => {
    // Optimistic remove
    setAlerts(prev => prev.filter(a => a.id !== id))
    try {
      await api.dismissAlert(id)
    } catch {
      // Re-fetch on failure
      load()
    }
  }

  if (alerts.length === 0) return null

  return (
    <div style={{
      position: 'sticky',
      top: 56,
      zIndex: 99,
      background: '#FFFBEB',
      borderBottom: '2px solid #F59E0B',
    }}>
      {alerts.map((alert, i) => (
        <div
          key={alert.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '10px 24px',
            borderTop: i > 0 ? '1px solid #FDE68A' : 'none',
          }}
        >
          {/* Icon */}
          <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🔥</span>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 13, color: '#92400E' }}>
                Post gaining traction — great time to reshare!
              </strong>
              {alert.angle_name && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '1px 8px', borderRadius: 999,
                  background: '#FDE68A', color: '#92400E',
                }}>
                  {alert.angle_name}
                </span>
              )}
              <span style={{ fontSize: 12, color: '#B45309' }}>
                {fmt(alert.impressions)} impressions · {alert.engagement_rate?.toFixed(1)}% engagement ·{' '}
                <strong>{alert.multiple}×</strong> above average
              </span>
            </div>
            {alert.content_preview && (
              <p style={{
                fontSize: 12, color: '#78350F', marginTop: 3,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                "{alert.content_preview}"
              </p>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={() => dismiss(alert.id)}
            style={{
              flexShrink: 0,
              background: 'none', border: '1px solid #F59E0B',
              borderRadius: 4, padding: '4px 10px',
              fontSize: 12, color: '#92400E', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
