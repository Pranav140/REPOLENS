import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Package, Loader2, ExternalLink, CheckCircle2,
} from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '../../components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Alert } from '../../components/ui/alert'
import { Skeleton } from '../../components/ui/skeleton'
import api from '../../api/api'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDownloads(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function GapBadge({ gap }) {
  if (!gap) return <span className="text-xs text-gray-600">UNKNOWN</span>
  if (gap.type === 'current') return <span className="text-xs text-green-400 font-medium">✓ UP TO DATE</span>
  if (gap.type === 'major') return (
    <span className="text-xs px-1.5 py-0.5 rounded border bg-red-500/20 text-red-300 border-red-700 font-semibold">
      MAJOR +{gap.gap}
    </span>
  )
  if (gap.type === 'minor') return (
    <span className="text-xs px-1.5 py-0.5 rounded border bg-yellow-500/20 text-yellow-300 border-yellow-700 font-semibold">
      MINOR +{gap.gap}
    </span>
  )
  if (gap.type === 'patch') return (
    <span className="text-xs px-1.5 py-0.5 rounded border bg-blue-500/20 text-blue-300 border-blue-700 font-semibold">
      PATCH +{gap.gap}
    </span>
  )
  return null
}

function RiskBadge({ level, score }) {
  if (level === 'high') return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/20 text-red-300 border-red-700">
      High ({score})
    </span>
  )
  if (level === 'medium') return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-500/20 text-yellow-300 border-yellow-700">
      Medium ({score})
    </span>
  )
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border bg-green-500/20 text-green-300 border-green-700">
      Low ({score})
    </span>
  )
}

function SummaryCard({ label, value, valueClass = 'text-white' }) {
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <p className={`text-3xl font-bold tabular-nums ${valueClass}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function Dependencies() {
  const { owner, name } = useParams()

  const [data,      setData]      = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState(null)
  const [aiSummary, setAiSummary] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [filter,    setFilter]    = useState('all')
  const [hasScanned,setHasScanned]= useState(false)

  // ── scan ────────────────────────────────────────────────────────────────────
  async function handleScan() {
    setIsLoading(true)
    setError(null)
    setAiSummary(null)
    try {
      const res = await api.get(`/api/repos/${owner}/${name}/dependencies`)
      setData(res.data)
      setHasScanned(true)
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to scan dependencies')
    } finally {
      setIsLoading(false)
    }
  }

  // ── AI summary ──────────────────────────────────────────────────────────────
  async function handleAISummary() {
    setAiLoading(true)
    try {
      const res = await api.post(
        `/api/ai/${owner}/${name}/dependency-summary`,
        { dependencies: data.dependencies }
      )
      setAiSummary(res.data.summary || res.data)
    } catch (e) {
      toast.error(e.response?.data?.message || 'AI request failed')
    } finally {
      setAiLoading(false)
    }
  }

  // ── INITIAL STATE ────────────────────────────────────────────────────────────
  if (!hasScanned && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md space-y-5">
          <Package size={64} className="text-gray-600 mx-auto" />
          <div>
            <h2 className="text-xl font-semibold text-white">Dependency Advisor</h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Scan all dependencies in <code className="text-gray-400 bg-[#1e1e1e] px-1 rounded">package.json</code> against
              the npm registry and OSV vulnerability database. Get risk scores, CVE counts, and
              an AI-powered remediation summary.
            </p>
          </div>
          <button
            onClick={handleScan}
            className="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-semibold
                       hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Run Dependency Scan
          </button>
          <p className="text-xs text-gray-600">This scan takes 20–30 seconds</p>
        </div>
      </div>
    )
  }

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={48} className="text-blue-400 animate-spin" />
        <div className="text-center">
          <p className="text-white font-medium">Scanning dependencies…</p>
          <p className="text-sm text-gray-400 mt-1">Fetching npm registry data and checking for CVEs…</p>
          <p className="text-sm text-gray-500 mt-0.5">This takes about 20–30 seconds</p>
        </div>
      </div>
    )
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-4">
        <Alert className="border-red-500/30 bg-red-500/10 text-red-400">{error}</Alert>
        <button
          onClick={handleScan}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
        >
          Retry Scan
        </button>
      </div>
    )
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────────
  const { summary, dependencies } = data

  const filteredDeps = filter === 'all'
    ? dependencies
    : dependencies.filter(d => d.riskLevel === filter)

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label="Total Packages" value={summary.total} />
        <SummaryCard
          label="High Risk"
          value={summary.high}
          valueClass={summary.high > 0 ? 'text-red-400' : 'text-white'}
        />
        <SummaryCard
          label="With CVEs"
          value={summary.withCVEs}
          valueClass={summary.withCVEs > 0 ? 'text-red-400' : 'text-white'}
        />
        <SummaryCard
          label="Outdated"
          value={summary.outdated}
          valueClass={summary.outdated > 0 ? 'text-yellow-400' : 'text-white'}
        />
      </div>

      {/* AI Summary card */}
      <div className="rounded-xl border border-[#222] bg-[#111] p-5">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-semibold text-gray-300">AI Risk Summary</h3>
          <span className="text-xs text-purple-400">✦ Gemini</span>
        </div>

        {!aiSummary && !aiLoading && (
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">
              Get an AI-generated analysis of your highest risk packages, CVE impacts, and upgrade recommendations.
            </p>
            <button
              onClick={handleAISummary}
              className="shrink-0 px-4 py-2 rounded-lg bg-[#1e1e1e] border border-[#333] text-sm text-gray-300
                         hover:text-white hover:border-[#444] transition-colors cursor-pointer"
            >
              Generate AI Summary
            </button>
          </div>
        )}

        {aiLoading && (
          <div className="flex items-center gap-3 py-2">
            <Loader2 size={16} className="text-purple-400 animate-spin shrink-0" />
            <p className="text-sm text-gray-400">Gemini is analyzing risks…</p>
          </div>
        )}

        {aiSummary && (
          <div className="space-y-3">
            {(typeof aiSummary === 'string' ? aiSummary : JSON.stringify(aiSummary, null, 2))
              .split('\n\n').filter(Boolean).map((p, i) => (
                <p key={i} className="text-sm text-gray-300 leading-relaxed">{p}</p>
              ))}
            <p className="text-xs text-gray-600">Powered by Gemini ✦</p>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={filter} onValueChange={v => setFilter(v)}>
          <TabsList className="bg-[#111] border border-[#222]">
            {['all','high','medium','low'].map(t => (
              <TabsTrigger
                key={t} value={t}
                className="capitalize text-gray-400 data-[state=active]:bg-[#222] data-[state=active]:text-white"
              >
                {t === 'all' ? `All (${summary.total})` : `${t.charAt(0).toUpperCase() + t.slice(1)} (${summary[t]})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <button
          onClick={handleScan}
          className="text-xs text-gray-500 hover:text-white border border-[#333] rounded px-3 py-1.5 transition-colors cursor-pointer"
        >
          Re-scan
        </button>
      </div>

      {/* Empty state for filter */}
      {filteredDeps.length === 0 && dependencies.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No package.json found in this repository
        </div>
      )}
      {filteredDeps.length === 0 && dependencies.length > 0 && filter !== 'all' && (
        <div className="text-center py-12 text-gray-500 text-sm">
          No {filter} risk packages found
        </div>
      )}

      {/* Table */}
      {filteredDeps.length > 0 && (
        <div className="rounded-xl border border-[#222] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#222] hover:bg-transparent bg-[#0a0a0a]">
                <TableHead className="text-gray-500">Package</TableHead>
                <TableHead className="text-gray-500 w-24">Current</TableHead>
                <TableHead className="text-gray-500 w-24">Latest</TableHead>
                <TableHead className="text-gray-500 w-28">Gap</TableHead>
                <TableHead className="text-gray-500 w-24">CVEs</TableHead>
                <TableHead className="text-gray-500 w-28">Downloads/wk</TableHead>
                <TableHead className="text-gray-500 w-32">Risk</TableHead>
                <TableHead className="text-gray-500 w-16">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeps.map((dep) => {
                const dlColor = dep.weeklyDownloads < 1000 ? 'text-red-400' : 'text-gray-400'
                const latestColor = dep.latestVersion === dep.currentVersion
                  ? 'text-green-400'
                  : 'text-yellow-400'

                return (
                  <TableRow key={dep.name} className="border-[#222] hover:bg-[#161616] align-top">
                    {/* Package */}
                    <TableCell className="py-3">
                      <p className="font-semibold text-white text-sm">{dep.name}</p>
                      {dep.description && (
                        <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">
                          {dep.description}
                        </p>
                      )}
                    </TableCell>
                    {/* Current */}
                    <TableCell className="font-mono text-sm text-gray-300">
                      {dep.currentVersion}
                    </TableCell>
                    {/* Latest */}
                    <TableCell className={`font-mono text-sm ${latestColor}`}>
                      {dep.latestVersion}
                    </TableCell>
                    {/* Gap */}
                    <TableCell>
                      <GapBadge gap={dep.versionGap} />
                    </TableCell>
                    {/* CVEs */}
                    <TableCell>
                      {dep.cveCount === 0 ? (
                        <CheckCircle2 size={16} className="text-green-400" />
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-700">
                          {dep.cveCount} CVE{dep.cveCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </TableCell>
                    {/* Downloads */}
                    <TableCell className={`text-sm tabular-nums ${dlColor}`}>
                      {fmtDownloads(dep.weeklyDownloads)}
                    </TableCell>
                    {/* Risk */}
                    <TableCell>
                      <RiskBadge level={dep.riskLevel} score={dep.riskScore} />
                    </TableCell>
                    {/* Link */}
                    <TableCell>
                      <a
                        href={dep.npmLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-white transition-colors"
                        title={dep.name + ' on npm'}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
