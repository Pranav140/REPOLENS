import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertTriangle, Info, Star, GitFork, GitCommitHorizontal, ExternalLink, Calendar, User, FileText, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { Alert } from '../../components/ui/alert'
import api from '../../api/api'

const TECH_COLORS = {
  react: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  vue: 'bg-green-500/10 text-green-400 border-green-500/30',
  angular: 'bg-red-500/10 text-red-400 border-red-500/30',
  next: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  express: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  nestjs: 'bg-red-500/10 text-red-400 border-red-500/30',
  fastify: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  prisma: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  mongoose: 'bg-green-500/10 text-green-400 border-green-500/30',
  typeorm: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  jest: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  vitest: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  tailwindcss: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  typescript: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  javascript: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
}

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
          suffix="Import cycles detected"
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
              {metrics.techStack.map((t) => {
                const colorClass = TECH_COLORS[t.toLowerCase()] || 'border-[#333] text-gray-300'
                return (
                  <Badge key={t} variant="outline" className={`${colorClass} text-xs font-medium`}>
                    {t}
                  </Badge>
                )
              })}
            </div>
          ) : langData.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {langData.map((l) => {
                const colorClass = TECH_COLORS[l.name.toLowerCase()] || 'border-[#333] text-gray-300'
                return (
                  <Badge key={l.name} variant="outline" className={`${colorClass} text-xs font-medium`}>
                    {l.name}
                  </Badge>
                )
              })}
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
            <div className="flex items-center gap-4 text-gray-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Star size={14} /> {repo?.stars ?? 0}
              </span>
              <span className="flex items-center gap-1.5">
                <GitFork size={14} /> {repo?.forks ?? 0}
              </span>
              {repo?.fullName && (
                <a
                  href={`https://github.com/${repo.fullName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <ExternalLink size={13} /> View on GitHub
                </a>
              )}
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
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Calendar size={12} />
                <span>
                  Analyzed {new Date(repo.analyzedAt).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
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
            {commits.map((c, i) => {
              const additions = c.stats?.additions ?? 0
              const deletions = c.stats?.deletions ?? 0
              const fileCount = c.files?.length ?? 0
              
              return (
                <div key={i} className="group rounded-lg border border-[#222] hover:border-[#333] transition-colors p-3">
                  <div className="flex items-start gap-3">
                    <GitCommitHorizontal size={14} className="text-gray-600 mt-1 shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start gap-2 justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 leading-relaxed">
                            {(c.message || '').split('\n')[0]}
                          </p>
                          {c.message && c.message.includes('\n') && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {c.message.split('\n').slice(1).join(' ').trim()}
                            </p>
                          )}
                        </div>
                        <a
                          href={`https://github.com/${repo.fullName}/commit/${c.sha}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs text-blue-400 hover:text-blue-300 shrink-0"
                        >
                          {(c.sha || '').slice(0, 7)}
                        </a>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <User size={11} />
                          <span>{c.author || 'Unknown'}</span>
                        </div>
                        {c.date && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar size={11} />
                            <span>{new Date(c.date).toLocaleDateString()}</span>
                          </div>
                        )}
                        {fileCount > 0 && (
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <FileText size={11} />
                            <span>{fileCount} {fileCount === 1 ? 'file' : 'files'}</span>
                          </div>
                        )}
                        {(additions > 0 || deletions > 0) && (
                          <div className="flex items-center gap-2 text-xs">
                            {additions > 0 && <span className="text-green-400">+{additions}</span>}
                            {deletions > 0 && <span className="text-red-400">-{deletions}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
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
