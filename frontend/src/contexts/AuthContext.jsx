import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lp_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('lp_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.me()
      .then(u => {
        setUser(u)
        localStorage.setItem('lp_user', JSON.stringify(u))
      })
      .catch(() => {
        localStorage.removeItem('lp_token')
        localStorage.removeItem('lp_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const data = await api.login(email, password)
    localStorage.setItem('lp_token', data.access_token)
    localStorage.setItem('lp_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const logout = () => {
    localStorage.removeItem('lp_token')
    localStorage.removeItem('lp_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
