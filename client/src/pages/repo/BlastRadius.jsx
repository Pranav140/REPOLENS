import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Flame, GitBranch, AlertTriangle, Activity, BarChart2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../api/api'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useTheme } from '../../contexts/ThemeContext'

export default function BlastRadius() {
  const { owner, name } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasScanned, setHasScanned] = useState(false)
  const [error, setError] = useState(null)

  const fetchBlastRadius = async () => {
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

  useEffect(() => {
    fetchBlastRadius()
  }, [owner, name])

  const handleClick = (e, file) => {
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

  if (isLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-[var(--border-default)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-secondary)]">Analyzing blast radius impact...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center backdrop-blur-xl">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={32} />
          <p className="text-sm text-red-400 mb-4 font-medium">{error}</p>
          <button
            onClick={fetchBlastRadius}
            className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 transition-colors cursor-pointer font-semibold"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    )
  }

  if (hasScanned && (!data || data.length === 0)) {
    return (
      <div className="min-h-[600px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <CheckCircle2 size={56} className="text-green-500 mx-auto" />
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Zero Critical Hotspots</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto leading-relaxed">
            Your repository architecture looks exceptionally stable with no highly coupled or volatile dependencies detected.
          </p>
        </div>
      </div>
    )
  }

  const criticalCount = data.filter(d => d.score >= 70).length
  const avgScore = Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / data.length) || 0

  const chartData = data.map(d => ({
    x: d.dependentCount,
    y: d.score,
    commits: d.commitFrequency,
    name: d.path.split('/').pop(),
    fullPath: d.path,
    score: d.score
  }))

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-[#0A0C10]/95 backdrop-blur-md border border-[var(--border-default)] p-3 rounded-lg shadow-2xl max-w-[250px]">
          <p className="text-sm font-mono text-[var(--text-primary)] truncate mb-1">{data.name}</p>
          <p className="text-xs text-[var(--text-secondary)]">Impact: <span className="text-[var(--text-primary)] font-bold">{data.x}</span> deps</p>
          <p className="text-xs text-[var(--text-secondary)]">Volatility: <span className="text-[var(--text-primary)] font-bold">{data.commits}</span> commits</p>
          <div className="mt-2 text-xs font-bold px-2 py-1 bg-red-500/10 text-red-400 rounded-md inline-block">
            Risk Score: {data.score}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <style>{`
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .modern-card {
          background: #0D0F14;
          border: 1px solid #1E222A;
          border-radius: 16px;
          transition: all 0.3s ease;
          position: relative;
        }
        .modern-card:hover {
          border-color: #2D3342;
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.5);
        }
        .modern-card::before {
          content: '';
          position: absolute;
          top: -1px; left: 20%; right: 20%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .modern-card:hover::before {
          opacity: 1;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-[28px] font-semibold text-white tracking-tight leading-none">
              Blast Radius
            </h2>
            <span className="px-2.5 py-0.5 rounded-full border border-[#2D3342] bg-[#161B22] text-[11px] font-medium text-[#8B949E] tracking-wide">
              BETA
            </span>
          </div>
          <p className="text-[14px] text-[#8B949E] max-w-xl">
            Analyze architectural coupling and structural volatility to identify the most dangerous files to modify.
          </p>
        </div>
        <button
          onClick={fetchBlastRadius}
          disabled={isLoading}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-[13px] font-semibold transition-all active:scale-95 hover:bg-gray-100 disabled:opacity-50 disabled:active:scale-100"
        >
          <BarChart2 size={16} />
          Run Analysis
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pb-4 border-b border-[#1E222A]">
        {/* Critical Hotspots Card */}
        <div className="modern-card p-6 flex flex-col group">
          <div className="flex justify-between items-start mb-8">
            <div className="text-[12px] font-semibold text-[#8B949E] tracking-widest uppercase flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#161B22] flex items-center justify-center border border-[#1E222A]">
                <Flame size={14} className="text-[#F87171]" />
              </div>
              Critical Hotspots
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[44px] font-semibold text-white tracking-tight leading-none">{criticalCount}</span>
            <span className="text-[13px] font-medium text-[#8B949E]">files</span>
          </div>
          <div className="mt-5 flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-[#161B22]">
            <div className="h-full bg-[#F87171] transition-all duration-1000" style={{ width: `${Math.min(100, (criticalCount/Math.max(1, data.length))*100)}%` }} />
          </div>
          <p className="mt-3 text-[12px] text-[#8B949E]">Scoring above 70 risk</p>
        </div>

        {/* Avg Risk Score Card */}
        <div className="modern-card p-6 flex flex-col group">
          <div className="flex justify-between items-start mb-8">
            <div className="text-[12px] font-semibold text-[#8B949E] tracking-widest uppercase flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#161B22] flex items-center justify-center border border-[#1E222A]">
                <Activity size={14} className="text-[#FBBF24]" />
              </div>
              Avg Risk Score
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[44px] font-semibold text-white tracking-tight leading-none">{avgScore}</span>
            <span className="text-[13px] font-medium text-[#8B949E]">/ 100</span>
          </div>
          <div className="mt-5 flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-[#161B22]">
             <div className="h-full bg-[#FBBF24] transition-all duration-1000" style={{ width: `${avgScore}%` }} />
          </div>
          <p className="mt-3 text-[12px] text-[#8B949E]">Across all monitored files</p>
        </div>

        {/* Total Affected Card */}
        <div className="modern-card p-6 flex flex-col group">
          <div className="flex justify-between items-start mb-8">
            <div className="text-[12px] font-semibold text-[#8B949E] tracking-widest uppercase flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#161B22] flex items-center justify-center border border-[#1E222A]">
                <GitBranch size={14} className="text-[#60A5FA]" />
              </div>
              Total Affected
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[44px] font-semibold text-white tracking-tight leading-none">
              {data.reduce((acc, curr) => acc + curr.dependentCount, 0)}
            </span>
            <span className="text-[13px] font-medium text-[#8B949E]">deps</span>
          </div>
          <div className="mt-5 flex gap-1 h-1.5 w-full rounded-full overflow-hidden bg-[#161B22]">
            <div className="h-full bg-[#60A5FA] w-full opacity-50" />
          </div>
          <p className="mt-3 text-[12px] text-[#8B949E]">Downstream transitive dependencies</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Risk List */}
        <div className="lg:col-span-7 space-y-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-default)] pb-3">
            Top Vulnerable Components
          </h3>
          <div className="space-y-4">
            {data.slice(0, 10).map((file, index) => {
              const isCritical = file.score >= 70
              const isHigh = file.score >= 50 && file.score < 70
              
              const accentColor = isCritical ? 'rgba(239, 68, 68, 1)' : isHigh ? 'rgba(245, 158, 11, 1)' : 'rgba(234, 179, 8, 1)'
              const accentBg = isCritical ? 'rgba(239, 68, 68, 0.08)' : isHigh ? 'rgba(245, 158, 11, 0.08)' : 'rgba(234, 179, 8, 0.08)'

              return (
                <div
                  key={file.path}
                  onClick={(e) => handleClick(e, file)}
                  className="group relative cursor-pointer overflow-hidden transition-all duration-300"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderLeft: `3px solid ${accentColor}`,
                    borderRadius: '12px',
                    padding: '20px'
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, ${accentBg}, transparent)` }} />
                  
                  <div className="relative z-10 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-semibold text-[var(--text-primary)] truncate block" title={file.path}>
                          {file.path.split('/').pop()}
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ color: accentColor, background: accentBg }}>
                          {isCritical ? 'Critical' : isHigh ? 'High Risk' : 'Elevated'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-[var(--text-secondary)] font-mono truncate opacity-60 mb-3">
                        {file.path}
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                        {file.reason}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] flex items-center gap-1.5 font-medium">
                          <GitBranch size={12} className="opacity-70" />
                          {file.dependentCount} Deps
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] font-medium">
                          {file.entryPointsAffected} Entry Points
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)] font-medium">
                          {file.commitFrequency} Commits
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-center justify-center">
                      <div className="text-3xl font-black" style={{ color: accentColor }}>
                        {file.score}
                      </div>
                      <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest mt-1">
                        Score
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Scatter Plot */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 glass-card p-6">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Impact vs Risk Score</h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6">High impact + high risk = maximum danger zone (top right).</p>
            
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    name="Dependents" 
                    stroke="var(--text-secondary)" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                    axisLine={{ stroke: 'var(--border-default)' }}
                    tickLine={false}
                    label={{ value: 'Dependency Impact', position: 'insideBottom', offset: -10, fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name="Risk Score" 
                    domain={[0, 100]}
                    stroke="var(--text-secondary)" 
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} 
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Risk Score', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--border-default)' }} />
                  <Scatter name="Files" data={chartData} onClick={(data) => navigate(`../graph?highlight=${encodeURIComponent(data.fullPath)}`)} style={{ cursor: 'pointer' }}>
                    {chartData.map((entry, index) => {
                      const color = entry.score >= 70 ? '#ef4444' : entry.score >= 50 ? '#f59e0b' : '#3b82f6'
                      return <Cell key={`cell-${index}`} fill={color} opacity={0.7} className="hover:opacity-100 transition-opacity" />
                    })}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical (≥70)</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> High (50-69)</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Medium (&lt;50)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
