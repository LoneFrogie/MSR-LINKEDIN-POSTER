import React, { useEffect, useState } from 'react'
import { api } from '../services/api'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'Z').toLocaleString('en-MY', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur',
  })
}

export default function PostHistory() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.getPosts().then(d => {
      setPosts(d.posts)
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ padding: 24, color: '#666' }}>Loading...</p>

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Published Posts</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
          History of all posts approved and published to MS. READ LinkedIn page.
        </p>
      </div>

      {posts.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
          padding: 40, textAlign: 'center', color: '#666',
        }}>
          No posts published yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {posts.map(post => (
            <div key={post.id} style={{
              background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
              overflow: 'hidden',
            }}>
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer',
                }}
                onClick={() => setExpanded(expanded === post.id ? null : post.id)}
              >
                {/* Thumbnail */}
                {post.image_path ? (
                  <img
                    src={`/uploads/${post.image_path.split('/').pop()}`}
                    alt=""
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: 8,
                    background: '#e8f0fe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, flexShrink: 0,
                  }}>📌</div>
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    Option {post.label} — {post.angle_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    {formatDate(post.posted_at)} · {post.topic || 'No topic'}
                  </div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 1 }}>
                    LinkedIn ID: {post.linkedin_post_id}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="badge badge-posted">posted</span>
                  <span style={{ color: '#999', fontSize: 16 }}>
                    {expanded === post.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {expanded === post.id && (
                <div style={{
                  padding: '0 20px 20px',
                  borderTop: '1px solid #f0f0f0',
                  marginTop: 0,
                }}>
                  <pre style={{
                    whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                    fontSize: 13, lineHeight: 1.7, color: '#1d2226',
                    marginTop: 14,
                  }}>
                    {post.content}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
