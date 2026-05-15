const BASE = '/api'

function getToken() {
  return localStorage.getItem('lp_token') || ''
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...(options.headers || {}) }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('lp_token')
    localStorage.removeItem('lp_user')
    window.location.href = '/'
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (email, password) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Login failed')
      return data
    }),

  me: () => request('/auth/me'),

  // ── Admin ─────────────────────────────────────────────────────────────────
  getUsers: () => request('/admin/users'),

  createUser: (email, password, role) =>
    request('/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    }),

  updateUser: (id, updates) =>
    request(`/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }),

  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),

  // ── Sessions ──────────────────────────────────────────────────────────────
  getSessions: (status) =>
    request(`/sessions${status ? `?status=${status}` : ''}`),

  getSession: (id) => request(`/sessions/${id}`),

  triggerGeneration: (topic, imageFile) => {
    const form = new FormData()
    if (topic) form.append('topic', topic)
    if (imageFile) form.append('image', imageFile)
    return request('/trigger', { method: 'POST', body: form })
  },

  uploadImage: (sessionId, imageFile) => {
    const form = new FormData()
    form.append('image', imageFile)
    return request(`/sessions/${sessionId}/image`, { method: 'POST', body: form })
  },

  approveOption: (sessionId, label) =>
    request(`/sessions/${sessionId}/approve/${label}`, { method: 'POST' }),

  rejectSession: (sessionId, keywords) =>
    request(`/sessions/${sessionId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords }),
    }),

  // ── Posts ─────────────────────────────────────────────────────────────────
  getPosts: () => request('/posts'),

  health: () => fetch(`${BASE}/health`).then(r => r.json()),

  // ── Analytics ─────────────────────────────────────────────────────────────
  getAnalytics: () => request('/analytics'),
  refreshAnalytics: () => request('/analytics/refresh', { method: 'POST' }),

  // ── Alerts ────────────────────────────────────────────────────────────────
  getAlerts: () => request('/alerts'),
  dismissAlert: (id) => request(`/alerts/${id}/dismiss`, { method: 'POST' }),

  // ── Settings ──────────────────────────────────────────────────────────────
  getSettings: () => request('/settings'),

  saveSettings: (body) =>
    request('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  testLinkedIn: () => request('/settings/test', { method: 'POST' }),
}
