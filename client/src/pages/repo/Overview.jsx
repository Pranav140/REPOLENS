import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip, XAxis, YAxis } from 'recharts'
import { 
  Activity, FileCode2, GitBranch, FileX2, Layers, Code2, Info, Star, GitFork, Clock, 
  ExternalLink, BarChart3, GitCommitHorizontal, User, Calendar, AlertCircle
} from 'lucide-react'
import api from '../../api/api'

// useCountUp hook
function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === undefined || target === null) return
    if (target === 0) { setCount(0); return }
    let start = null; let animationFrameId;
    const animate = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) animationFrameId = requestAnimationFrame(animate)
    }
    animationFrameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrameId)
  }, [target, duration])
  return count
}

const LANG_COLORS = { TypeScript: '#3178C6', JavaScript: '#F7DF1E', Python: '#3776AB', CSS: '#9B59B6', JSON: '#8B949E', Markdown: '#718096', Other: '#30363D' }

const MOCK_SPARKLINE_DATA = [
  { val: 10 }, { val: 25 }, { val: 20 }, { val: 40 }, { val: 35 }, { val: 55 }, { val: 50 }, { val: 70 }, { val: 65 }, { val: 90 }
]
const MOCK_SPARKLINE_DATA_2 = [
  { val: 90 }, { val: 80 }, { val: 85 }, { val: 60 }, { val: 70 }, { val: 50 }, { val: 30 }, { val: 40 }, { val: 20 }, { val: 10 }
]

export default function Overview() {
  const { owner, name } = useParams()
  const [repo, setRepo] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedSha, setCopiedSha] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [repoRes, metricsRes] = await Promise.all([
          api.get(`/api/repos/${owner}/${name}`),
          api.get(`/api/repos/${owner}/${name}/metrics`)
        ])
        setRepo(repoRes.data.repository)
        setMetrics(metricsRes.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load repository overview')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [owner, name])

  const healthScore = useCountUp(metrics?.healthScore ?? 0)
  const filesAnalyzed = useCountUp(metrics?.totalFiles ?? 0)
  const circularDeps = useCountUp(metrics?.circularDependencies ?? 0)
  const deadFiles = useCountUp(metrics?.deadFiles ?? 0)

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', height: '160px', animation: 'shimmer 1.5s infinite', backgroundImage: 'linear-gradient(90deg, var(--bg-elevated) 0%, var(--bg-overlay) 50%, var(--bg-elevated) 100%)', backgroundSize: '800px 100%' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertCircle size={16} />{error}
      </div>
    )
  }

  const getHealthColor = (score) => score >= 70 ? 'var(--success)' : score >= 40 ? 'var(--warning)' : 'var(--danger)'
  
  const languagesData = Object.entries(metrics?.languages || {}).map(([key, value]) => ({
    name: key, value: value, color: LANG_COLORS[key] || LANG_COLORS.Other
  })).sort((a, b) => b.value - a.value)
  const totalLines = languagesData.reduce((acc, curr) => acc + curr.value, 0) || 1

  const copyToClipboard = (sha) => {
    navigator.clipboard.writeText(sha)
    setCopiedSha(sha)
    setTimeout(() => setCopiedSha(null), 1500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* KPIs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        
        {/* Health Score */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
          padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease forwards', opacity: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} color="var(--success)" />
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'var(--success-bg)', color: 'var(--success)' }}>
              +{healthScore}%
            </div>
          </div>
          <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '4px' }}>{healthScore}</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Health Score</div>
          <div style={{ height: '40px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_SPARKLINE_DATA}>
                <defs><linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--success)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--success)" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Files Analyzed */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
          padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease forwards', animationDelay: '80ms', opacity: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--accent-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCode2 size={24} color="var(--accent-blue)" />
            </div>
          </div>
          <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '4px' }}>{filesAnalyzed}</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Files Analyzed</div>
          <div style={{ height: '40px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_SPARKLINE_DATA}>
                <defs><linearGradient id="colorFiles" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="var(--accent-blue)" strokeWidth={2} fillOpacity={1} fill="url(#colorFiles)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Circular Dependencies */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
          padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease forwards', animationDelay: '160ms', opacity: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: metrics?.circularDependencies > 0 ? 'var(--danger-bg)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GitBranch size={24} color={metrics?.circularDependencies > 0 ? 'var(--danger)' : 'var(--success)'} />
            </div>
            {metrics?.circularDependencies > 0 && <div style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '20px', background: 'var(--danger-bg)', color: 'var(--danger)' }}>Warning</div>}
          </div>
          <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '4px' }}>{circularDeps}</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Circular Dependencies</div>
          <div style={{ height: '40px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_SPARKLINE_DATA_2}>
                <defs><linearGradient id="colorCirc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={metrics?.circularDependencies > 0 ? 'var(--danger)' : 'var(--success)'} stopOpacity={0.3}/><stop offset="95%" stopColor={metrics?.circularDependencies > 0 ? 'var(--danger)' : 'var(--success)'} stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke={metrics?.circularDependencies > 0 ? 'var(--danger)' : 'var(--success)'} strokeWidth={2} fillOpacity={1} fill="url(#colorCirc)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Dead Files */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)',
          padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease forwards', animationDelay: '240ms', opacity: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-full)', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileX2 size={24} color="var(--warning)" />
            </div>
          </div>
          <div style={{ fontSize: '42px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '4px' }}>{deadFiles}</div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Dead Files</div>
          <div style={{ height: '40px', marginTop: '10px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_SPARKLINE_DATA_2}>
                <defs><linearGradient id="colorDead" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--warning)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--warning)" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="var(--warning)" strokeWidth={2} fillOpacity={1} fill="url(#colorDead)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Languages & Tech Stack */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', animation: 'fadeSlideUp 400ms ease 200ms forwards', opacity: 0 }}>
        
        {/* Languages Pie Chart */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', width: '100%', marginBottom: '24px' }}>Languages Overview</div>
          <div style={{ width: '180px', height: '180px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={languagesData} innerRadius={60} outerRadius={85} dataKey="value" strokeWidth={0}>
                  {languagesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{metrics?.languages ? Object.keys(metrics.languages).length : 0}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Langs</span>
            </div>
          </div>
          <div style={{ width: '100%', marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {languagesData.slice(0, 4).map((lang) => (
              <div key={lang.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: lang.color }} />
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>{lang.name}</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{Math.round((lang.value / totalLines) * 100)}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Stack & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>Technology Stack</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {metrics?.techStack?.map((tech, i) => (
                <div key={tech} style={{
                  padding: '8px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-default)',
                  fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', transition: 'all 0.2s ease', cursor: 'default'
                }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--accent-blue)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
                  {tech}
                </div>
              ))}
              {(!metrics?.techStack || metrics.techStack.length === 0) && <div style={{ color: 'var(--text-muted)' }}>No tech stack detected</div>}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Repository Name</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{repo?.name || 'Unknown'}</div>
              <a href={`https://github.com/${repo?.owner}/${repo?.name}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--accent-blue)', textDecoration: 'none' }}>
                <ExternalLink size={16} /> Open in GitHub
              </a>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Stars</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Star size={18} color="var(--warning)" fill="var(--warning)" /> {repo?.stars ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Forks</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}><GitFork size={18} color="var(--text-secondary)" /> {repo?.forks ?? 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Avg Complexity</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{metrics?.averageComplexity?.toFixed(1) || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Documentation</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>{metrics?.documentationScore || 0}%</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Commits */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease 400ms forwards', opacity: 0 }}>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '24px' }}>Recent Commits</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {repo?.recentCommits?.map((commit, i) => {
            const prefixMatch = commit.message.match(/^(feat|fix|chore|refactor)(\(.*\))?:/i)
            const prefix = prefixMatch ? prefixMatch[1].toLowerCase() : null
            let prefixStyle = { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
            if (prefix === 'feat') prefixStyle = { bg: 'var(--success-bg)', color: 'var(--success)' }
            else if (prefix === 'fix') prefixStyle = { bg: 'var(--danger-bg)', color: 'var(--danger)' }
            
            return (
              <div key={commit.sha} style={{ display: 'flex', alignItems: 'flex-start', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', gap: '16px', transition: 'all 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                  <GitCommitHorizontal size={18} color="var(--text-secondary)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    {prefix && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginRight: '8px', background: prefixStyle.bg, color: prefixStyle.color }}>{prefix}</span>}
                    {commit.message}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {commit.author}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {new Date(commit.date).toLocaleDateString()}</div>
                  </div>
                </div>
                <button onClick={() => copyToClipboard(commit.sha)} style={{ padding: '6px 12px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-primary)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}>
                  {commit.sha.substring(0, 7)}
                  {copiedSha === commit.sha && <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -4px)', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap' }}>Copied!</div>}
                </button>
              </div>
            )
          })}
          {(!repo?.recentCommits || repo.recentCommits.length === 0) && <div style={{ color: 'var(--text-muted)' }}>No recent commits found.</div>}
        </div>
      </div>
    </div>
  )
}
