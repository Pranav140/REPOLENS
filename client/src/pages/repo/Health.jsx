import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Skeleton } from '../../components/ui/skeleton'
import { Alert } from '../../components/ui/alert'
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
  const r = 60
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="160" height="160">
        <circle cx="80" cy="80" r={r} stroke="#222" strokeWidth="12" fill="none" />
        <circle cx="80" cy="80" r={r} stroke={color} strokeWidth="12" fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 80 80)" strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x="80" y="90" textAnchor="middle" fontSize="32" fill="white" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-sm text-gray-400">Repository Health Score</span>
    </div>
  )
}

export default function Health() {
  const { owner, name } = useParams()
  const [metrics, setMetrics] = useState(null)
  const [files, setFiles] = useState([])
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-center py-4">
          <ScoreRing score={metrics.healthScore??0} />
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c=>(
          <div key={c.label} className="rounded-xl border border-[#222] bg-[#0a0a0a] p-4 space-y-1">
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
    </div>
  )
}
