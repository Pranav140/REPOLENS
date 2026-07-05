import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, FileCode2, Code2, Box, X, ExternalLink } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Badge } from '../../components/ui/badge'
import { Skeleton } from '../../components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import api from '../../api/api'

const TYPE_ICON = {
  file:     <FileCode2 size={15} className="text-blue-400 shrink-0" />,
  function: <Code2 size={15} className="text-green-400 shrink-0" />,
  class:    <Box size={15} className="text-purple-400 shrink-0" />,
}

const TYPE_COLOR = {
  file:     'bg-blue-500/10   text-blue-400   border-blue-500/20',
  function: 'bg-green-500/10  text-green-400  border-green-500/20',
  class:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export default function Search() {
  const { owner, name } = useParams()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)

  // ── debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (query.length < 2) { setResults([]); setError(null); return }
    const t = setTimeout(fetchResults, 300)
    return () => clearTimeout(t)
  }, [query, typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchResults() {
    setIsLoading(true)
    setError(null)
    try {
      const res = await api.get(`/api/search/${owner}/${name}`, {
        params: { q: query, type: typeFilter },
      })
      setResults(res.data.results || [])
    } catch (err) {
      setResults([])
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / Hero */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Code Search</h1>
        <p className="text-gray-400 text-sm">Find files, functions, and classes instantly across the repository.</p>
      </div>

      {/* Search input */}
      <div className="relative group">
        <SearchIcon size={22} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-white transition-colors" />
        <input
          type="text"
          placeholder="Search for anything..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-14 pr-12 py-4 rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl border border-[#ffffff15]
                     text-white text-lg placeholder:text-gray-600 shadow-2xl
                     focus:outline-none focus:border-[#555] focus:ring-4 focus:ring-[#ffffff05] transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer bg-[#ffffff10] hover:bg-[#ffffff20] p-1.5 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Type tabs & Results Meta */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <Tabs value={typeFilter} onValueChange={v => { setTypeFilter(v); setResults([]) }}>
        <TabsList className="bg-[#0a0a0a] border border-[#ffffff10] rounded-xl p-1 shadow-inner h-11">
          {['all','file','function','class'].map(t => (
            <TabsTrigger
              key={t}
              value={t}
              className="capitalize text-gray-400 font-medium px-4 data-[state=active]:bg-[#252525] data-[state=active]:text-white rounded-lg transition-all"
            >
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Result count */}
      <div className="text-sm text-gray-500 font-medium px-2">
        {results.length > 0 ? (
          <span>Found <span className="text-white">{results.length}</span> result{results.length !== 1 ? 's' : ''}</span>
        ) : query.length >= 2 && !isLoading ? (
          <span>No results</span>
        ) : null}
      </div>
    </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#222] bg-[#111] p-4 flex items-center gap-3">
              <Skeleton className="w-5 h-5 rounded bg-[#1e1e1e]" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-40 bg-[#1e1e1e]" />
                <Skeleton className="h-2.5 w-64 bg-[#1e1e1e]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results list */}
      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <button
              key={`${r.path}-${r.name}-${i}`}
              onClick={() => setSelectedFile(r)}
              className="w-full rounded-2xl border border-[#ffffff10] bg-[#0a0a0a]/50 p-5
                         flex items-center gap-4 text-left shadow-sm backdrop-blur-sm
                         hover:border-[#ffffff25] hover:bg-[#1a1a1a]/80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group"
            >
              <div className="p-2.5 bg-[#ffffff05] rounded-xl group-hover:bg-[#ffffff10] transition-colors shrink-0">
                {TYPE_ICON[r.type] || <FileCode2 size={18} className="text-gray-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-200 group-hover:text-white truncate transition-colors">{r.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5 font-mono">{r.path}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {r.language && (
                  <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#ffffff08] border border-[#ffffff10] text-gray-400 uppercase tracking-wider font-medium">
                    {r.language}
                  </span>
                )}
                <span className={`text-[10px] px-2.5 py-1 rounded-md border uppercase tracking-wider font-medium ${TYPE_COLOR[r.type] || 'border-[#333] text-gray-400'}`}>
                  {r.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-[#0a0a0a]/30 rounded-3xl border border-red-500/10">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <X size={24} className="text-red-400" />
          </div>
          <p className="text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}
      {!isLoading && results.length === 0 && query.length >= 2 && !error && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-[#0a0a0a]/30 rounded-3xl border border-[#ffffff05] border-dashed">
          <div className="w-20 h-20 rounded-full bg-[#ffffff05] flex items-center justify-center mb-6 ring-8 ring-[#ffffff02]">
            <SearchIcon size={32} className="text-gray-600" />
          </div>
          <p className="text-white text-lg font-medium tracking-tight mb-2">No results found</p>
          <p className="text-gray-500 text-sm max-w-sm">We couldn't find anything matching &ldquo;{query}&rdquo;. Try adjusting your search terms or filters.</p>
        </div>
      )}
      {!isLoading && query.length < 2 && (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-[#0a0a0a]/30 rounded-3xl border border-[#ffffff05] border-dashed">
           <div className="w-20 h-20 rounded-full bg-[#ffffff05] flex items-center justify-center mb-6 ring-8 ring-[#ffffff02]">
            <Code2 size={32} className="text-gray-600" />
          </div>
          <p className="text-white text-lg font-medium tracking-tight mb-2">Start searching</p>
          <p className="text-gray-500 text-sm max-w-sm">Type at least 2 characters to search across all files, functions, and classes in this repository.</p>
        </div>
      )}

      {/* File detail modal */}
      {selectedFile && (
        <FileDetailModal
          owner={owner}
          name={name}
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onExplainAI={() => navigate(`/repo/${owner}/${name}/ai`)}
        />
      )}
    </div>
  )
}

// ── File Detail Modal ─────────────────────────────────────────────────────────

function FileDetailModal({ owner, name, file, onClose, onExplainAI }) {
  const [deps, setDeps] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch dependencies
    api.get(`/api/graph/${owner}/${name}/file`, { params: { path: file.path } })
      .then(r => setDeps(r.data))
      .catch(err => {
        setDeps({ imports: [], importedBy: [] })
        setError(err.message)
      })
      .finally(() => setLoading(false))

    // Fetch raw file content
    api.get(`/api/repos/${owner}/${name}/file`, { params: { path: file.path } })
      .then(r => setFileContent(r.data.content))
      .catch(() => setFileContent('// Failed to load file content'))
      .finally(() => setContentLoading(false))
  }, [file.path]) // eslint-disable-line react-hooks/exhaustive-deps

  const MAX_SHOW = 10

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="bg-[#0a0a0a]/95 backdrop-blur-xl border border-[#ffffff15] shadow-2xl text-white max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-0">
        <DialogHeader className="p-6 pb-4 border-b border-[#ffffff10] sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-10">
          <DialogTitle className="text-white text-base font-mono break-all flex items-center gap-2">
            <Code2 size={18} className="text-gray-400" />
            {file.path}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm p-6 pt-2">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {file.language && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-[#333] text-gray-400">
                {file.language}
              </span>
            )}
            {file.isDead && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                Dead Code
              </span>
            )}
            {file.isEntry && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Entry Point
              </span>
            )}
          </div>

          {/* Stats row */}
          {(file.lineCount || file.complexityScore != null || file.functionCount != null) && (
            <div className="flex gap-6 text-xs text-gray-500 bg-[#ffffff05] p-3 rounded-xl border border-[#ffffff0a]">
              {file.lineCount != null && <span><span className="text-white font-semibold">{file.lineCount}</span> lines</span>}
              {file.complexityScore != null && <span>complexity <span className="text-white font-semibold">{file.complexityScore}</span></span>}
              {file.functionCount != null && <span><span className="text-white font-semibold">{file.functionCount}</span> functions</span>}
            </div>
          )}

          {/* Imports */}
          {loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24 bg-[#1e1e1e]" />
              <Skeleton className="h-3 w-full bg-[#1e1e1e]" />
              <Skeleton className="h-3 w-4/5 bg-[#1e1e1e]" />
            </div>
          ) : (
            <>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5">
                  Imports ({deps?.imports?.length ?? 0})
                </p>
                {deps?.imports?.length > 0 ? (
                  <div className="space-y-1">
                    {deps.imports.slice(0, MAX_SHOW).map(p => (
                      <p key={p} className="font-mono text-xs text-gray-400 truncate">{p}</p>
                    ))}
                    {deps.imports.length > MAX_SHOW && (
                      <p className="text-xs text-gray-600">
                        and {deps.imports.length - MAX_SHOW} more…
                      </p>
                    )}
                  </div>
                ) : <p className="text-xs text-gray-600">No imports</p>}
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-400 mb-1.5">
                  Imported By ({deps?.importedBy?.length ?? 0})
                </p>
                {deps?.importedBy?.length > 0 ? (
                  <div className="space-y-1">
                    {deps.importedBy.slice(0, MAX_SHOW).map(p => (
                      <p key={p} className="font-mono text-xs text-gray-400 truncate">{p}</p>
                    ))}
                    {deps.importedBy.length > MAX_SHOW && (
                      <p className="text-xs text-gray-600">
                        and {deps.importedBy.length - MAX_SHOW} more…
                      </p>
                    )}
                  </div>
                ) : <p className="text-xs text-gray-600">Not imported by any file</p>}
              </div>
            </>
          )}

          {/* File Content Preview */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                File Content
              </p>
              <button
                onClick={() => window.open(`https://github.com/${owner}/${name}/blob/main/${file.path}`, '_blank')}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded-md"
              >
                <span>View Full File</span>
                <ExternalLink size={12} />
              </button>
            </div>
            <div className="bg-[#050505] rounded-xl border border-[#ffffff10] relative overflow-hidden">
              {contentLoading ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3 bg-[#1e1e1e]" />
                  <Skeleton className="h-4 w-1/2 bg-[#1e1e1e]" />
                  <Skeleton className="h-4 w-2/3 bg-[#1e1e1e]" />
                </div>
              ) : fileContent ? (
                <pre className="p-4 text-[11px] font-mono text-gray-300 overflow-x-auto max-h-[300px] overflow-y-auto custom-scrollbar">
                  <code>{fileContent}</code>
                </pre>
              ) : (
                <div className="p-8 text-center text-gray-500 text-xs">
                  Content not available
                </div>
              )}
            </div>
          </div>

          {/* Explain with AI */}
          <div className="pt-2">
            <button
              onClick={onExplainAI}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#1e1e1e] to-[#252525] border border-[#333] text-sm font-semibold
                         text-gray-200 hover:text-white hover:border-[#555] hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              ✨ Explain with AI
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
