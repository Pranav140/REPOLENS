import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('repolens_token')
    if (token) navigate('/dashboard')
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 text-center">
      {/* Badge */}
      <span className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#333] text-xs text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Open Source · GitHub Native
      </span>

      {/* Headline */}
      <h1 className="text-5xl sm:text-7xl font-bold text-white tracking-tight mb-4">
        RepoLens
      </h1>
      <p className="text-lg sm:text-xl text-gray-400 max-w-xl mb-10">
        Understand repositories, not just code.
      </p>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-2xl w-full text-left">
        {[
          { icon: '🔬', title: 'Deep Analysis', desc: 'Parse every file, map every dependency' },
          { icon: '🗺️', title: 'Visual Graph', desc: 'Interactive dependency & call graph' },
          { icon: '🤖', title: 'AI Insights', desc: 'Gemini-powered explanations & guides' },
        ].map(f => (
          <div key={f.title} className="rounded-xl border border-[#222] bg-[#111] p-4">
            <span className="text-2xl mb-2 block">{f.icon}</span>
            <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate('/login')}
        className="px-8 py-3 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
      >
        Get Started
      </button>
    </div>
  )
}
