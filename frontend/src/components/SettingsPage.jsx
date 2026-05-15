import React, { useEffect, useState } from 'react'
import { api } from '../services/api'

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

export default function SettingsPage() {
  const [form, setForm] = useState({
    linkedin_token: '',
    linkedin_org_id: '6456959',
    linkedin_member_id: '',
    post_mode: 'org',
    schedule_days: ['mon', 'wed', 'fri'],
    schedule_time: '09:00',
    default_topics: [],
  })
  const [tokenMasked, setTokenMasked] = useState('')
  const [tokenSet, setTokenSet] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [topicsText, setTopicsText] = useState('')
  // Reference posts: [{label, text}]
  const [refPosts, setRefPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getSettings().then(data => {
      setForm(f => ({
        ...f,
        linkedin_org_id: data.linkedin_org_id || '6456959',
        linkedin_member_id: data.linkedin_member_id || '',
        post_mode: data.post_mode || 'org',
        schedule_days: data.schedule_days || ['mon', 'wed', 'fri'],
        schedule_time: data.schedule_time || '09:00',
        default_topics: data.default_topics || [],
      }))
      setTokenMasked(data.linkedin_token_masked || '')
      setTokenSet(data.linkedin_token_set || false)
      setTopicsText((data.default_topics || []).join('\n'))
      setRefPosts(data.reference_posts || [])
      setLoading(false)
    })
  }, [])

  // ── Reference posts helpers ──
  const addRefPost = () =>
    setRefPosts(p => [...p, { label: `Reference ${p.length + 1}`, text: '' }])

  const updateRef = (i, field, val) =>
    setRefPosts(p => p.map((r, idx) => idx === i ? { ...r, [field]: val } : r))

  const removeRef = (i) =>
    setRefPosts(p => p.filter((_, idx) => idx !== i))

  const toggleDay = (day) => {
    setForm(f => ({
      ...f,
      schedule_days: f.schedule_days.includes(day)
        ? f.schedule_days.filter(d => d !== day)
        : [...f.schedule_days, day],
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const topics = topicsText.split('\n').map(t => t.trim()).filter(Boolean)
      const payload = {
        post_mode: form.post_mode,
        linkedin_org_id: form.linkedin_org_id,
        linkedin_member_id: form.linkedin_member_id,
        schedule_days: form.schedule_days,
        schedule_time: form.schedule_time,
        default_topics: topics,
        reference_posts: refPosts.filter(r => r.text.trim()),
      }
      // Only send token if user typed a new one
      if (form.linkedin_token.trim()) {
        payload.linkedin_token = form.linkedin_token.trim()
      }
      await api.saveSettings(payload)
      // Refresh masked token display
      const fresh = await api.getSettings()
      setTokenMasked(fresh.linkedin_token_masked || '')
      setTokenSet(fresh.linkedin_token_set || false)
      setForm(f => ({ ...f, linkedin_token: '' }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await api.testLinkedIn()
      setTestResult(result)
    } catch (e) {
      setTestResult({ ok: false, error: e.message })
    } finally {
      setTesting(false)
    }
  }

  if (loading) return <p style={{ padding: 24, color: '#666' }}>Loading settings...</p>

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h1>
        <p style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
          Configure your LinkedIn credentials, posting schedule, and content preferences.
          All settings are saved securely in the database.
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── LinkedIn Mode ── */}
        <Section title="Post Mode" hint="Choose whether to post as a Company Page or a Personal LinkedIn Profile.">
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { value: 'org', label: 'Company Page', desc: 'Post as your organisation (MS. READ)' },
              { value: 'personal', label: 'Personal Profile', desc: 'Post as your personal LinkedIn account' },
            ].map(opt => {
              const active = form.post_mode === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, post_mode: opt.value }))}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    border: `2px solid ${active ? '#0A66C2' : '#ddd'}`,
                    background: active ? '#e8f2fd' : '#fff',
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: active ? '#0A66C2' : '#1d2226' }}>{opt.label}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{opt.desc}</div>
                </button>
              )
            })}
          </div>
        </Section>

        {/* ── LinkedIn Credentials ── */}
        <Section title="LinkedIn Credentials">
          <Field label="LinkedIn Access Token" hint="From your LinkedIn Developer App. Expires every 60 days.">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type={showToken ? 'text' : 'password'}
                value={form.linkedin_token}
                onChange={e => setForm(f => ({ ...f, linkedin_token: e.target.value }))}
                placeholder={tokenSet ? `Current: ${tokenMasked}  (leave blank to keep)` : 'Paste your LinkedIn access token...'}
                style={inputStyle}
              />
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowToken(!showToken)}
                style={{ flexShrink: 0, fontSize: 12, padding: '7px 12px' }}
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
            {tokenSet && (
              <div style={{ fontSize: 12, color: '#057642', marginTop: 4 }}>
                ✓ Token saved ({tokenMasked})
              </div>
            )}
          </Field>

          {form.post_mode === 'org' ? (
            <Field label="LinkedIn Organization ID" hint="The numeric ID of your company page (default: 6456959 for MS. READ).">
              <input
                type="text"
                value={form.linkedin_org_id}
                onChange={e => setForm(f => ({ ...f, linkedin_org_id: e.target.value }))}
                style={{ ...inputStyle, width: 220 }}
              />
            </Field>
          ) : (
            <Field label="LinkedIn Member ID" hint='Your personal LinkedIn numeric ID.'>
              <input
                type="text"
                value={form.linkedin_member_id}
                onChange={e => setForm(f => ({ ...f, linkedin_member_id: e.target.value }))}
                placeholder="e.g. 126851668"
                style={{ ...inputStyle, width: 300 }}
              />
              <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                Click "Test Connection" to auto-detect, or find it in your LinkedIn profile URL:
                linkedin.com/in/yourname<strong>0123456789</strong> — use the numbers at the end (drop leading zero).
              </p>
            </Field>
          )}

          <div>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleTest}
              disabled={testing || !tokenSet}
              style={{ fontSize: 13 }}
            >
              {testing ? 'Testing...' : '🔌 Test LinkedIn Connection'}
            </button>
            {!tokenSet && (
              <span style={{ fontSize: 12, color: '#999', marginLeft: 10 }}>
                Save a token first to test.
              </span>
            )}
            {testResult && (
              <div style={{
                marginTop: 10, padding: '10px 14px', borderRadius: 8, fontSize: 13,
                background: testResult.ok ? '#d4edda' : '#fce8e9',
                color: testResult.ok ? '#155724' : '#721c24',
              }}>
                {testResult.ok
                  ? testResult.mode === 'personal'
                    ? <>
                        ✅ {testResult.note
                          ? <><strong>Token valid for posting.</strong> {testResult.note}</>
                          : <>Connected! Profile: "<strong>{testResult.name}</strong>" (Member ID: <code>{testResult.member_id}</code>)</>
                        }
                        {testResult.member_id && !testResult.note && (
                          <div style={{ marginTop: 6 }}>
                            👆 Copy this Member ID and paste it into the field above, then save.
                          </div>
                        )}
                      </>
                    : `✅ Connected! Page: "${testResult.org_name}" (ID: ${testResult.org_id})`
                  : `❌ ${testResult.error}`}
              </div>
            )}
          </div>
        </Section>

        {/* ── Posting Schedule ── */}
        <Section title="Posting Schedule">
          <Field label="Post days" hint="Content will be auto-generated on these days at the time below.">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DAYS.map(d => {
                const active = form.schedule_days.includes(d.key)
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: `2px solid ${active ? '#0A66C2' : '#ddd'}`,
                      background: active ? '#0A66C2' : '#fff',
                      color: active ? '#fff' : '#444',
                      fontWeight: active ? 600 : 400,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
            {form.schedule_days.length === 0 && (
              <p style={{ fontSize: 12, color: '#cc1016', marginTop: 4 }}>
                Select at least one day.
              </p>
            )}
          </Field>

          <Field label="Post time (Malaysia Time, MYT)" hint="Time when content options are auto-generated. You approve before it goes live.">
            <input
              type="time"
              value={form.schedule_time}
              onChange={e => setForm(f => ({ ...f, schedule_time: e.target.value }))}
              style={{ ...inputStyle, width: 140 }}
            />
          </Field>

          <div style={{
            background: '#e8f0fe', border: '1px solid #c5d9f8',
            borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#1d2226',
          }}>
            <strong>Current schedule:</strong>{' '}
            {form.schedule_days.length > 0
              ? `${form.schedule_days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')} at ${form.schedule_time} MYT`
              : 'No days selected'}
            <br />
            Content is generated automatically at this time. You review and approve from the{' '}
            <strong>Approvals</strong> queue before anything is posted to LinkedIn.
          </div>
        </Section>

        {/* ── Default Topics ── */}
        <Section title="Default Topic Hints" hint="Optional standing topics the AI uses when no specific topic is provided. One per line.">
          <textarea
            value={topicsText}
            onChange={e => setTopicsText(e.target.value)}
            placeholder={
              'Employee Appreciation Week\nMalaysia Labour Day\nNew store opening in Bangsar\nDiversity & Inclusion in fashion retail\nCareer growth at MS. READ'
            }
            rows={5}
            style={{
              ...inputStyle,
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.6,
            }}
          />
          <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
            The AI will rotate through these topics. Leave blank to let Claude choose the most relevant current topic.
          </p>
        </Section>

        {/* ── Reference Posts ── */}
        <Section
          title="Reference LinkedIn Posts"
          hint="Paste real MS. READ LinkedIn posts (or posts you admire) as style examples. Claude will mirror the tone, structure and voice — not copy the content."
        >
          {refPosts.length === 0 && (
            <p style={{ fontSize: 13, color: '#999' }}>
              No references added yet. Add examples to guide the AI's writing style.
            </p>
          )}

          {refPosts.map((ref, i) => (
            <div key={i} style={{
              border: '1px solid #e0e0e0', borderRadius: 8,
              overflow: 'hidden', background: '#fafafa',
            }}>
              {/* Label row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderBottom: '1px solid #ececec',
                background: '#f5f5f5',
              }}>
                <input
                  type="text"
                  value={ref.label}
                  onChange={e => updateRef(i, 'label', e.target.value)}
                  placeholder="Label (e.g. Culture Post, HR Topic)"
                  style={{
                    flex: 1, padding: '5px 8px', border: '1px solid #ddd',
                    borderRadius: 4, fontSize: 12, background: '#fff',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeRef(i)}
                  style={{
                    background: 'none', border: 'none', color: '#cc1016',
                    cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px',
                    flexShrink: 0,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
              {/* Post text */}
              <textarea
                value={ref.text}
                onChange={e => updateRef(i, 'text', e.target.value)}
                placeholder="Paste the full LinkedIn post text here..."
                rows={6}
                style={{
                  width: '100%', padding: '10px 12px',
                  border: 'none', outline: 'none',
                  resize: 'vertical', fontFamily: 'inherit',
                  fontSize: 13, lineHeight: 1.6,
                  background: '#fff', boxSizing: 'border-box',
                }}
              />
              <div style={{ padding: '4px 12px 6px', fontSize: 11, color: '#aaa' }}>
                {ref.text.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>
          ))}

          <button
            type="button"
            className="btn-ghost"
            onClick={addRefPost}
            style={{ alignSelf: 'flex-start', fontSize: 13 }}
          >
            + Add Reference Post
          </button>

          {refPosts.length > 0 && (
            <div style={{
              background: '#fff8e1', border: '1px solid #ffe082',
              borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#5d4037',
            }}>
              <strong>{refPosts.filter(r => r.text.trim()).length} reference post(s) saved.</strong>{' '}
              Claude will study these for tone and structure before generating new content.
              Up to 6 references are used per generation.
            </div>
          )}
        </Section>

        {/* ── Save ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving || form.schedule_days.length === 0}
            style={{ padding: '10px 28px', fontSize: 14 }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && (
            <span style={{ color: '#057642', fontWeight: 600, fontSize: 13 }}>
              ✓ Saved!
            </span>
          )}
          {error && (
            <span style={{ color: '#cc1016', fontSize: 13 }}>
              Error: {error}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}

function Section({ title, hint, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e0e0e0',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #f0f0f0',
        background: '#fafafa',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1d2226' }}>{title}</h2>
        {hint && <p style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{hint}</p>}
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#1d2226' }}>
        {label}
      </label>
      {children}
      {hint && <p style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{hint}</p>}
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
}
