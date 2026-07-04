import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Tooltip as RechartsTooltip, RadialBarChart, RadialBar, Legend, BarChart, Bar, LineChart, Line } from 'recharts'
import { 
  Activity, FileCode2, GitBranch, FileX2, Layers, Code2, Star, GitFork, Clock, 
  ExternalLink, GitCommitHorizontal, User, Calendar, AlertCircle, CheckCircle2, LayoutTemplate
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

const MOCK_SPARKLINE_DATA = [{ val: 10 }, { val: 25 }, { val: 20 }, { val: 40 }, { val: 35 }, { val: 55 }, { val: 50 }, { val: 70 }, { val: 65 }, { val: 90 }]
const MOCK_SPARKLINE_DATA_2 = [{ val: 90 }, { val: 80 }, { val: 85 }, { val: 60 }, { val: 70 }, { val: 50 }, { val: 30 }, { val: 40 }, { val: 20 }, { val: 10 }]

export default function Overview() {
  const { owner, name } = useParams()
  const [repo, setRepo] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [blastRadiusData, setBlastRadiusData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copiedSha, setCopiedSha] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [repoRes, metricsRes, blastRes] = await Promise.all([
          api.get(`/api/repos/${owner}/${name}`),
          api.get(`/api/repos/${owner}/${name}/metrics`),
          api.get(`/api/repos/${owner}/${name}/blast-radius`).catch(() => ({ data: { results: [] } }))
        ])
        setRepo(repoRes.data.repository)
        setMetrics(metricsRes.data)
        setBlastRadiusData(blastRes.data?.results || [])
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

  const languagesData = Object.entries(metrics?.languages || {}).map(([key, value]) => ({
    name: key, value: value, fill: LANG_COLORS[key] || LANG_COLORS.Other
  })).sort((a, b) => b.value - a.value)
  const totalLines = languagesData.reduce((acc, curr) => acc + curr.value, 0) || 1

  const copyToClipboard = (sha) => {
    navigator.clipboard.writeText(sha)
    setCopiedSha(sha)
    setTimeout(() => setCopiedSha(null), 1500)
  }

  // Compute Real Blast Radius Metrics using Top 4 files
  const top4 = blastRadiusData.slice(0, 4)
  const c1 = top4[0] // Outermost (highest risk)
  const c2 = top4[1]
  const c3 = top4[2]
  const c4 = top4[3] // Innermost

  const ecoVal = c1 ? c1.score : 77;
  const ecoLabel = c1 ? c1.name : 'auth.ts';

  const indirectVal = c2 ? c2.score : 73;
  const indirectLabel = c2 ? c2.name : 'index.ts';

  const directVal = c3 ? c3.score : 73;
  const directLabel = c3 ? c3.name : 'prisma.ts';

  const coreVal = c4 ? c4.score : 53;
  const coreLabel = c4 ? c4.name : 'password.service.ts';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* KPIs Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        
        {/* 1. Health Score (Premium Gradient + Area Chart) */}
        <div style={{
          background: 'linear-gradient(145deg, var(--bg-surface) 0%, rgba(5, 205, 153, 0.05) 100%)', borderRadius: '24px',
          padding: '20px 20px 0 20px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease forwards', opacity: 0, border: '1px solid rgba(5, 205, 153, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px 4px rgba(5, 205, 153, 0.2)' }}>
              <Activity size={18} color="var(--success)" />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', background: 'var(--success-bg)', color: 'var(--success)', letterSpacing: '0.02em' }}>
              Excellent
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '4px', letterSpacing: '-0.02em' }}>{healthScore}</div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Health Score</div>
          <div style={{ height: '32px', marginTop: '12px', marginLeft: '-20px', marginRight: '-20px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_SPARKLINE_DATA}>
                <defs><linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--success)" stopOpacity={0.3}/><stop offset="100%" stopColor="var(--success)" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="val" stroke="var(--success)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHealth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Files Analyzed (Clean White + Bar Chart) */}
        <div style={{
          background: 'var(--bg-surface)', borderRadius: '24px',
          padding: '20px 20px 0 20px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease forwards', animationDelay: '80ms', opacity: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent-blue-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCode2 size={18} color="var(--accent-blue)" />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '2px' }}>Files Analyzed</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{filesAnalyzed}</div>
            </div>
          </div>
          <div style={{ height: '32px', marginTop: '8px', marginLeft: '-20px', marginRight: '-20px', position: 'relative', outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
              <BarChart data={MOCK_SPARKLINE_DATA} style={{ outline: 'none' }}>
                <Bar dataKey="val" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} opacity={0.8} style={{ outline: 'none' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Circular Dependencies (Side-by-Side + Radial Warning) */}
        <div style={{
          background: 'var(--bg-surface)', borderRadius: '24px',
          padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease forwards', animationDelay: '160ms', opacity: 0, border: metrics?.circularDependencies > 0 ? '1px solid rgba(238, 93, 80, 0.3)' : 'none'
        }}>
          <div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: metrics?.circularDependencies > 0 ? 'var(--danger-bg)' : 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <GitBranch size={16} color={metrics?.circularDependencies > 0 ? 'var(--danger)' : 'var(--success)'} />
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '4px', letterSpacing: '-0.02em' }}>{circularDeps}</div>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Circular Deps</div>
          </div>
          <div style={{ width: '64px', height: '64px', position: 'relative', outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={6} data={[{ name: 'Deps', value: metrics?.circularDependencies > 0 ? 100 : 0, fill: metrics?.circularDependencies > 0 ? 'var(--danger)' : 'var(--success)' }]} startAngle={90} endAngle={-270} style={{ outline: 'none' }}>
                <RadialBar background={{ fill: 'var(--bg-elevated)' }} dataKey="value" cornerRadius={10} style={{ outline: 'none' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '16px', fontWeight: 800, color: metrics?.circularDependencies > 0 ? 'var(--danger)' : 'var(--success)' }}>
              !
            </div>
          </div>
        </div>

        {/* 4. Dead Files (Dark Theme / High Contrast + Dashed Line) */}
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: '24px',
          padding: '20px 20px 0 20px', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', animation: 'fadeSlideUp 400ms ease forwards', animationDelay: '240ms', opacity: 0
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Dead Files Found</div>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileX2 size={16} color="var(--warning)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginBottom: '8px', letterSpacing: '-0.02em' }}>{deadFiles}</div>
          <div style={{ height: '32px', marginTop: '12px', marginLeft: '-20px', marginRight: '-20px', position: 'relative', outline: 'none' }}>
            <ResponsiveContainer width="100%" height="100%" style={{ outline: 'none' }}>
              <LineChart data={MOCK_SPARKLINE_DATA_2} style={{ outline: 'none' }}>
                <Line type="monotone" dataKey="val" stroke="var(--warning)" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 2.5, fill: 'var(--warning)', strokeWidth: 0 }} style={{ outline: 'none' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Row 2: Languages & Repo Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', animation: 'fadeSlideUp 400ms ease 200ms forwards', opacity: 0 }}>
        
        {/* Modern Languages Radial Chart */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={20} color="var(--accent-blue)" /> Languages Breakdown
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
            <div style={{ width: '220px', height: '220px', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={languagesData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" strokeWidth={0}>
                    {languagesData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} style={{ filter: `drop-shadow(0px 4px 6px ${entry.fill}40)` }} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow-md)', background: 'var(--bg-surface)' }} itemStyle={{ fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)' }}>{metrics?.languages ? Object.keys(metrics.languages).length : 0}</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Languages</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {languagesData.slice(0, 5).map((lang) => (
                <div key={lang.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px dashed var(--border-default)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: lang.fill, boxShadow: `0 2px 8px ${lang.fill}60` }} />
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{lang.name}</div>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{Math.round((lang.value / totalLines) * 100)}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Repository Profile */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: '200px', height: '200px', background: 'var(--accent-blue-bg)', filter: 'blur(60px)', borderRadius: '50%', transform: 'translate(50%, -50%)', pointerEvents: 'none' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Code2 size={32} color="var(--text-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Repository Profile</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{repo?.name || 'Unknown'}</div>
              <a href={`https://github.com/${repo?.owner}/${repo?.name}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '14px', fontWeight: 600, color: 'var(--text-link)', textDecoration: 'none' }}>
                <ExternalLink size={14} /> Open in GitHub
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}><Star size={16} color="var(--warning)" /> Stars</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{repo?.stars ?? 0}</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}><GitFork size={16} /> Forks</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{repo?.forks ?? 0}</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}><Activity size={16} color="var(--success)" /> Complexity</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{metrics?.averageComplexity?.toFixed(1) || 0}</div>
            </div>
            <div style={{ background: 'var(--bg-elevated)', padding: '20px', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}><Layers size={16} color="var(--accent-blue)" /> Docs Score</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{metrics?.documentationScore || 0}%</div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 3: Tech Stack & Recent Commits */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', animation: 'fadeSlideUp 400ms ease 400ms forwards', opacity: 0 }}>
        
        {/* Blast Radius Component */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               Blast Radius
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                 <Activity size={16} />
              </div>
            </div>
          </div>
          
          <div style={{ position: 'relative', width: '320px', height: '320px', margin: 'auto' }}>
            {/* Circle 1 (Outermost) */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '320px', height: '320px', borderRadius: '50%',
              background: 'var(--accent-blue)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px'
            }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{ecoVal}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.95)', fontWeight: 600, fontFamily: 'monospace', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ecoLabel}</div>
            </div>

            {/* Circle 2 */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '250px', height: '250px', borderRadius: '50%',
              background: 'linear-gradient(rgba(67, 24, 255, 0.4), rgba(67, 24, 255, 0.4)), var(--bg-surface)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px'
            }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{indirectVal}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontFamily: 'monospace', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{indirectLabel}</div>
            </div>

            {/* Circle 3 */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '180px', height: '180px', borderRadius: '50%',
              background: 'linear-gradient(rgba(67, 24, 255, 0.15), rgba(67, 24, 255, 0.15)), var(--bg-surface)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '24px'
            }}>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{directVal}</div>
              <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 600, fontFamily: 'monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{directLabel}</div>
            </div>

            {/* Circle 4 (Innermost) */}
            <div style={{
              position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
              width: '110px', height: '110px', borderRadius: '50%',
              background: 'repeating-linear-gradient(45deg, var(--border-default), var(--border-default) 3px, var(--bg-surface) 3px, var(--bg-surface) 8px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '20px'
            }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{coreVal}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'monospace', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coreLabel}</div>
            </div>
          </div>
        </div>

        {/* Professional Timeline for Commits */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', padding: '32px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitCommitHorizontal size={20} color="var(--accent-blue)" /> Recent Activity
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Vertical Line */}
            <div style={{ position: 'absolute', top: '16px', bottom: '16px', left: '23px', width: '2px', background: 'var(--border-default)', zIndex: 0 }} />
            
            {repo?.recentCommits?.map((commit, i) => {
              const prefixMatch = commit.message.match(/^(feat|fix|chore|refactor)(\(.*\))?:/i)
              const prefix = prefixMatch ? prefixMatch[1].toLowerCase() : null
              let prefixStyle = { bg: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
              if (prefix === 'feat') prefixStyle = { bg: 'var(--success-bg)', color: 'var(--success)' }
              else if (prefix === 'fix') prefixStyle = { bg: 'var(--danger-bg)', color: 'var(--danger)' }
              
              return (
                <div key={commit.sha} style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', position: 'relative', zIndex: 1, marginBottom: i === repo.recentCommits.length - 1 ? 0 : '32px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-surface)', border: '4px solid var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 2px var(--border-default)' }}>
                    <GitCommitHorizontal size={20} color="var(--text-secondary)" />
                  </div>
                  <div style={{ flex: 1, background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {prefix && <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginRight: '8px', background: prefixStyle.bg, color: prefixStyle.color }}>{prefix}</span>}
                      {commit.message}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> {commit.author}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={14} /> {new Date(commit.date).toLocaleDateString()}</div>
                      </div>
                      <button onClick={() => copyToClipboard(commit.sha)} style={{ padding: '4px 8px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 600, color: 'var(--text-link)', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--text-link)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}>
                        {commit.sha.substring(0, 7)}
                        {copiedSha === commit.sha && <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translate(-50%, -4px)', background: 'var(--bg-overlay)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)', whiteSpace: 'nowrap' }}>Copied!</div>}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            {(!repo?.recentCommits || repo.recentCommits.length === 0) && <div style={{ color: 'var(--text-muted)' }}>No recent commits found.</div>}
          </div>
        </div>

      </div>
    </div>
  )
}
