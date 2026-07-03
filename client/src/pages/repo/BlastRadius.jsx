import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flame, ExternalLink, ChevronRight, GitBranch } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api/api'

export default function BlastRadius() {
  const { owner, name } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true) // Start as true for auto-load
  const [hasScanned, setHasScanned] = useState(false)
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])
  async function fetchBlastRadius() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/repos/${owner}/${name}/blast-radius`)
      setData(res.data.results || [])
      setHasScanned(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze blast radius')
      toast.error(err.response?.data?.message || 'Failed to analyze blast radius')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch on component mount
  useEffect(() => {
    fetchBlastRadius()
  }, [owner, name]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[#333] border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Analyzing blast radius...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchBlastRadius}
            className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (hasScanned && (!data || data.length === 0)) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center">
          <Flame size={48} className="text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No dependency data available.</p>
          <p className="text-xs text-gray-600 mt-1">Make sure this repository has been fully analyzed.</p>
        </div>
      </div>
    )
  }

  const handleClick = (e, file) => {
    // Create ripple element
    const ripple = document.createElement('div')
    ripple.style.cssText = `
      position: fixed;
      border-radius: 50%;
      width: 20px; height: 20px;
      left: ${e.clientX - 10}px;
      top: ${e.clientY - 10}px;
      background: rgba(239,68,68,0.3);
      animation: ripple 0.4s ease-out forwards;
      pointer-events: none;
      z-index: 9999;
    `
    document.body.appendChild(ripple)
    setTimeout(() => {
      document.body.removeChild(ripple)
      navigate(`../graph?highlight=${encodeURIComponent(file.path)}`)
    }, 350)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <style>{`
        @keyframes radarSweep {
          0% { transform: rotate(0deg); opacity: 0.4; }
          100% { transform: rotate(360deg); opacity: 0.4; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes threatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.15); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      <div className="relative overflow-hidden mb-6 p-6 -mx-6 -mt-6">
        {/* Radar circles */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px', height: '600px',
          pointerEvents: 'none', zIndex: 0
        }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              position: 'absolute', top: '50%', left: '50%',
              width: `${i * 25}%`, height: `${i * 25}%`,
              transform: 'translate(-50%, -50%)',
              border: '1px solid rgba(239, 68, 68, 0.08)',
              borderRadius: '50%'
            }} />
          ))}
          {/* Sweep line */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '50%', height: '1px',
            background: 'linear-gradient(90deg, rgba(239,68,68,0.4), transparent)',
            transformOrigin: '0% 50%',
            animation: 'radarSweep 4s linear infinite'
          }} />
        </div>
        
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Riskiest Files to Modify</h2>
            <p className="text-sm text-gray-400 mt-1">Ranked by transitive impact, complexity, and change frequency</p>
          </div>
          <button
            onClick={fetchBlastRadius}
            disabled={isLoading}
            className="shrink-0 px-4 py-2 rounded-lg bg-[#1a1a1a] hover:bg-[#222] border border-[#333] hover:border-[#444] text-gray-300 hover:text-white text-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Flame size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {data?.map((file, index) => {
          let styleOverrides = {
            animation: \`fadeSlideIn 0.4s ease forwards\`,
            animationDelay: \`\${index * 60}ms\`,
            opacity: 0,
            background: '#111',
            border: '1px solid #222',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative'
          }
          
          let badge = null
          
          if (index === 0) {
            styleOverrides.borderLeft = '3px solid #ef4444'
            styleOverrides.boxShadow = '0 0 20px rgba(239,68,68,0.1)'
            badge = <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.1em', position: 'absolute', top: '16px', right: '16px' }}>CRITICAL</span>
          } else if (index === 1) {
            styleOverrides.borderLeft = '3px solid #f59e0b'
            badge = <span style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.1em', position: 'absolute', top: '16px', right: '16px' }}>HIGH RISK</span>
          } else if (index === 2) {
            styleOverrides.borderLeft = '3px solid #eab308'
            badge = <span style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.4)', color: '#eab308', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.1em', position: 'absolute', top: '16px', right: '16px' }}>ELEVATED</span>
          }

          if (file.riskLevel === 'high') {
            styleOverrides.animation = \`fadeSlideIn 0.4s ease forwards, threatPulse 3s ease-in-out infinite\`
            styleOverrides.animationDelay = \`\${index * 60}ms, \${index * 60 + 400}ms\`
          }
          
          return (
            <div
              key={file.path}
              style={styleOverrides}
              className="group cursor-pointer hover:bg-[#161616] transition-colors"
              onClick={(e) => handleClick(e, file)}
            >
              {badge}
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-gray-200 truncate">{file.path}</span>
                </div>
                
                <p className="text-sm text-gray-400 leading-relaxed pr-24">{file.reason}</p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-gray-400 flex items-center gap-1.5">
                    <GitBranch size={11} />
                    {file.dependentCount} dependents
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-gray-400">
                    {file.entryPointsAffected} entry points
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a1a] border border-[#333] text-gray-400">
                    {file.commitFrequency} commits
                  </span>
                </div>
              </div>
              
              <div className="shrink-0 flex flex-col items-center justify-center min-w-[100px] border-l border-[#222] pl-6 pt-6">
                <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                  <svg width="64" height="64" style={{ position: 'absolute', top: 0, left: 0 }}>
                    <circle cx="32" cy="32" r="28" stroke="#222" strokeWidth="4" fill="none"/>
                    <circle cx="32" cy="32" r="28"
                      stroke={
                        file.score >= 60 ? '#ef4444' : 
                        file.score >= 30 ? '#f59e0b' : '#22c55e'
                      }
                      strokeWidth="4" fill="none"
                      strokeDasharray={\`${2 * Math.PI * 28}\`}
                      strokeDashoffset={\`${2 * Math.PI * 28 * (1 - file.score / 100)}\`}
                      transform="rotate(-90 32 32)"
                      style={{ transition: 'stroke-dashoffset 1s ease' }}
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '14px', fontWeight: 'bold',
                    color: file.score >= 60 ? '#ef4444' : 
                           file.score >= 30 ? '#f59e0b' : '#22c55e'
                  }}>
                    {file.score}
                  </div>
                </div>
                <span className="text-xs text-gray-500 uppercase mt-1.5 tracking-wider font-semibold">{file.riskLevel} risk</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
