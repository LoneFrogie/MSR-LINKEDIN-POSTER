import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f2ef',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #e0e0e0',
        borderRadius: 12,
        padding: '36px 40px',
        width: '100%',
        maxWidth: 400,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{
            background: '#0A66C2', color: '#fff',
            fontWeight: 700, fontSize: 16,
            padding: '5px 10px', borderRadius: 5,
          }}>in</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1d2226' }}>MS. READ LinkedIn Poster</div>
            <div style={{ fontSize: 11, color: '#999' }}>AI-powered employer branding</div>
          </div>
        </div>

        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1d2226', marginBottom: 6 }}>Sign in</h1>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>
          Enter your credentials to access the dashboard.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d2226', marginBottom: 5 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1d2226', marginBottom: 5 }}>
              Password
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  padding: '0 12px', border: '1px solid #ccc', borderRadius: 6,
                  background: '#f5f5f5', cursor: 'pointer', fontSize: 12, color: '#555',
                  flexShrink: 0,
                }}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fce8e9', border: '1px solid #f5c6cb',
              borderRadius: 6, padding: '10px 14px',
              fontSize: 13, color: '#721c24',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#a0c4e8' : '#0A66C2',
              color: '#fff', border: 'none', borderRadius: 6,
              padding: '11px 0', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 24 }}>
          Contact your admin to get an account.
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1px solid #ccc',
  borderRadius: 6,
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  background: '#fff',
  boxSizing: 'border-box',
}
