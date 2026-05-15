import React, { useEffect, useState } from 'react'
import { api } from '../services/api'

function fmt(n) {
  if (n == null) return '—'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

function pct(n) {
  if (n == null) return '—'
  return n.toFixed(1) + '%'
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso + 'Z').toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
    timeZone: 'Asia/Kuala_Lumpur',
  })
}

const ANGLE_COLORS = {
  'Brand Story & Culture':      '#0A66C2',
  'Malaysia HR & Career Topic': '#057642',
  'LinkedIn Thought Leadership': '#E91E8C',
}
function angleColor(name) {
  return ANGLE_COLORS[name] || '#888'
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#0A66C2', icon }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
      padding: '16px 20px', minWidth: 130, flex: 1,
      borderTop: `4px solid ${color}`,
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1d2226' }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#444', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── Mini bar ──────────────────────────────────────────────────────────────────
function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, width: '100%' }}>
      <div style={{
        background: color, borderRadius: 4, height: 8,
        width: `${pct}%`, transition: 'width 0.3s',
      }} />
    </div>
  )
}

// ── Follower sparkline (simple SVG) ───────────────────────────────────────────
function FollowerSparkline({ history }) {
  if (!history || history.length < 2) return (
    <div style={{ color: '#999', fontSize: 12, padding: '8px 0' }}>
      Not enough data for trend yet.
    </div>
  )

  const values = [...history].reverse().map(h => h.total)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 300, H = 60

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 8) - 4
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke="#0A66C2"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * W
        const y = H - ((v - min) / range) * (H - 8) - 4
        return <circle key={i} cx={x} cy={y} r={3} fill="#0A66C2" />
      })}
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState(null)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const d = await api.getAnalytics()
      setData(d)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const result = await api.refreshAnalytics()
      if (result.ok) {
        setRefreshMsg(`✅ Refreshed ${result.posts_refreshed} post(s). Followers: ${result.followers?.total ?? '—'}`)
        await load()
      } else {
        setRefreshMsg(`⚠️ ${result.error}`)
      }
    } catch (e) {
      setRefreshMsg(`❌ ${e.message}`)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return <p style={{ padding: 24, color: '#666' }}>Loading analytics...</p>
  if (error)   return <p style={{ padding: 24, color: 'red' }}>Error: {error}</p>
  if (!data)   return null

  const { followers, totals, posts, by_angle } = data
  const hasData = totals.posts > 0
  const maxImpressions = Math.max(...(posts.map(p => p.impressions || 0)), 1)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Page Analytics</h1>
          <p style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
            MS. READ LinkedIn page performance — pulled live from LinkedIn API.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            className="btn-primary"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{ fontSize: 13 }}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh from LinkedIn'}
          </button>
          {refreshMsg && (
            <span style={{ fontSize: 12, color: '#444' }}>{refreshMsg}</span>
          )}
        </div>
      </div>

      {/* ── Followers ── */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Followers</h2>
          {followers.growth != null && (
            <span style={{
              background: followers.growth >= 0 ? '#d4edda' : '#fce8e9',
              color: followers.growth >= 0 ? '#057642' : '#cc1016',
              fontWeight: 600, fontSize: 13, padding: '3px 10px', borderRadius: 999,
            }}>
              {followers.growth >= 0 ? '+' : ''}{followers.growth} since first snapshot
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#0A66C2', lineHeight: 1 }}>
              {followers.total != null ? followers.total.toLocaleString() : '—'}
            </div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Total followers</div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, color: '#999', marginBottom: 6 }}>Growth trend (last {followers.history.length} snapshots)</div>
            <FollowerSparkline history={followers.history} />
          </div>
        </div>
      </div>

      {/* ── Overall totals ── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <StatCard icon="📄" label="Posts Published"  value={fmt(totals.posts)}        color="#0A66C2" />
        <StatCard icon="👁"  label="Total Impressions" value={fmt(totals.impressions)}  color="#5e35b1" sub="times seen in feed" />
        <StatCard icon="👍" label="Likes"              value={fmt(totals.likes)}        color="#057642" />
        <StatCard icon="💬" label="Comments"           value={fmt(totals.comments)}     color="#E91E8C" />
        <StatCard icon="🔁" label="Shares"             value={fmt(totals.shares)}       color="#e65100" />
        <StatCard icon="🖱" label="Clicks"              value={fmt(totals.clicks)}       color="#1565c0" />
      </div>

      {/* ── Best performing angle ── */}
      {by_angle.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Performance by Content Angle</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {by_angle.map((a, i) => (
              <div key={a.angle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {i === 0 && <span style={{ fontSize: 14 }}>🏆</span>}
                    <span style={{
                      display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                      background: angleColor(a.angle), flexShrink: 0,
                    }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{a.angle}</span>
                    <span style={{ fontSize: 12, color: '#888' }}>({a.posts} post{a.posts !== 1 ? 's' : ''})</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#444', textAlign: 'right' }}>
                    <strong>{fmt(a.avg_impressions)}</strong> avg impressions ·{' '}
                    <strong>{fmt(a.avg_engagement)}</strong> avg engagements
                  </div>
                </div>
                <Bar
                  value={a.avg_impressions}
                  max={by_angle[0].avg_impressions}
                  color={angleColor(a.angle)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Post performance table ── */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>Post Performance</h2>
          <span style={{ fontSize: 12, color: '#888' }}>
            {hasData ? `${posts.length} post(s) tracked` : 'No posts yet'}
          </span>
        </div>

        {!hasData ? (
          <div style={{ padding: 32, textAlign: 'center', color: '#888', fontSize: 13 }}>
            No published posts yet. Once you approve and post content, stats will appear here after a refresh.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f7f7f7' }}>
                  {['Date', 'Angle', 'Topic', 'Impressions', 'Likes', 'Comments', 'Shares', 'Clicks', 'Eng. Rate'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontWeight: 600, color: '#444',
                      borderBottom: '1px solid #eee', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {posts.map((p, i) => (
                  <tr key={p.linkedin_post_id || i} style={{
                    borderBottom: '1px solid #f5f5f5',
                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                  }}>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: '#666' }}>
                      {formatDate(p.posted_at)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px', borderRadius: 999,
                        fontSize: 11, fontWeight: 600,
                        background: angleColor(p.angle_name) + '18',
                        color: angleColor(p.angle_name),
                        whiteSpace: 'nowrap',
                      }}>
                        {p.angle_name || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555', maxWidth: 180 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.topic || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{fmt(p.impressions)}</td>
                    <td style={{ padding: '10px 14px', color: '#057642' }}>{fmt(p.likes)}</td>
                    <td style={{ padding: '10px 14px', color: '#E91E8C' }}>{fmt(p.comments)}</td>
                    <td style={{ padding: '10px 14px', color: '#e65100' }}>{fmt(p.shares)}</td>
                    <td style={{ padding: '10px 14px', color: '#1565c0' }}>{fmt(p.clicks)}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: p.engagement_rate > 2 ? '#057642' : '#444' }}>
                      {pct(p.engagement_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scope note */}
      <p style={{ fontSize: 11, color: '#bbb', marginTop: 12, textAlign: 'center' }}>
        Stats require <strong>r_organization_social_feed</strong> scope (LinkedIn Marketing Developer Platform).
        Click "Refresh from LinkedIn" to pull latest data.
      </p>
    </div>
  )
}
