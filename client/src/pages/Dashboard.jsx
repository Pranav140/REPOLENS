import { useState, useEffect, useMemo } from 'react'
import ConstellationMap from '../components/shared/ConstellationMap'
import Navbar from '../components/shared/Navbar'
import RepositoryCard from '../components/shared/RepositoryCard'
import ImportRepoModal from '../components/shared/ImportRepoModal'
import { Alert } from '../components/ui/alert'
import { Plus, GitBranch, Star, GitFork } from 'lucide-react'
import api from '../api/api'
import { useTheme } from '../contexts/ThemeContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell } from 'recharts'

function useCountUp(target, dur = 800) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!target) { setN(0); return }
    let s = null
    const run = ts => { if (!s) s = ts; const p = Math.min((ts-s)/dur,1); setN(Math.round((1-Math.pow(1-p,3))*target)); if(p<1) requestAnimationFrame(run) }
    requestAnimationFrame(run)
  }, [target, dur])
  return n
}

const TIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-default)', borderRadius:8, padding:'8px 12px' }}>
      {label && <p style={{ fontSize:10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:5 }}>{label}</p>}
      {payload.map((e,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background: e.color || e.fill }} />
          <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{e.name}</span>
          <span style={{ fontSize:13, fontWeight:800, color:'var(--text-primary)', marginLeft:8 }}>{e.value}</span>
        </div>
      ))}
    </div>
  )
}

// GitHub-style contribution heatmap (seeded visual)
function Heatmap({ theme }) {
  const weeks = useMemo(() => {
    let s = 99; const r = () => { s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff }
    return Array.from({length:18}, () => Array.from({length:7}, () => Math.floor(r()*5)))
  }, [])
  const cols = theme === 'dark'
    ? ['#0d1117','#1a2235','#213352','#2d4a7a','#3b82f6']
    : ['#E8ECF2','#C5D5E8','#9ABBD6','#5B9FD9','#3178C6']
  return (
    <div>
      <div style={{ display:'flex', gap:3 }}>
        {weeks.map((week,wi) => (
          <div key={wi} style={{ display:'flex', flexDirection:'column', gap:3 }}>
            {week.map((v,di) => (
              <div key={di} style={{ width:12, height:12, borderRadius:2, background:cols[v] }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:8, justifyContent:'flex-end' }}>
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>Less</span>
        {cols.map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:2, background:c }} />)}
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>More</span>
      </div>
    </div>
  )
}

// Real repo timeline
function RepoTimeline({ repos }) {
  if (!repos.length) return <p style={{ color:'var(--text-muted)', fontSize:13 }}>No repos imported yet.</p>
  const sorted = [...repos].sort((a,b) => new Date(a.analyzedAt||a.createdAt||0) - new Date(b.analyzedAt||b.createdAt||0))
  return (
    <div style={{ position:'relative', paddingLeft:20 }}>
      <div style={{ position:'absolute', left:6, top:6, bottom:6, width:1, background:'linear-gradient(180deg, var(--accent-blue), var(--border-default))' }} />
      {sorted.map((repo, i) => {
        const dt = repo.analyzedAt ? new Date(repo.analyzedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'Pending'
        const dotColor = repo.status==='completed'?'#22c55e': repo.status==='analyzing'?'#3b82f6': repo.status==='failed'?'#ef4444':'#f59e0b'
        return (
          <div key={repo._id} style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom: i<sorted.length-1?20:0 }}>
            <div style={{ width:13, height:13, borderRadius:'50%', background:dotColor, border:'2px solid var(--bg-base)', flexShrink:0, marginTop:2, boxShadow:`0 0 8px ${dotColor}60`, marginLeft:-7 }} />
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'monospace' }}>{repo.owner}/{repo.name}</span>
                <span style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'monospace' }}>{dt}</span>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:5 }}>
                <span style={{ fontSize:11, color: dotColor, background:`${dotColor}15`, border:`1px solid ${dotColor}30`, borderRadius:20, padding:'2px 8px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{repo.status}</span>
                {repo.language && <span style={{ fontSize:11, color:'var(--text-muted)' }}>{repo.language}</span>}
                {repo.metrics?.healthScore > 0 && <span style={{ fontSize:11, color:'var(--text-muted)' }}>Health: <strong style={{ color:'var(--text-secondary)' }}>{repo.metrics.healthScore}</strong></span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Dashboard() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)

  async function fetchRepos() {
    try { setError(null); const r = await api.get('/api/repos'); setRepos(r.data) }
    catch(e) { setError(e.response?.data?.message || 'Failed to load') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchRepos() }, [])

  const completed  = useMemo(() => repos.filter(r=>r.status==='completed'), [repos])
  const totalStars = useMemo(() => repos.reduce((a,r)=>a+(r.stars||0),0), [repos])
  const totalForks = useMemo(() => repos.reduce((a,r)=>a+(r.forks||0),0), [repos])
  const coverage   = useMemo(() => repos.length ? Math.round((completed.length/repos.length)*100) : 0, [repos, completed])
  const topRepo    = useMemo(() => [...completed].sort((a,b)=>(b.metrics?.healthScore||0)-(a.metrics?.healthScore||0))[0], [completed])

  const repoAnim  = useCountUp(repos.length, 600)
  const starsAnim = useCountUp(totalStars, 700)
  const forksAnim = useCountUp(totalForks, 700)
  const covAnim   = useCountUp(coverage, 900)

  // ── Derived theme colors (only for things that can't use var()) ──
  const cardBg     = isDark ? '#0D111A' : 'var(--bg-surface)'
  const cardBorder = isDark ? '#1E2A3A' : 'var(--border-default)'
  const accentGlow = isDark ? 'rgba(59,130,246,0.06)' : 'rgba(49,120,198,0.05)'

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-base)', color:'var(--text-primary)' }}>
      {/* Subtle ambient glow */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', backgroundImage: isDark
        ? 'radial-gradient(ellipse 70% 50% at 15% 0%, rgba(59,130,246,0.06) 0%, transparent 60%)'
        : 'radial-gradient(ellipse 70% 50% at 15% 0%, rgba(49,120,198,0.05) 0%, transparent 60%)'
      }}/>
      <div style={{ position:'relative', zIndex:10 }}>
        <Navbar/>
        <main style={{ paddingTop:80, paddingBottom:80, paddingLeft:'max(20px,3vw)', paddingRight:'max(20px,3vw)', maxWidth:1400, margin:'0 auto' }}>

          {/* ── Header ── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', paddingTop:36, paddingBottom:32, borderBottom:`1px solid ${cardBorder}`, marginBottom:28 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--accent-blue)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:8 }}>Workspace Overview</p>
              <h1 style={{ fontSize:'clamp(26px,3.5vw,40px)', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.03em', lineHeight:1.1 }}>Repository Dashboard</h1>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background: isDark ? '#e2e8f0' : 'var(--text-primary)', color: isDark ? '#070B12' : 'var(--bg-surface)', borderRadius:10, border:'none', fontSize:13, fontWeight:700, cursor:'pointer', transition:'opacity 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.opacity='0.85'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}
            >
              <Plus size={14} strokeWidth={2.5}/> Import Repo
            </button>
          </div>

          {/* ── Constellation ── */}
          <ConstellationMap repos={repos}/>

          {/* ── Stats Ticker ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', marginBottom:22, background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:16, overflow:'hidden' }}>
            {[
              { label:'Repositories', value: repoAnim, unit:'', sub: `${completed.length} analyzed`, accent:'#3b82f6',
                bar: repos.map(r=>({ color: r.status==='completed'?'#22c55e':r.status==='analyzing'?'#3b82f6':'#f59e0b', w: 100/Math.max(repos.length,1) })) },
              { label:'Coverage', value: covAnim, unit:'%', sub: `${repos.length - completed.length} pending`, accent:'#22c55e', progress: covAnim },
              { label:'GitHub Stars', value: starsAnim, unit:'', sub: topRepo ? `★ Best: ${topRepo.name}` : 'No repos yet', accent:'#f59e0b' },
              { label:'Total Forks', value: forksAnim, unit:'', sub: 'across all repositories', accent:'#a78bfa' },
            ].map((s, i) => (
              <div key={i} style={{ padding:'22px 24px', borderRight: i<3?`1px solid ${cardBorder}`:'none', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:`${s.accent}08`, filter:'blur(20px)', pointerEvents:'none' }}/>
                <p style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.14em', marginBottom:12 }}>{s.label}</p>
                <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:10 }}>
                  <span style={{ fontSize:44, fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.05em', lineHeight:1, fontFamily:'monospace' }}>{s.value}</span>
                  {s.unit && <span style={{ fontSize:22, fontWeight:700, color:s.accent }}>{s.unit}</span>}
                </div>
                {s.progress !== undefined && (
                  <div style={{ height:3, background: isDark ? '#12161E' : 'var(--border-subtle)', borderRadius:2, overflow:'hidden', marginBottom:8 }}>
                    <div style={{ height:'100%', width:`${s.progress}%`, background:`linear-gradient(90deg,#22c55e,#4ade80)`, borderRadius:2, transition:'width 1s ease' }}/>
                  </div>
                )}
                {s.bar && repos.length > 0 && (
                  <div style={{ display:'flex', gap:2, marginBottom:8, height:3 }}>
                    {repos.map((r,ri) => (
                      <div key={ri} style={{ flex:1, background: r.status==='completed'?'#22c55e':r.status==='analyzing'?'#3b82f6': isDark ? '#334155' : 'var(--border-default)', borderRadius:2 }}/>
                    ))}
                  </div>
                )}
                <p style={{ fontSize:11, color:'var(--text-muted)', marginTop: s.bar||s.progress!==undefined ? 0 : 4, fontFamily: s.label==='GitHub Stars'?'monospace':'inherit', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Row: Top Performer + Repo Timeline + Heatmap ── */}
          <div style={{ display:'grid', gridTemplateColumns:'240px 1fr 300px', gap:18, marginBottom:22 }}>

            {/* Top Performer */}
            <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:16, padding:22, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <div>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:16 }}>Top Performer</p>
                {topRepo ? (
                  <>
                    <div style={{ fontSize:15, fontWeight:800, color:'var(--text-primary)', fontFamily:'monospace', marginBottom:6, wordBreak:'break-all' }}>{topRepo.name}</div>
                    <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:20 }}>{topRepo.owner}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                      <div style={{ flex:1, height:6, background: isDark ? '#12161E' : 'var(--border-subtle)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${topRepo.metrics?.healthScore ?? 0}%`, background:'#22c55e', borderRadius:3 }}/>
                      </div>
                      <span style={{ fontSize:13, fontWeight:800, color:'#22c55e', fontFamily:'monospace', flexShrink:0 }}>{topRepo.metrics?.healthScore ?? 0}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>Health Score</div>
                  </>
                ) : (
                  <div style={{ color:'var(--text-muted)', fontSize:13, marginTop:10 }}>Analyze a repo to see the top performer.</div>
                )}
              </div>
              <div style={{ paddingTop:16, borderTop:`1px solid ${cardBorder}`, marginTop:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>Status Breakdown</p>
                {[['Completed','#22c55e',repos.filter(r=>r.status==='completed').length],
                  ['Analyzing','#3b82f6',repos.filter(r=>r.status==='analyzing').length],
                  ['Pending',  '#f59e0b',repos.filter(r=>r.status==='pending').length],
                  ['Failed',   '#ef4444',repos.filter(r=>r.status==='failed').length],
                ].filter(s=>s[2]>0).map(([l,c,n])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:c, boxShadow:`0 0 5px ${c}` }}/>
                      <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{l}</span>
                    </div>
                    <span style={{ fontSize:12, fontWeight:800, color:c }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Repository Timeline */}
            <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:16, padding:24 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:20 }}>Repository Timeline</p>
              <RepoTimeline repos={repos}/>
            </div>

            {/* Activity Heatmap */}
            <div style={{ background:cardBg, border:`1px solid ${cardBorder}`, borderRadius:16, padding:22 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>Analysis Activity</p>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:20 }}>18-week contribution grid</p>
              <Heatmap theme={theme}/>
            </div>
          </div>

          {/* ── Active Projects ── */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div>
              <h2 style={{ fontSize:19, fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.02em', marginBottom:3 }}>Active Projects</h2>
              <p style={{ fontSize:12, color:'var(--text-muted)' }}>{repos.length} repositories imported</p>
            </div>
          </div>

          {loading && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
              {[1,2,3].map(i=><div key={i} style={{ height:160, borderRadius:14, background:cardBg, border:`1px solid ${cardBorder}` }}/>)}
            </div>
          )}
          {error && !loading && (
            <Alert style={{ border:'1px solid rgba(239,68,68,0.2)', background:'rgba(239,68,68,0.05)', color:'#ef4444', borderRadius:10, padding:14, fontSize:13 }}>{error}</Alert>
          )}
          {!loading && !error && repos.length===0 && (
            <div style={{ border:`1px dashed ${cardBorder}`, borderRadius:18, padding:'60px 32px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', background:cardBg }}>
              <GitBranch size={30} style={{ color:'var(--text-muted)', marginBottom:14 }}/>
              <h3 style={{ fontSize:17, fontWeight:800, color:'var(--text-secondary)', marginBottom:8 }}>No repositories yet</h3>
              <p style={{ fontSize:13, color:'var(--text-muted)', maxWidth:340, lineHeight:1.7, marginBottom:24 }}>Import a GitHub repository to start analyzing its health and code quality in real-time.</p>
              <button onClick={()=>setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px', background:'var(--accent-blue)', color: isDark ? '#000' : '#fff', borderRadius:10, border:'none', fontSize:13, fontWeight:700, cursor:'pointer' }}>
                <Plus size={14}/> Import your first repository
              </button>
            </div>
          )}
          {!loading && !error && repos.length>0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
              {repos.map((repo,i)=><RepositoryCard key={repo._id} repo={repo} index={i}/>)}
            </div>
          )}
        </main>
      </div>
      <ImportRepoModal open={showModal} onClose={()=>setShowModal(false)} onSuccess={()=>{setShowModal(false);fetchRepos()}}/>
    </div>
  )
}
