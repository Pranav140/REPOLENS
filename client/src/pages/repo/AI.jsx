import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { FileCode2, BookOpen, Network, GitPullRequest, Star, CheckCircle2, XCircle, AlertTriangle, Sparkles, ChevronRight, Copy } from 'lucide-react'
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
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-[#1E222A]" />
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-transparent border-t-[#6366F1] animate-spin" />
        <Sparkles size={16} className="text-[#6366F1] animate-pulse" />
      </div>
      <div className="text-center">
        <p className="text-[12px] font-semibold text-[#8B949E] tracking-widest uppercase mb-1">AI Agent Active</p>
        <p className="text-[14px] text-white">Analyzing codebase context...</p>
      </div>
    </div>
  )
}

function Paragraphs({ text }) {
  return (
    <div className="relative rounded-xl border border-[#1E222A] bg-[#0D0F14] p-6 shadow-2xl overflow-hidden mt-6">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#6366F1] to-transparent opacity-50" />
      <div className="space-y-4">
        {(text || '').split('\n\n').filter(Boolean).map((p, i) => (
          <p key={i} className="text-[14px] text-[#C9D1D9] leading-relaxed font-light">{p}</p>
        ))}
      </div>
    </div>
  )
}

function PoweredBy() {
  return (
    <div className="flex items-center gap-1.5 mt-6 text-[11px] font-medium text-[#8B949E] uppercase tracking-widest">
      <Sparkles size={12} className="text-[#6366F1]" />
      Powered by Gemini
    </div>
  )
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
        placeholder="Search for a file (e.g. src/auth.ts)..."
        value={q}
        onChange={e => setQ(e.target.value)}
        className="w-full px-4 py-2.5 rounded-lg bg-[#0D0F14] border border-[#1E222A] text-white text-[14px]
                   placeholder:text-[#8B949E] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-all shadow-sm"
      />
      {results.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 z-50 rounded-xl border border-[#1E222A]
                        bg-[#0D0F14] shadow-2xl overflow-hidden backdrop-blur-md">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { onSelect(r.path); setQ(''); setResults([]) }}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#161B22] cursor-pointer transition-colors border-b border-[#1E222A] last:border-0 group"
            >
              <div className="overflow-hidden pr-4">
                <p className="font-semibold text-white text-[13px] truncate">{r.name}</p>
                <p className="text-[#8B949E] text-[11px] truncate font-mono mt-0.5">{r.path}</p>
              </div>
              <ChevronRight size={14} className="text-[#8B949E] opacity-0 group-hover:opacity-100 transition-opacity" />
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
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold text-white mb-2">Explain File</h3>
          <p className="text-[14px] text-[#8B949E] mb-6">
            Select a file to get a detailed AI explanation of its role, architecture, and potential improvement suggestions.
          </p>
          <div className="space-y-4">
            <FileSearchInput owner={owner} name={name} onSelect={p => { setSelectedPath(p); reset() }} />
            
            {selectedPath && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-[#161B22] border border-[#1E222A]">
                <div className="flex items-center gap-2 overflow-hidden text-[13px] text-[#8B949E]">
                  <FileCode2 size={14} className="text-[#6366F1]" />
                  <span className="font-mono text-white truncate">{selectedPath}</span>
                </div>
                <button onClick={() => { setSelectedPath(''); reset() }} className="text-[#8B949E] hover:text-white transition-colors cursor-pointer ml-4">✕</button>
              </div>
            )}

            <button
              onClick={() => call('explain-file', { filePath: selectedPath })}
              disabled={!selectedPath || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-[13px] font-semibold
                         hover:bg-gray-100 transition-all cursor-pointer active:scale-95 shadow-lg shadow-white/5
                         disabled:opacity-50 disabled:active:scale-100"
            >
              <Sparkles size={14} />
              Generate Explanation
            </button>
          </div>
        </div>

        {result?.explanation && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Paragraphs text={result.explanation} />
            <PoweredBy />
          </div>
        )}
      </div>
    )
  }

  function OnboardingTool() {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold text-white mb-2">Onboarding Guide</h3>
          <p className="text-[14px] text-[#8B949E] mb-6">
            Generate a comprehensive Markdown onboarding guide covering the tech stack, code organization, entry points, and data flow.
          </p>
          <button
            onClick={() => call('onboarding-guide')}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-gray-100 transition-all cursor-pointer active:scale-95 shadow-lg shadow-white/5 disabled:opacity-50"
          >
            <BookOpen size={14} />
            Generate Complete Guide
          </button>
        </div>

        {result?.guide && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative rounded-xl border border-[#1E222A] bg-[#0D0F14] p-8 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366F1]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => { navigator.clipboard.writeText(result.guide); toast.success('Copied to clipboard!') }}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-[#8B949E] hover:text-white border border-[#1E222A] bg-[#161B22] rounded-md px-3 py-1.5 transition-colors cursor-pointer"
                >
                  <Copy size={12} />
                  Copy Markdown
                </button>
              </div>
              
              <div className="prose prose-invert prose-sm max-w-none
                              prose-headings:text-white prose-headings:font-semibold prose-p:text-[#C9D1D9] prose-li:text-[#C9D1D9]
                              prose-code:text-[#A5B4FC] prose-code:bg-[#161B22] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
                              prose-pre:bg-[#161B22] prose-pre:border prose-pre:border-[#1E222A] prose-pre:shadow-inner">
                <ReactMarkdown>{result.guide}</ReactMarkdown>
              </div>
            </div>
            <PoweredBy />
          </div>
        )}
      </div>
    )
  }

  function ArchitectureTool() {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold text-white mb-2">Architecture Analysis</h3>
          <p className="text-[14px] text-[#8B949E] mb-6">
            Analyze the repository's architectural patterns, identify structural bottlenecks, and receive concrete improvement recommendations.
          </p>
          <button
            onClick={() => call('architecture-summary')}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-gray-100 transition-all cursor-pointer active:scale-95 shadow-lg shadow-white/5 disabled:opacity-50"
          >
            <Network size={14} />
            Analyze Architecture
          </button>
        </div>

        {result?.summary && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Paragraphs text={result.summary} />
            <div className="mt-4 flex justify-between items-center">
              <PoweredBy />
              <button
                onClick={() => { navigator.clipboard.writeText(result.summary); toast.success('Copied to clipboard!') }}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#8B949E] hover:text-white transition-colors cursor-pointer"
              >
                <Copy size={12} />
                Copy Report
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  function PRTool() {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
         <div className="max-w-2xl">
          <h3 className="text-xl font-semibold text-white mb-2">Pull Request Analyzer</h3>
          <p className="text-[14px] text-[#8B949E] mb-6">
            Scan a Pull Request to understand its intent, blast radius, risk level, and critical areas for reviewers.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E] font-mono text-[13px]">#</span>
              <input
                type="number"
                min="1"
                placeholder="PR Number"
                value={prNumber}
                onChange={e => setPrNumber(e.target.value)}
                className="w-40 pl-8 pr-4 py-2.5 rounded-lg bg-[#0D0F14] border border-[#1E222A] text-white text-[14px] font-mono
                           placeholder:text-[#8B949E] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
              />
            </div>
            <button
              onClick={() => call('analyze-pr', { prNumber: parseInt(prNumber) })}
              disabled={!prNumber || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-gray-100 transition-all cursor-pointer active:scale-95 shadow-lg shadow-white/5 disabled:opacity-50"
            >
              <GitPullRequest size={14} />
              Scan PR
            </button>
          </div>
        </div>

        {result?.analysis && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Paragraphs text={result.analysis} />
            <PoweredBy />
          </div>
        )}
      </div>
    )
  }

  function ReadmeTool() {
    const score = result?.score || 0
    let gradient = 'from-red-400 to-red-600'
    let ringColor = 'border-red-500/20 bg-red-500/10 text-red-400'
    
    if (score >= 70) {
      gradient = 'from-emerald-400 to-emerald-600'
      ringColor = 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
    } else if (score >= 40) {
      gradient = 'from-amber-400 to-amber-600'
      ringColor = 'border-amber-500/20 bg-amber-500/10 text-amber-400'
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold text-white mb-2">README Scorer</h3>
          <p className="text-[14px] text-[#8B949E] mb-6">
            Evaluate your repository's README.md against industry-standard quality criteria and get actionable improvements.
          </p>
          <button
            onClick={() => call('score-readme')}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-gray-100 transition-all cursor-pointer active:scale-95 shadow-lg shadow-white/5 disabled:opacity-50"
          >
            <Star size={14} />
            Evaluate README
          </button>
        </div>

        {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="rounded-xl border border-[#1E222A] bg-[#0D0F14] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6366F1]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex flex-col md:flex-row gap-10">
                {/* Score Column */}
                <div className="flex flex-col items-center justify-center min-w-[150px]">
                   <div className={`text-[11px] font-bold tracking-widest uppercase mb-3 px-3 py-1 rounded-full border ${ringColor}`}>
                     Health Score
                   </div>
                   <div className="flex items-baseline gap-1">
                     <span className={`text-[72px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-br ${gradient}`}>
                       {score}
                     </span>
                     <span className="text-[20px] font-bold text-[#8B949E]">/100</span>
                   </div>
                </div>

                {/* Criteria Column */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 border-l border-[#1E222A] pl-10">
                  {Object.entries(result.breakdown || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      {val ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                          <XCircle size={12} className="text-red-400" />
                        </div>
                      )}
                      <span className={`text-[13px] font-medium ${val ? 'text-[#C9D1D9]' : 'text-[#8B949E] line-through decoration-[#8B949E]/50'}`}>
                        {README_LABELS[key] || key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {result.suggestions?.length > 0 && (
                <div className="mt-10 pt-8 border-t border-[#1E222A]">
                  <h4 className="text-[12px] font-bold text-[#8B949E] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400" /> Improvement Suggestions
                  </h4>
                  <ol className="space-y-3">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="text-[14px] text-[#C9D1D9] flex items-start gap-3">
                        <span className="text-[#6366F1] font-mono mt-0.5">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
            <PoweredBy />
          </div>
        )}
      </div>
    )
  }

  function BreakingChangesTool() {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold text-white mb-2">Breaking Changes Detector</h3>
          <p className="text-[14px] text-[#8B949E] mb-6">
            Check a Pull Request for breaking function signature changes and instantly analyze affected callers to prevent regressions.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E] font-mono text-[13px]">#</span>
              <input
                type="number"
                min="1"
                placeholder="PR Number"
                value={prNumber}
                onChange={e => setPrNumber(e.target.value)}
                className="w-40 pl-8 pr-4 py-2.5 rounded-lg bg-[#0D0F14] border border-[#1E222A] text-white text-[14px] font-mono
                           placeholder:text-[#8B949E] focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-all"
              />
            </div>
            <button
              onClick={() => call('breaking-changes', { prNumber: parseInt(prNumber) })}
              disabled={!prNumber || isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-[13px] font-semibold hover:bg-gray-100 transition-all cursor-pointer active:scale-95 shadow-lg shadow-white/5 disabled:opacity-50"
            >
              <AlertTriangle size={14} />
              Check PR Safety
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="mt-8 text-[13px] text-[#8B949E] flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-[#1E222A] border-t-[#6366F1] rounded-full animate-spin" />
            Comparing abstract syntax trees across PR...
          </div>
        )}

        {result?.changes && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {result.changes.length === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </div>
                <span className="text-[14px] text-emerald-100 font-medium">All clear! No breaking function signature changes detected in this PR.</span>
              </div>
            ) : (
              <div className="space-y-6">
                {result.explanation && <Paragraphs text={result.explanation} />}
                
                <div className="space-y-4">
                  <h4 className="text-[13px] font-bold text-white tracking-wide flex items-center gap-2 border-b border-[#1E222A] pb-2">
                    <AlertTriangle size={14} className="text-red-400" /> Detected Signature Changes ({result.changes.length})
                  </h4>
                  {result.changes.map((c, i) => {
                    const isHigh = c.risk === 'high'
                    const badgeColor = isHigh ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                                     : c.risk === 'medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                     : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    return (
                      <div key={i} className="rounded-xl border border-[#1E222A] bg-[#0D0F14] overflow-hidden shadow-lg group hover:border-[#2D3342] transition-colors">
                        <div className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="font-mono text-[14px] font-semibold text-white bg-[#161B22] px-2 py-0.5 rounded border border-[#2D3342]">{c.functionName}</span>
                              <p className="text-[12px] text-[#8B949E] mt-2 font-mono flex items-center gap-1.5 before:content-[''] before:w-1.5 before:h-1.5 before:border-l before:border-b before:border-[#2D3342] before:-mt-0.5">{c.file}</p>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border tracking-widest ${badgeColor}`}>
                              {c.risk}
                            </span>
                          </div>
                          
                          <div className="font-mono text-[13px] bg-[#050505] p-4 rounded-lg border border-[#1E222A] shadow-inner mb-5">
                            <div className="text-red-400 opacity-80 decoration-red-400/50">- {c.functionName}({c.oldParams.join(', ')})</div>
                            <div className="text-emerald-400 font-semibold mt-1">+ {c.functionName}({c.newParams.join(', ')})</div>
                          </div>

                          <div className="bg-[#161B22] rounded-lg p-4 border border-[#2D3342]">
                            <p className="text-[12px] font-semibold text-[#8B949E] uppercase tracking-widest mb-3">Downstream Callers ({c.callerFiles.length})</p>
                            {c.callerFiles.length === 0 ? (
                               <p className="text-[13px] text-[#8B949E]">No callers found in this repository.</p>
                            ) : (
                               <div className="flex flex-wrap gap-2 mb-3">
                                {c.callerFiles.map(cf => (
                                  <span key={cf} className="px-2.5 py-1 bg-[#0D0F14] border border-[#1E222A] text-[11px] text-[#C9D1D9] rounded-md font-mono flex items-center gap-1.5">
                                    <FileCode2 size={10} className="text-[#8B949E]" /> {cf}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {c.callersModifiedInPR.length < c.callerFiles.length && (
                              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-amber-400 text-[12px] leading-relaxed">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">{c.callerFiles.length - c.callersModifiedInPR.length} caller(s)</span> were NOT modified in this Pull Request. This will likely break the build unless handled.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="mt-4"><PoweredBy /></div>
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
    <div className="flex h-[calc(100vh-120px)] bg-[#0D0F14] rounded-2xl border border-[#1E222A] overflow-hidden shadow-2xl">
      {/* Left sidebar */}
      <div className="w-64 shrink-0 border-r border-[#1E222A] bg-[#0A0C10] p-4 flex flex-col gap-1.5 overflow-y-auto">
        <div className="mb-4 px-2 mt-2">
          <p className="text-[11px] font-bold text-[#8B949E] uppercase tracking-widest">AI Assistants</p>
        </div>
        {TOOLS.map(({ id, label, Icon }) => {
          const isActive = activeTool === id
          return (
            <button
              key={id}
              onClick={() => switchTool(id)}
              className={`w-full flex items-center gap-3 rounded-lg py-2.5 px-3 text-[13px] font-medium text-left transition-all cursor-pointer group relative
                ${isActive
                  ? 'bg-[#161B22] text-white shadow-sm'
                  : 'text-[#8B949E] hover:bg-[#161B22]/50 hover:text-[#C9D1D9]'
                }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#6366F1] rounded-r-full" />
              )}
              <Icon size={16} className={`shrink-0 ${isActive ? 'text-[#6366F1]' : 'text-[#8B949E] group-hover:text-[#C9D1D9] transition-colors'}`} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Right content */}
      <div className="flex-1 p-10 overflow-y-auto relative">
        {/* Error */}
        {error && (
          <Alert className="border-red-500/20 bg-red-500/10 text-red-400 mb-6 text-[13px] rounded-xl flex items-center gap-3 absolute top-6 right-6 z-10 max-w-sm">
            <XCircle size={16} />
            {error}
          </Alert>
        )}

        {/* Loading / Content */}
        <div className="max-w-4xl mx-auto h-full">
          {isLoading ? <Spinner /> : PANELS[activeTool]}
        </div>
      </div>
    </div>
  )
}
