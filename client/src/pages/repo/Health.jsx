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

function Card({ children, title }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      {title && <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>}
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
    <div className="space-y-4">
      <div className="rounded-xl border border-[#222] bg-[#111] p-8 flex justify-center">
        <Skeleton className="w-40 h-40 rounded-full bg-[#1e1e1e]" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({length:6}).map((_,i)=>(
          <div key={i} className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4 space-y-2">
            <Skeleton className="h-3 w-20 bg-[#1e1e1e]"/><Skeleton className="h-8 w-12 bg-[#1e1e1e]"/>
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

  const getCardStyle = (status) => ({
    background: '#111',
    border: `1px solid ${
      status === 'good' ? 'rgba(34,197,94,0.2)' :
      status === 'warning' ? 'rgba(245,158,11,0.2)' :
      'rgba(239,68,68,0.2)'
    }`,
    boxShadow: status === 'danger' 
      ? '0 0 12px rgba(239,68,68,0.05)' : 'none',
    borderRadius: '8px', padding: '16px',
    transition: 'all 0.2s ease'
  })

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-center py-4">
          <ScoreRing score={metrics.healthScore??0} />
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c=>(
          <div key={c.label} style={getCardStyle(c.status)} className="space-y-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-bold ${S[c.status]}`}>{c.v}</p>
            <p className="text-xs text-gray-600">{c.desc}</p>
          </div>
        ))}
      </div>

      <Card title="File Complexity Distribution">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{top:5,right:10,left:-20,bottom:5}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false}/>
            <XAxis dataKey="range" tick={{fill:'#6b7280',fontSize:12}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:'#6b7280',fontSize:12}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={{background:'#111',border:'1px solid #222',borderRadius:8}}
              labelStyle={{color:'#fff'}} itemStyle={{color:'#9ca3af'}}
              cursor={{fill:'rgba(255,255,255,0.03)'}}/>
            <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Hotspot Files">
        <Table>
          <TableHeader>
            <TableRow className="border-[#222] hover:bg-transparent">
              <TableHead className="text-gray-500">File</TableHead>
              <TableHead className="text-gray-500 text-right w-32">Imported By</TableHead>
              <TableHead className="text-gray-500 text-right w-32">Complexity</TableHead>
              <TableHead className="text-gray-500 text-right w-24">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hotspots.slice(0,10).map(h=>{
              const fm = files.find(f=>f.path===h.path)
              const badge = fm?.isEntry
                ? <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Entry</span>
                : fm?.isDead
                  ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">Dead</span>
                  : <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e1e1e] text-gray-500 border border-[#333]">Module</span>
              return (
                <TableRow key={h.path} className="border-[#222] hover:bg-[#161616] text-sm">
                  <TableCell className="font-mono text-xs text-gray-300 max-w-xs truncate">{h.path}</TableCell>
                  <TableCell className="text-right text-gray-400">{h.importedByCount}</TableCell>
                  <TableCell className="text-right text-gray-400">{h.complexityScore}</TableCell>
                  <TableCell className="text-right">{badge}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        {hotspots.length===0&&<p className="text-sm text-gray-600 text-center py-4">No hotspot data</p>}
      </Card>

      {/* SECTION 5 — Structural Refactor Suggestions */}
      <Card title="Structural Refactor Suggestions">
        {!refactorFindings ? (
          <div className="flex items-center justify-between p-4 bg-[#161616] rounded-lg border border-[#333]">
            <span className="text-sm text-gray-300">Detect structural issues like god files, feature envy, and isolated clusters</span>
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
              className="px-4 py-2 rounded-lg bg-[#222] hover:bg-[#333] text-sm text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              {refactorLoading ? 'Analyzing...' : 'Analyze Structure'}
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
