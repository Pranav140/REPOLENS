import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/api'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('No authorization code received from GitHub.')
      return
    }

    api.post('/api/auth/github', { code })
      .then(res => {
        const { token, user } = res.data
        localStorage.setItem('repolens_token', token)
        localStorage.setItem('repolens_user', JSON.stringify(user))
        navigate('/dashboard')
      })
      .catch(err => {
        setError(
          err.response?.data?.message || 'Authentication failed. Please try again.'
        )
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 text-xl">
          ✕
        </div>
        <h2 className="text-lg font-semibold text-white">Authentication Failed</h2>
        <p className="text-sm text-gray-400 max-w-sm">{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-2 px-5 py-2 rounded-lg bg-[#222] text-white text-sm hover:bg-[#333] transition-colors cursor-pointer"
        >
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      {/* Spinner */}
      <div className="w-10 h-10 border-2 border-[#333] border-t-white rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Signing you in...</p>
    </div>
  )
}
