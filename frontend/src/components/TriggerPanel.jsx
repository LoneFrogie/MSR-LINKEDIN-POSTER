import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function TriggerPanel() {
  const navigate = useNavigate()
  const [topic, setTopic] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(null)
  const fileRef = useRef()

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const result = await api.triggerGeneration(topic || null, imageFile)
      setStatus({ type: 'success', sessionId: result.session_id })
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Generate New Content</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
          Trigger AI content generation manually. Provide an optional topic and image.
          Claude will generate 3 post options for your approval.
        </p>
      </div>

      <div style={{
        background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, padding: 24,
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Topic */}
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>
              Topic hint <span style={{ color: '#999', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Employee Appreciation Week, New store opening, Malaysia Labour Day"
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid #ccc', borderRadius: 6,
                fontSize: 13, outline: 'none',
              }}
            />
            <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
              If left blank, Claude will pick the most relevant current topic.
            </p>
          </div>

          {/* Image upload */}
          <div>
            <label style={{ fontWeight: 600, fontSize: 13, display: 'block', marginBottom: 6 }}>
              Post image <span style={{ color: '#999', fontWeight: 400 }}>(optional — can be added later)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />

            {imagePreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={imagePreview}
                  alt="preview"
                  style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 8 }}
                />
                <div>
                  <p style={{ fontSize: 12, color: '#444' }}>{imageFile.name}</p>
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ marginTop: 6, fontSize: 12, padding: '4px 10px' }}
                    onClick={() => { setImageFile(null); setImagePreview(null) }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => fileRef.current.click()}
              >
                Upload Image
              </button>
            )}
            <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
              Recommended: 1200×627px (LinkedIn landscape). JPG or PNG.
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
          >
            {loading ? 'Generating...' : '✦ Generate 3 Post Options'}
          </button>
        </form>

        {/* Status feedback */}
        {status?.type === 'success' && (
          <div style={{
            marginTop: 20, padding: 16, borderRadius: 8,
            background: '#d4edda', color: '#155724', fontSize: 13,
          }}>
            ✅ Generation started! Session #{status.sessionId} is being processed.{' '}
            <button
              onClick={() => navigate(`/session/${status.sessionId}`)}
              style={{
                background: 'none', border: 'none', color: '#0A66C2',
                fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0,
              }}
            >
              View session →
            </button>
          </div>
        )}

        {status?.type === 'error' && (
          <div style={{
            marginTop: 20, padding: 16, borderRadius: 8,
            background: '#fce8e9', color: '#721c24', fontSize: 13,
          }}>
            ❌ Error: {status.message}
          </div>
        )}
      </div>

      {/* Info box */}
      <div style={{
        marginTop: 20, background: '#e8f0fe', border: '1px solid #c5d9f8',
        borderRadius: 10, padding: 16, fontSize: 13,
      }}>
        <strong>Auto-schedule:</strong> Content is also generated automatically every{' '}
        <strong>Monday, Wednesday, and Friday at 9:00 AM MYT</strong>.
        Sessions will appear in the <strong>Approvals</strong> queue when ready.
      </div>
    </div>
  )
}
