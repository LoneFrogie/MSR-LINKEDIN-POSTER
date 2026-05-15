import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const ANGLE_COLORS = { A: '#0A66C2', B: '#057642', C: '#E91E8C' }
const ANGLE_LABELS = { A: 'Brand Story & Culture', B: 'Malaysia HR Topic', C: 'Thought Leadership' }

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [approving, setApproving] = useState(null)
  const [rejecting, setRejecting] = useState(false)
  const [rejectKeywords, setRejectKeywords] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getSession(id)
      setSession(data)
      if (data.image_path) {
        setImagePreview(`/uploads/${data.image_path.split('/').pop()}`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleUploadImage = async () => {
    if (!imageFile) return
    setUploading(true)
    try {
      await api.uploadImage(id, imageFile)
      setImageFile(null)
    } catch (e) {
      alert(`Image upload failed: ${e.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleApprove = async (label) => {
    if (!window.confirm(`Approve Option ${label} and post to LinkedIn?`)) return
    setApproving(label)
    try {
      const result = await api.approveOption(id, label)
      if (result.dry_run) {
        alert(`✅ DRY RUN — Option ${label} would be posted.\n\nAdd LINKEDIN_ACCESS_TOKEN to .env to post for real.`)
      } else {
        alert(`✅ Posted to LinkedIn! Post ID: ${result.linkedin_post_id}`)
      }
      navigate('/')
    } catch (e) {
      alert(`Error: ${e.message}`)
    } finally {
      setApproving(null)
    }
  }

  const handleReject = async () => {
    if (!window.confirm('Reject all options? This topic will be blocked for 6 months.')) return
    setRejecting(true)
    try {
      await api.rejectSession(id, rejectKeywords || undefined)
      navigate('/')
    } catch (e) {
      alert(`Error: ${e.message}`)
    } finally {
      setRejecting(false)
    }
  }

  if (loading) return <p style={{ padding: 24, color: '#666' }}>Loading...</p>
  if (error) return <p style={{ padding: 24, color: 'red' }}>Error: {error}</p>
  if (!session) return null

  const isEditable = session.status === 'pending'
  const pendingOptions = session.options.filter(o => o.status === 'pending')

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <button className="btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 12, fontSize: 13 }}>
          ← Back to Queue
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>
              Session #{session.id}
              <span className={`badge badge-${session.status}`} style={{ marginLeft: 10, verticalAlign: 'middle' }}>
                {session.status}
              </span>
            </h1>
            <p style={{ color: '#666', fontSize: 13, marginTop: 4 }}>
              {session.topic ? `Topic: "${session.topic}"` : 'Auto-generated — no topic specified'}
            </p>
          </div>
          {isEditable && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Block keywords (optional)"
                value={rejectKeywords}
                onChange={e => setRejectKeywords(e.target.value)}
                style={{
                  padding: '7px 12px', borderRadius: 6, border: '1px solid #ccc',
                  fontSize: 13, width: 200,
                }}
              />
              <button
                className="btn-danger"
                onClick={handleReject}
                disabled={rejecting}
              >
                {rejecting ? 'Rejecting...' : 'Reject All'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image section */}
      <div style={{
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
        padding: 20, marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>Post Image</p>
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Post"
              style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8, display: 'block' }}
            />
          ) : (
            <div style={{
              width: 140, height: 100, borderRadius: 8, background: '#f0f4ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#666', fontSize: 13, border: '2px dashed #cce0ff',
            }}>
              No image
            </div>
          )}
        </div>
        {isEditable && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            <button className="btn-ghost" onClick={() => fileRef.current.click()}>
              {imagePreview ? 'Change Image' : 'Upload Image'}
            </button>
            {imageFile && (
              <button className="btn-primary" onClick={handleUploadImage} disabled={uploading}>
                {uploading ? 'Uploading...' : 'Save Image'}
              </button>
            )}
            <p style={{ fontSize: 12, color: '#999' }}>
              Recommended: 1200×627px, JPG or PNG
            </p>
          </div>
        )}
      </div>

      {/* 3 Option cards */}
      {pendingOptions.length === 0 && session.status !== 'pending' ? (
        <div style={{
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
          padding: 32, textAlign: 'center', color: '#666',
        }}>
          This session has been {session.status}.
        </div>
      ) : pendingOptions.length === 0 ? (
        <div style={{ padding: 24, color: '#666' }}>
          Content is still generating... refresh in a moment.
          <button className="btn-ghost" onClick={load} style={{ marginLeft: 12 }}>Refresh</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {pendingOptions.map(opt => (
            <OptionCard
              key={opt.id}
              option={opt}
              isEditable={isEditable}
              approving={approving}
              onApprove={handleApprove}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function OptionCard({ option, isEditable, approving, onApprove }) {
  const color = ANGLE_COLORS[option.label] || '#0A66C2'
  const [expanded, setExpanded] = useState(false)
  const preview = option.content.slice(0, 280)
  const hasMore = option.content.length > 280

  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${color}22`,
      borderTop: `4px solid ${color}`,
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 15, flexShrink: 0,
        }}>
          {option.label}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1d2226' }}>{option.angle_name}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{ANGLE_LABELS[option.label]}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '14px 18px',
        flex: 1,
        fontSize: 13,
        lineHeight: 1.7,
        color: '#1d2226',
        whiteSpace: 'pre-wrap',
      }}>
        {expanded ? option.content : preview}
        {hasMore && !expanded && '...'}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'block', marginTop: 6,
              background: 'none', border: 'none', padding: 0,
              color: color, fontWeight: 500, fontSize: 12, cursor: 'pointer',
            }}
          >
            {expanded ? 'Show less' : 'Read full post'}
          </button>
        )}
      </div>

      {/* Word count */}
      <div style={{ padding: '6px 18px', fontSize: 11, color: '#aaa' }}>
        ~{option.content.split(/\s+/).filter(Boolean).length} words
      </div>

      {/* Approve button */}
      {isEditable && (
        <div style={{ padding: '12px 18px', borderTop: '1px solid #f0f0f0' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', background: color }}
            onClick={() => onApprove(option.label)}
            disabled={!!approving}
          >
            {approving === option.label ? 'Posting...' : `✓ Approve & Post Option ${option.label}`}
          </button>
        </div>
      )}
    </div>
  )
}
