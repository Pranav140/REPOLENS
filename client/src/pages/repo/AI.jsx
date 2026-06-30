import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FileCode2, BookOpen, Network, GitPullRequest, Star, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Alert } from '../../components/ui/alert'
import api from '../../api/api'

// ── tool config ───────────────────────────────────────────────────────────────

const TOOLS = [
  { id: 'explain-file',  label: 'Explain File',       Icon: FileCode2      },
  { id: 'onboarding',    label: 'Onboarding Guide',   Icon: BookOpen       },
  { id: 'architecture',  label: 'Architecture',       Icon: Network        },
  { id: 'pr-analyzer',   label: 'PR Analyzer',        Icon: GitPullRequest },
  { id: 'readme-scorer', label: 'README Scorer',      Icon: Star           },
  { id: 'breaking-changes', label: 'Breaking Changes', Icon: AlertTriangle },
]

const README_LABELS = {
  hasInstallation:          'Installation instructions',
  hasUsageExamples:         'Usage examples',
  hasArchitectureExplanation: 'Architecture explanation',
  hasContributingGuide:     'Contributing guide',
  hasLicense:               'License information',
  hasScreenshots:           'Screenshots / demos',
  adequateLength:           'Adequate length',
}

// ── sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="w-8 h-8 border-2 border-[#333] border-t-purple-400 rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Gemini is analyzing…</p>
    </div>
  )
}

function Paragraphs({ text }) {
  return (
    <div className="space-y-3">
      {(text || '').split('\n\n').filter(Boolean).map((p, i) => (
        <p key={i} className="text-sm text-gray-300 leading-relaxed">{p}</p>
      ))}
    </div>
  )
}

function PoweredBy() {
  return <p className="text-xs text-gray-600 mt-4">Powered by Gemini ✦</p>
}

// ── file search dropdown ───────────────────────────────────────────────────────

function FileSearchInput({ owner, name, onSelect }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])

  useEffect(() => {
    if (q.length < 2) { setResults([]); return }
    const t = setTimeout(() => {
      api.get(`/api/search/${owner}/${name}`, { params: { q, type: 'file' } })
        .then(r => setResults((r.data.results || []).slice(0, 5)))
        .catch(() => setResults([]))
    }, 300)
    return () => clearTimeout(t)
  }, [q, owner, name])

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search for a file..."
        value={q}
        onChange={e => setQ(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#333] text-white text-sm
                   placeholder:text-gray-600 focus:outline-none focus:border-[#444]"
      />
      {results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-[#333]
                        bg-[#111] shadow-xl overflow-hidden">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onSelect(r.path); setQ(''); setResults([]) }}
              className="w-full px-3 py-2 text-left text-xs text-gray-300 hover:bg-[#1e1e1e] cursor-pointer transition-colors border-b border-[#222] last:border-0"
            >
              <p className="font-medium text-white truncate">{r.name}</p>
              <p className="text-gray-500 truncate">{r.path}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function AI() {
  const { owner, name } = useParams()

  const [activeTool, setActiveTool] = useState('explain-file')
  const [result, setResult]         = useState(null)
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState(null)

  // explain-file
  const [selectedPath, setSelectedPath] = useState('')

  // pr-analyzer
  const [prNumber, setPrNumber] = useState('')

  function reset() { setResult(null); setError(null) }

  function switchTool(id) { setActiveTool(id); reset(); setSelectedPath(''); setPrNumber('') }

  async function call(endpoint, body = {}) {
    setIsLoading(true); setError(null); setResult(null)
    try {
      const res = await api.post(`/api/ai/${owner}/${name}/${endpoint}`, body)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.message || 'AI request failed. You may have hit the rate limit.')
    } finally { setIsLoading(false) }
  }

  // ── tool panels ───────────────────────────────────────────────────────────

  function ExplainFileTool() {
    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-3">
            Select a file to get a detailed AI explanation of what it does, its role, and improvement suggestions.
          </p>
          <FileSearchInput owner={owner} name={name} onSelect={p => { setSelectedPath(p); reset() }} />
        </div>

        {selectedPath && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1e1e] border border-[#333] text-xs text-gray-300">
            <span className="font-mono truncate flex-1">{selectedPath}</span>
            <button onClick={() => { setSelectedPath(''); reset() }} className="text-gray-500 hover:text-white cursor-pointer">✕</button>
          </div>
        )}

        <button
          onClick={() => call('explain-file', { filePath: selectedPath })}
          disabled={!selectedPath || isLoading}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold
                     hover:bg-gray-200 transition-colors cursor-pointer
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Explain this File
        </button>

        {result?.explanation && (
          <div className="space-y-2">
            <Paragraphs text={result.explanation} />
            <PoweredBy />
          </div>
        )}
      </div>
    )
  }

  function OnboardingTool() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Generate a structured Markdown onboarding guide covering tech stack, code organization,
          entry points, data flow, and key things to be aware of.
        </p>
        <button
          onClick={() => call('onboarding-guide')}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40"
        >
          Generate Guide
        </button>
        {result?.guide && (
          <div className="space-y-2">
            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] p-5 prose prose-invert prose-sm max-w-none
                            prose-headings:text-white prose-p:text-gray-300 prose-li:text-gray-300
                            prose-code:text-blue-300 prose-code:bg-[#1e1e1e] prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{result.guide}</ReactMarkdown>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(result.guide); toast.success('Copied!') }}
                className="text-xs text-gray-500 hover:text-white border border-[#333] rounded px-3 py-1 transition-colors cursor-pointer"
              >
                Copy
              </button>
              <PoweredBy />
            </div>
          </div>
        )}
      </div>
    )
  }

  function ArchitectureTool() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Analyze the architecture pattern, strengths, risk areas, and get 3 concrete improvement recommendations.
        </p>
        <button
          onClick={() => call('architecture-summary')}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40"
        >
          Analyze Architecture
        </button>
        {result?.summary && (
          <div className="space-y-2">
            <Paragraphs text={result.summary} />
            <div className="flex items-center gap-2">
              <button
                onClick={() => { navigator.clipboard.writeText(result.summary); toast.success('Copied!') }}
                className="text-xs text-gray-500 hover:text-white border border-[#333] rounded px-3 py-1 transition-colors cursor-pointer"
              >
                Copy
              </button>
              <PoweredBy />
            </div>
          </div>
        )}
      </div>
    )
  }

  function PRTool() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Analyze a pull request — what it changes, its dependency blast radius, risk level, and what reviewers should focus on.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            placeholder="PR number..."
            value={prNumber}
            onChange={e => setPrNumber(e.target.value)}
            className="w-40 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#333] text-white text-sm
                       placeholder:text-gray-600 focus:outline-none focus:border-[#444]"
          />
          <button
            onClick={() => call('analyze-pr', { prNumber: parseInt(prNumber) })}
            disabled={!prNumber || isLoading}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40"
          >
            Analyze PR
          </button>
        </div>
        {result?.analysis && (
          <div className="space-y-2">
            <Paragraphs text={result.analysis} />
            <PoweredBy />
          </div>
        )}
      </div>
    )
  }

  function ReadmeTool() {
    const score = result?.score
    const scoreColor = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Score your README.md against 7 quality criteria and get specific improvement suggestions.
        </p>
        <button
          onClick={() => call('score-readme')}
          disabled={isLoading}
          className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40"
        >
          Score README
        </button>
        {result && (
          <div className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-bold ${scoreColor}`}>{score}</span>
              <span className="text-xl text-gray-500">/100</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(result.breakdown || {}).map(([key, val]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {val
                    ? <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                    : <XCircle size={14} className="text-red-400 shrink-0" />}
                  <span className={val ? 'text-gray-300' : 'text-gray-500'}>
                    {README_LABELS[key] || key}
                  </span>
                </div>
              ))}
            </div>

            {result.suggestions?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Suggestions</p>
                <ol className="space-y-1.5 list-decimal list-inside">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-gray-300">{s}</li>
                  ))}
                </ol>
              </div>
            )}
            <PoweredBy />
          </div>
        )}
      </div>
    )
  }

  function BreakingChangesTool() {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Check for breaking function signature changes across a PR and analyze the affected callers.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            placeholder="PR number..."
            value={prNumber}
            onChange={e => setPrNumber(e.target.value)}
            className="w-40 px-3 py-2 rounded-lg bg-[#0a0a0a] border border-[#333] text-white text-sm
                       placeholder:text-gray-600 focus:outline-none focus:border-[#444]"
          />
          <button
            onClick={() => call('breaking-changes', { prNumber: parseInt(prNumber) })}
            disabled={!prNumber || isLoading}
            className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-40"
          >
            Check for Breaking Changes
          </button>
        </div>
        {isLoading && <p className="text-sm text-gray-400">Comparing function signatures across PR...</p>}
        {result?.changes && (
          <div className="space-y-4">
            {result.changes.length === 0 ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-500" />
                <span className="text-sm text-gray-300">No breaking function signature changes detected in this PR</span>
              </div>
            ) : (
              <div className="space-y-4">
                {result.explanation && <Paragraphs text={result.explanation} />}
                
                <div className="space-y-3">
                  {result.changes.map((c, i) => {
                    const badgeColor = c.risk === 'high' ? 'bg-red-500/20 text-red-400' : c.risk === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'
                    return (
                      <div key={i} className="rounded-lg border border-[#222] bg-[#111] p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-mono font-semibold text-white">{c.functionName}</span>
                            <p className="text-xs text-gray-400">{c.file}</p>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${badgeColor}`}>
                            {c.risk}
                          </span>
                        </div>
                        
                        <div className="font-mono text-xs bg-[#0a0a0a] p-2 rounded">
                          <div className="text-red-400">- {c.functionName}({c.oldParams.join(', ')})</div>
                          <div className="text-green-400">+ {c.functionName}({c.newParams.join(', ')})</div>
                        </div>

                        <div>
                          <p className="text-xs text-gray-400 mb-1">Called from {c.callerFiles.length} file(s):</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {c.callerFiles.map(cf => (
                              <span key={cf} className="px-2 py-0.5 bg-[#222] text-[10px] text-gray-300 rounded font-mono">{cf}</span>
                            ))}
                          </div>
                          {c.callersModifiedInPR.length < c.callerFiles.length && (
                            <p className="text-yellow-400 text-xs">
                              {c.callerFiles.length - c.callersModifiedInPR.length} caller(s) were NOT modified in this PR — verify compatibility
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <PoweredBy />
          </div>
        )}
      </div>
    )
  }

  const PANELS = {
    'explain-file':  <ExplainFileTool />,
    'onboarding':    <OnboardingTool />,
    'architecture':  <ArchitectureTool />,
    'pr-analyzer':   <PRTool />,
    'readme-scorer': <ReadmeTool />,
    'breaking-changes': <BreakingChangesTool />,
  }

  return (
    <div className="flex h-full min-h-[600px]">
      {/* Left sidebar */}
      <div className="w-48 shrink-0 border-r border-[#222] p-3 space-y-1">
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => switchTool(id)}
            className={`w-full flex items-center gap-2.5 rounded-lg py-2 px-3 text-sm text-left transition-colors cursor-pointer
              ${activeTool === id
                ? 'bg-[#222] text-white'
                : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-gray-200'
              }`}
          >
            <Icon size={14} className="shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Error */}
        {error && (
          <Alert className="border-red-500/30 bg-red-500/10 text-red-400 mb-4 text-sm">
            {error}
          </Alert>
        )}

        {/* Loading */}
        {isLoading ? <Spinner /> : PANELS[activeTool]}
      </div>
    </div>
  )
}
