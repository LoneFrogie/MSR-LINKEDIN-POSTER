import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import LoginPage from './components/LoginPage'
import ApprovalQueue from './components/ApprovalQueue'
import SessionDetail from './components/SessionDetail'
import PostHistory from './components/PostHistory'
import TriggerPanel from './components/TriggerPanel'
import SettingsPage from './components/SettingsPage'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import AdminPanel from './components/AdminPanel'
import AlertBanner from './components/AlertBanner'

const linkStyle = ({ isActive }) => ({
  padding: '8px 14px',
  borderRadius: '6px',
  fontWeight: 500,
  fontSize: '13px',
  color: isActive ? '#ffffff' : '#1d2226',
  background: isActive ? '#0A66C2' : 'transparent',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
})

function AppShell() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f2ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#666', fontSize: 14 }}>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f2ef' }}>
      {/* Top nav */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e0e0e0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: '#0A66C2', color: '#fff',
            fontWeight: 700, fontSize: 15,
            padding: '4px 9px', borderRadius: 5,
          }}>in</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1d2226', lineHeight: 1.2 }}>
              MS. READ LinkedIn Poster
            </div>
            <div style={{ fontSize: 11, color: '#999', lineHeight: 1.2 }}>
              AI-powered employer branding
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'nowrap' }}>
          <NavLink to="/" end style={linkStyle}>Approvals</NavLink>
          <NavLink to="/history" style={linkStyle}>Published</NavLink>
          <NavLink to="/analytics" style={linkStyle}>Analytics</NavLink>
          <NavLink to="/trigger" style={linkStyle}>+ Generate</NavLink>
          <NavLink to="/settings" style={linkStyle}>Settings</NavLink>
          {user.role === 'admin' && (
            <NavLink to="/admin" style={linkStyle}>Users</NavLink>
          )}
          {/* User badge + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid #e0e0e0' }}>
            <span style={{ fontSize: 12, color: '#555', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </span>
            <button
              onClick={logout}
              style={{
                fontSize: 12, padding: '5px 10px',
                border: '1px solid #ddd', borderRadius: 4,
                background: '#fff', cursor: 'pointer', color: '#555',
                whiteSpace: 'nowrap',
              }}
            >
              Sign out
            </button>
          </div>
        </nav>
      </header>

      <AlertBanner />

      {/* Main content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <Routes>
          <Route path="/" element={<ApprovalQueue />} />
          <Route path="/session/:id" element={<SessionDetail />} />
          <Route path="/history" element={<PostHistory />} />
          <Route path="/trigger" element={<TriggerPanel />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          {user.role === 'admin' && (
            <Route path="/admin" element={<AdminPanel />} />
          )}
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
