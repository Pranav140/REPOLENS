import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Search as SearchIcon, FileCode2, Code2, Box, X } from 'lucide-react'
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

  // ── debounced search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(fetchResults, 300)
    return () => clearTimeout(t)
  }, [query, typeFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchResults() {
    setIsLoading(true)
    try {
      const res = await api.get(`/api/search/${owner}/${name}`, {
        params: { q: query, type: typeFilter },
      })
      setResults(res.data.results || [])
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Search files, functions, classes..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#111] border border-[#333]
                     text-white text-sm placeholder:text-gray-600
                     focus:outline-none focus:border-[#444] transition-colors"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Type tabs */}
      <Tabs value={typeFilter} onValueChange={v => { setTypeFilter(v); setResults([]) }}>
        <TabsList className="bg-[#111] border border-[#222]">
          {['all','file','function','class'].map(t => (
            <TabsTrigger
              key={t}
              value={t}
              className="capitalize text-gray-400 data-[state=active]:bg-[#222] data-[state=active]:text-white"
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Result count */}
      {results.length > 0 && (
        <p className="text-xs text-gray-500">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

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
      {!isLoading && results.length > 0 && (
        <div className="space-y-2">
          {results.map((r, i) => (
            <button
              key={`${r.path}-${r.name}-${i}`}
              onClick={() => setSelectedFile(r)}
              className="w-full rounded-xl border border-[#222] bg-[#111] p-4
                         flex items-center gap-3 text-left
                         hover:border-[#333] hover:bg-[#161616] transition-all cursor-pointer"
            >
              {TYPE_ICON[r.type] || <FileCode2 size={15} className="text-gray-500 shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{r.name}</p>
                <p className="text-xs text-gray-500 truncate">{r.path}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {r.language && (
                  <span className="text-xs px-2 py-0.5 rounded-full border border-[#333] text-gray-400">
                    {r.language}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${TYPE_COLOR[r.type] || 'border-[#333] text-gray-400'}`}>
                  {r.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty states */}
      {!isLoading && results.length === 0 && query.length >= 2 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchIcon size={32} className="text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">No results for &ldquo;{query}&rdquo;</p>
        </div>
      )}
      {!isLoading && query.length < 2 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchIcon size={32} className="text-gray-700 mb-3" />
          <p className="text-gray-500 text-sm">Search files, functions, and classes...</p>
          <p className="text-gray-700 text-xs mt-1">Type at least 2 characters</p>
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/graph/${owner}/${name}/file`, { params: { path: file.path } })
      .then(r => setDeps(r.data))
      .catch(() => setDeps({ imports: [], importedBy: [] }))
      .finally(() => setLoading(false))
  }, [file.path]) // eslint-disable-line react-hooks/exhaustive-deps

  const MAX_SHOW = 10

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="bg-[#111] border-[#222] text-white max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white text-sm font-mono break-all">
            {file.path}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm">
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

          {/* Stats row — only if data exists on result */}
          {(file.lineCount || file.complexityScore != null || file.functionCount != null) && (
            <div className="flex gap-4 text-xs text-gray-500">
              {file.lineCount && <span><span className="text-white font-medium">{file.lineCount}</span> lines</span>}
              {file.complexityScore != null && <span>complexity <span className="text-white font-medium">{file.complexityScore}</span></span>}
              {file.functionCount != null && <span><span className="text-white font-medium">{file.functionCount}</span> functions</span>}
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

          {/* Explain with AI */}
          <button
            onClick={onExplainAI}
            className="w-full py-2 rounded-lg bg-[#1e1e1e] border border-[#333] text-sm
                       text-gray-300 hover:text-white hover:border-[#444] transition-colors cursor-pointer"
          >
            ✨ Explain with AI
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
