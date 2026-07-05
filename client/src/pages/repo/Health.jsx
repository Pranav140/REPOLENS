import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Skeleton } from '../../components/ui/skeleton'
import { Alert } from '../../components/ui/alert'
import { AlertOctagon, ArrowRightLeft, GitBranch } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import api from '../../api/api'

function getStatus(v, good, warn) {
  if (v <= good) return 'good'
  if (v <= warn) return 'warning'
  return 'danger'
}
function getStatusInv(v, good, warn) {
  if (v >= good) return 'good'
  if (v >= warn) return 'warning'
  return 'danger'
}
const S = { good: 'text-green-400', warning: 'text-yellow-400', danger: 'text-red-400' }

function Card({ children, title, className = '' }) {
  return (
    <div className={`rounded-2xl bg-[#0a0a0a]/50 backdrop-blur-xl p-6 shadow-sm border border-[#ffffff0a] ${className}`}>
      {title && <h3 className="text-sm font-semibold text-gray-300 mb-5 uppercase tracking-wider">{title}</h3>}
      {children}
    </div>
  )
}

function ScoreRing({ score }) {
  const color = score >= 70 ? '#22c55e' : 
                score >= 40 ? '#f59e0b' : '#ef4444'
  const radius = 70
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  return (
    <>
      <style>{`
        @keyframes dashReveal {
          from { stroke-dashoffset: ${2 * Math.PI * 60}px; }
          to { stroke-dashoffset: ${offset}px; }
        }
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 4px ${color}40); }
          50% { filter: drop-shadow(0 0 12px ${color}80); }
        }
        @keyframes scoreCount {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div style={{ 
        display: 'flex', flexDirection: 'column', 
        alignItems: 'center', gap: '8px',
        padding: '32px'
      }}>
        <svg width="180" height="180" 
          style={{ animation: 'glowPulse 3s ease-in-out infinite' }}>
          {/* Background track */}
          <circle cx="90" cy="90" r={radius}
            stroke="#1a1a1a" strokeWidth="10" fill="none"/>
          {/* Subtle tick marks */}
          {Array.from({ length: 20 }).map((_, i) => {
            const angle = (i / 20) * 2 * Math.PI - Math.PI / 2
            const inner = radius - 14
            const outer = radius - 8
            return (
              <line key={i}
                x1={90 + inner * Math.cos(angle)}
                y1={90 + inner * Math.sin(angle)}
                x2={90 + outer * Math.cos(angle)}
                y2={90 + outer * Math.sin(angle)}
                stroke="#2a2a2a" strokeWidth="1"
              />
            )
          })}
          {/* Main progress arc */}
          <circle cx="90" cy="90" r={radius}
            stroke={color}
            strokeWidth="10" fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ}
            transform="rotate(-90 90 90)"
            style={{
              animation: `dashReveal 1.2s ease forwards`,
              animationDelay: '0.3s'
            }}
          />
          {/* Score label */}
          <text x="90" y="82" textAnchor="middle"
            fontSize="36" fontWeight="800"
            fill="white" fontFamily="monospace">
            {score}
          </text>
          <text x="90" y="104" textAnchor="middle"
            fontSize="11" fill="#555" letterSpacing="0.15em">
            HEALTH SCORE
          </text>
        </svg>
        <div style={{ 
          display: 'flex', gap: '6px', alignItems: 'center' 
        }}>
          <div style={{ 
            width: '8px', height: '8px', borderRadius: '50%',
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: 'glowPulse 2s ease-in-out infinite'
          }}/>
          <span style={{ color: '#666', fontSize: '12px' }}>
            {score >= 70 ? 'healthy' : 
             score >= 40 ? 'needs attention' : 'critical'}
          </span>
        </div>
      </div>
    </>
  )
}

export default function Health() {
  const { owner, name } = useParams()
  const [metrics, setMetrics] = useState(null)
  const [files, setFiles] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [refactorFindings, setRefactorFindings] = useState(null)
  const [refactorLoading, setRefactorLoading] = useState(false)
  const [refactorExplanation, setRefactorExplanation] = useState(null)
  const [explanationLoading, setExplanationLoading] = useState(false)

  useEffect(() => {
    async function go() {
      try {
        const [mR, fR, hR] = await Promise.all([
          api.get(`/api/repos/${owner}/${name}/metrics`),
          api.get(`/api/repos/${owner}/${name}/files`),
          api.get(`/api/graph/${owner}/${name}/hotspots`),
        ])
        setMetrics(mR.data)
        setFiles(fR.data || [])
        setHotspots(hR.data.hotspots || [])
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load health data')
      } finally { setLoading(false) }
    }
    go()
  }, [owner, name])

  if (loading) return (
    <div className="max-w-[1200px] mx-auto space-y-6 mt-8">
      <div className="rounded-3xl bg-[#0a0a0a]/30 p-12 flex justify-center animate-pulse">
        <div className="w-48 h-48 rounded-full border-8 border-[#ffffff05]" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="rounded-2xl bg-[#0a0a0a]/40 p-6 space-y-3">
            <Skeleton className="h-3 w-20 bg-[#ffffff10]"/><Skeleton className="h-10 w-16 bg-[#ffffff10]"/>
          </div>
        ))}
      </div>
    </div>
  )
  if (error) return <Alert className="border-red-500/30 bg-red-500/10 text-red-400">{error}</Alert>
  if (!metrics) return <p className="text-gray-500 text-sm">No metrics available.</p>

  const buckets = {'0-10':0,'11-20':0,'21-30':0,'31-50':0,'50+':0}
  files.forEach(f=>{
    const s=f.complexityScore??0
    if(s<=10) buckets['0-10']++
    else if(s<=20) buckets['11-20']++
    else if(s<=30) buckets['21-30']++
    else if(s<=50) buckets['31-50']++
    else buckets['50+']++
  })
  const chartData = Object.entries(buckets).map(([range,count])=>({range,count}))

  const coupling = files.length>0
    ? (files.reduce((s,f)=>s+(f.importCount??0),0)/files.length).toFixed(1)
    : 0

  const cards = [
    {label:'Circular Deps', v:metrics.circularDependencies??0, status:getStatus(metrics.circularDependencies??0,0,5), desc:'0 circular dependencies is ideal'},
    {label:'Dead Files', v:metrics.deadFiles??0, status:getStatus(metrics.deadFiles??0,0,10), desc:'Files not imported anywhere'},
    {label:'Avg Complexity', v:metrics.averageComplexity??0, status:getStatus(metrics.averageComplexity??0,10,20), desc:'Lower is better'},
    {label:'Documentation', v:`${metrics.documentationScore??0}%`, status:getStatusInv(metrics.documentationScore??0,70,40), desc:'% of files with JSDoc comments'},
    {label:'Security Issues', v:metrics.securityIssues??0, status:getStatus(metrics.securityIssues??0,0,3), desc:'Potential vulnerabilities found'},
    {label:'Coupling', v:coupling, status:getStatus(Number(coupling),2,5), desc:'Average imports per file'},
  ]

  const getCardStyle = (status) => {
    if (status === 'good') return 'bg-gradient-to-br from-green-500/5 to-transparent border-green-500/10'
    if (status === 'warning') return 'bg-gradient-to-br from-yellow-500/5 to-transparent border-yellow-500/10'
    return 'bg-gradient-to-br from-red-500/5 to-transparent border-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]'
  }

  return (
    <div className="max-w-[1200px] mx-auto mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="text-center space-y-2 mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">Repository Health</h1>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">An overarching analysis of code quality, structural integrity, and architectural coupling across your codebase.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Main Score Hero */}
        <div className="md:w-1/3 rounded-3xl bg-[#0a0a0a]/50 backdrop-blur-xl border border-[#ffffff0a] flex items-center justify-center py-10 shadow-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff02] to-transparent pointer-events-none" />
          <div className="relative z-10 transition-transform duration-500 group-hover:scale-105">
            <ScoreRing score={metrics.healthScore??0} />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="md:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map(c=>(
            <div key={c.label} className={`rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg backdrop-blur-sm ${getCardStyle(c.status)}`}>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">{c.label}</p>
                <p className={`text-4xl font-black tracking-tighter ${S[c.status]}`}>{c.v}</p>
              </div>
              <p className="text-[11px] text-gray-500 mt-4 leading-snug">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <Card title="Complexity Distribution" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00cffc]/5 to-transparent opacity-20 pointer-events-none" />
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{top:20,right:10,left:-20,bottom:5}}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00cffc" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#00cffc" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false}/>
            <XAxis dataKey="range" tick={{fill:'#6b7280',fontSize:12}} axisLine={false} tickLine={false} dy={10}/>
            <YAxis tick={{fill:'#6b7280',fontSize:12}} axisLine={false} tickLine={false}/>
            <Tooltip 
              cursor={{fill:'rgba(255,255,255,0.02)'}}
              contentStyle={{background:'#0a0a0a',border:'1px solid #ffffff10',borderRadius:'12px',boxShadow:'0 8px 32px rgba(0,0,0,0.5)'}}
              labelStyle={{color:'#fff', fontWeight: 'bold'}} 
              itemStyle={{color:'#00cffc'}}
            />
            <Bar dataKey="count" fill="url(#colorCount)" radius={[6,6,0,0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Architectural Hotspots">
        <div className="rounded-xl overflow-hidden border border-[#ffffff0a] bg-[#050505]/50">
          <Table>
            <TableHeader className="bg-[#ffffff05]">
              <TableRow className="border-b border-[#ffffff0a] hover:bg-transparent">
                <TableHead className="text-gray-400 font-semibold tracking-wider text-[10px] uppercase h-10">File Path</TableHead>
                <TableHead className="text-gray-400 font-semibold tracking-wider text-[10px] uppercase text-right w-32 h-10">Imported By</TableHead>
                <TableHead className="text-gray-400 font-semibold tracking-wider text-[10px] uppercase text-right w-32 h-10">Complexity</TableHead>
                <TableHead className="text-gray-400 font-semibold tracking-wider text-[10px] uppercase text-right w-24 h-10">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotspots.slice(0,10).map(h=>{
                const fm = files.find(f=>f.path===h.path)
                const badge = fm?.isEntry
                  ? <span className="text-[10px] px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider font-bold">Entry</span>
                  : fm?.isDead
                    ? <span className="text-[10px] px-2.5 py-1 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider font-bold">Dead</span>
                    : <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#ffffff05] text-gray-400 border border-[#ffffff10] uppercase tracking-wider font-bold">Module</span>
                return (
                  <TableRow key={h.path} className="border-b border-[#ffffff05] hover:bg-[#ffffff05] text-sm transition-colors cursor-default">
                    <TableCell className="font-mono text-[11px] text-gray-300 max-w-xs truncate py-3">{h.path}</TableCell>
                    <TableCell className="text-right text-white font-medium py-3">{h.importedByCount}</TableCell>
                    <TableCell className="text-right text-gray-400 py-3">{h.complexityScore}</TableCell>
                    <TableCell className="text-right py-3">{badge}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          {hotspots.length===0&&<p className="text-sm text-gray-600 text-center py-8">No hotspot data available.</p>}
        </div>
      </Card>

      {/* SECTION 5 — Structural Refactor Suggestions */}
      <Card title="Structural Insights">
        {!refactorFindings ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-gradient-to-r from-[#ffffff05] to-transparent rounded-2xl border border-[#ffffff0a] gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <GitBranch size={80} />
            </div>
            <div className="z-10">
              <h4 className="text-white font-medium mb-1">Deep Structural Analysis</h4>
              <p className="text-sm text-gray-400">Detect architectural anti-patterns like god files, feature envy, and isolated clusters.</p>
            </div>
            <button
              onClick={async () => {
                setRefactorLoading(true)
                try {
                  const res = await api.get(`/api/repos/${owner}/${name}/refactor-analysis`)
                  setRefactorFindings(res.data.findings)
                } catch (e) {
                  setError(e.response?.data?.message || 'Refactor analysis failed')
                } finally { setRefactorLoading(false) }
              }}
              disabled={refactorLoading}
              className="z-10 px-6 py-2.5 rounded-xl bg-[#00cffc]/10 hover:bg-[#00cffc]/20 text-[#00cffc] border border-[#00cffc]/20 font-semibold text-sm transition-all duration-300 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {refactorLoading ? 'Analyzing...' : 'Run Analysis'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {refactorFindings.godFiles?.length === 0 && refactorFindings.featureEnvy?.length === 0 && refactorFindings.orphanedClusters?.length === 0 && (
              <p className="text-sm text-green-400">No structural issues detected — your architecture looks clean</p>
            )}

            {refactorFindings.godFiles?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertOctagon size={16} className="text-orange-500" />
                  <h4 className="text-sm font-semibold text-white">God Files</h4>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#222] hover:bg-transparent">
                      <TableHead className="text-gray-500">File</TableHead>
                      <TableHead className="text-gray-500 text-right">Imported By</TableHead>
                      <TableHead className="text-gray-500 text-right">Imports</TableHead>
                      <TableHead className="text-gray-500 text-right">Total Coupling</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {refactorFindings.godFiles.map(g => (
                      <TableRow key={g.path} className="border-[#222] hover:bg-[#161616] text-sm">
                        <TableCell className="font-mono text-xs text-gray-300 truncate max-w-xs">{g.path}</TableCell>
                        <TableCell className="text-right text-gray-400">{g.inDegree}</TableCell>
                        <TableCell className="text-right text-gray-400">{g.outDegree}</TableCell>
                        <TableCell className="text-right font-bold text-orange-400">{g.totalCoupling}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {refactorFindings.featureEnvy?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-blue-400" />
                  <h4 className="text-sm font-semibold text-white">Feature Envy</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {refactorFindings.featureEnvy.map(f => (
                    <div key={f.path} className="p-3 bg-[#161616] border border-[#222] rounded-lg">
                      <p className="text-xs text-gray-300">
                        <span className="font-mono text-white">{f.path}</span> lives in <span className="font-mono text-blue-300">{f.nativeFolder}</span> but <span className="font-bold text-orange-400">{f.enviousPercent}%</span> of its imports go to <span className="font-mono text-blue-300">{f.dominantFolder}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {refactorFindings.orphanedClusters?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <GitBranch size={16} className="text-purple-400" />
                  <h4 className="text-sm font-semibold text-white">Isolated Clusters</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {refactorFindings.orphanedClusters.map((c, i) => (
                    <div key={i} className="p-4 bg-[#161616] border border-[#222] rounded-lg space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {c.nodes.map(n => (
                          <span key={n} className="px-2 py-0.5 bg-[#222] text-xs text-gray-400 rounded-full font-mono">{n}</span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">{c.externalConnections} connections to rest of codebase</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(refactorFindings.godFiles?.length > 0 || refactorFindings.featureEnvy?.length > 0 || refactorFindings.orphanedClusters?.length > 0) && (
              <div className="pt-4 border-t border-[#222]">
                {!refactorExplanation ? (
                  <div className="flex items-center justify-between bg-[#161616] p-4 rounded-lg border border-[#333]">
                    <span className="text-sm text-gray-300">Get specific refactor recommendations</span>
                    <button
                      onClick={async () => {
                        setExplanationLoading(true)
                        try {
                          const res = await api.post(`/api/ai/${owner}/${name}/explain-refactor`, { findings: refactorFindings })
                          setRefactorExplanation(res.data.explanation)
                        } catch (e) {
                          setError('Failed to explain findings')
                        } finally { setExplanationLoading(false) }
                      }}
                      disabled={explanationLoading}
                      className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-sm text-white transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {explanationLoading ? 'Gemini is thinking...' : 'Explain These Findings'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 p-5 bg-[#0a0a0a] rounded-lg border border-[#222]">
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 prose-headings:text-white prose-p:text-gray-300">
                      <ReactMarkdown>{refactorExplanation}</ReactMarkdown>
                    </div>
                    <p className="text-xs text-gray-600 mt-4">Powered by Gemini ✦</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
