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
  return (
    <div style={{
      background: '#0d0d0d',
      border: `1px solid ${
        issue.severity === 'high' ? 'rgba(239,68,68,0.3)' :
        issue.severity === 'medium' ? 'rgba(245,158,11,0.3)' :
        'rgba(59,130,246,0.2)'
      }`,
      borderLeft: `3px solid ${
        issue.severity === 'high' ? '#ef4444' :
        issue.severity === 'medium' ? '#f59e0b' : '#3b82f6'
      }`,
      borderRadius: '6px',
      padding: '12px 16px',
      marginBottom: '8px',
      fontFamily: 'monospace'
    }}>
      <div style={{ 
        display: 'flex', alignItems: 'center', 
        gap: '12px', fontSize: '12px' 
      }}>
        <span style={{ 
          color: issue.severity === 'high' ? '#ef4444' :
                 issue.severity === 'medium' ? '#f59e0b' : '#3b82f6',
          fontWeight: '700', letterSpacing: '0.05em'
        }}>
          [{issue.severity.toUpperCase()}]
        </span>
        <span style={{ color: '#888' }}>{issue.type}</span>
        <span style={{ color: '#555', marginLeft: 'auto' }}>
          {issue.filePath.split('/').pop()}:{issue.line}
        </span>
      </div>
      <div style={{ 
        color: '#aaa', fontSize: '12px', marginTop: '4px' 
      }}>
        {issue.description}
      </div>
      {/* Code snippet */}
      {issue.snippet && (
        <div style={{
          background: '#111', borderRadius: '4px',
          padding: '8px 12px', marginTop: '8px',
          color: '#ef4444', fontSize: '11px',
          borderLeft: '2px solid #333'
        }}>
          {issue.snippet}
        </div>
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
    <div style={{
      textAlign: 'center', padding: '48px',
      fontFamily: 'monospace'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>✓</div>
      <div style={{ color: '#22c55e', fontSize: '18px' }}>
        0 vulnerabilities detected
      </div>
      <div style={{ color: '#555', fontSize: '12px', marginTop: '8px' }}>
        scan complete — all checks passed
      </div>
    </div>
  )

  const filtered = filter === 'all'
    ? [...issues].sort((a,b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
    : issues.filter(i => i.severity === filter)

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes scanLine {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      
      {/* Terminal header bar */}
      <div style={{
        background: '#0d0d0d',
        border: '1px solid #1a1a1a',
        borderRadius: '8px',
        padding: '16px',
        fontFamily: 'monospace',
        marginBottom: '24px'
      }}>
        <div style={{ 
          display: 'flex', alignItems: 'center', 
          gap: '8px', marginBottom: '12px' 
        }}>
          <div style={{ 
            width: '12px', height: '12px', 
            borderRadius: '50%', background: '#ef4444' 
          }}/>
          <div style={{ 
            width: '12px', height: '12px', 
            borderRadius: '50%', background: '#f59e0b' 
          }}/>
          <div style={{ 
            width: '12px', height: '12px', 
            borderRadius: '50%', background: '#22c55e' 
          }}/>
          <span style={{ 
            color: '#666', fontSize: '12px', marginLeft: '8px' 
          }}>
            repolens — security-scan
          </span>
        </div>
        <div style={{ color: '#22c55e', fontSize: '13px' }}>
          <span style={{ color: '#666' }}>$ </span>
          running security scan on {owner}/{name}...
        </div>
        <div style={{ 
          color: summary.high > 0 ? '#ef4444' : '#22c55e', 
          fontSize: '13px', marginTop: '4px' 
        }}>
          <span style={{ color: '#666' }}>→ </span>
          {summary.total} issue(s) found 
          [{summary.high ?? 0} critical, {summary.medium ?? 0} medium, 
          {summary.low ?? 0} low]
          <span style={{ animation: 'blink 1s step-end infinite' }}>
            _
          </span>
        </div>
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
