import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  ResponsiveContainer, AreaChart, Area,
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip
} from 'recharts'
import {
  Activity, FileCode2, GitBranch, FileX2, Star, Layers,
  GitFork, ExternalLink, GitCommitHorizontal, User, Calendar, LayoutTemplate,
  Zap, ShieldAlert, AlertTriangle, File
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import api from '../../api/api'
import { useTheme } from '../../contexts/ThemeContext'
import './Overview.css'

// ─── useCountUp ────────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === undefined || target === null) return
    if (target === 0) { setCount(0); return }
    let start = null
    let raf
    const animate = (ts) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      setCount(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(animate)
    }
    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return count
}

// ─── Constants ─────────────────────────────────────────────────
const getC = (theme) => ({
  neon:   theme === 'dark' ? '#00FF26'  : '#3178C6',
  lime:   theme === 'dark' ? '#BBE663'  : '#12A37A',
  dark:   theme === 'dark' ? '#0A0C10'  : '#D6DAE6',
  cardBg: theme === 'dark' ? 'rgba(18, 22, 30, 0.85)' : 'rgba(224, 228, 239, 0.95)',
  panel:  theme === 'dark' ? '#12161E'  : '#E0E4EF',
  slate:  theme === 'dark' ? '#191919'  : '#CDD2E0',
  white:  theme === 'dark' ? '#FFFFFF'  : '#18243A',
  muted:  theme === 'dark' ? '#6B7280'  : '#4A5A72',
  border: theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(49,120,198,0.14)',
  blast1: theme === 'dark' ? '#12161E'  : '#E0E4EF',
  blast2: theme === 'dark' ? '#1A1F2B'  : '#D0D5E6',
  blast3: theme === 'dark' ? '#252B38'  : '#C0C7D8',
  blast4: theme === 'dark' ? '#3A4255'  : '#AAB2C8',
})

const getLangBarColors = (theme) => [getC(theme).neon, getC(theme).lime, '#6B7280', '#F59E0B', '#818CF8', '#EC4899']
const MOCK_AREA = [8,18,14,32,28,45,40,58,52,78]
const MOCK_BARS = [18,32,24,44,36,52,44,62,54,72]
const MOCK_LINE_DOWN = [88,75,80,62,70,52,44,36,28,18]

// ─── Animation variants ─────────────────────────────────────────
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
}
const card = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 22 } }
}

// ─── Sub-components ─────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, badge, badgeClass = 'rl-badge-green', sparkData, sparkColor, sparkType = 'area', iconColor, colSpan = 1, theme = 'dark', href }) {
  const C = getC(theme)
  const counted = useCountUp(value)
  const areaData = sparkData.map((v, i) => ({ i, v }))
  const navigate = useNavigate()

  return (
    <motion.div variants={card} className="rl-card" style={{ gridColumn: `span ${colSpan}`, cursor: href ? 'pointer' : 'default' }} onClick={() => href && navigate(href)}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(${iconColor || '0,255,38'},0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={`rgb(${iconColor || '0,255,38'})`} />
        </div>
        <span className={`rl-badge ${badgeClass}`}>{badge}</span>
      </div>

      <div className="rl-kpi-number">{counted}</div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginTop: 6, marginBottom: 'auto' }}>{label}</div>

      {/* Sparkline */}
      <div style={{ height: 52, marginTop: 16, marginLeft: -24, marginRight: -24 }}>
        <ResponsiveContainer width="100%" height="100%">
          {sparkType === 'area' ? (
            <AreaChart data={areaData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={2} fill={`url(#grad-${label})`} dot={false} />
            </AreaChart>
          ) : sparkType === 'bar' ? (
            <BarChart data={areaData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Bar dataKey="v" fill={sparkColor} radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          ) : (
            <LineChart data={areaData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Line type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={2} strokeDasharray="4 3" dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

function SectionLabel({ icon: Icon, children, color, theme = 'dark' }) {
  const C = getC(theme)
  const actualColor = color || C.neon
  return (
    <div className="rl-section-label">
      <Icon size={14} color={actualColor} />
      {children}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────
export default function Overview() {
  const { owner, name } = useParams()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const C = getC(theme)
  const [repo, setRepo] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [blastRadiusData, setBlastRadiusData] = useState([])
  const [topComplexFiles, setTopComplexFiles] = useState([])
  const [copiedSha, setCopiedSha] = useState(null)
  const [barsVisible, setBarsVisible] = useState(false)
  const barsRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setBarsVisible(true)
    }, { threshold: 0.1 })
    if (barsRef.current) observer.observe(barsRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    async function fetchData() {
      try {
        const [repoRes, metricsRes, blastRes, filesRes] = await Promise.all([
          api.get(`/api/repos/${owner}/${name}`),
          api.get(`/api/repos/${owner}/${name}/metrics`),
          api.get(`/api/repos/${owner}/${name}/blast-radius`).catch(() => ({ data: { results: [] } })),
          api.get(`/api/repos/${owner}/${name}/files`).catch(() => ({ data: [] }))
        ])
        setRepo(repoRes.data.repository)
        setMetrics(metricsRes.data.metrics || metricsRes.data)
        // API returns { results: [...] } shape
        const raw = blastRes.data?.results ?? blastRes.data
        setBlastRadiusData(Array.isArray(raw) ? raw : [])
        
        // Calculate top complex files
        const allFiles = Array.isArray(filesRes.data) ? filesRes.data : []
        const complexFiles = allFiles.sort((a, b) => (b.complexityScore || 0) - (a.complexityScore || 0)).slice(0, 6)
        setTopComplexFiles(complexFiles)
        setTimeout(() => setBarsVisible(true), 400)
      } catch (err) {
        console.error('Overview fetch error:', err)
      }
    }
    fetchData()
  }, [owner, name])

  const copyToClipboard = (sha) => {
    navigator.clipboard.writeText(sha)
    setCopiedSha(sha)
    setTimeout(() => setCopiedSha(null), 2000)
  }

  // ── Derived data ──────────────────────────────────────────────
  const healthScore = useCountUp(metrics?.healthScore || 0)
  const filesAnalyzed = useCountUp(metrics?.totalFiles || 0)
  const circularDeps = useCountUp(metrics?.circularDependencies || 0)
  const deadFilesCount = useCountUp(metrics?.deadFiles || 0)
  const blastArray = Array.isArray(blastRadiusData) ? blastRadiusData : []
  // Each blast item: { path, name, score, riskLevel, dependents, ... }
  const sortedBlast = [...blastArray].sort((a, b) => (b.score ?? b.dependentCount ?? 0) - (a.score ?? a.dependentCount ?? 0))
  const getLabel = (item) => item ? (item.name || item.path?.split('/').pop() || 'Unknown') : null
  const getScore = (item) => item ? (item.score ?? item.dependentCount ?? item.impactScore ?? 0) : null
  const circles = [
    { size: 300, bg: C.blast1, label: getLabel(sortedBlast[0]) || 'Ecosystem', score: getScore(sortedBlast[0]) ?? 85, textColor: theme === 'dark' ? C.neon : '#059669' },
    { size: 228, bg: C.blast2, label: getLabel(sortedBlast[1]) || 'Indirect Deps', score: getScore(sortedBlast[1]) ?? 72, textColor: theme === 'dark' ? C.white : '#0F172A' },
    { size: 160, bg: C.blast3, label: getLabel(sortedBlast[2]) || 'Direct Deps', score: getScore(sortedBlast[2]) ?? 64, textColor: theme === 'dark' ? C.lime : '#4D7C0F' },
    { size: 92, bg: C.blast4, label: getLabel(sortedBlast[3]) || 'Core', score: getScore(sortedBlast[3]) ?? 53, textColor: theme === 'dark' ? C.muted : '#FFFFFF' },
  ]

  const dnaData = [
    { subject: 'Complexity', A: metrics?.averageComplexity ? Math.min(100, metrics.averageComplexity * 4) : 40 },
    { subject: 'Docs', A: metrics?.documentationScore || 70 },
    { subject: 'Files', A: Math.min(100, (metrics?.totalFiles || 50) / 2) },
    { subject: 'Activity', A: Math.min(100, (repo?.recentCommits?.length || 4) * 12) },
    { subject: 'Health', A: metrics?.healthScore || 80 },
    { subject: 'Maintain', A: 100 - (metrics?.securityIssues || 0) * 10 || 78 },
  ]

  return (
    <div className="rl-overview" data-theme={theme}>
      <motion.div className="rl-bento-grid" variants={stagger} initial="hidden" animate="show">

        {/* ── ROW 1: 4 KPI Cards ─────────────────────────── */}
        <KpiCard
          icon={Activity}
          label="Health Score"
          value={metrics?.healthScore || 0}
          badge="Excellent"
          badgeClass="rl-badge-green"
          sparkData={MOCK_AREA}
          sparkColor={C.neon}
          sparkType="area"
          theme={theme}
          href={`/repo/${owner}/${name}/health`}
        />
        <KpiCard
          icon={FileCode2}
          label="Files Analyzed"
          value={metrics?.totalFiles || 0}
          badge="Scanned"
          badgeClass="rl-badge-lime"
          sparkData={MOCK_BARS}
          sparkColor={C.lime}
          sparkType="bar"
          iconColor={theme === 'dark' ? "187,230,99" : "5,205,153"}
          theme={theme}
          href={`/repo/${owner}/${name}/search`}
        />
        <KpiCard
          icon={GitBranch}
          label="Circular Deps"
          value={metrics?.circularDependencies || 0}
          badge={metrics?.circularDependencies > 0 ? 'Warning' : 'Clean'}
          badgeClass={metrics?.circularDependencies > 0 ? 'rl-badge-lime' : 'rl-badge-green'}
          sparkData={MOCK_AREA}
          sparkColor="#818CF8"
          sparkType="area"
          iconColor="129,140,248"
          theme={theme}
          href={`/repo/${owner}/${name}/dependencies`}
        />
        <KpiCard
          icon={FileX2}
          label="Dead Files Found"
          value={metrics?.deadFiles || 0}
          badge="Review"
          badgeClass="rl-badge-gray"
          sparkData={MOCK_LINE_DOWN}
          sparkColor="#F59E0B"
          sparkType="line"
          iconColor="245,158,11"
          theme={theme}
          href={`/repo/${owner}/${name}/health`}
        />

        {/* ── ROW 2 Left: Repo Profile (span 2) ─────────── */}
        <motion.div variants={card} className="rl-card" style={{ gridColumn: 'span 2' }}>
          <SectionLabel icon={LayoutTemplate} color={C.neon} theme={theme}>Repository Profile</SectionLabel>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(0,255,38,0.07)', border: `1px solid rgba(0,255,38,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutTemplate size={28} color={C.neon} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: C.white, letterSpacing: '-0.02em' }}>{repo?.name || '—'}</div>
              <a
                href={`https://github.com/${repo?.owner}/${repo?.name}`}
                target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: C.neon, textDecoration: 'none', marginTop: 4 }}
              >
                <ExternalLink size={12} /> Open in GitHub
              </a>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { icon: Star, label: 'Stars', value: repo?.stars ?? 0, color: '#F59E0B' },
              { icon: GitFork, label: 'Forks', value: repo?.forks ?? 0, color: C.lime },
              { icon: Activity, label: 'Complexity', value: metrics?.averageComplexity?.toFixed(1) ?? 0, color: '#818CF8' },
              { icon: Layers, label: 'Docs %', value: `${metrics?.documentationScore || 0}%`, color: C.neon },
            ].map(s => (
              <div key={s.label} className="rl-stat-box">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <s.icon size={13} color={s.color} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.white }}>{s.value}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── ROW 2-3 Right: Top Complex Files (span 2, row 2) ── */}
        <motion.div variants={card} className="rl-card" style={{ gridColumn: 'span 2', gridRow: 'span 2' }} ref={barsRef}>
          <SectionLabel icon={AlertTriangle} color="#F59E0B" theme={theme}>Top Complex Files</SectionLabel>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
            {topComplexFiles.length > 0 ? topComplexFiles.map((file, i) => {
              const filename = (file.path || file.file || file.name || 'unknown').split('/').pop()
              const fullPath = file.path || file.file || file.name || ''
              const complexity = file.complexityScore ?? file.complexity ?? file.score ?? file.cyclomaticComplexity ?? 0
              const maxComplexity = topComplexFiles[0]?.complexityScore ?? topComplexFiles[0]?.complexity ?? topComplexFiles[0]?.score ?? topComplexFiles[0]?.cyclomaticComplexity ?? 100
              const pct = Math.min(100, Math.round((complexity / (maxComplexity || 1)) * 100))
              const barColor = pct > 75 ? '#FF6B6B' : pct > 50 ? '#F59E0B' : C.lime
              return (
                <div key={fullPath} style={{ background: theme === 'dark' ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)', border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <File size={13} color={barColor} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: theme === 'dark' ? C.white : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{filename}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: barColor, flexShrink: 0, marginLeft: 8 }}>{complexity}</span>
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullPath}</div>
                  <div className="rl-lang-bar-track">
                    <motion.div
                      className="rl-lang-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: barsVisible ? `${pct}%` : 0 }}
                      transition={{ duration: 1.0, delay: 0.15 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      style={{ background: `linear-gradient(90deg, ${barColor}, ${barColor}88)` }}
                    />
                  </div>
                </div>
              )
            }) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13, gap: 8 }}>
                <AlertTriangle size={28} color="rgba(255,255,255,0.15)" />
                <span>No file complexity data available</span>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Run analysis to populate this panel</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── ROW 3 Left: Recent Activity (span 2) ──────── */}
        <motion.div variants={card} className="rl-card" style={{ gridColumn: 'span 2', cursor: 'pointer' }} onClick={() => navigate(`/repo/${owner}/${name}/commits`)}>
          <SectionLabel icon={GitCommitHorizontal} color={C.neon} theme={theme}>Recent Commits</SectionLabel>

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, gap: 0, overflowY: 'auto' }}>
            <div className="rl-timeline-line" />

            {repo?.recentCommits?.slice(0, 3).map((commit, i) => {
              const prefixMatch = commit.message.match(/^(feat|fix|chore|refactor|style|docs|test|perf)(\(.*?\))?:/i)
              const prefix = prefixMatch ? prefixMatch[1].toLowerCase() : null
              const prefixColors = { feat: C.neon, fix: '#F59E0B', chore: C.muted, refactor: '#818CF8', style: '#EC4899', docs: C.lime, test: '#06B6D4', perf: '#FF6B6B' }
              const prefixColor = prefix ? (prefixColors[prefix] || C.muted) : C.muted

              return (
                <motion.div
                  key={commit.sha}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.12 }}
                  style={{ display: 'flex', gap: 16, paddingLeft: 36, paddingBottom: 20, position: 'relative' }}
                >
                  {/* dot */}
                  <div style={{ position: 'absolute', left: 8, top: 4, width: 16, height: 16, borderRadius: '50%', background: theme === 'dark' ? C.panel : '#FFFFFF', border: `2px solid ${C.neon}`, zIndex: 1 }} />

                  <div style={{ flex: 1, background: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)', border: theme === 'dark' ? C.border : '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      {prefix && (
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, background: `rgba(${prefixColor === C.neon ? '0,255,38' : prefixColor === '#F59E0B' ? '245,158,11' : '107,114,128'},0.12)`, color: prefixColor, border: `1px solid rgba(${prefixColor === C.neon ? '0,255,38' : (theme === 'dark' ? '255,255,255' : '0,0,0')},0.15)` }}>
                          {prefix}
                        </span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: theme === 'dark' ? C.white : '#0F172A' }}>{commit.message.replace(/^[a-z]+(\(.*?\))?:\s*/i, '')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: C.muted, fontWeight: 500 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={11} /> {commit.author}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={11} /> {new Date(commit.date).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(commit.sha)}
                        style={{ padding: '3px 8px', background: 'rgba(0,255,38,0.07)', border: '1px solid rgba(0,255,38,0.15)', borderRadius: 5, fontSize: 11, fontWeight: 700, color: C.neon, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.2s' }}
                      >
                        {copiedSha === commit.sha ? '✓ copied' : commit.sha.slice(0, 7)}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
            {(!repo?.recentCommits || repo.recentCommits.length === 0) && (
              <div style={{ color: C.muted, fontSize: 13, paddingLeft: 36 }}>No recent commits</div>
            )}
          </div>
        </motion.div>

        {/* ── ROW 4-5 Left: Blast Radius (span 2, row 2) ── */}
        <motion.div variants={card} className="rl-card" style={{ gridColumn: 'span 2', gridRow: 'span 2', cursor: 'pointer' }} onClick={() => navigate(`/repo/${owner}/${name}/blast-radius`)}>
          <SectionLabel icon={Zap} color={C.neon} theme={theme}>Blast Radius</SectionLabel>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', width: 300, height: 300 }}>
              {circles.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200, damping: 22 }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: c.size,
                    height: c.size,
                    borderRadius: '50%',
                    background: c.bg,
                    border: i === 0 ? `1px solid rgba(0,255,38,0.2)` : `1px solid rgba(255,255,255,0.05)`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    paddingTop: 16,
                    boxShadow: i === 0 ? `0 0 40px rgba(0,255,38,0.06)` : 'none',
                  }}
                >
                  <div style={{ fontSize: i === 0 ? 20 : 18, fontWeight: 800, color: c.textColor, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{c.score}</div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: i === 3 ? C.muted : C.muted, fontFamily: 'JetBrains Mono, monospace', maxWidth: c.size - 32, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {c.label.length > 14 ? c.label.slice(0, 14) + '…' : c.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 20 }}>
            {circles.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: [theme === 'dark' ? C.neon : '#059669', theme === 'dark' ? C.lime : '#0F172A', theme === 'dark' ? '#818CF8' : '#4D7C0F', theme === 'dark' ? C.muted : '#FFFFFF'][i] }} />
                <span style={{ fontSize: 10, color: C.muted, fontFamily: 'JetBrains Mono, monospace' }}>{c.label.slice(0, 12)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── ROW 4-5 Right: Repository DNA Radar (span 2, row 2) ── */}
        <motion.div variants={card} className="rl-card" style={{ gridColumn: 'span 2', gridRow: 'span 2', cursor: 'pointer' }} onClick={() => navigate(`/repo/${owner}/${name}/health`)}>
          <SectionLabel icon={ShieldAlert} color={C.lime} theme={theme}>Repository DNA</SectionLabel>

          <div style={{ flex: 1, minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={dnaData}>
                <defs>
                  <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={C.neon} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={C.lime} stopOpacity={0.15} />
                  </radialGradient>
                </defs>
                <PolarGrid stroke={theme === 'dark' ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: C.muted, fontSize: 11, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="DNA"
                  dataKey="A"
                  stroke={C.neon}
                  strokeWidth={2}
                  fill="url(#radarGrad)"
                  fillOpacity={1}
                  dot={{ fill: C.neon, strokeWidth: 0, r: 4 }}
                />
                <Tooltip
                  contentStyle={{ background: theme === 'dark' ? C.panel : '#FFFFFF', border: `1px solid ${theme === 'dark' ? C.border : '#E2E8F0'}`, borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: 12 }}
                  labelStyle={{ color: theme === 'dark' ? C.white : '#0F172A' }}
                  itemStyle={{ color: C.neon }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* DNA metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 20 }}>
            {dnaData.map((d, i) => (
              <div key={d.subject} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 8px' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: i % 2 === 0 ? C.neon : C.lime }}>{d.A}</div>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{d.subject}</div>
              </div>
            ))}
          </div>
        </motion.div>

      </motion.div>
    </div>
  )
}
