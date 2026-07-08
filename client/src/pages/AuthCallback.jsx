import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/api'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('No authorization code received from GitHub.')
      setIsLoading(false)
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
      .finally(() => {
        setIsLoading(false)
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
    <div className="min-h-screen bg-[#070B12] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#3b82f6]/[0.03] via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        
        {/* Data processing bars loader */}
        <div className="flex items-center justify-center gap-1.5 mb-8 h-10">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className="w-1.5 rounded-full bg-[#3b82f6]"
              style={{
                animation: 'dataPulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
                height: '30%',
                opacity: 0.3
              }}
            />
          ))}
        </div>

        {/* Clean, decent typography */}
        <div className="flex flex-col items-center w-full text-center">
          <h2 className="text-[17px] font-semibold text-slate-200 mb-2 tracking-wide">Authenticating</h2>
          <p className="text-slate-500 text-[13px]">Securing connection to your workspace</p>
        </div>
      </div>
      
      <style>{`
        @keyframes dataPulse {
          0%, 100% { height: 30%; opacity: 0.2; background: #1E2A3A; }
          50% { height: 100%; opacity: 1; background: #3b82f6; box-shadow: 0 0 10px rgba(59,130,246,0.5); }
        }
      `}</style>
    </div>
  )
}
