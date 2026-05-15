import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso + 'Z')) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ApprovalQueue() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getSessions('pending')
      setSessions(data.sessions)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <p style={{ color: '#666', padding: 24 }}>Loading sessions...</p>
  if (error) return <p style={{ color: 'red', padding: 24 }}>Error: {error}</p>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Pending Approvals</h1>
          <p style={{ color: '#666', marginTop: 2, fontSize: 13 }}>
            Review and approve one of 3 AI-generated post options per session.
          </p>
        </div>
        <button className="btn-ghost" onClick={load}>Refresh</button>
      </div>

      {sessions.length === 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: 10,
          padding: 40,
          textAlign: 'center',
          border: '1px solid #e0e0e0',
        }}>
          <p style={{ fontSize: 15, color: '#666' }}>No pending sessions.</p>
          <p style={{ fontSize: 13, color: '#999', marginTop: 8 }}>
            Content is auto-generated Mon/Wed/Fri at 9AM, or use{' '}
            <Link to="/trigger">+ Generate</Link> to trigger manually.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map(s => (
            <Link
              key={s.id}
              to={`/session/${s.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                background: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'box-shadow 0.15s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {/* Image thumbnail */}
                {s.image_path ? (
                  <img
                    src={`/uploads/${s.image_path.split('/').pop()}`}
                    alt="session"
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: 8,
                    background: '#f0f4ff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>📋</div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#1d2226', fontSize: 14 }}>
                    {s.topic || 'Auto-generated — no topic'}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    Session #{s.id} · {timeAgo(s.created_at)} · {s.options.length} options ready
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge badge-pending">pending</span>
                  <span style={{ color: '#0A66C2', fontSize: 13, fontWeight: 500 }}>
                    Review →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
