import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const ROLE_COLORS = {
  admin: { bg: '#0A66C215', color: '#0A66C2' },
  user:  { bg: '#05764215', color: '#057642' },
}

function Badge({ role }) {
  const c = ROLE_COLORS[role] || ROLE_COLORS.user
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color,
    }}>
      {role}
    </span>
  )
}

export default function AdminPanel() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create user form
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', password: '', role: 'user' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState(null)

  // Password reset per user
  const [resetId, setResetId] = useState(null)
  const [resetPass, setResetPass] = useState('')
  const [resetting, setResetting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.getUsers()
      setUsers(data.users)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      await api.createUser(createForm.email, createForm.password, createForm.role)
      setCreateForm({ email: '', password: '', role: 'user' })
      setShowCreate(false)
      await load()
    } catch (e) {
      setCreateError(e.message)
    } finally {
      setCreating(false)
    }
  }

  const toggleActive = async (u) => {
    try {
      await api.updateUser(u.id, { active: u.active ? 0 : 1 })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  const changeRole = async (u, role) => {
    try {
      await api.updateUser(u.id, { role })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  const handleResetPassword = async (userId) => {
    if (!resetPass || resetPass.length < 6) {
      alert('Password must be at least 6 characters.')
      return
    }
    setResetting(true)
    try {
      await api.updateUser(userId, { password: resetPass })
      setResetId(null)
      setResetPass('')
      alert('Password updated.')
    } catch (e) {
      alert(e.message)
    } finally {
      setResetting(false)
    }
  }

  const handleDelete = async (u) => {
    if (!confirm(`Delete ${u.email}? This cannot be undone.`)) return
    try {
      await api.deleteUser(u.id)
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <p style={{ padding: 24, color: '#666' }}>Loading users...</p>
  if (error) return <p style={{ padding: 24, color: 'red' }}>Error: {error}</p>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>User Management</h1>
          <p style={{ color: '#666', fontSize: 13, marginTop: 2 }}>
            Admin panel — manage who can access this dashboard.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { setShowCreate(s => !s); setCreateError(null) }}
          style={{ fontSize: 13 }}
        >
          {showCreate ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Create user form */}
      {showCreate && (
        <div style={{
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10,
          padding: 20, marginBottom: 20,
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Create new user</h2>
          <form onSubmit={handleCreate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 2, minWidth: 180 }}>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                value={createForm.email}
                onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 2, minWidth: 160 }}>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                required
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <label style={labelStyle}>Role</label>
              <select
                value={createForm.role}
                onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="btn-primary"
                disabled={creating}
                style={{ fontSize: 13, padding: '9px 20px' }}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
          {createError && (
            <p style={{ color: '#cc1016', fontSize: 13, marginTop: 10 }}>{createError}</p>
          )}
        </div>
      )}

      {/* Users table */}
      <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700 }}>All Users</h2>
          <span style={{ fontSize: 12, color: '#888' }}>{users.length} user(s)</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f7f7f7' }}>
                {['Email', 'Role', 'Status', 'Created', 'Password', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: '#444', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                    {u.email}
                    {u.id === me?.id && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: '#888' }}>(you)</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {u.id === me?.id ? (
                      <Badge role={u.role} />
                    ) : (
                      <select
                        value={u.role}
                        onChange={e => changeRole(u, e.target.value)}
                        style={{
                          border: '1px solid #ddd', borderRadius: 4,
                          padding: '3px 6px', fontSize: 12, cursor: 'pointer',
                          background: '#fff',
                        }}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      background: u.active ? '#d4edda' : '#f8d7da',
                      color: u.active ? '#155724' : '#721c24',
                    }}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#888', whiteSpace: 'nowrap' }}>
                    {u.created_at ? new Date(u.created_at + 'Z').toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {resetId === u.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="password"
                          value={resetPass}
                          onChange={e => setResetPass(e.target.value)}
                          placeholder="New password"
                          style={{ ...inputStyle, width: 140, padding: '5px 8px' }}
                        />
                        <button
                          onClick={() => handleResetPassword(u.id)}
                          disabled={resetting}
                          style={{ fontSize: 12, padding: '5px 10px', background: '#0A66C2', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        >
                          {resetting ? '...' : 'Set'}
                        </button>
                        <button
                          onClick={() => { setResetId(null); setResetPass('') }}
                          style={{ fontSize: 12, padding: '5px 8px', background: '#eee', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setResetId(u.id); setResetPass('') }}
                        className="btn-ghost"
                        style={{ fontSize: 12, padding: '4px 10px' }}
                      >
                        Reset
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {u.id !== me?.id && (
                        <>
                          <button
                            onClick={() => toggleActive(u)}
                            className="btn-ghost"
                            style={{ fontSize: 12, padding: '4px 10px' }}
                          >
                            {u.active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            style={{
                              fontSize: 12, padding: '4px 10px',
                              background: 'none', border: '1px solid #f5c6cb',
                              borderRadius: 4, color: '#cc1016', cursor: 'pointer',
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#bbb', marginTop: 12, textAlign: 'center' }}>
        Default admin: <strong>admin@msread.com</strong> / <strong>Admin123!</strong> — change this immediately after first login.
      </p>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontWeight: 600, fontSize: 12, color: '#1d2226', marginBottom: 4,
}

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #ccc',
  borderRadius: 6, fontSize: 13, outline: 'none',
  fontFamily: 'inherit', background: '#fff', boxSizing: 'border-box',
}
