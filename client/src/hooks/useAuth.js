import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('repolens_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* invalid JSON */ }
    }
    setLoading(false)
  }, [])

  function logout() {
    localStorage.removeItem('repolens_token')
    localStorage.removeItem('repolens_user')
    navigate('/login')
  }

  return { user, loading, isAuthenticated: !!user, logout }
}
