import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Info, Star, GitFork, GitCommitHorizontal } from 'lucide-react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { Alert } from '../../components/ui/alert'
import api from '../../api/api'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const STATUS_STYLES = {
  pending:   'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  analyzing: 'bg-blue-500/10   text-blue-400   border-blue-500/20',
  completed: 'bg-green-500/10  text-green-400  border-green-500/20',
  failed:    'bg-red-500/10    text-red-400    border-red-500/20',
}

function basename(p) {
  if (!p) return '—'
  return p.split('/').pop()
}

function StatCard({ label, value, suffix, icon, valueClass = 'text-white' }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className={`text-4xl font-bold tabular-nums ${valueClass}`}>{value ?? '—'}</span>
        {icon}
      </div>
      {suffix && <p className="text-xs text-gray-500">{suffix}</p>}
      <p className="text-sm text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function Overview() {
  const { owner, name } = useParams()
  const [repo, setRepo] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [hotspots, setHotspots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchAll() {
      try {
        const [repoRes, hotspotsRes] = await Promise.all([
          api.get(`/api/repos/${owner}/${name}`),
          api.get(`/api/graph/${owner}/${name}/hotspots`),
        ])
        setRepo(repoRes.data.repository)
        setMetrics(repoRes.data.metrics)
        setHotspots(hotspotsRes.data.hotspots || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load overview')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [owner, name])

  if (loading) return <OverviewSkeleton />

  if (error) {
    return <Alert className="border-red-500/30 bg-red-500/10 text-red-400">{error}</Alert>
  }

  // Health score color
  const score = metrics?.healthScore ?? 0
  const scoreColor = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'

  // Language pie data — metrics.languages may be a plain object (from JSON)
  const langData = metrics?.languages
    ? Object.entries(metrics.languages).map(([n, v]) => ({ name: n, value: v }))
    : []

  // Recent commits
  const commits = repo?.recentCommits || []

  return (
    <div className="space-y-4">
      {/* ROW 1 — 4 stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Health Score"
          value={score}
          valueClass={scoreColor}
        />
        <StatCard
          label="Files Analyzed"
          value={metrics?.totalFiles ?? 0}
        />
        <StatCard
          label="Circular Deps"
          value={metrics?.circularDependencies ?? 0}
          icon={
            (metrics?.circularDependencies ?? 0) > 0
              ? <AlertTriangle size={18} className="text-orange-400" />
              : null
          }
        />
        <StatCard
          label="Dead Files"
          value={metrics?.deadFiles ?? 0}
          icon={<Info size={18} className="text-gray-500" />}
        />
      </div>

      {/* ROW 2 — Tech Stack + Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Tech Stack">
          {metrics?.techStack?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {metrics.techStack.map((t) => (
                <Badge key={t} variant="outline" className="border-[#333] text-gray-300 text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Not detected</p>
          )}
        </SectionCard>

        <SectionCard title="Languages">
          {langData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={langData}
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {langData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  itemStyle={{ color: '#9ca3af' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-600">No language data</p>
          )}
        </SectionCard>
      </div>

      {/* ROW 3 — Repo Info + Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Repository Info">
          <div className="space-y-3 text-sm">
            {repo?.description && (
              <p className="text-gray-400 leading-relaxed">{repo.description}</p>
            )}
            <div className="flex items-center gap-4 text-gray-500">
              <span className="flex items-center gap-1">
                <Star size={13} /> {repo?.stars ?? 0}
              </span>
              <span className="flex items-center gap-1">
                <GitFork size={13} /> {repo?.forks ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {repo?.language && (
                <Badge variant="outline" className="border-[#333] text-gray-300 text-xs">
                  {repo.language}
                </Badge>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[repo?.status] || STATUS_STYLES.completed}`}
              >
                {repo?.status}
              </span>
            </div>
            {repo?.analyzedAt && (
              <p className="text-xs text-gray-600">
                Last analyzed:{' '}
                {new Date(repo.analyzedAt).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Key Metrics">
          <div className="space-y-2.5 text-sm">
            {[
              { label: 'Most Imported', value: basename(metrics?.mostImportedFile) },
              { label: 'Largest File',  value: basename(metrics?.largestFile) },
              { label: 'Avg Complexity', value: metrics?.averageComplexity ?? '—' },
              { label: 'Documentation', value: `${metrics?.documentationScore ?? 0}%` },
              {
                label: 'Security Issues',
                value: metrics?.securityIssues ?? 0,
                className: (metrics?.securityIssues ?? 0) > 0 ? 'text-red-400' : '',
              },
            ].map(({ label, value, className }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-gray-500">{label}</span>
                <span className={`font-medium text-white truncate max-w-[55%] text-right ${className ?? ''}`}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ROW 4 — Recent Commits */}
      <SectionCard title="Recent Commits">
        {commits.length === 0 ? (
          <p className="text-sm text-gray-600">No commit data</p>
        ) : (
          <div className="space-y-3">
            {commits.map((c, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <GitCommitHorizontal size={14} className="text-gray-600 mt-0.5 shrink-0" />
                <span className="font-mono text-xs text-blue-400 shrink-0 mt-0.5">
                  {(c.sha || '').slice(0, 7)}
                </span>
                <span className="text-gray-300 truncate flex-1">
                  {(c.message || '').slice(0, 80)}
                </span>
                <span className="text-gray-600 text-xs shrink-0 hidden sm:block">{c.author}</span>
                <span className="text-gray-700 text-xs shrink-0 hidden md:block">
                  {c.date ? new Date(c.date).toLocaleDateString() : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-2">
            <Skeleton className="h-10 w-16 bg-[#1e1e1e]" />
            <Skeleton className="h-3 w-24 bg-[#1e1e1e]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[#222] bg-[#111] p-5 space-y-3">
            <Skeleton className="h-4 w-28 bg-[#1e1e1e]" />
            <Skeleton className="h-36 w-full bg-[#1e1e1e]" />
          </div>
        ))}
      </div>
    </div>
  )
}
