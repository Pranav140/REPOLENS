import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '../../components/ui/collapsible'
import { Skeleton } from '../../components/ui/skeleton'
import api from '../../api/api'

const SEV_ORDER = { high: 0, medium: 1, low: 2 }

function SevBadge({ severity }) {
  if (severity === 'high') return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/20 text-red-300 border-red-700 font-medium">
      High
    </span>
  )
  if (severity === 'medium') return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-700 font-medium">
      Medium
    </span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-700 font-medium">
      Low
    </span>
  )
}

function IssueCard({ issue }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-4 space-y-2">
      <div className="flex items-start gap-2 flex-wrap">
        <SevBadge severity={issue.severity} />
        <span className="text-sm font-medium text-white">{issue.type}</span>
        <span className="font-mono text-xs text-gray-500 ml-auto">
          {issue.filePath.split('/').pop()}:{issue.line}
        </span>
      </div>
      <p className="text-sm text-gray-300">{issue.description}</p>

      {issue.snippet && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {open ? 'Hide code' : 'Show code'}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-2 p-3 rounded-lg bg-[#0a0a0a] border border-[#222] text-xs text-gray-400 overflow-x-auto font-mono whitespace-pre-wrap break-all">
              {issue.snippet}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  )
}

export default function Security() {
  const { owner, name } = useParams()
  const [issues, setIssues]   = useState([])
  const [summary, setSummary] = useState({})
  const [filter, setFilter]   = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    api.get(`/api/security/${owner}/${name}`)
      .then(res => {
        setIssues(res.data.issues || [])
        setSummary(res.data.summary || {})
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load security scan'))
      .finally(() => setLoading(false))
  }, [owner, name])

  if (loading) return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[0,1,2].map(i=>(
          <div key={i} className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-2">
            <Skeleton className="h-8 w-12 bg-[#1e1e1e]"/>
            <Skeleton className="h-3 w-16 bg-[#1e1e1e]"/>
          </div>
        ))}
      </div>
      {[0,1,2,3].map(i=>(
        <Skeleton key={i} className="h-20 w-full bg-[#1e1e1e] rounded-xl"/>
      ))}
    </div>
  )

  if (error) return (
    <div className="p-4 text-red-400 text-sm border border-red-500/30 bg-red-500/10 rounded-xl">
      {error}
    </div>
  )

  if (!loading && summary.total === 0) return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <ShieldCheck size={48} className="text-green-400" />
      <div>
        <h2 className="text-lg font-semibold text-white">No security issues detected</h2>
        <p className="text-sm text-gray-500 mt-1">Your codebase passed all security checks</p>
      </div>
    </div>
  )

  const filtered = filter === 'all'
    ? [...issues].sort((a,b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
    : issues.filter(i => i.severity === filter)

  const summaryCards = [
    { label: 'High',   count: summary.high   ?? 0, bg: 'bg-red-950 border-red-800',    text: 'text-red-300' },
    { label: 'Medium', count: summary.medium  ?? 0, bg: 'bg-yellow-950 border-yellow-800', text: 'text-yellow-300' },
    { label: 'Low',    count: summary.low     ?? 0, bg: 'bg-blue-950 border-blue-800',  text: 'text-blue-300' },
  ]

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {summaryCards.map(c => (
          <div key={c.label} className={`rounded-xl border p-5 ${c.bg}`}>
            <p className={`text-3xl font-bold ${c.text}`}>{c.count}</p>
            <p className={`text-sm mt-1 ${c.text} opacity-70`}>{c.label} Severity</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList className="bg-[#111] border border-[#222]">
          {['all','high','medium','low'].map(t => (
            <TabsTrigger
              key={t} value={t}
              className="capitalize text-gray-400 data-[state=active]:bg-[#222] data-[state=active]:text-white"
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Issue count */}
      <p className="text-xs text-gray-500">
        {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
        {filter !== 'all' ? ` · ${filter} severity` : ''}
      </p>

      {/* Issues list */}
      <div className="space-y-2">
        {filtered.map((issue, i) => <IssueCard key={i} issue={issue} />)}
      </div>
    </div>
  )
}
